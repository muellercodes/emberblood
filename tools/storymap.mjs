#!/usr/bin/env node
// tools/storymap.mjs: writes dist/storymap.html, one self-contained page (inline SVG, CSS and a little JS, no
// libraries, no network) that shows each act of the story data as a map: the chapters in order with their steps,
// clues feeding deductions feeding mysteries (red herrings marked), side quests and their payoffs, gates on old maps
// with their power and payoff, trust beats and endings. Failures from dist/check.json are marked red; tap or hover a
// red thing to read the message. Works on a phone and a laptop, light and dark.
//
//   node tools/storymap.mjs [--root <repo>] [--story <dir>] [--check dist/check.json] [--out dist]
import { readFileSync, writeFileSync, existsSync, mkdirSync, statSync } from 'node:fs';
import { join, resolve, dirname, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { scanGame, loadStory, buildModel, runChecks, loadFixtures, parseDo, MAPS, GATE_POWER } from './check.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const argv = process.argv.slice(2);
const arg = (k, d) => { const i = argv.indexOf(k); return i >= 0 ? argv[i + 1] : d; };
const root = resolve(arg('--root', resolve(HERE, '..')));
const storyDir = resolve(arg('--story', join(root, 'game/story')));
const outDir = resolve(arg('--out', join(root, 'dist')));
const checkPath = resolve(arg('--check', join(outDir, 'check.json')));

// ---------------------------------------------------------------- data
const game = scanGame(root);
const loaded = loadStory(storyDir, root);
const M = buildModel(loaded, game);
let CJ = null;
if (existsSync(checkPath)) {
  try { CJ = JSON.parse(readFileSync(checkPath, 'utf8')); } catch (e) { CJ = null; }
  // a check.json older than the data is stale: run the check here instead
  if (CJ) { const t = statSync(checkPath).mtimeMs; if (loaded.files.some((f) => statSync(f.path).mtimeMs > t)) CJ = null; }
}
if (!CJ) {
  const res = runChecks(M, { loadFails: loaded.loadFails, fixtures: loadFixtures(arg('--fixtures', join(root, 'tools/test_fixtures/saves')), root), root });
  CJ = { fails: res.fails, warns: res.warns, walk: res.walk, order: res.order, info: res.info, counts: { fail: res.fails.length, warn: res.warns.length }, fresh: true };
}
const fails = CJ.fails || [], warns = (CJ.warns || []).filter((w) => !w.legacy);
const legacyWarns = (CJ.warns || []).filter((w) => w.legacy);

const arr = (x) => (x == null ? [] : Array.isArray(x) ? x : [x]);
const isStr = (x) => typeof x === 'string';
const full = (x) => (isStr(x) ? x : Array.isArray(x) ? x[0] : '');
const simple = (x) => (Array.isArray(x) && isStr(x[1]) ? x[1] : full(x));
const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const ROMAN = { 1: 'I', 2: 'II', 3: 'III', 4: 'IV', 5: 'V' };
const MAPNAME = { 0: 'Embermere', 1: 'the Clockwork Coast', 2: 'Frostreach', 3: 'Moonfall', 4: 'Nightfall Peak' };
const actName = (n) => (n === 5 ? 'The Finale' : `Act ${ROMAN[n] || n}`);

// which failures belong to a thing: by the fields check.mjs sets, or by the id as a whole word in the message
const wordRe = (id) => new RegExp(`(^|[^A-Za-z0-9_])${String(id).replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}([^A-Za-z0-9_]|$)`);
const used = new Set();
function failsFor(pred) { const L = fails.filter(pred); L.forEach((f) => used.add(f)); return L; }
const byOwnerStep = (o, s) => failsFor((f) => f.owner === o && f.step === s);
const byWord = (id, rules) => failsFor((f) => (!rules || rules.includes(f.rule)) && wordRe(id).test(f.msg));

// acts present
const actSet = new Set();
for (const c of Object.values(M.chapters)) actSet.add(+c.def.act);
for (const q of Object.values(M.quests)) actSet.add(+q.def.act);
for (const n of Object.keys(M.acts)) actSet.add(+n);
for (const o of Object.values(M.extra || {})) if (o.def.act != null) actSet.add(+o.def.act);
const acts = [...actSet].filter((n) => !isNaN(n)).sort((a, b) => a - b);
const order = CJ.order || [];
const stageAct = (s) => (M.chapters[s] ? +M.chapters[s].def.act : game.stageAct[s] || null);

// where each clue is added: [{ owner, type, where, main }]
function clueSources() {
  const out = {};
  const add = (id, src) => { (out[id] = out[id] || []).push(src); };
  const scan = (v, src, depth = 0) => {
    if (depth > 12 || v == null) return;
    if (isStr(v)) { const m = /^clue\s+(\S+)$/.exec(v.trim()); if (m) add(m[1], src); return; }
    if (Array.isArray(v)) { v.forEach((x) => scan(x, src, depth + 1)); return; }
    if (typeof v === 'object') { if (isStr(v.clue)) add(v.clue, src); for (const [k, x] of Object.entries(v)) if (k !== 'clue') scan(x, src, depth + 1); }
  };
  for (const O of M.owners) {
    const d = O.def;
    const isMainOwner = O.type === 'chapter';
    const stepScene = new Set();
    const doStep = (s, main, label) => {
      if (!s) return;
      const src = { owner: O.id, type: O.type, where: label, main: main && !s.optional };
      scan(s.then, src);
      for (const k of ['scene', 'win']) if (s[k] && d.scene && d.scene[s[k]]) { stepScene.add(s[k]); scan(d.scene[s[k]], src); }
      const p = parseDo(s.do);
      if (p.verb === 'cutscene' && d.scene && d.scene[p.args[0]]) { stepScene.add(p.args[0]); scan(d.scene[p.args[0]], src); }
      if (p.verb === 'deduce' && d.deduce && d.deduce[p.args[0]]) scan(d.deduce[p.args[0]].then, src);
      arr(s.parts).forEach((x, i) => doStep(x, main && !s.optional, `${label} part ${i + 1}`));
      arr(s.extra).forEach((x, i) => doStep(x, false, `${label} extra ${i + 1}`));
    };
    arr(d.step).forEach((s, i) => doStep(s, isMainOwner, s && s.id ? s.id : `step ${i + 1}`));
    // picks that play another scene of the same owner
    for (const k of [...stepScene]) for (const b of arr(d.scene[k])) if (b && b.pick) for (const p of arr(b.pick)) if (p.scene && d.scene && d.scene[p.scene] && !stepScene.has(p.scene)) { stepScene.add(p.scene); scan(d.scene[p.scene], { owner: O.id, type: O.type, where: p.scene, main: isMainOwner }); }
    for (const [k, sc] of Object.entries(d.scene || {})) if (!stepScene.has(k)) scan(sc, { owner: O.id, type: O.type, where: `scene ${k}`, main: false });
    for (const [npc, L] of Object.entries(d.talk || {})) scan(L, { owner: O.id, type: O.type, where: `talk ${npc}`, main: false });
    for (const [pid, p] of Object.entries(d.place || {})) if (p) scan(p.then, { owner: O.id, type: O.type, where: `place ${pid}`, main: false });
  }
  return out;
}
const SRC = clueSources();

// trust beats inside an owner: [{ track, n, where, pick, cond }]
function trustBeats(d) {
  const out = [];
  const walk = (v, ctx, depth = 0) => {
    if (depth > 14 || v == null) return;
    if (isStr(v)) { const m = /^trust\s+(\S+)\s+([+-]?\d+)$/.exec(v.trim()); if (m) out.push({ track: m[1], n: +m[2], ...ctx }); return; }
    if (Array.isArray(v)) { v.forEach((x) => walk(x, ctx, depth + 1)); return; }
    if (typeof v === 'object') {
      const c2 = Object.assign({}, ctx);
      if (v.t != null && (v.then || v.say)) c2.pick = full(v.t);
      if (isStr(v.if)) c2.cond = v.if;
      for (const [k, x] of Object.entries(v)) walk(x, c2, depth + 1);
    }
  };
  arr(d.step).forEach((s) => { if (!s) return; walk(s, { where: s.id || '' }); const p = parseDo(s.do); for (const k of [s.scene, s.win, p.verb === 'cutscene' ? p.args[0] : null]) if (k && d.scene && d.scene[k]) walk(d.scene[k], { where: `${s.id}: ${k}` }); });
  return out;
}

// ---------------------------------------------------------------- html pieces
const VERB = {
  talk: ['talk', 'v-talk'], goto: ['go', 'v-go'], examine: ['look', 'v-find'], track: ['track', 'v-find'], find: ['find', 'v-find'],
  deduce: ['deduce', 'v-deduce'], fight: ['fight', 'v-fight'], dungeon: ['dungeon', 'v-fight'], cutscene: ['scene', 'v-scene'],
  wait_for: ['wait', 'v-scene'], minigame: ['game', 'v-game'], use_power_at: ['power', 'v-power'], give: ['give', 'v-talk'],
  choose: ['choose', 'v-deduce'], all: ['all of', 'v-group'], any: ['any of', 'v-group'],
};
const failBox = (L) => (L.length ? `<div class="fmsg">${L.map((f) => `<div><b>${esc(f.rule)}</b> ${esc(f.msg)}${f.file ? ` <span class="loc">${esc(f.file)}${f.line ? ':' + f.line : ''}</span>` : ''}</div>`).join('')}</div>` : '');
const tip = (L) => (L.length ? ` data-tip="${esc(L.map((f) => `${f.rule}: ${f.msg}`).join('\n'))}" tabindex="0"` : '');
const chip = (cls, text, title) => `<span class="chip ${cls}"${title ? ` title="${esc(title)}"` : ''}>${esc(text)}</span>`;

function stepRow(O, s, label, opt, depth = 0) {
  if (!s) return '';
  const p = parseDo(s.do);
  const [vt, vc] = VERB[p.verb] || [p.verb || '?', 'v-scene'];
  const F = byOwnerStep(O.id, s.id || null).concat(s.id ? [] : failsFor((f) => f.owner === O.id && !f.step && wordRe(s.do || '###').test(f.msg) && f.rule === 'solve'));
  const chips = [];
  const effs = arr(s.then);
  const d = O.def;
  const sceneOf = (k) => (k && d.scene && d.scene[k] ? d.scene[k] : null);
  const scan = [effs, sceneOf(s.scene), sceneOf(s.win), p.verb === 'cutscene' ? sceneOf(p.args[0]) : null, p.verb === 'deduce' && d.deduce && d.deduce[p.args[0]] ? d.deduce[p.args[0]].then : null];
  const flat = []; const walk = (v, dd = 0) => { if (dd > 10 || v == null) return; if (isStr(v)) flat.push(v); else if (Array.isArray(v)) v.forEach((x) => walk(x, dd + 1)); else if (typeof v === 'object') { if (v.clue) flat.push('clue ' + v.clue); for (const [k, x] of Object.entries(v)) if (!['t', 'ask', 'say', 'hint', 'text', 'obj', 'clue', 'if', 'locked', 'show', 'fact', 'dir', 'ref', 'promise', 'choose', 'tone', 'cam', 'place', 'walk', 'anim'].includes(k)) walk(x, dd + 1); } };
  scan.forEach((v) => walk(v));
  const seen = new Set();
  for (const e of flat) {
    const w = e.trim().split(/\s+/);
    const key = w.join(' ');
    if (seen.has(key)) continue; seen.add(key);
    if (w[0] === 'clue' && w.length === 2) chips.push(chip(M.clues[w[1]] && M.clues[w[1]].herring ? 'c-herring' : 'c-clue', `clue ${w[1]}`, M.clues[w[1]] ? full(M.clues[w[1]].text) : ''));
    else if (w[0] === 'trust' && /^[+-]?\d+$/.test(w[2] || '')) chips.push(chip('c-trust', `trust ${w[1]} ${w[2]}`));
    else if (w[0] === 'power' || w[0] === 'weapon') chips.push(chip('c-power', `+ ${w[1]}`));
    else if (w[0] === 'give' && w[1] !== 'coins') chips.push(chip('c-item', `+ ${w[1]}`));
    else if (w[0] === 'heart_ember') chips.push(chip('c-power', 'Heart Ember'));
    else if (w[0] === 'stage') chips.push(chip('c-flag', `to ${w[1]}`));
  }
  if (p.verb === 'dungeon') chips.push(chip('c-flag', 'ends with a boss'));
  if (s.scene || p.verb === 'cutscene') { const k = p.verb === 'cutscene' ? p.args[0] : s.scene; const si = CJ.info && CJ.info.scenes && CJ.info.scenes[k]; if (si) chips.push(chip(si.len > si.max ? 'c-bad' : 'c-flag', `${k}: ${si.len}/${si.max} lines`)); }
  const SF = [s.scene, s.win, p.verb === 'cutscene' ? p.args[0] : null].filter(Boolean).flatMap((k) => byWord(k, ['length']));
  const allF = F.concat(SF);
  const target = p.args.join(' ');
  const obj = s.obj ? `<div class="obj">${esc(full(s.obj))}</div>` : '';
  let kids = '';
  if (s.parts) kids += `<div class="kids">${arr(s.parts).map((x, i) => stepRow(O, x, `${label}.${i + 1}`, false, depth + 1)).join('')}</div>`;
  if (s.extra) kids += `<div class="kids opt-kids"><div class="kids-h">optional</div>${arr(s.extra).map((x, i) => stepRow(O, x, `${label}.x${i + 1}`, true, depth + 1)).join('')}</div>`;
  return `<div class="step${opt || s.optional ? ' opt' : ''}${allF.length ? ' bad' : ''}"${tip(allF)}>
  <div class="srow"><span class="verb ${vc}">${esc(vt)}</span><span class="sid">${esc(s.id || '')}</span><span class="tgt">${esc(target)}</span></div>
  ${obj}${chips.length ? `<div class="chips">${chips.join('')}</div>` : ''}${failBox(allF)}${kids}</div>`;
}

function chapterCard(c, walk, n) {
  const d = c.def;
  const F = failsFor((f) => f.owner === c.id && !f.step && !['length', 'simple', 'words'].includes(f.rule) && !(f.rule === 'ids' && /scene|talk/.test(f.msg)));
  const TF = failsFor((f) => f.owner === c.id && (f.rule === 'simple' || (f.rule === 'ids' && /scene|talk/.test(f.msg))));
  const tb = trustBeats(d);
  const powers = walk && walk.powersAt && walk.powersAt[c.id] ? walk.powersAt[c.id] : [];
  const card = arr(d.card);
  const steps = arr(d.step).map((s, i) => stepRow(c, s, String(i + 1), false)).join('');
  const talkN = Object.values(d.talk || {}).reduce((a, L) => a + arr(L).length, 0);
  return `<li class="stage data${F.length ? ' bad' : ''}" id="ch-${esc(c.id)}">
  <div class="dot"></div>
  <div class="card">
    <div class="ch-h"><div><div class="label">${esc(card[0] || '')}</div><h3>${esc(full(card[1]) || c.id)}</h3></div><code class="cid">${esc(c.id)}</code></div>
    ${d.so_far ? `<p class="sofar">${esc(simple(d.so_far))}</p>` : ''}
    ${failBox(F)}
    <div class="steps">${steps}</div>
    <div class="ch-foot">
      ${tb.length ? `<div class="tb">${tb.map((b) => `<span class="chip c-trust" title="${esc(b.cond ? 'only if ' + b.cond : '')}">${b.n > 0 ? '+' : ''}${b.n} ${esc(b.track)}${b.pick ? ': ' + esc(b.pick) : ''}${b.cond ? ` <i>(if ${esc(b.cond)})</i>` : ''}</span>`).join('')}</div>` : ''}
      <div class="meta">${Object.keys(d.clue || {}).length} clues, ${Object.keys(d.deduce || {}).length} deductions, ${Object.keys(d.scene || {}).length} scenes, ${talkN} talk lines${powers.length ? ` <span class="pw">powers after: ${powers.map((p) => `<b>${esc(p)}</b>`).join(' ')}</span>` : ''}</div>
      ${TF.length ? `<details class="tf"><summary>${TF.length} text problem${TF.length > 1 ? 's' : ''}</summary>${failBox(TF)}</details>` : ''}
    </div>
  </div></li>`;
}

// ---------------------------------------------------------------- the mystery graph (SVG)
function mysteryGraph(n) {
  const mys = Object.values(M.mysteries).filter((m) => m.act === n).sort((a, b) => (b.main ? 1 : 0) - (a.main ? 1 : 0));
  const ded = Object.values(M.deduce).filter((d) => d.owner && +d.owner.act === n);
  const clues = Object.values(M.clues).filter((c) => c.owner && +c.owner.act === n || ded.some((d) => arr(d.needs).concat(arr(d.bonus)).includes(c.id)));
  if (!ded.length && !clues.length) return '<p class="empty">No clues or deductions in this act yet.</p>';
  // sources: chapters in stage order, then quests, then other owners
  const ownerRank = (id) => { const i = order.indexOf(id); return i >= 0 ? i : 10000 + (M.quests[id] ? 0 : 500) + id.charCodeAt(0); };
  const srcOf = (c) => (SRC[c.id] || []);
  const srcIds = [...new Set(clues.flatMap((c) => srcOf(c).map((s) => s.owner)))].sort((a, b) => ownerRank(a) - ownerRank(b));
  const firstRank = (c) => { const s = srcOf(c); return s.length ? Math.min(...s.map((x) => ownerRank(x.owner) * 10 + (x.main ? 0 : 5))) : 1e9; };
  clues.sort((a, b) => firstRank(a) - firstRank(b));
  const dedRank = (d) => ownerRank(d.owner.id);
  ded.sort((a, b) => dedRank(a) - dedRank(b));
  const ROW = 34, COLW = [150, 230, 250, 230], GAP = 70, PADT = 36;
  const X = []; let x = 10; for (const w of COLW) { X.push(x); x += w + GAP; }
  const W = x - GAP + 10;
  const rows = Math.max(srcIds.length, clues.length, ded.length * 2, mys.length * 3, 1);
  const H = PADT + rows * ROW + 20;
  const spread = (k, total) => (i) => Math.round(PADT + (i + 0.5) * (total * ROW / Math.max(k, 1)) - 13);
  const ySrc = spread(srcIds.length, rows), yClue = spread(clues.length, rows), yDed = spread(ded.length, rows), yMys = spread(mys.length, rows);
  const pos = {};
  srcIds.forEach((id, i) => { pos['s:' + id] = { x: X[0], y: ySrc(i), w: COLW[0] }; });
  clues.forEach((c, i) => { pos['c:' + c.id] = { x: X[1], y: yClue(i), w: COLW[1] }; });
  ded.forEach((d, i) => { pos['d:' + d.id] = { x: X[2], y: yDed(i), w: COLW[2] }; });
  mys.forEach((m, i) => { pos['m:' + m.id] = { x: X[3], y: yMys(i), w: COLW[3] }; });
  const edges = [];
  const curve = (a, b, cls, title) => { if (!a || !b) return; const x1 = a.x + a.w, y1 = a.y + 13, x2 = b.x, y2 = b.y + 13, mx = (x1 + x2) / 2; edges.push(`<path class="e ${cls}" d="M${x1},${y1} C${mx},${y1} ${mx},${y2} ${x2},${y2}">${title ? `<title>${esc(title)}</title>` : ''}</path>`); };
  for (const c of clues) for (const s of srcOf(c)) curve(pos['s:' + s.owner], pos['c:' + c.id], s.main ? 'e-main' : 'e-opt', `${c.id} is found in ${s.owner} (${s.where})${s.main ? '' : ', optional'}`);
  for (const d of ded) { for (const c of arr(d.needs)) curve(pos['c:' + c], pos['d:' + d.id], 'e-need', `${d.id} needs ${c}`); for (const c of arr(d.bonus)) curve(pos['c:' + c], pos['d:' + d.id], 'e-bonus', `${c} is a bonus clue for ${d.id}`); }
  for (const d of ded) curve(pos['d:' + d.id], pos['m:' + d.mystery], 'e-mys', '');
  for (const c of clues) if (c.mystery) curve(pos['c:' + c.id], pos['m:' + c.mystery], 'e-bonus', `${c.id} opens ${c.mystery}`);
  const node = (key, label, sub, cls, F, title) => {
    const p = pos[key]; if (!p) return '';
    const t = F.length ? F.map((f) => `${f.rule}: ${f.msg}`).join('\n') : title || '';
    const lab = label.length > 30 ? label.slice(0, 29) + '...' : label;
    return `<g class="n ${cls}${F.length ? ' nbad' : ''}"${F.length ? ` data-tip="${esc(t)}" tabindex="0"` : ''}><title>${esc(t)}</title><rect x="${p.x}" y="${p.y}" width="${p.w}" height="26" rx="7"/><text x="${p.x + 9}" y="${p.y + 17}">${esc(lab)}</text>${sub ? `<text class="sub" x="${p.x + p.w - 8}" y="${p.y + 17}" text-anchor="end">${esc(sub)}</text>` : ''}</g>`;
  };
  const nodes = [];
  for (const id of srcIds) nodes.push(node('s:' + id, id, M.quests[id] ? 'quest' : M.chapters[id] ? '' : 'place', M.quests[id] ? 'n-quest' : M.chapters[id] ? 'n-ch' : 'n-other', failsFor((f) => f.owner === id && f.rule === 'quest'), ''));
  for (const c of clues) {
    const S = srcOf(c); const optOnly = S.length && S.every((s) => !s.main);
    nodes.push(node('c:' + c.id, c.id, c.herring ? 'herring' : optOnly ? 'optional' : !S.length ? 'never found' : '', c.herring ? 'n-herring' : S.length ? 'n-clue' : 'n-lost', byWord(c.id, ['mystery', 'ids']), full(c.text)));
  }
  for (const d of ded) nodes.push(node('d:' + d.id, d.id, `${arr(d.pick).length} picks`, 'n-ded', failsFor((f) => f.ded === d.id || (f.rule === 'mystery' && wordRe(d.id).test(f.msg))), full(d.ask)));
  for (const m of mys) nodes.push(node('m:' + m.id, m.id, m.main ? 'main' : 'small', m.main ? 'n-main' : 'n-mys', byWord(m.id, ['mystery']), full(m.def.title)));
  const heads = ['found in', 'clues', 'deductions', 'mysteries'].map((h, i) => `<text class="colh" x="${X[i]}" y="18">${h}</text>`).join('');
  return `<p class="swipe">The graph is wide: swipe it sideways.</p><div class="graphwrap"><svg class="graph" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" role="img" aria-label="clues, deductions and mysteries of ${esc(actName(n))}">${heads}${edges.join('')}${nodes.join('')}</svg></div>
  <div class="legend"><span><i class="lg e-main"></i>found on the main path</span><span><i class="lg e-opt"></i>found in optional content</span><span><i class="lg e-need"></i>needed by a deduction</span><span><i class="lg e-bonus"></i>bonus clue or opens a mystery</span><span><i class="sw n-herring"></i>red herring</span><span><i class="sw nbad"></i>has a problem (tap it)</span></div>`;
}

function mysteryCards(n) {
  const mys = Object.values(M.mysteries).filter((m) => m.act === n).sort((a, b) => (b.main ? 1 : 0) - (a.main ? 1 : 0));
  const ded = Object.values(M.deduce).filter((d) => d.owner && +d.owner.act === n);
  const clueChip = (id, kind) => { const c = M.clues[id]; const S = SRC[id] || []; const where = S.length ? S.map((s) => `${s.owner}${s.main ? '' : ' (optional)'}`).join(', ') : 'nobody adds it'; return `<span class="chip ${c && c.herring ? 'c-herring' : kind === 'bonus' ? 'c-bonus' : 'c-clue'}${!S.length ? ' c-bad' : ''}" title="${esc((c ? full(c.text) + '\n' : '') + 'found: ' + where)}">${esc(id)}<small>${esc(S.length ? S[0].owner : 'never')}</small></span>`; };
  const out = [];
  for (const m of mys.concat(ded.some((d) => !M.mysteries[d.mystery]) ? [{ id: '(no mystery)', def: { title: 'Deductions with a mystery no act file defines' }, act: n }] : [])) {
    const D = ded.filter((d) => d.mystery === m.id || (m.id === '(no mystery)' && !M.mysteries[d.mystery]));
    const herr = Object.values(M.clues).filter((c) => c.herring && c.owner && +c.owner.act === n && (c.mystery === m.id || D.some((d) => arr(d.pick).some((p) => p.hint && full(p.hint).toLowerCase().includes((full(c.text).split(' ')[0] || '').toLowerCase())))));
    out.push(`<div class="mcard${m.main ? ' main' : ''}"><div class="mh"><span class="tag">${m.main ? 'main mystery' : m.id === '(no mystery)' ? 'unfiled' : 'small mystery'}</span><h4>${esc(full(m.def.title) || m.id)}</h4><code>${esc(m.id)}</code></div>
    ${D.map((d) => { const F = failsFor((f) => f.ded === d.id); return `<div class="ded${F.length ? ' bad' : ''}"${tip(F)}><div class="q">${esc(full(d.ask))} <code>${esc(d.id)}</code> <span class="in">asked in ${esc(d.owner.id)}</span></div>
      <div class="needs">${arr(d.needs).map((c) => clueChip(c)).join('')}${arr(d.bonus).map((c) => clueChip(c, 'bonus')).join('')}</div>
      <ul class="picks">${arr(d.pick).map((p) => `<li class="${p.right ? 'right' : p.hint ? '' : 'nohint'}">${esc(full(p.t))}${p.right ? ' <b>right</b>' : p.hint ? `<span class="hint">hint: ${esc(full(p.hint))}</span>` : ' <b class="red">no hint</b>'}</li>`).join('')}</ul>${failBox(F)}</div>`; }).join('') || '<p class="empty">No deductions yet.</p>'}
    ${herr.length ? `<div class="herr">red herrings: ${herr.map((c) => clueChip(c.id)).join('')}</div>` : ''}</div>`);
  }
  const allHerr = Object.values(M.clues).filter((c) => c.herring && c.owner && +c.owner.act === n);
  if (allHerr.length) out.push(`<div class="mcard"><div class="mh"><span class="tag">red herrings in this act</span></div><div class="needs">${allHerr.map((c) => clueChip(c.id)).join('')}</div></div>`);
  return out.join('');
}

// ---------------------------------------------------------------- side quests, gates, endings, scene lengths
function questCards(n) {
  const Q = Object.values(M.quests).filter((q) => +q.def.act === n);
  if (!Q.length) return '<p class="empty">No side quests in the data for this act yet.</p>';
  return `<div class="grid">${Q.map((q) => {
    const d = q.def, info = (CJ.info && CJ.info.quests && CJ.info.quests[q.id]) || {};
    const F = failsFor((f) => f.owner === q.id);
    const tb = trustBeats(d);
    const clues = Object.keys(SRC).filter((c) => (SRC[c] || []).some((s) => s.owner === q.id));
    const p = d.payoff || {};
    return `<div class="qcard${F.length ? ' bad' : ''}"${tip(F)}><div class="qh"><h4>${esc(full(d.title) || q.id)}</h4><code>${esc(q.id)}</code></div>
      <div class="qmeta">from <b>${esc(d.giver || '?')}</b>, ${arr(d.step).length} steps${d.takeover ? ', takes over the old quest' : ''}</div>
      <div class="chips">${p.kind ? chip(info.ok === false ? 'c-bad' : 'c-pay', `payoff: ${p.kind}${p.id ? ' ' + p.id : ''}`, info.why || '') : chip('c-bad', 'no payoff')}${clues.map((c) => chip(M.clues[c] && M.clues[c].herring ? 'c-herring' : 'c-clue', `clue ${c}`)).join('')}${tb.map((b) => chip('c-trust', `${b.n > 0 ? '+' : ''}${b.n} ${b.track}`)).join('')}</div>${failBox(F)}</div>`;
  }).join('')}</div>`;
}
function gateCards(n) {
  const G = (CJ.info && CJ.info.gates || []).filter((g) => g.act === n);
  const min = CJ.info && CJ.info.gatesMin && CJ.info.gatesMin[n];
  const allGates = Object.values(M.ents).filter((e) => e.gate && (e.owner ? +e.owner.act === n : false));
  const F0 = failsFor((f) => f.rule === 'backtrack' && f.act === n && !f.ent);
  if (!G.length && !allGates.length) return `<p class="empty">No gates in the data for this act yet.</p>${failBox(F0)}`;
  const pct = min ? Math.min(100, Math.round(G.length / min * 100)) : 100;
  const rows = (G.length ? G : allGates.map((e) => ({ id: e.id, gate: e.gate, power: GATE_POWER[e.gate], map: e.map, at: e.at, leads: e.leads, payoff: null, other: true }))).map((g) => {
    const F = failsFor((f) => f.ent === g.id || (f.rule === 'backtrack' && wordRe(g.id).test(f.msg)));
    return `<div class="gate${F.length ? ' bad' : ''}"${tip(F)}><div class="gpow">${esc(g.power || '?')}</div><div class="gbody"><div><code>${esc(g.id)}</code> <span class="gk">${esc(g.gate)}</span></div>
      <div class="gw">${esc(MAPNAME[g.map] || 'map ' + g.map)}${g.at ? ` at ${g.at[0]}, ${g.at[1]}` : ''} <span class="arrow">to</span> <code>${esc(g.leads || 'nowhere')}</code></div></div>
      <div class="gpay">${g.payoff ? chip('c-pay', String(g.payoff)) : g.other ? '' : chip('c-bad', 'no payoff')}</div>${failBox(F)}</div>`;
  }).join('');
  return `${min ? `<div class="meter"><div class="mtxt">${G.length} of ${min} new-power gates on earlier maps</div><div class="bar"><i style="width:${pct}%" class="${G.length >= min ? 'okb' : 'badb'}"></i></div></div>` : ''}${failBox(F0)}<div class="gates">${rows}</div>`;
}
function endingCards(n) {
  const A = M.acts[n];
  const W = CJ.walk && CJ.walk[n];
  if (!A) return '<p class="empty">No act file yet (game/story/act' + n + '/_act.js): endings, mysteries and backtracking are not checked.</p>';
  const tr = (W && W.trust) || {};
  const bonus = (W && W.bonus) || [];
  const out = [];
  for (const [id, en] of Object.entries(A.def.ending || {})) {
    const F = failsFor((f) => f.ending === id || (f.rule === 'solve' && /^ending /.test(f.msg) && wordRe(id).test(f.msg.split(' ')[1] || '')));
    const st = W && W.endings && W.endings[id];
    let bar = '';
    const m = /trust\s+([a-z0-9_]+)(>=|>)(\d+)/.exec(en.if || '');
    if (m) {
      const need = +m[3] + (m[2] === '>' ? 1 : 0), have = tr[m[1]] || 0, extra = bonus.filter((b) => b.track === m[1]);
      const max = Math.max(need, have + extra.reduce((s, b) => s + b.n, 0), 1);
      const cells = []; for (let i = 1; i <= max; i++) cells.push(`<i class="${i <= have ? 'have' : i <= have + extra.reduce((s, b) => s + b.n, 0) ? 'bonus' : 'none'}${i === need ? ' need' : ''}"></i>`);
      bar = `<div class="trust"><div class="tl">${esc(m[1])} trust on the main path: <b>${have}</b> of ${need}${extra.length ? `, ${have + extra.reduce((s, b) => s + b.n, 0)} with ${esc([...new Set(extra.map((b) => b.why))].join(', '))}` : ''}</div><div class="cells">${cells.join('')}</div></div>`;
    }
    out.push(`<div class="ecard ${st && st.ok === false || F.length ? 'bad' : 'ok'}"${tip(F)}><div class="eh"><h4>${esc(id)}</h4>${chip(st && st.ok === false ? 'c-bad' : 'c-ok', st ? (st.ok ? 'reachable' : 'not reachable') : 'not walked')}</div>
      <div class="econd">${en.else ? 'otherwise' : `needs <code>${esc(en.if || '?')}</code>`}${en.at ? ` at <code>${esc(en.at)}</code>` : ''}${en.scene ? `, plays <code>${esc(en.scene)}</code>` : ''}</div>${bar}${failBox(F)}</div>`);
  }
  return out.join('') || '<p class="empty">The act file has no endings.</p>';
}
function sceneBars(n) {
  const S = Object.entries((CJ.info && CJ.info.scenes) || {}).filter(([id]) => M.scenes[id] && M.scenes[id].owner && +M.scenes[id].owner.act === n);
  if (!S.length) return '<p class="empty">No scenes yet.</p>';
  S.sort((a, b) => (order.indexOf(a[1].owner) - order.indexOf(b[1].owner)) || 0);
  return `<div class="bars">${S.map(([id, s]) => `<div class="sbar${s.len > s.max ? ' bad' : ''}"${s.len > s.max ? ` data-tip="${esc(`${id}: ${s.len} lines${s.afterBoss ? ' after boss ' + s.afterBoss : ''} (max ${s.max})`)}" tabindex="0"` : ''}><span class="sn">${esc(id)}${s.afterBoss ? ' <em>after boss</em>' : ''}</span><span class="sb"><i style="width:${Math.min(100, s.len / 12 * 100)}%"></i><b style="left:${s.max / 12 * 100}%"></b></span><span class="sl">${s.len}/${s.max}</span></div>`).join('')}</div>`;
}

// ---------------------------------------------------------------- one act
function actSection(n) {
  const W = CJ.walk && CJ.walk[n];
  const A = M.acts[n];
  const stages = order.filter((s) => stageAct(s) === n);
  const chapters = Object.values(M.chapters).filter((c) => +c.def.act === n);
  for (const c of chapters) if (!stages.includes(c.id)) stages.push(c.id);
  const timeline = stages.map((s) => {
    const c = M.chapters[s];
    if (c) return chapterCard(c, W, n);
    const g = W && W.granted ? W.granted.filter((x) => x.stage === s).map((x) => x.power) : [];
    return `<li class="stage old"><div class="dot"></div><div class="oldc"><code>${esc(s)}</code> still runs on the old code${g.length ? ` <span class="pw">gives ${g.map((p) => `<b>${esc(p)}</b>`).join(' ')}</span>` : ''}</div></li>`;
  }).join('');
  const F = fails.filter((f) => f.act === n || (f.act == null && f.file && f.file.includes(`/act${n}/`)));
  const Wn = warns.filter((w) => w.act === n);
  const tr = (W && W.trust) || {};
  const en = (W && W.endings) || {};
  const nClue = Object.values(M.clues).filter((c) => c.owner && +c.owner.act === n).length;
  const nDed = Object.values(M.deduce).filter((d) => d.owner && +d.owner.act === n).length;
  const nQ = Object.values(M.quests).filter((q) => +q.def.act === n).length;
  const nG = (CJ.info && CJ.info.gates || []).filter((g) => g.act === n).length;
  const name = A ? full(A.def.name) : '';
  return `<section class="act" id="act-${n}" data-act="${n}">
  <header class="acth"><div><div class="label">${esc(actName(n))}${A && A.def.map != null ? ` on ${esc(MAPNAME[A.def.map] || 'map ' + A.def.map)}` : ''}</div><h2>${esc(name || actName(n))}</h2></div>
    <div class="stat ${F.length ? 'sbad' : 'sok'}"><b>${F.length}</b> problem${F.length === 1 ? '' : 's'}${Wn.length ? `, ${Wn.length} note${Wn.length === 1 ? '' : 's'}` : ''}</div></header>
  <div class="sumrow">
    ${chip('c-flag', `${chapters.length} data chapter${chapters.length === 1 ? '' : 's'} of ${stages.length} stages`)}${chip('c-clue', `${nClue} clues`)}${chip('c-ded', `${nDed} deductions`)}${chip('c-quest', `${nQ} side quests`)}${chip('c-power', `${nG} gates back on old maps`)}
    ${Object.entries(tr).map(([k, v]) => chip('c-trust', `${k} trust on the main path: ${v}`)).join('')}${Object.entries(en).map(([k, v]) => chip(v.ok ? 'c-ok' : 'c-bad', `ending ${k}: ${v.ok ? 'reachable' : 'not reachable'}`)).join('')}
  </div>
  <nav class="secnav"><a href="#path-${n}">The path</a><a href="#mys-${n}">Mysteries</a><a href="#q-${n}">Side quests</a><a href="#g-${n}">Old maps</a><a href="#end-${n}">Endings</a><a href="#len-${n}">Scene lengths</a><a href="#prob-${n}">Problems</a></nav>
  <h3 class="sec" id="path-${n}">The path</h3>
  <p class="note">Every stage of the act in order. Data chapters show their steps; tap a red one to read what is wrong.</p>
  <ol class="timeline">${timeline || '<li class="empty">No stages.</li>'}</ol>
  <h3 class="sec" id="mys-${n}">Mysteries</h3>
  <p class="note">Where each clue is found, which deduction needs it, and which mystery the deduction solves. Hover or tap a box to read it.</p>
  ${mysteryGraph(n)}
  <div class="mcards">${mysteryCards(n)}</div>
  <h3 class="sec" id="q-${n}">Side quests</h3>${questCards(n)}
  <h3 class="sec" id="g-${n}">Back to old maps</h3>
  <p class="note">Gates that need this act's new powers, placed on earlier maps, and what each one leads to.</p>${gateCards(n)}
  <h3 class="sec" id="end-${n}">Endings</h3>${endingCards(n)}
  <h3 class="sec" id="len-${n}">Scene lengths</h3><p class="note">Lines along the longest branch; the mark is the limit (6 right after a boss, 10 otherwise).</p>${sceneBars(n)}
  <h3 class="sec" id="prob-${n}">Problems</h3>
  ${F.length ? `<ul class="plist">${F.map((f) => `<li><b>${esc(f.rule)}</b> ${esc(f.msg)} ${f.file ? `<span class="loc">${esc(f.file)}${f.line ? ':' + f.line : ''}</span>` : ''}</li>`).join('')}</ul>` : '<p class="good">No problems in this act.</p>'}
  ${Wn.length ? `<details class="wl"><summary>${Wn.length} note${Wn.length === 1 ? '' : 's'} (warnings)</summary><ul class="plist w">${Wn.map((f) => `<li><b>${esc(f.rule)}</b> ${esc(f.msg)}</li>`).join('')}</ul></details>` : ''}
</section>`;
}

// ---------------------------------------------------------------- the page
const sections = acts.map(actSection).join('\n');
const other = fails.filter((f) => !used.has(f) && !acts.includes(f.act));
const nF = fails.length, nW = (CJ.warns || []).length;
const when = new Date().toISOString().replace('T', ' ').slice(0, 16);
const CSS = `
:root{--bg:#f4efe6;--paper:#fffdf8;--ink:#2b2420;--soft:#6d625a;--line:#d9cfc1;--rail:#c9bba8;--ember:#c4511d;--ember2:#e07a3a;
--bad:#c8372d;--badbg:#fdecea;--ok:#2d7d52;--okbg:#e6f3ec;--warn:#a86a12;--clue:#1f7a7a;--cluebg:#e3f2f1;--ded:#6a4bb0;--dedbg:#eee8f8;
--trust:#b03a6e;--trustbg:#f8e6ef;--pow:#8a6a10;--powbg:#f7efd7;--quest:#2f5f9e;--questbg:#e5edf8;--herr:#c2571a;--herrbg:#fbe9dc;--flag:#6d625a;--flagbg:#efe9df;
--e-main:#3c8d8d;--e-opt:#b8a990;--e-need:#7a5fc0;--shadow:0 1px 2px rgba(60,40,20,.08),0 4px 14px rgba(60,40,20,.06)}
@media (prefers-color-scheme:dark){:root:not([data-theme=light]){--bg:#15100e;--paper:#1f1916;--ink:#efe6dc;--soft:#a99a8c;--line:#3a302a;--rail:#4a3d34;--ember:#ff8a4c;--ember2:#ffb07a;
--bad:#ff6f61;--badbg:#3a1a17;--ok:#5fcf93;--okbg:#16301f;--warn:#e6a64a;--clue:#5fd0cc;--cluebg:#14302f;--ded:#b49cf0;--dedbg:#2a2140;
--trust:#f08ab8;--trustbg:#3a1a2a;--pow:#e8c46a;--powbg:#352a10;--quest:#8ab4f0;--questbg:#17263a;--herr:#ff9a5a;--herrbg:#3a2112;--flag:#b5a596;--flagbg:#2a221d;
--e-main:#4fb3b0;--e-opt:#6b5d4f;--e-need:#9d84e8;--shadow:0 1px 2px rgba(0,0,0,.3),0 6px 18px rgba(0,0,0,.25)}}
:root[data-theme=dark]{--bg:#15100e;--paper:#1f1916;--ink:#efe6dc;--soft:#a99a8c;--line:#3a302a;--rail:#4a3d34;--ember:#ff8a4c;--ember2:#ffb07a;
--bad:#ff6f61;--badbg:#3a1a17;--ok:#5fcf93;--okbg:#16301f;--warn:#e6a64a;--clue:#5fd0cc;--cluebg:#14302f;--ded:#b49cf0;--dedbg:#2a2140;
--trust:#f08ab8;--trustbg:#3a1a2a;--pow:#e8c46a;--powbg:#352a10;--quest:#8ab4f0;--questbg:#17263a;--herr:#ff9a5a;--herrbg:#3a2112;--flag:#b5a596;--flagbg:#2a221d;
--e-main:#4fb3b0;--e-opt:#6b5d4f;--e-need:#9d84e8;--shadow:0 1px 2px rgba(0,0,0,.3),0 6px 18px rgba(0,0,0,.25)}
*{box-sizing:border-box}html{-webkit-text-size-adjust:100%}
body{margin:0;background:var(--bg);color:var(--ink);font:15px/1.5 system-ui,-apple-system,"Segoe UI",Roboto,sans-serif}
h1,h2,h3,h4{font-family:"Iowan Old Style","Palatino Linotype",Palatino,Georgia,serif;font-weight:600;margin:0;letter-spacing:.01em}
code{font:12.5px/1.3 ui-monospace,SFMono-Regular,Menlo,Consolas,monospace}
.top{position:sticky;top:0;z-index:5;background:color-mix(in srgb,var(--bg) 92%,transparent);backdrop-filter:blur(8px);border-bottom:1px solid var(--line)}
.topin{max-width:1180px;margin:0 auto;padding:10px 16px;display:flex;gap:12px;align-items:center;flex-wrap:wrap}
.brand{display:flex;align-items:baseline;gap:10px;margin-right:auto}.brand h1{font-size:20px}.brand h1 span{color:var(--ember)}.brand small{color:var(--soft)}
.tabs{display:flex;gap:6px;flex-wrap:wrap}.tabs button,.theme button{font:inherit;font-size:13px;border:1px solid var(--line);background:var(--paper);color:var(--ink);border-radius:999px;padding:5px 12px;cursor:pointer}
.tabs button[aria-pressed=true]{background:var(--ember);border-color:var(--ember);color:#fff}
.tabs button .n{display:inline-block;min-width:18px;margin-left:6px;padding:0 5px;border-radius:9px;background:var(--bad);color:#fff;font-size:11px;line-height:17px;text-align:center}
.theme{display:flex;gap:4px}.theme button{padding:5px 9px}.theme button[aria-pressed=true]{border-color:var(--ember);color:var(--ember)}
main{max-width:1180px;margin:0 auto;padding:16px}
.overall{display:flex;gap:10px;flex-wrap:wrap;align-items:center;margin:4px 0 14px;color:var(--soft);font-size:13px}
.big{font-size:14px;font-weight:600;padding:4px 10px;border-radius:8px}.big.sbad{background:var(--badbg);color:var(--bad)}.big.sok{background:var(--okbg);color:var(--ok)}
.act{display:none}.act.on{display:block}
.acth{display:flex;justify-content:space-between;gap:12px;align-items:flex-end;flex-wrap:wrap;padding:14px 0 8px;border-bottom:2px solid var(--ember)}
.acth h2{font-size:30px;line-height:1.1}.label{font-size:12px;text-transform:uppercase;letter-spacing:.08em;color:var(--soft)}
.stat{font-size:14px;padding:5px 12px;border-radius:999px}.stat.sbad{background:var(--badbg);color:var(--bad)}.stat.sok{background:var(--okbg);color:var(--ok)}
.sumrow{display:flex;flex-wrap:wrap;gap:6px;margin:12px 0}
.secnav{display:flex;gap:4px;flex-wrap:wrap;margin:6px 0 4px}.secnav a{font-size:13px;color:var(--soft);text-decoration:none;padding:3px 9px;border-radius:6px;border:1px solid transparent}.secnav a:hover{border-color:var(--line);color:var(--ink)}
.sec{font-size:22px;margin:30px 0 4px;padding-top:6px;scroll-margin-top:70px}.note{color:var(--soft);margin:0 0 12px;font-size:13.5px}.empty{color:var(--soft);font-style:italic}
.chip{display:inline-flex;align-items:center;gap:5px;font-size:12px;line-height:1.3;padding:2px 8px;border-radius:999px;border:1px solid transparent;white-space:nowrap;max-width:100%;overflow:hidden;text-overflow:ellipsis}
.chip small{opacity:.7;font-size:10.5px}
.c-clue{background:var(--cluebg);color:var(--clue)}.c-ded{background:var(--dedbg);color:var(--ded)}.c-trust{background:var(--trustbg);color:var(--trust)}.c-power{background:var(--powbg);color:var(--pow)}
.c-item{background:var(--powbg);color:var(--pow)}.c-flag{background:var(--flagbg);color:var(--flag)}.c-quest{background:var(--questbg);color:var(--quest)}.c-pay{background:var(--okbg);color:var(--ok)}.c-ok{background:var(--okbg);color:var(--ok)}
.c-bad{background:var(--badbg);color:var(--bad);border-color:var(--bad)}.c-herring{background:var(--herrbg);color:var(--herr);border:1px dashed var(--herr)}.c-bonus{background:transparent;color:var(--clue);border:1px dotted var(--clue)}
.c-trust i{font-style:italic;opacity:.8}
.timeline{list-style:none;margin:0;padding:0 0 0 22px;position:relative}
.timeline:before{content:"";position:absolute;left:8px;top:8px;bottom:8px;width:2px;background:var(--rail);border-radius:2px}
.stage{position:relative;margin:0 0 14px}.stage .dot{position:absolute;left:-19px;top:16px;width:12px;height:12px;border-radius:50%;background:var(--paper);border:2px solid var(--ember)}
.stage.old .dot{top:7px;width:10px;height:10px;left:-18px;border-color:var(--rail);background:var(--bg)}
.stage.bad .dot{border-color:var(--bad);background:var(--bad)}
.oldc{color:var(--soft);font-size:13px;padding:2px 0 4px}.pw b{display:inline-block;font-weight:600;color:var(--pow);background:var(--powbg);border-radius:6px;padding:0 6px;margin-left:3px;font-size:11.5px}
.card{background:var(--paper);border:1px solid var(--line);border-radius:12px;box-shadow:var(--shadow);padding:12px 14px}
.stage.bad>.card{border-color:color-mix(in srgb,var(--bad) 55%,var(--line))}
.ch-h{display:flex;justify-content:space-between;gap:10px;align-items:flex-start}.ch-h h3{font-size:20px}.cid{color:var(--soft);white-space:nowrap}
.sofar{margin:6px 0 8px;color:var(--soft);font-size:13.5px;font-style:italic}
.steps{display:flex;flex-direction:column;gap:6px;margin-top:8px}
.step{border:1px solid var(--line);border-radius:9px;padding:7px 9px;background:color-mix(in srgb,var(--paper) 70%,var(--bg))}
.step.opt{border-style:dashed;background:transparent}.step.bad{border-color:var(--bad);background:var(--badbg)}
.srow{display:flex;gap:8px;align-items:baseline;flex-wrap:wrap}.sid{font-weight:600;font-size:13px}.tgt{font:12.5px ui-monospace,Menlo,monospace;color:var(--soft);word-break:break-word}
.verb{font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.05em;padding:1px 7px;border-radius:5px;min-width:52px;text-align:center}
.v-talk{background:var(--questbg);color:var(--quest)}.v-go{background:var(--flagbg);color:var(--flag)}.v-find{background:var(--cluebg);color:var(--clue)}.v-deduce{background:var(--dedbg);color:var(--ded)}
.v-fight{background:var(--badbg);color:var(--bad)}.v-scene{background:var(--flagbg);color:var(--soft)}.v-game{background:var(--herrbg);color:var(--herr)}.v-power{background:var(--powbg);color:var(--pow)}.v-group{background:transparent;color:var(--soft);border:1px solid var(--line)}
.obj{font-size:13.5px;margin:3px 0 0}.chips{display:flex;flex-wrap:wrap;gap:4px;margin-top:5px}
.kids{margin:6px 0 0 10px;display:flex;flex-direction:column;gap:5px;border-left:2px solid var(--line);padding-left:9px}.opt-kids{border-left-style:dashed}.kids-h{font-size:11px;text-transform:uppercase;letter-spacing:.06em;color:var(--soft)}
.fmsg{margin-top:6px;font-size:13px;color:var(--bad);display:flex;flex-direction:column;gap:3px}.fmsg b{text-transform:uppercase;font-size:10.5px;letter-spacing:.06em;background:var(--bad);color:var(--paper);padding:0 5px;border-radius:4px;margin-right:4px}
.loc{color:var(--soft);font:11.5px ui-monospace,Menlo,monospace}
.ch-foot{margin-top:9px;display:flex;flex-direction:column;gap:6px}.tb{display:flex;flex-wrap:wrap;gap:4px}.meta{font-size:12.5px;color:var(--soft)}
.tf summary{cursor:pointer;color:var(--bad);font-size:13px}
.graphwrap{overflow-x:auto;background:var(--paper);border:1px solid var(--line);border-radius:12px;box-shadow:var(--shadow);padding:6px;-webkit-overflow-scrolling:touch}
.graph{display:block;max-width:none;height:auto}
.graph .colh{font:600 11px system-ui,sans-serif;text-transform:uppercase;letter-spacing:.08em;fill:var(--soft)}
.graph .e{fill:none;stroke-width:1.6;opacity:.8}.e-main{stroke:var(--e-main)}.e-opt{stroke:var(--e-opt);stroke-dasharray:4 4}.e-need{stroke:var(--e-need)}.e-bonus{stroke:var(--e-need);stroke-dasharray:2 4}.e-mys{stroke:var(--ember);stroke-width:2.2!important}
.graph .n rect{fill:var(--flagbg);stroke:var(--line);stroke-width:1}.graph .n text{font:12px ui-monospace,Menlo,monospace;fill:var(--ink)}.graph .n text.sub{font:10.5px system-ui,sans-serif;fill:var(--soft)}
.graph .n-clue rect{fill:var(--cluebg);stroke:var(--clue)}.graph .n-ded rect{fill:var(--dedbg);stroke:var(--ded)}.graph .n-main rect{fill:var(--ember);stroke:var(--ember)}.graph .n-main text{fill:#fff;font-weight:700}.graph .n-main text.sub{fill:#fff}
.graph .n-mys rect{fill:var(--paper);stroke:var(--ember);stroke-width:1.6}.graph .n-quest rect{fill:var(--questbg);stroke:var(--quest)}.graph .n-ch rect{fill:var(--paper);stroke:var(--rail)}
.graph .n-herring rect{fill:var(--herrbg);stroke:var(--herr);stroke-dasharray:4 3}.graph .n-lost rect{fill:var(--badbg);stroke:var(--bad)}
.graph .nbad rect{stroke:var(--bad);stroke-width:2.5;fill:var(--badbg)}.graph .nbad text{fill:var(--bad)}.graph .n[data-tip]{cursor:pointer}
.swipe{display:none;font-size:12px;color:var(--soft);margin:0 0 6px}@media (max-width:700px){.swipe{display:block}}
.legend{display:flex;flex-wrap:wrap;gap:12px;font-size:12px;color:var(--soft);margin:8px 2px 14px}.legend span{display:inline-flex;align-items:center;gap:6px}
.lg{display:inline-block;width:26px;height:0;border-top:2px solid}.lg.e-main{border-color:var(--e-main)}.lg.e-opt{border-top-style:dashed;border-color:var(--e-opt)}.lg.e-need{border-color:var(--e-need)}.lg.e-bonus{border-top-style:dotted;border-color:var(--e-need)}
.sw{display:inline-block;width:16px;height:12px;border-radius:3px}.sw.n-herring{background:var(--herrbg);border:1px dashed var(--herr)}.sw.nbad{background:var(--badbg);border:2px solid var(--bad)}
.mcards{display:grid;gap:12px;grid-template-columns:repeat(auto-fill,minmax(min(100%,420px),1fr))}
.mcard{background:var(--paper);border:1px solid var(--line);border-radius:12px;padding:12px 14px;box-shadow:var(--shadow)}.mcard.main{border-top:4px solid var(--ember)}
.mh{display:flex;flex-wrap:wrap;gap:8px;align-items:baseline;margin-bottom:6px}.mh h4{font-size:17px}.mh code{color:var(--soft)}
.tag{font-size:10.5px;text-transform:uppercase;letter-spacing:.08em;color:var(--ember);font-weight:700}
.ded{border-top:1px solid var(--line);padding:8px 0 4px}.ded.bad{background:var(--badbg);margin:0 -8px;padding:8px;border-radius:8px}
.q{font-weight:600}.q code{font-weight:400;color:var(--soft)}.in{font-weight:400;font-size:12px;color:var(--soft)}
.needs{display:flex;flex-wrap:wrap;gap:4px;margin:6px 0}.picks{margin:4px 0;padding-left:18px;font-size:13.5px}.picks li{margin:2px 0}
.picks li.right{color:var(--ok)}.picks .hint{display:block;color:var(--soft);font-size:12.5px}.red{color:var(--bad)}.herr{margin-top:6px;font-size:12.5px;color:var(--soft)}
.grid{display:grid;gap:10px;grid-template-columns:repeat(auto-fill,minmax(min(100%,300px),1fr))}
.qcard,.ecard{background:var(--paper);border:1px solid var(--line);border-radius:12px;padding:11px 13px;box-shadow:var(--shadow)}.qcard.bad,.ecard.bad{border-color:var(--bad)}
.qh,.eh{display:flex;justify-content:space-between;gap:8px;align-items:baseline}.qh code{color:var(--soft)}.qmeta{font-size:12.5px;color:var(--soft);margin:2px 0 4px}
.meter{margin:0 0 10px}.mtxt{font-size:13px;margin-bottom:4px}.bar{height:8px;background:var(--flagbg);border-radius:6px;overflow:hidden}.bar i{display:block;height:100%}.okb{background:var(--ok)}.badb{background:var(--bad)}
.gates{display:flex;flex-direction:column;gap:6px}
.gate{display:grid;grid-template-columns:86px 1fr auto;gap:10px;align-items:center;background:var(--paper);border:1px solid var(--line);border-radius:10px;padding:8px 10px}.gate.bad{border-color:var(--bad);background:var(--badbg)}
.gate .fmsg{grid-column:1/-1;margin:0}.gpow{font-weight:700;color:var(--pow);background:var(--powbg);border-radius:7px;text-align:center;padding:5px 4px;font-size:13px}
.gk{font-size:12px;color:var(--soft)}.gw{font-size:12.5px;color:var(--soft)}.arrow{color:var(--ember);font-weight:600}
@media (max-width:560px){.gate{grid-template-columns:70px 1fr}.gpay{grid-column:2}}
.ecard{margin-bottom:10px}.ecard.ok{border-left:4px solid var(--ok)}.ecard.bad{border-left:4px solid var(--bad)}.eh h4{font-size:18px}.econd{font-size:13.5px;margin:4px 0}
.trust{margin-top:6px}.tl{font-size:13px;margin-bottom:5px}.cells{display:flex;gap:4px}.cells i{width:26px;height:16px;border-radius:4px;border:1px solid var(--line);position:relative}
.cells i.have{background:var(--trust);border-color:var(--trust)}.cells i.bonus{background:repeating-linear-gradient(45deg,var(--trustbg),var(--trustbg) 3px,transparent 3px,transparent 6px);border-color:var(--trust);border-style:dashed}
.cells i.need:after{content:"needed";position:absolute;top:18px;left:-6px;font-size:10px;color:var(--soft);white-space:nowrap}
.bars{display:flex;flex-direction:column;gap:4px;background:var(--paper);border:1px solid var(--line);border-radius:12px;padding:10px 12px}
.sbar{display:grid;grid-template-columns:minmax(120px,240px) 1fr 44px;gap:10px;align-items:center;font-size:12.5px}.sn{font-family:ui-monospace,Menlo,monospace;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.sn em{font-family:system-ui;color:var(--bad);font-style:normal;font-size:11px}
.sb{position:relative;height:9px;background:var(--flagbg);border-radius:5px}.sb i{position:absolute;left:0;top:0;bottom:0;background:var(--e-main);border-radius:5px}.sb b{position:absolute;top:-3px;bottom:-3px;width:2px;background:var(--ink);opacity:.55}
.sbar.bad .sb i{background:var(--bad)}.sbar.bad .sl{color:var(--bad);font-weight:700}.sl{text-align:right}
@media (max-width:560px){.sbar{grid-template-columns:110px 1fr 38px}}
.plist{margin:0;padding-left:18px;font-size:13.5px}.plist li{margin:3px 0}.plist b{text-transform:uppercase;font-size:10.5px;letter-spacing:.06em;background:var(--bad);color:var(--paper);padding:0 5px;border-radius:4px}
.plist.w b{background:var(--warn)}.wl summary,.legacy summary{cursor:pointer;color:var(--soft);margin-top:10px}.good{color:var(--ok)}
#tipbox{position:fixed;z-index:20;max-width:min(420px,92vw);background:var(--ink);color:var(--bg);font-size:13px;line-height:1.4;padding:8px 10px;border-radius:8px;box-shadow:0 6px 24px rgba(0,0,0,.3);white-space:pre-wrap;display:none;pointer-events:none}
[data-tip]{cursor:pointer}
footer{max-width:1180px;margin:30px auto 40px;padding:0 16px;color:var(--soft);font-size:12.5px}
@media (max-width:560px){body{font-size:14.5px}.acth h2{font-size:24px}.card{padding:10px 11px}.timeline{padding-left:18px}.stage .dot{left:-16px}.stage.old .dot{left:-15px}.timeline:before{left:6px}}
`;
const JS = `
(function(){
  var root=document.documentElement, KEY='ebmap-theme';
  function setTheme(t){ if(t==='auto') root.removeAttribute('data-theme'); else root.setAttribute('data-theme',t);
    document.querySelectorAll('.theme button').forEach(function(b){ b.setAttribute('aria-pressed', String(b.dataset.t===t)); });
    try{ localStorage.setItem(KEY,t); }catch(e){} }
  var saved='auto'; try{ saved=localStorage.getItem(KEY)||'auto'; }catch(e){}
  setTheme(saved);
  document.querySelectorAll('.theme button').forEach(function(b){ b.onclick=function(){ setTheme(b.dataset.t); }; });
  function show(n){ document.querySelectorAll('.act').forEach(function(s){ s.classList.toggle('on', s.dataset.act===String(n)); });
    document.querySelectorAll('.tabs button').forEach(function(b){ b.setAttribute('aria-pressed', String(b.dataset.act===String(n))); });
    try{ history.replaceState(null,'','#a'+n); }catch(e){} }
  document.querySelectorAll('.tabs button').forEach(function(b){ b.onclick=function(){ show(b.dataset.act); window.scrollTo(0,0); }; });
  var h=(location.hash.match(/^#a(\\d+)$/)||[])[1]; var first=document.querySelector('.tabs button'); show(h||(first&&first.dataset.act)||'');
  document.querySelectorAll('.secnav a').forEach(function(a){ a.onclick=function(e){ e.preventDefault(); var t=document.querySelector(a.getAttribute('href')); if(t) t.scrollIntoView({behavior:'smooth'}); }; });
  var box=document.getElementById('tipbox'), pinned=null;
  function place(el,x,y){ box.textContent=el.getAttribute('data-tip'); box.style.display='block';
    var w=box.offsetWidth, hh=box.offsetHeight, vw=window.innerWidth, vh=window.innerHeight;
    var left=Math.min(vw-w-8, Math.max(8, x+12)), top=y+16; if(top+hh>vh-8) top=Math.max(8,y-hh-12);
    box.style.left=left+'px'; box.style.top=top+'px'; }
  function hide(){ box.style.display='none'; pinned=null; }
  document.addEventListener('mouseover',function(e){ if(pinned) return; var el=e.target.closest&&e.target.closest('[data-tip]'); if(el&&el.closest('svg')) place(el,e.clientX,e.clientY); else if(!el) box.style.display='none'; });
  document.addEventListener('mousemove',function(e){ if(pinned||box.style.display!=='block') return; var el=e.target.closest&&e.target.closest('svg [data-tip]'); if(el) place(el,e.clientX,e.clientY); });
  document.addEventListener('click',function(e){ var el=e.target.closest&&e.target.closest('[data-tip]'); if(el&&el.closest('svg')){ pinned=el; place(el,e.clientX,e.clientY); e.stopPropagation(); } else hide(); });
  document.addEventListener('keydown',function(e){ if(e.key==='Escape') hide(); if(e.key==='Enter'&&document.activeElement&&document.activeElement.hasAttribute('data-tip')&&document.activeElement.closest('svg')){ var r=document.activeElement.getBoundingClientRect(); pinned=document.activeElement; place(document.activeElement,r.left,r.bottom); } });
  window.addEventListener('scroll',function(){ if(!pinned) box.style.display='none'; },{passive:true});
})();
`;
const tabs = acts.map((n) => { const k = fails.filter((f) => f.act === n).length; return `<button data-act="${n}" aria-pressed="false">${esc(actName(n))}${k ? `<span class="n">${k}</span>` : ''}</button>`; }).join('');
const html = `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Emberblood Story Map</title><meta name="color-scheme" content="light dark"><style>${CSS}</style></head>
<body>
<div class="top"><div class="topin"><div class="brand"><h1>Ember<span>blood</span> story map</h1><small>${esc(when)} UTC</small></div>
<div class="tabs" role="tablist">${tabs}</div>
<div class="theme" aria-label="colours"><button data-t="auto">Auto</button><button data-t="light">Light</button><button data-t="dark">Dark</button></div></div></div>
<main>
<div class="overall"><span class="big ${nF ? 'sbad' : 'sok'}">${nF ? `${nF} problem${nF === 1 ? '' : 's'}` : 'No problems'}</span><span>${(CJ.warns || []).length} warnings, ${legacyWarns.length} of them from Act I's old text</span><span>${M.files.length} data files, ${Object.keys(M.chapters).length} chapters, ${Object.keys(M.quests).length} side quests, ${Object.keys(M.clues).length} clues${CJ.fresh ? ' (checked just now)' : ''}</span></div>
${acts.length ? sections : '<p class="empty">No story data yet (game/story is empty).</p>'}
${other.length ? `<section class="act on"><h3 class="sec">Problems outside any act</h3><ul class="plist">${other.map((f) => `<li><b>${esc(f.rule)}</b> ${esc(f.msg)}</li>`).join('')}</ul></section>` : ''}
${legacyWarns.length ? `<details class="legacy"><summary>${legacyWarns.length} lines in Act I's old modules that mention a gate, key, ledge, lift, chest, secret, cave or compass direction</summary><ul class="plist w">${legacyWarns.map((f) => `<li><b>${esc(f.rule)}</b> ${esc(f.msg)}</li>`).join('')}</ul></details>` : ''}
</main>
<footer>Made by tools/storymap.mjs from game/story and ${CJ.fresh ? 'a fresh check' : 'dist/check.json'}. Rules: v10/_plan_format.md. Run <code>node tools/check.mjs</code> then <code>node tools/storymap.mjs</code>.</footer>
<div id="tipbox" role="tooltip"></div>
<script>${JS}</script>
</body></html>
`;
if (html.includes('—')) throw new Error('em dash in the story map');
mkdirSync(outDir, { recursive: true });
writeFileSync(join(outDir, 'storymap.html'), html);
console.log(`storymap: wrote ${relative(process.cwd(), join(outDir, 'storymap.html'))} (${(html.length / 1024).toFixed(0)} KB, ${acts.length} act${acts.length === 1 ? '' : 's'}, ${nF} problems marked)`);
