#!/usr/bin/env node
// tools/check.mjs: the Emberblood v10 story checker (rules 1 to 13 of _plan_format.md, plus warnings).
//
//   node tools/check.mjs [--act 2] [--root <repo root>] [--story <dir>] [--out <dir>] [--quiet]
//
// Loads every game/story/**/*.js in a vm sandbox where act, chapter, quest and legacy are collectors and nothing
// else exists (a file that calls anything else, computes, or holds a function fails), reads the game code for what
// already exists (items, dungeons, flags, speakers), runs the rules, and writes <out>/check.md (counts, then FAIL
// and WARN lines) and <out>/check.json. Exit code 1 on any FAIL. Node 22, no packages, a few seconds.
import { readFileSync, writeFileSync, readdirSync, statSync, existsSync, mkdirSync } from 'node:fs';
import { join, relative, resolve, dirname, basename, sep } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { execFileSync } from 'node:child_process';
import vm from 'node:vm';
import { tokenize } from './jstok.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));

// ---------------------------------------------------------------- the game's fixed facts (V9.md 2, 3, 4.5; bibles)
export const MAPS = { 0: { w: 14000, h: 11000 }, 1: { w: 14000, h: 11000 }, 2: { w: 14000, h: 11000 }, 3: { w: 14000, h: 11000 }, 4: { w: 9000, h: 11000 } };
export const BAND = 20000, IZX = 20000;
export const ACT_MAP = { 1: 0, 2: 1, 3: 2, 4: 3, 5: 4 };
// gate kind -> the power that opens it (_plan_format.md, the gate table)
export const GATE_POWER = {
  climb_wall: 'claws', grapple_post: 'grapple', shadow_curtain: 'shadow', thin_bars: 'shadow', whip_hook: 'whip', chain_ring: 'whip',
  vent: 'wings', step_face: 'dbljump', water: 'stride', ice_wall: 'blaze', wind_ribbon: 'windride', pound_plate: 'pound',
  cracked_floor: 'pound', bomb_rock: 'bombs', dive_spot: 'dive', burrow_mound: 'burrow', moon_glass: 'moonfire', fetch_spot: 'fetch',
};
// which act's powers each power is (for backtracking: "new-power gates")
export const POWER_ACT = {
  jump: 1, stride: 1, wings: 1, dbljump: 1, skimmer: 1, claws: 2, grapple: 2, shadow: 2, whip: 2, fetch: 2,
  blaze: 3, windride: 3, pound: 3, bombs: 3, dive: 4, burrow: 4, moonfire: 4, glaive: 4,
};
// dungeons that grant a power when finished (game/src defineDungeon abil:, the Act I trials)
export const DUNGEON_POWER = {
  leap: 'jump', tide: 'stride', sky: 'wings', trial_leap: 'jump', trial_tide: 'stride', trial_sky: 'wings', a1_nursery: 'dbljump',
  c_gullcrag: 'claws', c_brassworks: 'grapple', c_lighthouse: 'shadow', f_maze: 'blaze', f_sky: 'windride', f_deep: 'pound',
  m_lumen: 'dive', m_burrows: 'burrow', m_mirror: 'moonfire',
};
// main-path power grants by the old (legacy) stage that ends with them: used when a stage is not data yet, or its data
// has no `dungeon` step for that dungeon. Optional sources (the whip from Saltbeard, the glaive) are not here.
export const LEGACY_STAGE_POWER = {
  lore: ['jump'], warcamp: ['stride'], oath: ['wings'], three: ['dbljump', 'skimmer'],
  c_claws: ['claws'], c_brass: ['grapple', 'fetch'], c_light: ['shadow'],
  f_maze: ['blaze'], f_sky: ['windride'], f_deep: ['pound'],
  m_lumen: ['dive'], m_burrows: ['burrow'], m_reef: ['bombs'], m_mirror: ['moonfire'],
};
export const ALL_POWERS = new Set(Object.keys(POWER_ACT));
const PAYOFF_KINDS = new Set(['power', 'upgrade', 'item_main', 'shortcut', 'ally', 'truth', 'heart_ember']);
const PLACE_KINDS = new Set(['examine', 'prints', 'sign', 'chest', 'gate', 'door', 'spot', 'prop', 'npc_spot', 'item']);
const REG_KINDS = new Set(['place', 'landmark', 'door', 'gate', 'npc', 'item', 'chest', 'examine', 'prints', 'sign', 'prop', 'spot', 'npc_spot', 'area']);
const STEP_VERBS = new Set(['talk', 'goto', 'find', 'examine', 'fight', 'use_power_at', 'give', 'choose', 'deduce', 'track', 'wait_for', 'cutscene', 'minigame', 'dungeon', 'all', 'any']);
const EFFECT_VERBS = new Set(['set', 'clear', 'give', 'take', 'trust', 'power', 'upgrade', 'heart_ember', 'open', 'close', 'spawn', 'despawn', 'move', 'world', 'clue', 'quest', 'stage', 'time', 'emit', 'mail', 'epi', 'music', 'xp', 'weapon', 'ally', 'hat',
  // also in ENG's engine (e10_story.js): see ENGINE.md section 4
  'coins', 'sfx', 'heal', 'choice', 'solve', 'bless', 'deed', 'end_act', 'warp', 'page', 'moon', 'people', 'bombbag', 'shrine']);
const WEAPON_POWERS = new Set(['whip', 'bombs', 'glaive']);
const STEP_SCENES = ['scene', 'lose', 'win', 'kneel', 'after', 'intro'];
const SPEAKERS_BUILTIN = new Set(['narr', 'ash', 'pip', 'mom', 'maren', 'sign', 'note', 'book', 'banner']);
const WATCH = /\b(gates?|ledges?|keys?|lifts?|chests?|secrets?|caves?|caverns?|north|south|east|west|northern|southern|eastern|western)\b/i;
const DIRV = { north: [0, -1], south: [0, 1], east: [1, 0], west: [-1, 0] };
const LEGACY_ACT1 = ['a1d_story', 'a1e_people', 'a1f_qdata', 'a1g_talk', 'a9d_quests', 'x0_act1', 'x0_vorlaxis'];
const BASE_REF = '0fb0938';
const AFTER_BOSS_MAX = 6, SCENE_MAX = 10, SIMPLE_WORDS = 8;
const EM = String.fromCharCode(0x2014);

// ---------------------------------------------------------------- small helpers
const isStr = (x) => typeof x === 'string';
const arr = (x) => (x == null ? [] : Array.isArray(x) ? x : [x]);
const words = (s) => (isStr(s) ? s.trim().split(/\s+/).filter((w) => /[A-Za-z0-9]/.test(w)).length : 0);
const short = (s, n = 60) => { s = String(s).replace(/\s+/g, ' '); return s.length > n ? s.slice(0, n - 3) + '...' : s; };
function walkFiles(dir, out = []) {
  if (!existsSync(dir)) return out;
  for (const n of readdirSync(dir).sort()) {
    const p = join(dir, n);
    const s = statSync(p);
    if (s.isDirectory()) walkFiles(p, out); else if (n.endsWith('.js')) out.push(p);
  }
  return out;
}
// a text pair: 'x' | ['full'] | ['full','simple'] -> { full, simple }
function pairOf(x) {
  if (isStr(x)) return { full: x, simple: null };
  if (Array.isArray(x) && isStr(x[0])) return { full: x[0], simple: isStr(x[1]) ? x[1] : null };
  return null;
}

// ---------------------------------------------------------------- reading the game code (what already exists)
export function scanGame(root) {
  const srcDir = join(root, 'game/src');
  const G = {
    files: {}, inBuild: new Set(), strs: new Set(), keys: new Set(), items: new Set(), itemGives: new Set(), itemReads: new Set(),
    itemReadPrefixes: new Set(), flagReads: new Map(), flagSets: new Set(), choiceReads: new Map(), emits: new Set(), dungeons: new Set(), minis: new Set(),
    foes: new Set(), looks: new Set(), poses: new Set(), propKinds: new Set(), stages: [], stageAct: {}, speakers: new Set(), cast: new Set(),
  };
  if (!existsSync(srcDir)) return G;
  let order = [];
  try {
    const b = readFileSync(join(root, 'build.mjs'), 'utf8');
    const m = /const ORDER\s*=\s*\[([\s\S]*?)\];/.exec(b);
    if (m) order = [...m[1].matchAll(/'([^']+)'/g)].map((q) => q[1]);
  } catch (e) { /* no build.mjs */ }
  for (const f of readdirSync(srcDir).filter((n) => n.endsWith('.js')).sort()) {
    const mod = f.slice(0, -3);
    const t = readFileSync(join(srcDir, f), 'utf8');
    G.files[mod] = t;
    if (!order.length || order.includes(mod) || /^v10_art/.test(mod) || /^e10/.test(mod)) G.inBuild.add(mod);
  }
  const add = (set, v) => { if (v) set.add(v); };
  const count = (map, k, mod) => { const e = map.get(k) || []; e.push(mod); map.set(k, e); };
  for (const [mod, t] of Object.entries(G.files)) {
    for (const m of t.matchAll(/(['"`])([A-Za-z_][A-Za-z0-9_:.-]*)\1/g)) G.strs.add(m[2]);
    for (const m of t.matchAll(/([A-Za-z_][A-Za-z0-9_]*)\s*:/g)) G.keys.add(m[1]);
    for (const m of t.matchAll(/\.([A-Za-z_][A-Za-z0-9_]*)/g)) G.keys.add(m[1]);
    for (const m of t.matchAll(/ITEM_NAMES\s*(?:=|,)\s*\{([^]*?)\}\s*\)?\s*;/g)) for (const k of m[1].matchAll(/(?:^|[,{\s])([A-Za-z_][A-Za-z0-9_]*)\s*:/g)) G.items.add(k[1]);
    for (const m of t.matchAll(/ITEM_NAMES\.([A-Za-z_][A-Za-z0-9_]*)\s*=/g)) G.items.add(m[1]);
    for (const m of t.matchAll(/\[\s*'([a-z][a-z0-9_]*)'\s*,\s*S\(/g)) if (/ITEM_NAMES/.test(t)) G.strs.add(m[1]);
    for (const m of t.matchAll(/giveItems\(\s*\{([^}]*)\}/g)) for (const k of m[1].matchAll(/([A-Za-z_][A-Za-z0-9_]*)\s*:/g)) G.itemGives.add(k[1]);
    for (const m of t.matchAll(/\bitems(?:\.([A-Za-z_][A-Za-z0-9_]*)|\[\s*'([^']+)'\s*\])(?!\s*=[^=])/g)) add(G.itemReads, m[1] || m[2]);
    // the old quest tables and helpers read items too: take:{x:1}, takeItems({x:1}), {t:'item',item:'x'}, item:{item:'x'},
    // locked:'x' (a locked chest or door), hasItem('x'), itemCount('x'), k==='x' in an item handler
    for (const m of t.matchAll(/\b(?:take|takeItems\()\s*:?\s*\{([^}]*)\}/g)) for (const k of m[1].matchAll(/([A-Za-z_][A-Za-z0-9_]*)\s*:/g)) G.itemReads.add(k[1]);
    for (const m of t.matchAll(/\b(?:item|locked|needItem|key)\s*:\s*'([a-z][a-z0-9_]*)'/g)) G.itemReads.add(m[1]);
    for (const m of t.matchAll(/\b(?:hasItem|itemCount|haveItem|useItem)\(\s*'([a-z][a-z0-9_]*)'/g)) G.itemReads.add(m[1]);
    for (const m of t.matchAll(/\bk\s*===\s*'([a-z][a-z0-9_]*)'/g)) G.itemReads.add(m[1]);
    for (const m of t.matchAll(/\bitems\[\s*'([a-z][a-z0-9_]*)'\s*\+/g)) G.itemReadPrefixes.add(m[1]);
    for (const m of t.matchAll(/\b(?:flags|F)(?:\.([A-Za-z_][A-Za-z0-9_]*)|\[\s*'([^']+)'\s*\])(\s*=(?!=))?/g)) {
      const k = m[1] || m[2]; if (!k) continue;
      if (m[3]) G.flagSets.add(k); else count(G.flagReads, k, mod);
    }
    for (const m of t.matchAll(/\bchoices(?:\.([A-Za-z_][A-Za-z0-9_]*)|\[\s*'([^']+)'\s*\])(\s*=(?!=))?/g)) { const k = m[1] || m[2]; if (k && !m[3]) count(G.choiceReads, k, mod); }
    for (const m of t.matchAll(/storyEmit\(\s*['"`]([^'"`]+)['"`]/g)) G.emits.add(m[1]);
    for (const m of t.matchAll(/defineDungeon\(\s*['"]([A-Za-z0-9_]+)/g)) G.dungeons.add(m[1]);
    for (const m of t.matchAll(/MINI(?:\.([A-Za-z0-9_]+)|\[\s*'([^']+)'\s*\])\s*=/g)) G.minis.add(m[1] || m[2]);
    for (const m of t.matchAll(/define(?:Foe|Boss)\(\s*['"]([A-Za-z0-9_]+)/g)) G.foes.add(m[1]);
    for (const m of t.matchAll(/defineLook\(\s*['"]([^'"]+)/g)) G.looks.add(m[1]);
    for (const m of t.matchAll(/definePose\(\s*['"]([^'"]+)['"]\s*,\s*['"]([^'"]+)/g)) G.poses.add(`${m[1]}:${m[2]}`);
    for (const m of t.matchAll(/definePropKind\(\s*['"]([^'"]+)/g)) G.propKinds.add(m[1]);
    // old drawings an old module tells the engine how to find (e10_story s10FindKind, for legacy src prop:<k>@x,y)
    for (const m of t.matchAll(/s10FindKind\(\s*['"]([^'"]+)/g)) G.propKinds.add(m[1]);
    for (const m of t.matchAll(/\{id:'([a-z0-9_]+)',name:/g)) G.cast.add(m[1]);
    for (const m of t.matchAll(/(?:c1Spk|f2Spk|m3Spk|Spk)\(\s*'([a-z0-9_]+)'/g)) G.speakers.add(m[1]);
    for (const m of t.matchAll(/\bSPK\.([a-z0-9_]+)\s*=|\bSPK\[\s*'([^']+)'\s*\]\s*=/g)) G.speakers.add(m[1] || m[2]);
  }
  // gate kinds the gate library builds (e10c_gates.js GATE_KINDS): power null is a story gate (only an `open` effect)
  G.gateKinds = {};
  const gk = /const GATE_KINDS\s*=\s*\{/.exec(G.files.e10c_gates || '');
  if (gk) {
    const seg = G.files.e10c_gates.slice(gk.index, spanEnd(G.files.e10c_gates, gk.index + gk[0].length - 1));
    for (const m of seg.matchAll(/(?:^|[,{\s])([a-z_]+)\s*:\s*\{\s*power\s*:\s*(?:'([a-z]+)'|null)/g)) G.gateKinds[m[1]] = m[2] || null;
  }
  for (const [k, p] of Object.entries(G.gateKinds)) if (p && !GATE_POWER[k]) GATE_POWER[k] = p;
  // upstairs and cellars (a2g_floors.js FLOORS: h_x:{up:{...}} makes area h_x_up)
  G.areas = new Set();
  const fl = /const FLOORS\s*=\s*\{/.exec(G.files.a2g_floors || '');
  if (fl) {
    const T = G.files.a2g_floors, end = spanEnd(T, fl.index + fl[0].length - 1);
    for (const m of T.slice(fl.index, end).matchAll(/\n\s*([a-z][a-z0-9_]*)\s*:\s*\{/g)) {
      const at0 = fl.index + m.index + m[0].length - 1, body = T.slice(at0, spanEnd(T, at0));
      for (const w of ['up', 'down']) if (new RegExp(`[{,\\s]${w}\\s*:\\s*\\{`).test(body.slice(0, 40)) || new RegExp(`\\n\\s*${w}\\s*:\\s*\\{`).test(body)) G.areas.add(`${m[1]}_${w}`);
    }
  }
  // stage order: Act I's STAGES, then every defineStages block in module order
  const a9 = G.files.a9c_story || '';
  const sm = /const STAGES\s*=\s*\[([^\]]*)\]/.exec(a9);
  if (sm) for (const q of sm[1].matchAll(/'([^']+)'/g)) { G.stages.push(q[1]); G.stageAct[q[1]] = 1; }
  const modOrder = order.length ? order.filter((m) => G.files[m]) : Object.keys(G.files);
  // the real stage lists (with chapter:) first, in module order; fallback lists (at: only) after
  const storyFirst = modOrder.filter((m) => /_story$|^e7_acts$/.test(m)).concat(modOrder.filter((m) => !/_story$|^e7_acts$/.test(m)));
  for (const key of ['chapter', 'at']) for (const mod of storyFirst) {
    const t = G.files[mod];
    for (const m of t.matchAll(/defineStages\(\s*(\d)\s*,\s*\[/g)) {
      const n = +m[1];
      const seg = t.slice(m.index, spanEnd(t, m.index + m[0].length - 1));
      for (const q of seg.matchAll(new RegExp(`\\{id:'([a-z0-9_]+)'\\s*,\\s*${key}\\b`, 'g'))) if (!(q[1] in G.stageAct)) { G.stages.push(q[1]); G.stageAct[q[1]] = n; }
    }
  }
  return G;
}

// the index just past the bracket that closes the one at t[i] (skips strings, templates and comments)
function spanEnd(t, i) {
  let d = 0;
  for (let k = i; k < t.length; k++) {
    const c = t[k];
    if (c === '"' || c === "'" || c === '`') { const q = c; k++; while (k < t.length && t[k] !== q) { if (t[k] === '\\') k++; k++; } continue; }
    if (c === '/' && t[k + 1] === '/') { while (k < t.length && t[k] !== '\n') k++; continue; }
    if (c === '/' && t[k + 1] === '*') { k = t.indexOf('*/', k + 2); if (k < 0) return t.length; k++; continue; }
    if (c === '[' || c === '{' || c === '(') d++;
    else if (c === ']' || c === '}' || c === ')') { d--; if (d === 0) return k + 1; }
  }
  return t.length;
}

// ---------------------------------------------------------------- loading the data (sandbox + static scan)
const COLLECTORS = ['act', 'chapter', 'quest', 'legacy', 'people', 'places'];
function staticScan(text) {
  // a whitelist: literals, the four collectors, object keys, ( ) [ ] { } , : ; and a minus before a number
  const toks = tokenize(text);
  const bad = [];
  const calls = [];
  for (let i = 0; i < toks.length; i++) {
    const t = toks[i], p = toks[i - 1], n = toks[i + 1];
    if (t.t === 'id') {
      if (COLLECTORS.includes(t.v) && n && n.v === '(') { calls.push({ kind: t.v, line: t.line }); continue; }
      if (['true', 'false', 'null'].includes(t.v)) continue;
      if (n && n.v === ':' && p && (p.v === '{' || p.v === ',')) continue; // object key
      if (t.v === 'function' || t.v === 'class') { bad.push({ line: t.line, what: `contains a ${t.v}` }); continue; }
      bad.push({ line: t.line, what: n && n.v === '(' ? `calls ${t.v}()` : `uses the name ${t.v}` });
      continue;
    }
    if (t.t === 'tpl' && t.expr) { bad.push({ line: t.line, what: 'a template string with ${...} computes' }); continue; }
    if (t.t === 'regex') { bad.push({ line: t.line, what: 'a regular expression' }); continue; }
    if (t.t === 'punc') {
      if ('()[]{},:;'.includes(t.v) && t.v.length === 1) continue;
      if (t.v === '-' && n && n.t === 'num' && p && (p.v === ',' || p.v === '[' || p.v === ':' || p.v === '(')) continue;
      if (t.v === '=>') { bad.push({ line: t.line, what: 'contains a function (=>)' }); continue; }
      bad.push({ line: t.line, what: `computes with "${t.v}"` });
    }
  }
  return { toks, bad, calls };
}

function lineIndex(toks) {
  // first line of each string literal value, and of each `key:` (for ids)
  const strLine = new Map(), keyLine = new Map();
  for (let i = 0; i < toks.length; i++) {
    const t = toks[i];
    if ((t.t === 'str' || t.t === 'tpl') && !strLine.has(t.v)) strLine.set(t.v, t.line);
    if ((t.t === 'id' || t.t === 'str') && toks[i + 1] && toks[i + 1].v === ':' && !keyLine.has(String(t.v))) keyLine.set(String(t.v), t.line);
  }
  return { strLine, keyLine };
}

export function loadStory(storyDir, root) {
  const files = walkFiles(storyDir);
  const out = { files: [], items: [], loadFails: [] };
  for (const path of files) {
    const rel = relative(root, path).split(sep).join('/');
    const text = readFileSync(path, 'utf8');
    const { toks, bad, calls } = staticScan(text);
    const idx = lineIndex(toks);
    const F = { path, rel, text, idx, ok: true };
    out.files.push(F);
    for (const b of bad.slice(0, 5)) out.loadFails.push({ rule: 'load', file: rel, line: b.line, msg: `${rel}:${b.line} ${b.what} (data files hold only literals and act/chapter/quest/legacy calls)` });
    if (bad.length > 5) out.loadFails.push({ rule: 'load', file: rel, line: bad[5].line, msg: `${rel}: ${bad.length - 5} more problems like that` });
    if (bad.length) { F.ok = false; continue; }
    const got = [];
    const ctx = vm.createContext(Object.create(null));
    for (const k of COLLECTORS) ctx[k] = (o) => { got.push({ kind: k, def: o }); };
    try {
      new vm.Script(text, { filename: rel }).runInContext(ctx, { timeout: 1000 });
    } catch (e) {
      const m = /:(\d+)/.exec(String(e.stack || '').split('\n').find((l) => l.includes(rel)) || '');
      out.loadFails.push({ rule: 'load', file: rel, line: m ? +m[1] : 0, msg: `${rel}${m ? ':' + m[1] : ''} does not load: ${String(e.message || e)}` });
      F.ok = false; continue;
    }
    got.forEach((g, i) => {
      g.file = rel; g.line = calls[i] ? calls[i].line : 0; g.F = F;
      const fn = findFunction(g.def);
      if (fn) out.loadFails.push({ rule: 'load', file: rel, line: g.line, msg: `${rel}:${g.line} holds a function at ${fn}` });
      if (!g.def || typeof g.def !== 'object' || Array.isArray(g.def)) out.loadFails.push({ rule: 'load', file: rel, line: g.line, msg: `${rel}:${g.line} ${g.kind}() needs one object` });
      else out.items.push(g);
    });
  }
  return out;
}
function findFunction(v, path = '') {
  if (typeof v === 'function') return path || '(top)';
  if (v && typeof v === 'object') for (const k of Object.keys(v)) { const r = findFunction(v[k], `${path}.${k}`); if (r) return r; }
  return null;
}

// ---------------------------------------------------------------- the model
function actOfPath(rel) { const m = /\/act(\d+)\//.exec(rel); return m ? +m[1] : null; }

export function buildModel(loaded, game) {
  const M = {
    acts: {}, chapters: {}, quests: {}, ents: {}, npcs: {}, items: {}, clues: {}, deduce: {}, scenes: {}, mysteries: {}, pages: {},
    dupes: [], owners: [], game, files: loaded.files,
  };
  const dup = (what, id, a, b) => M.dupes.push({ what, id, a, b });
  const ownerOf = (g) => ({ type: g.kind, id: g.def.id, act: g.def.act != null ? g.def.act : (g.kind === 'act' ? g.def.id : actOfPath(g.file)), file: g.file, line: g.line, F: g.F, def: g.def });
  for (const g of loaded.items) {
    const d = g.def;
    if (g.kind === 'legacy') {
      if (!isStr(d.id)) { M.dupes.push({ what: 'legacy without id', id: '?', a: `${g.file}:${g.line}` }); continue; }
      const e = Object.assign({}, d, { from: 'legacy', file: g.file, line: g.line, owner: null });
      const prev = M.ents[d.id];
      if (prev && prev.from === 'npc') { M.ents[d.id] = e; if (d.kind === 'npc') M.npcs[d.id] = Object.assign({}, e, prev, { at: prev.at || e.at, map: prev.map != null ? prev.map : e.map }); continue; }
      if (prev) {
        if (prev.from !== 'legacy') dup('entity', d.id, `${prev.file}:${prev.line}`, `${g.file}:${g.line}`);
        else if (!sameEnt(prev, e)) dup(`legacy entry (${entSig(prev)} vs ${entSig(e)})`, d.id, `${prev.file}:${prev.line}`, `${g.file}:${g.line}`);
        continue;
      }
      M.ents[d.id] = e;
      if (d.kind === 'npc') M.npcs[d.id] = Object.assign({ from: 'legacy' }, e);
      if (d.kind === 'item') M.items[d.id] = M.items[d.id] || { id: d.id, name: d.name, from: 'legacy', file: g.file, line: g.line, keepsake: d.keepsake };
      continue;
    }
    const O = ownerOf(g);
    if (g.kind === 'act') {
      const n = isStr(d.id) && /^act(\d+)$/.test(d.id) ? +d.id.slice(3) : typeof d.id === 'number' ? d.id : (d.act != null ? d.act : actOfPath(g.file));
      O.act = n;
      if (M.acts[n]) dup('act', n, `${M.acts[n].file}:${M.acts[n].line}`, `${g.file}:${g.line}`);
      M.acts[n] = O;
      const mys = d.mystery || {};
      const list = Array.isArray(mys) ? mys.map((m) => [m.id, m]) : Object.entries(mys);
      for (const [id, m] of list) M.mysteries[id] = { id, def: m || {}, act: n, main: !!(m && (m.main || m.kind === 'main')), file: g.file, line: g.F.idx.keyLine.get(id) || g.line };
    } else if (g.kind === 'chapter') {
      if (!isStr(d.id)) { dup('chapter without id', '?', `${g.file}:${g.line}`); continue; }
      if (M.chapters[d.id]) dup('chapter', d.id, `${M.chapters[d.id].file}:${M.chapters[d.id].line}`, `${g.file}:${g.line}`);
      M.chapters[d.id] = O;
    } else if (g.kind === 'quest') {
      if (!isStr(d.id)) { dup('quest without id', '?', `${g.file}:${g.line}`); continue; }
      if (M.quests[d.id]) dup('quest', d.id, `${M.quests[d.id].file}:${M.quests[d.id].line}`, `${g.file}:${g.line}`);
      M.quests[d.id] = O;
    } else if (g.kind === 'people' || g.kind === 'places') {
      if (!isStr(d.id)) { dup(`${g.kind} without id`, '?', `${g.file}:${g.line}`); continue; }
      const key = `${g.kind}:${d.id}`;
      if (M.extra && M.extra[key]) dup(g.kind, d.id, `${M.extra[key].file}:${M.extra[key].line}`, `${g.file}:${g.line}`);
      (M.extra = M.extra || {})[key] = O;
      if (g.kind === 'places') for (const p of Object.values(d.place || {})) if (p && p.map == null && d.map != null) p.map = d.map;
    }
    M.owners.push(O);
    // blocks every owner may carry
    for (const [id, p] of Object.entries(d.place || {})) {
      const e = Object.assign({ id }, p, { from: 'place', owner: O, file: g.file, line: g.F.idx.keyLine.get(id) || g.line });
      if (M.ents[id]) { const pr = M.ents[id]; if (!(pr.from === 'place' && sameEnt(pr, e))) dup('entity', id, `${pr.file}:${pr.line}`, `${e.file}:${e.line}`); continue; }
      M.ents[id] = e;
    }
    for (const [id, n] of Object.entries(d.npc || {})) {
      const e = Object.assign({ id, kind: 'npc' }, n, { from: 'npc', owner: O, file: g.file, line: g.F.idx.keyLine.get(id) || g.line });
      if (M.npcs[id] && M.npcs[id].from === 'npc' && !sameEnt(M.npcs[id], e)) dup('npc', id, `${M.npcs[id].file}:${M.npcs[id].line}`, `${e.file}:${e.line}`);
      M.npcs[id] = e;
      if (!M.ents[id]) M.ents[id] = e;
    }
    for (const [id, it] of Object.entries(d.item || {})) {
      const e = Object.assign({ id }, it, { from: 'item', owner: O, file: g.file, line: g.F.idx.keyLine.get(id) || g.line });
      if (M.items[id] && M.items[id].from === 'item') dup('item', id, `${M.items[id].file}:${M.items[id].line}`, `${e.file}:${e.line}`);
      M.items[id] = e;
    }
    for (const [id, c] of Object.entries(d.clue || {})) {
      const e = Object.assign({ id }, c, { owner: O, file: g.file, line: g.F.idx.keyLine.get(id) || g.line });
      if (M.clues[id]) dup('clue', id, `${M.clues[id].file}:${M.clues[id].line}`, `${e.file}:${e.line}`);
      M.clues[id] = e;
    }
    for (const [id, c] of Object.entries(d.deduce || {})) {
      const e = Object.assign({ id }, c, { owner: O, file: g.file, line: g.F.idx.keyLine.get(id) || g.line });
      if (M.deduce[id]) dup('deduction', id, `${M.deduce[id].file}:${M.deduce[id].line}`, `${e.file}:${e.line}`);
      M.deduce[id] = e;
    }
    for (const [id, pg] of Object.entries(d.page || {})) {
      const e = Object.assign({ id }, pg, { owner: O, file: g.file, line: g.F.idx.keyLine.get(id) || g.line });
      if (M.pages[id]) dup('page', id, `${M.pages[id].file}:${M.pages[id].line}`, `${e.file}:${e.line}`);
      M.pages[id] = e;
    }
    for (const [id, s] of Object.entries(d.scene || {})) {
      const e = { id, beats: s, owner: O, file: g.file, line: g.F.idx.keyLine.get(id) || g.line };
      if (M.scenes[id]) dup('scene', id, `${M.scenes[id].file}:${M.scenes[id].line}`, `${e.file}:${e.line}`);
      M.scenes[id] = e;
    }
  }
  return M;
}
// two entries for one id agree: same map, kind, gate and leads, and points within 64 px
function sameEnt(a, b) {
  const k = (e) => JSON.stringify([e.map, e.kind, e.gate, e.leads, e.area || null]);
  if (k(a) !== k(b)) return false;
  const pa = a.at ? [a.at] : a.path || [], pb = b.at ? [b.at] : b.path || [];
  if (pa.length !== pb.length) return false;
  return pa.every((p, i) => Array.isArray(p) && Array.isArray(pb[i]) && Math.hypot(p[0] - pb[i][0], p[1] - pb[i][1]) <= 64);
}
const entSig = (e) => `${e.kind || '?'} map ${e.map} at ${JSON.stringify(e.at || (e.path && e.path[0]) || null)}${e.leads ? ' leads ' + e.leads : ''}`;

// ---------------------------------------------------------------- parsing the little languages
// a step's do: 'verb arg arg'
export function parseDo(s) {
  if (!isStr(s)) return { verb: null, args: [] };
  const p = s.trim().split(/\s+/);
  return { verb: p[0], args: p.slice(1) };
}
// conditions: 'flag x item y !power z' -> [{ neg, k, a:[...] }]; unknown words -> { bad }
// a condition word and how many words follow it ('?' = one more word only if it matches)
const COND_ARGS = { flag: 1, item: 1, power: 1, trust: 1, choice: 1, clue: 1, solved: 1, seen: 1, diff: 1, hour: 1, night: 0, day: 0, weapon: 1, world: 1,
  event: 1, step: 1, area: 1, outdoors: 0, ending: 1, true: 0, false: 0 };
const COND_OPT = { quest: /^(done|active|started|open|available)$/, near: /^\d+$/, coins: /^[<>=!]/ };
export function parseCond(c) {
  const res = [];
  if (c == null || c === true) return res;
  if (Array.isArray(c)) return [{ any: c.map(parseCond) }];
  if (typeof c === 'object') {
    if (c.any) return [{ any: arr(c.any).map(parseCond) }];
    if (c.if) return parseCond(c.if);
    return res;
  }
  const t = String(c).trim().split(/\s+/).filter(Boolean);
  for (let i = 0; i < t.length; i++) {
    let w = t[i], neg = false;
    if (w.startsWith('!')) { neg = true; w = w.slice(1); }
    let m;
    if ((m = /^(stage|act|coins)(>=|<=|>|<|=|==|!=)(.+)$/.exec(w))) { res.push({ neg, k: m[1], op: m[2], a: [m[3]] }); continue; }
    if (w in COND_OPT) { const a = []; if (w !== 'coins') { a.push(t[i + 1]); i++; } if (t[i + 1] && COND_OPT[w].test(t[i + 1])) { a.push(t[i + 1]); i++; } res.push({ neg, k: w, a }); continue; }
    if (w in COND_ARGS) { const n = COND_ARGS[w]; res.push({ neg, k: w, a: t.slice(i + 1, i + 1 + n) }); i += n; continue; }
    if ((w === 'stage' || w === 'act') && t[i + 1]) { res.push({ neg, k: w, op: '=', a: [t[i + 1]] }); i++; continue; }
    res.push({ neg, k: '?', a: [w], bad: w });
  }
  return res;
}
const condText = (c) => (isStr(c) ? c : Array.isArray(c) ? c.map(condText).join(' | ') : c && c.any ? arr(c.any).map(condText).join(' | ') : JSON.stringify(c));

// ---------------------------------------------------------------- the checker
export function runChecks(M, opts = {}) {
  const G = M.game;
  const fails = [], warns = [];
  const actFilter = opts.act != null ? +opts.act : null;
  const inAct = (a) => actFilter == null || a == null || +a === actFilter;
  const at = (O, key) => { if (!O) return { file: '', line: 0 }; const l = (key != null && O.F && (O.F.idx.strLine.get(key) || O.F.idx.keyLine.get(key))) || O.line; return { file: O.file, line: l }; };
  // messages quote the data; an em dash in a quote is shown as [em dash] so no report holds one
  const clean = (m) => String(m).split(EM).join('[em dash]');
  const FAIL = (rule, msg, where = {}) => { if (inAct(where.act)) fails.push(Object.assign({ rule, msg: clean(msg) }, where)); };
  const WARN = (rule, msg, where = {}) => { if (inAct(where.act)) warns.push(Object.assign({ rule, msg: clean(msg) }, where)); };
  const W = (O, extra = {}) => Object.assign({ act: O ? O.act : null, owner: O ? O.id : null, file: O ? O.file : '', line: O ? O.line : 0 }, extra);

  // ---------- load and duplicate problems
  for (const f of opts.loadFails || []) FAIL('load', f.msg, { file: f.file, line: f.line, act: actOfPath(f.file) });
  for (const d of M.dupes) FAIL('dup', `${d.what} ${d.id} is defined twice: ${d.a}${d.b ? ' and ' + d.b : ''}`, { file: (d.b || d.a || '').split(':')[0], line: +((d.b || d.a || '').split(':')[1] || 0), act: actOfPath(d.a || '') });

  // ---------- name lookups
  // an id the game code names, as a literal or built from a prefix ('c_pep'+(i+1) makes c_pep1)
  const dynPrefix = new Map();
  const knownGame = (id) => {
    if (G.strs.has(id) || G.keys.has(id)) return true;
    const str = String(id || '');
    const cands = [];
    const m = /^(.*?[a-z_])(\d+)[a-z]?$/.exec(str);
    if (m) cands.push(m[1]);
    const u = str.lastIndexOf('_');
    if (u > 0 && u < str.length - 1) cands.push(str.slice(0, u + 1));
    return cands.some((pre0) => {
      if (!dynPrefix.has(pre0)) { const pre = pre0.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); const re = new RegExp(`['"\`]${pre}['"\`]\\s*\\+|\`${pre}\\$\\{`); dynPrefix.set(pre0, Object.values(G.files).some((t) => re.test(t))); }
      return dynPrefix.get(pre0);
    });
  };
  const isEnt = (id) => !!M.ents[id];
  const isNpc = (id) => !!M.npcs[id] || (M.ents[id] && M.ents[id].kind === 'npc');
  const isItem = (id) => !!M.items[id] || G.items.has(id) || id === 'coins';
  const isSpeaker = (id) => SPEAKERS_BUILTIN.has(id) || isNpc(id) || G.cast.has(id) || G.speakers.has(id) || knownGame(id);
  const stageIdx = (id) => { const i = G.stages.indexOf(id); return i; };
  const flagSetInData = new Set();
  const emitsInData = new Set();
  const choiceIds = new Set();
  const itemsGivenData = new Map();   // item -> [where]
  const itemsUsedData = new Map();
  const cluesAdded = new Map();       // clue -> [{ owner, main?, where }]
  const scenesUsed = new Map();       // scene -> [where]
  const worldStates = new Map();      // entity -> Set(states) from `world` effects
  const optionScenes = new Map();     // scene -> [where] for talk options
  const openedByData = new Set();     // entities an `open x` effect opens
  const addTo = (map, k, v) => { if (!map.has(k)) map.set(k, []); map.get(k).push(v); };

  // ---------- 1. walk every owner, collect uses, check ids and vocabulary
  // visit every effect list / condition / line in an owner, calling cb
  function eachEffect(list, cb, ctx) { for (const e of arr(list)) cb(e, ctx); }
  function checkEffect(e, O, where) {
    if (e && typeof e === 'object' && !Array.isArray(e)) {
      if (e.banner) { textPair(e.banner, O, where + ' banner', null, {}); return; }
      if (e.journal != null) { textPair(e.journal, O, where + ' journal', null, {}); return; }
      if (e.say != null) { if (Array.isArray(e.say)) lineBeat(e.say, O, where + ' say', []); return; }
      if (e.if != null && ('then' in e || 'else' in e)) { checkCond(e.if, O, where); eachEffect(e.then, (x) => checkEffect(x, O, where)); eachEffect(e.else, (x) => checkEffect(x, O, where)); return; }
      FAIL('ids', `${O.id}.${where}: unknown effect ${short(JSON.stringify(e))}`, W(O, at(O)));
      return;
    }
    if (!isStr(e)) { FAIL('ids', `${O.id}.${where}: an effect must be a string, got ${short(JSON.stringify(e))}`, W(O, at(O))); return; }
    const p = e.trim().split(/\s+/);
    const v = p[0], a = p.slice(1);
    const loc = W(O, at(O, e));
    if (!EFFECT_VERBS.has(v)) { FAIL('ids', `${O.id}.${where}: unknown effect "${e}"`, loc); return; }
    switch (v) {
      case 'set': case 'clear': { const k = (a[0] || '').split('=')[0]; if (!k) FAIL('ids', `${O.id}.${where}: "${e}" needs a flag`, loc); else flagSetInData.add(k); if (v === 'set' && a[0] && a[0].includes('=')) { /* value */ } break; }
      case 'give': case 'take': {
        const it = a[0];
        if (!it) { FAIL('ids', `${O.id}.${where}: "${e}" needs an item`, loc); break; }
        if (!isItem(it)) FAIL('ids', `${O.id}.${where}: item ${it} is not defined (add it to an item: block)`, loc);
        if (v === 'give') addTo(itemsGivenData, it, { O, where }); else addTo(itemsUsedData, it, { O, where });
        break;
      }
      case 'trust': { const tr = a[0]; const act = M.acts[O.act]; if (act && !(act.def.trust || {})[tr]) FAIL('ids', `${O.id}.${where}: trust track ${tr} is not in act ${O.act}'s trust: {}`, loc); if (!/^[+-]?\d+$/.test(a[1] || '')) FAIL('ids', `${O.id}.${where}: "${e}" needs +n or -n`, loc); break; }
      case 'power': if (!ALL_POWERS.has(a[0])) FAIL('ids', `${O.id}.${where}: unknown power ${a[0]}`, loc); break;
      case 'open': case 'close': if (!isEnt(a[0])) FAIL('ids', `${O.id}.${where}: "${e}": no entity ${a[0]}`, loc); else if (v === 'open') openedByData.add(a[0]); break;
      case 'spawn': if (!isNpc(a[0]) && !G.cast.has(a[0])) FAIL('ids', `${O.id}.${where}: "${e}": no npc ${a[0]}`, loc); if (a[1] === 'at' ? !isEnt(a[2]) : a[1] && !isEnt(a[1])) FAIL('ids', `${O.id}.${where}: "${e}": no place ${a[1] === 'at' ? a[2] : a[1]}`, loc); break;
      case 'despawn': if (!isNpc(a[0]) && !G.cast.has(a[0])) FAIL('ids', `${O.id}.${where}: "${e}": no npc ${a[0]}`, loc); break;
      case 'move': if (!isNpc(a[0]) && !G.cast.has(a[0])) FAIL('ids', `${O.id}.${where}: "${e}": no npc ${a[0]}`, loc); if (!isEnt(a[1])) FAIL('ids', `${O.id}.${where}: "${e}": no place ${a[1]}`, loc); break;
      case 'world': if (!isEnt(a[0])) FAIL('ids', `${O.id}.${where}: "${e}": no entity ${a[0]}`, loc); else { if (!worldStates.has(a[0])) worldStates.set(a[0], new Set()); worldStates.get(a[0]).add(a[1]); } break;
      case 'clue': if (!M.clues[a[0]]) FAIL('ids', `${O.id}.${where}: clue ${a[0]} is not defined in any clue: block`, loc); else addTo(cluesAdded, a[0], { O, where }); break;
      case 'quest': if (!['start', 'done'].includes(a[0]) || !M.quests[a[1]]) FAIL('ids', `${O.id}.${where}: "${e}": ${M.quests[a[1]] ? 'use quest start|done id' : 'no quest ' + a[1]}`, loc); break;
      case 'stage': if (!M.chapters[a[0]] && stageIdx(a[0]) < 0) FAIL('ids', `${O.id}.${where}: "${e}": no stage ${a[0]}`, loc); break;
      case 'emit': emitsInData.add(a[0]); break;
      case 'upgrade': if (!a[0]) FAIL('ids', `${O.id}.${where}: "${e}" needs an upgrade id`, loc); break;
      case 'xp': case 'bless': case 'moon': if (!/^\d+$/.test(a[0] || '')) FAIL('ids', `${O.id}.${where}: "${e}" needs a number`, loc); break;
      case 'end_act': if (!/^\d+$/.test(a[0] || '') || !M.acts[+a[0]]) FAIL('ids', `${O.id}.${where}: "${e}": no act file for act ${a[0]}`, loc); break;
      case 'warp': if (!isEnt(a[0])) FAIL('ids', `${O.id}.${where}: "${e}": no entity ${a[0]}`, loc); break;
      case 'page': if (!M.pages[a[0]]) FAIL('ids', `${O.id}.${where}: "${e}": no page ${a[0]} in any page: block`, loc); break;
      case 'shrine': { const L = M.ents[a[0]], sm = L && /^SHRINES:(.+)$/.exec(L.src || ''); if (!sm && !knownGame(a[0])) FAIL('ids', `${O.id}.${where}: "${e}": ${a[0]} is not a shrine (a SHRINES id, or a legacy entry with src SHRINES:<id>)`, loc); break; }
      case 'weapon': if (!WEAPON_POWERS.has(a[0]) && !knownGame(a[0])) FAIL('ids', `${O.id}.${where}: "${e}": no weapon ${a[0]}`, loc); break;
      case 'ally': if (!a[0]) FAIL('ids', `${O.id}.${where}: "${e}" needs an ally id`, loc); break;
      case 'hat': if (!isItem(a[0]) && !knownGame(a[0])) FAIL('ids', `${O.id}.${where}: "${e}": item ${a[0]} is not defined`, loc); else addTo(itemsUsedData, a[0], { O, where }); break;
      default: break;
    }
  }
  function checkCond(c, O, where) {
    if (c == null) return;
    for (const q of parseCond(c)) {
      if (q.any) { for (const sub of q.any) for (const s of sub) checkOne(s); continue; }
      checkOne(q);
    }
    function checkOne(q) {
      const loc = W(O, at(O, isStr(c) ? c : null));
      if (q.bad) { FAIL('ids', `${O.id}.${where}: unknown condition word "${q.bad}" in "${condText(c)}"`, loc); return; }
      const a = q.a[0];
      switch (q.k) {
        case 'item': { const it = (a || '').split(/[<>=]/)[0]; if (!isItem(it)) FAIL('ids', `${O.id}.${where}: item ${it} in "${condText(c)}" is not defined`, loc); else addTo(itemsUsedData, it, { O, where }); break; }
        case 'power': if (!ALL_POWERS.has(a)) FAIL('ids', `${O.id}.${where}: unknown power ${a} in "${condText(c)}"`, loc); break;
        case 'clue': if (!M.clues[a]) FAIL('ids', `${O.id}.${where}: clue ${a} in "${condText(c)}" is not defined`, loc); break;
        case 'solved': if (!M.deduce[a] && !M.mysteries[a]) FAIL('ids', `${O.id}.${where}: deduction ${a} in "${condText(c)}" is not defined`, loc); break;
        case 'quest': if (!M.quests[a] && !knownGame(a)) FAIL('ids', `${O.id}.${where}: quest ${a} in "${condText(c)}" is not defined`, loc); break;
        case 'seen': if (!M.scenes[a] && !knownGame(a)) FAIL('ids', `${O.id}.${where}: scene ${a} in "${condText(c)}" is not defined`, loc); break;
        case 'near': if (!isEnt(a)) FAIL('ids', `${O.id}.${where}: place ${a} in "${condText(c)}" is not defined`, loc); break;
        case 'trust': { const m = /^([a-z0-9_]+)(>=|<=|>|<|=)(\d+)$/.exec(a || ''); if (!m) FAIL('ids', `${O.id}.${where}: "${condText(c)}": write trust name>=n`, loc); break; }
        case 'stage': if (!M.chapters[a] && stageIdx(a) < 0) FAIL('ids', `${O.id}.${where}: stage ${a} in "${condText(c)}" is not a stage`, loc); break;
        default: break;
      }
    }
  }
  // text: [full, simple] or string; who for lines; tags {fact, promise, dir, ref, if}
  const texts = [];   // every player-facing text with its context, for rules 6, 10, 11 and the watch warnings
  function textPair(x, O, where, who, tags, conds = []) {
    const p = pairOf(x);
    if (!p) { if (x != null) FAIL('ids', `${O.id}.${where}: text should be "text" or [full, simple], got ${short(JSON.stringify(x))}`, W(O, at(O))); return; }
    texts.push({ O, where, who, full: p.full, simple: p.simple, tags: tags || {}, conds, ...at(O, p.full) });
  }
  // a text with variants (A4S, A4b): { if, t: text } or a list of them (the first whose condition holds is shown)
  function textVar(x, O, where) {
    const isVar = (v) => v && typeof v === 'object' && !Array.isArray(v) && 't' in v;
    const vs = isVar(x) ? [x] : Array.isArray(x) && x.length && isVar(x[0]) ? x : null;
    if (!vs) return textPair(x, O, where, null, {});
    vs.forEach((v, i) => { if (!isVar(v)) { FAIL('ids', `${O.id}.${where}: variant ${i + 1} should be { if, t: [full, simple] }`, W(O, at(O))); return; }
      if (v.if != null) checkCond(v.if, O, `${where} variant ${i + 1}`); textPair(v.t, O, `${where} variant ${i + 1}`, null, {}, v.if != null ? [v.if] : []); });
  }
  function lineBeat(b, O, where, conds) {
    // [who, full, simple?, tags?]
    const who = b[0];
    let full = b[1], simple = b[2], tags = {};
    if (simple && typeof simple === 'object') { tags = simple; simple = null; }
    if (b[3] && typeof b[3] === 'object') tags = b[3];
    if (!isStr(who) || !isSpeaker(who)) FAIL('ids', `${O.id}.${where}: unknown speaker ${JSON.stringify(who)}`, W(O, at(O, full)));
    if (!isStr(full)) { FAIL('ids', `${O.id}.${where}: a line needs [who, full, simple]`, W(O, at(O))); return; }
    texts.push({ O, where, who, full, simple: isStr(simple) ? simple : null, tags, conds: tags.if ? conds.concat([tags.if]) : conds, ...at(O, full) });
    if (tags.clue) { if (!M.clues[tags.clue]) FAIL('ids', `${O.id}.${where}: clue ${tags.clue} is not defined`, W(O, at(O, full))); else addTo(cluesAdded, tags.clue, { O, where }); }
    if (tags.if) checkCond(tags.if, O, where);
    if (tags.do) eachEffect(tags.do, (e) => checkEffect(e, O, where));
    for (const k of ['promise', 'ref']) for (const id of arr(tags[k])) promiseLater.push({ k, id, O, where, loc: W(O, at(O, full)) });
  }
  function beats(list, O, where, conds = []) {
    arr(list).forEach((b, i) => {
      const w = `${where}#${i + 1}`;
      if (Array.isArray(b)) { lineBeat(b, O, w, conds); return; }
      if (!b || typeof b !== 'object') { FAIL('ids', `${O.id}.${w}: unknown beat ${short(JSON.stringify(b))}`, W(O, at(O))); return; }
      if ('choose' in b) {
        choiceIds.add(b.choose);
        if (b.ask) textPair(b.ask, O, `${w} ask`, null, {}, conds);
        if (!arr(b.pick).length) FAIL('ids', `${O.id}.${w}: choose ${b.choose} has no picks`, W(O, at(O)));
        arr(b.pick).forEach((p, j) => {
          const pw = `${w} pick ${j + 1}`;
          if (p.t != null) textPair(p.t, O, pw, 'ash', {}, conds);
          if (p.if) checkCond(p.if, O, pw);
          if (p.locked) { if (Array.isArray(p.locked) && p.locked.length && typeof p.locked[0] === 'object' && !Array.isArray(p.locked[0])) p.locked.forEach((L, k) => { if (L.if) checkCond(L.if, O, `${pw} locked ${k + 1}`); textPair(L.t, O, `${pw} locked ${k + 1}`, null, {}, conds); }); else textPair(p.locked, O, `${pw} locked`, null, {}, conds); }
          eachEffect(p.then, (e) => checkEffect(e, O, pw));
          for (const [k, l] of arr(p.say).entries()) if (Array.isArray(l)) lineBeat(l, O, `${pw} say ${k + 1}`, p.if ? conds.concat([p.if]) : conds);
          if (p.scene) { if (!M.scenes[p.scene]) FAIL('ids', `${O.id}.${pw}: scene ${p.scene} is not defined`, W(O, at(O, p.scene))); addTo(scenesUsed, p.scene, { O, where: pw }); }
        });
        return;
      }
      if ('if' in b && ('then' in b || 'else' in b)) {
        checkCond(b.if, O, w);
        const isEff = (L) => arr(L).every((x) => isStr(x) || (x && x.banner));
        if (isEff(b.then)) eachEffect(b.then, (e) => checkEffect(e, O, w)); else beats(b.then, O, `${w} then`, conds.concat([b.if]));
        if (b.else) { if (isEff(b.else)) eachEffect(b.else, (e) => checkEffect(e, O, w)); else beats(b.else, O, `${w} else`, conds.concat(['!(' + condText(b.if) + ')'])); }
        return;
      }
      if (b.do) { eachEffect(b.do, (e) => checkEffect(e, O, w)); return; }
      let known = false;
      if (b.cam != null) { known = true; if (!isEnt(b.cam) && !isNpc(b.cam)) FAIL('ids', `${O.id}.${w}: cam ${b.cam} is not an entity`, W(O, at(O, b.cam))); }
      for (const k of ['place', 'walk']) if (b[k]) { known = true; const [who, p] = arr(b[k]); if (!isSpeaker(who)) FAIL('ids', `${O.id}.${w}: ${k}: unknown ${who}`, W(O, at(O, who))); if (p && isStr(p) && !isEnt(p) && !isNpc(p) && !['player', 'ash'].includes(p)) FAIL('ids', `${O.id}.${w}: ${k}: no entity ${p}`, W(O, at(O, p))); }
      if (b.anim) { known = true; const [who, pose] = arr(b.anim); if (!isSpeaker(who)) FAIL('ids', `${O.id}.${w}: anim: unknown ${who}`, W(O, at(O, who))); else if (pose && !G.poses.has(`${who}:${pose}`)) WARN('art', `${O.id}.${w}: pose ${who}:${pose} has no definePose yet`, W(O, at(O, pose))); }
      if ('fade' in b || 'wait' in b || 'sfx' in b) known = true;
      if (known) return;
      FAIL('ids', `${O.id}.${w}: unknown beat ${short(JSON.stringify(b))}`, W(O, at(O)));
    });
  }
  // steps
  function checkStep(s, O, where) {
    if (!s || typeof s !== 'object') { FAIL('ids', `${O.id}.${where}: a step must be an object`, W(O, at(O))); return; }
    const w = s.id ? `${where} ${s.id}` : where;
    const loc = W(O, Object.assign(at(O, s.do), { step: s.id }));
    const { verb, args } = parseDo(s.do);
    if (!STEP_VERBS.has(verb)) { FAIL('ids', `${O.id}.${w}: unknown step "${s.do}"`, loc); return; }
    const need = (cond, msg) => { if (!cond) FAIL('ids', `${O.id}.${w}: ${msg}`, loc); };
    const a = args[0];
    switch (verb) {
      case 'talk': need(isNpc(a) || G.cast.has(a), `talk ${a}: no npc ${a}`); if (!isNpc(a) && G.cast.has(a)) WARN('ids', `${O.id}.${w}: npc ${a} is in the game's CAST but has no registry entry`, loc); break;
      case 'goto': case 'examine': case 'track': need(isEnt(a), `${verb} ${a}: ${a} is not placed (no place or registry entry)`); if (verb === 'track' && isEnt(a) && M.ents[a].kind !== 'prints') FAIL('ids', `${O.id}.${w}: track ${a}: ${a} is a ${M.ents[a].kind}, not prints`, loc); break;
      case 'find': need(isItem(a), `find ${a}: item ${a} is not defined`); if (isItem(a)) { const holder = Object.values(M.ents).find((e) => e.id === a || arr(e.loot).some((l) => isStr(l) && l.split(/\s+/).includes(a)) || e.item === a); if (!holder) FAIL('ids', `${O.id}.${w}: find ${a}: no chest or item entity holds it`, loc); addTo(itemsGivenData, a, { O, where: w }); } break;
      case 'fight': need(G.foes.has(a) || knownGame(a) || isNpc(a), `fight ${a}: no foe ${a} in the game`); break;
      case 'use_power_at': need(ALL_POWERS.has(a), `use_power_at: unknown power ${a}`); need(isEnt(args[1]), `use_power_at ${a} ${args[1]}: ${args[1]} is not placed`); break;
      case 'give': need(isItem(a), `give ${a}: item ${a} is not defined`); need(isNpc(args[1]) || G.cast.has(args[1]), `give ${a} ${args[1]}: no npc ${args[1]}`); if (isItem(a)) addTo(itemsUsedData, a, { O, where: w }); break;
      case 'choose': choiceIds.add(a); break;
      case 'deduce': need(!!M.deduce[a], `deduce ${a}: no deduction ${a}`); break;
      case 'wait_for': {
        if (a === 'event') { /* checked in solvability */ } else if (!['night', 'day', 'hour'].includes(a)) checkCond(args.join(' '), O, w);
        for (const n of arr(s.skip)) need(isNpc(n) || G.cast.has(n), `skip: no npc ${n}`);
        break;
      }
      case 'cutscene': need(!!M.scenes[a] || knownGame(a), `cutscene ${a}: no scene ${a}`); if (M.scenes[a]) addTo(scenesUsed, a, { O, where: w }); break;
      case 'minigame': need(G.minis.has(a) || knownGame(a), `minigame ${a}: no minigame ${a} (MINI.${a}) in the game`); break;
      case 'dungeon': need(G.dungeons.has(a) || DUNGEON_POWER[a] != null, `dungeon ${a}: no defineDungeon('${a}') in the game`); break;
      case 'all': case 'any': if (!arr(s.parts).length) FAIL('ids', `${O.id}.${w}: ${verb} needs parts`, loc); break;
      default: break;
    }
    if (s.at && !isEnt(s.at)) FAIL('ids', `${O.id}.${w}: at ${s.at} is not placed`, loc);
    if (s.marker && !isEnt(s.marker) && !isNpc(s.marker)) (knownGame(s.marker) ? WARN : FAIL)('ids', `${O.id}.${w}: marker ${s.marker} is not a registry entity${knownGame(s.marker) ? ' (the old code knows it)' : ''}`, loc);
    for (const k of STEP_SCENES) if (s[k]) { if (!M.scenes[s[k]]) FAIL('ids', `${O.id}.${w}: ${k} ${s[k]} is not a scene in any scene: block`, W(O, at(O, s[k]))); addTo(scenesUsed, s[k], { O, where: w }); }
    if (s.obj) textPair(s.obj, O, `${w} obj`, null, {});
    if (s.hint) textPair(s.hint, O, `${w} hint`, null, {});
    if (s.if) checkCond(s.if, O, w);
    if (s.migrate_if) checkCond(s.migrate_if, O, w);
    eachEffect(s.then, (e) => checkEffect(e, O, w));
    arr(s.parts).forEach((p, i) => checkStep(p, O, `${w} part ${i + 1}`));
    arr(s.extra).forEach((p, i) => checkStep(p, O, `${w} extra ${i + 1}`));
  }
  function checkTalk(talk, O) {
    for (const [npc, list] of Object.entries(talk || {})) {
      if (!isNpc(npc) && !G.cast.has(npc)) FAIL('ids', `${O.id}.talk: no npc ${npc}`, W(O, at(O, npc)));
      else if (!isNpc(npc)) WARN('ids', `${O.id}.talk: npc ${npc} is in the game's CAST but has no registry entry`, W(O, at(O, npc)));
      arr(list).forEach((t, i) => {
        const w = `talk ${npc}#${i + 1}`;
        const tags = { fact: t.fact, promise: t.promise, dir: t.dir, ref: t.ref };
        const conds = t.if ? [t.if] : [];
        if (t.if) checkCond(t.if, O, w);
        if (t.say) { if (Array.isArray(t.say) && Array.isArray(t.say[0])) t.say.forEach((x, k) => textPair(x, O, `${w} say ${k + 1}`, npc, tags, conds)); else textPair(t.say, O, w, npc, tags, conds); }
        if (t.option) { textPair(t.option, O, `${w} option`, 'ash', {}, conds); const sc = t.scene || null; if (sc) addTo(optionScenes, sc, { O, where: w, npc }); }
        if (t.scene) { if (!M.scenes[t.scene]) FAIL('ids', `${O.id}.${w}: scene ${t.scene} is not defined`, W(O, at(O, t.scene))); addTo(scenesUsed, t.scene, { O, where: w }); }
        if (t.fact && !t.say) factCheckLater.push({ O, where: w, fact: t.fact, conds, full: '' });
        for (const k of ['promise', 'ref']) for (const id of arr(t[k])) promiseLater.push({ k, id, O, where: w, loc: W(O, at(O, id)) });
        eachEffect(t.then, (e) => checkEffect(e, O, w));
        if (!t.say && !t.option && !t.scene && !t.then) FAIL('ids', `${O.id}.${w}: a talk entry needs say, option, scene or then`, W(O, at(O, npc)));
      });
    }
  }
  const factCheckLater = [];
  const promiseLater = [];

  // map and coordinates of every entity
  for (const e of Object.values(M.ents)) {
    const O = e.owner || { id: e.id, file: e.file, line: e.line, act: actOfPath(e.file) };
    const loc = W(O, { file: e.file, line: e.line, ent: e.id });
    if (e.kind && !(REG_KINDS.has(e.kind) || PLACE_KINDS.has(e.kind))) FAIL('ids', `${e.id}: unknown kind ${e.kind}`, loc);
    if (e.kind === 'npc' && e.from === 'npc' && !e.at) { for (const w of arr(e.where)) if (w && w.at && !(Array.isArray(w.at) && w.at.length >= 2) && !isEnt(w.at)) FAIL('ids', `${e.id}: where at ${JSON.stringify(w.at)} is not a point or an entity`, loc); continue; }
    if (e.map == null) { if (e.kind !== 'npc' || e.at) FAIL('ids', `${e.id}: no map`, loc); continue; }
    const pts = e.path ? arr(e.path) : e.at ? [e.at] : [];
    if (!pts.length) { FAIL('ids', `${e.id}: no at or path`, loc); continue; }
    const mp = MAPS[e.map];
    if (!mp) { FAIL('ids', `${e.id}: map ${e.map} does not exist`, loc); continue; }
    if (e.area) { if (!knownGame(e.area) && !isEnt(e.area) && !G.areas.has(e.area)) FAIL('ids', `${e.id}: area ${e.area} is not an area in the game`, loc); if (e.from === 'legacy') checkLegacySrc(e, loc); continue; }
    for (const p of pts) {
      if (!Array.isArray(p) || p.length < 2 || typeof p[0] !== 'number' || typeof p[1] !== 'number') { FAIL('ids', `${e.id}: a point must be [x, y]`, loc); break; }
      const [x, y] = p;
      if (x >= IZX - 50) continue; // an interior, cave or dungeon (x >= IZX-50, any y)
      const y0 = e.map * BAND;
      if (x < 0 || x > mp.w || y < y0 || y > y0 + mp.h) { FAIL('ids', `${e.id}: (${x}, ${y}) is outside map ${e.map} (x 0 to ${mp.w}, y ${y0} to ${y0 + mp.h})`, loc); break; }
    }
    if (e.kind === 'gate' || e.gate) {
      if (e.gate && !GATE_POWER[e.gate] && !(e.gate in (G.gateKinds || {}))) FAIL('uses', `${e.id}: unknown gate kind ${e.gate} (not in e10c_gates.js GATE_KINDS)`, loc);
      if (e.leads && !isEnt(e.leads)) FAIL('ids', `${e.id}: leads to ${e.leads}, which is not placed`, loc);
    }
    if (e.kind === 'door' && e.leads && !isEnt(e.leads) && !knownGame(e.leads) && !(/^h_(.+)$/.test(e.leads) && G.cast.has(e.leads.slice(2)))) FAIL('ids', `${e.id}: leads to ${e.leads}, which is not placed`, loc);
    if (e.look && !(e.kind === 'prints' && ['boot', 'claw', 'hoof'].includes(e.look)) && !G.looks.has(e.look) && !G.propKinds.has(e.look)) WARN('art', `${e.id}: look ${e.look} has no defineLook yet (a placeholder is drawn)`, loc);
    for (const [st, lk] of Object.entries(e.states || {})) if (isStr(lk) && !G.looks.has(lk) && !G.propKinds.has(lk) && !/^(flag|!flag|item|stage|world)/.test(lk) && !/\s/.test(lk)) WARN('art', `${e.id}: look ${lk} for state ${st} has no defineLook yet`, loc);
    if (e.show) checkCond(e.show, O, `${e.id} show`);
    if (e.from === 'legacy') checkLegacySrc(e, loc);
  }
  function checkLegacySrc(e, loc) {
    const s = e.src;
    if (!isStr(s)) { FAIL('ids', `${e.id}: legacy entry has no src (where the old code draws it)`, loc); return; }
    const inCode = (name) => Object.values(G.files).some((t) => t.includes(name));
    let m;
    if ((m = /^([a-z0-9_]+)\.js\s+(.+)$/.exec(s))) {
      const t = G.files[m[1]];
      if (!t) FAIL('ids', `${e.id}: src ${s}: no game/src/${m[1]}.js`, loc);
      else if (!t.includes(m[2].split(/\s+/)[0])) FAIL('ids', `${e.id}: src ${s}: ${m[2].split(/\s+/)[0]} is not in ${m[1]}.js`, loc);
    } else if ((m = /^(elev|prop):([A-Za-z0-9_-]+)@(-?\d+),(-?\d+)$/.exec(s))) {
      if (m[1] === 'prop' && !G.propKinds.has(m[2]) && !G.strs.has(m[2]) && !G.keys.has(m[2])) FAIL('ids', `${e.id}: src ${s}: no prop kind ${m[2]} (definePropKind, a STRUCTS kind, or s10FindKind in the old module that draws it)`, loc);
    } else if ((m = /^ITEM_NAMES:([A-Za-z0-9_]+)$/.exec(s))) {
      if (!G.items.has(m[1])) FAIL('ids', `${e.id}: src ${s}: no item ${m[1]} in ITEM_NAMES`, loc);
    } else if ((m = /^regionAt:(.+)$/.exec(s))) {
      const re = new RegExp(`['"](?:the )?${m[1].replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}['"]`, 'i');
      if (!Object.values(G.files).some((t) => re.test(t))) FAIL('ids', `${e.id}: src ${s}: no region called ${m[1]} in the game code`, loc);
    } else if ((m = /^([A-Za-z_]+):([A-Za-z0-9_]+)(@-?\d+,-?\d+)?$/.exec(s))) {
      // the engine's src forms (e10_story.js s10Resolve, ENGINE.md section 8)
      const known = ['LANDMARKS', 'CAST', 'DOORS', 'HOUSES', 'HOUSE', 'POI', 'furn', 'SPECIAL', 'NPC', 'CHESTS', 'WARDS', 'SHRINES', 'LANTERNS', 'CROSSINGS', 'CAVEMOUTHS', 'SITES', 'NPCSPOT', 'fn', 'code'];
      if (!known.includes(m[1])) FAIL('ids', `${e.id}: src kind ${m[1]}: is not one the engine can check (${known.join(', ')})`, loc);
      const houseOf = /^h_(.+)$/.exec(m[2]);
      if (!knownGame(m[2]) && !(houseOf && (G.cast.has(houseOf[1]) || G.strs.has(houseOf[1])))) FAIL('ids', `${e.id}: src ${s}: ${m[2]} is nowhere in the game code`, loc);
    } else if ((m = /^([A-Za-z_$][\w$]*)(\.[\w$]+)*$/.exec(s))) {
      // a game value by name (GATE_COL, G.goat, A1W.goat.path): the first name must be in the code
      if (!new RegExp(`\\b(?:const|let|var|function)\\s+${m[1].replace(/\$/g, '\\$')}\\b`).test(Object.values(G.files).join('\n')) && m[1] !== 'G') FAIL('ids', `${e.id}: src ${s}: ${m[1]} is not defined in the game code`, loc);
    } else FAIL('ids', `${e.id}: src "${s}" should be "file.js id", KIND:id (LANDMARKS, CAST, DOORS, HOUSES, POI, CHESTS, WARDS, SHRINES, LANTERNS, CROSSINGS, CAVEMOUTHS, SITES, NPCSPOT, ITEM_NAMES, regionAt, furn), elev:n@x,y, prop:kind@x,y or a game value`, loc);
  }

  // every owner
  for (const O of M.owners) {
    const d = O.def;
    if (O.type === 'chapter') {
      for (const k of ['act', 'after', 'step']) if (d[k] == null) FAIL('ids', `${O.id}: chapter has no ${k}`, W(O, at(O)));
      if (d.next == null && !d.last) WARN('ids', `${O.id}: chapter has no next (fine only for the act's last chapter)`, W(O, at(O)));
      if (!('card' in d)) FAIL('ids', `${O.id}: chapter has no card (write card: null for none)`, W(O, at(O)));
      if (d.card) { const c = arr(d.card); if (c.length < 2) FAIL('ids', `${O.id}: card needs [label, title]`, W(O, at(O))); }
      if (d.so_far) textPair(d.so_far, O, 'so_far', null, {});
      arr(d.mom).forEach((m, i) => textPair(m, O, `mom ${i + 1}`, 'maren', {}));
      for (const k of arr(d.silence)) if (!knownGame(k)) WARN('ids', `${O.id}: silence ${k}: no old STORY key by that name`, W(O, at(O, k)));
      if (d.takeover && stageIdx(O.id) < 0) WARN('ids', `${O.id}: takeover, but no old stage has this id`, W(O, at(O)));
    }
    if (O.type === 'quest') {
      if (!d.optional) WARN('quest', `${O.id}: side quest without optional: true`, W(O, at(O)));
      if (d.title) textVar(d.title, O, 'title');
      if (d.giver && !isNpc(d.giver) && !G.cast.has(d.giver)) FAIL('ids', `${O.id}: giver ${d.giver} is not an npc`, W(O, at(O, d.giver)));
    }
    if (O.type === 'act') {
      for (const [id, m] of Object.entries(M.mysteries)) if (m.act === O.act && m.def.title) textPair(m.def.title, O, `mystery ${id}`, null, {});
      // trust: { track: 'flag' } (other keys, such as a banner text, are the engine's business)
      for (const [id, en] of Object.entries(d.ending || {})) { if (en.if) checkCond(en.if, O, `ending ${id}`); if (en.at && !M.chapters[en.at] && stageIdx(en.at) < 0) FAIL('ids', `act ${O.act}: ending ${id} at ${en.at}: no chapter`, W(O, at(O, en.at))); if (en.scene && !M.scenes[en.scene]) FAIL('ids', `act ${O.act}: ending ${id}: scene ${en.scene} is not defined`, W(O, at(O, en.scene))); else if (en.scene) addTo(scenesUsed, en.scene, { O, where: 'ending ' + id }); }
    }
    arr(d.step).forEach((s, i) => checkStep(s, O, `step ${i + 1}`));
    for (const [id, p] of Object.entries(d.place || {})) {
      if (!p || typeof p !== 'object') continue;
      if (p.if) checkCond(p.if, O, `place ${id}`);
      if (p.say) { if (!M.scenes[p.say]) FAIL('ids', `${O.id}: place ${id} says scene ${p.say}, which is not defined`, W(O, at(O, p.say))); else addTo(scenesUsed, p.say, { O, where: `place ${id}` }); }
      eachEffect(p.then, (e) => checkEffect(e, O, `place ${id}`));
      // chest loot: a list of effects ('heart_ember id', 'give c_lampoil', 'give coins 30', 'set flag') or bare item ids
      for (const l of arr(p.loot)) if (isStr(l)) { const w0 = l.trim().split(/\s+/)[0]; if (EFFECT_VERBS.has(w0)) checkEffect(l, O, `place ${id} loot`); else if (isItem(w0)) addTo(itemsGivenData, w0, { O, where: `place ${id} loot` }); else FAIL('ids', `${O.id}: place ${id} loot "${l}" is not an effect or an item`, W(O, at(O, l))); }
      if (p.name) textPair(p.name, O, `place ${id} name`, null, {});
    }
    for (const [id, c] of Object.entries(d.clue || {})) {
      textPair(c.text, O, `clue ${id}`, null, {});
      if (c.mystery && !M.mysteries[c.mystery]) (M.acts[O.act] ? FAIL : WARN)('mystery', `${O.id}: clue ${id} starts mystery ${c.mystery}, which no act file defines`, W(O, at(O, id)));
    }
    for (const [id, x] of Object.entries(d.deduce || {})) {
      const loc = W(O, Object.assign(at(O, id), { ded: id }));
      if (!x.mystery || !M.mysteries[x.mystery]) (M.acts[O.act] || !x.mystery ? FAIL : WARN)('mystery', `${O.id}: deduction ${id} belongs to mystery ${x.mystery}, which no act file defines`, loc);
      textPair(x.ask, O, `deduce ${id} ask`, null, {});
      for (const c of arr(x.needs)) if (!M.clues[c]) FAIL('ids', `${O.id}: deduction ${id} needs clue ${c}, which is not defined`, loc);
      for (const c of arr(x.bonus)) if (!M.clues[c]) FAIL('ids', `${O.id}: deduction ${id} lists bonus clue ${c}, which is not defined`, loc);
      const picks = arr(x.pick);
      const right = picks.filter((p) => p.right);
      if (right.length !== 1) FAIL('mystery', `${O.id}: deduction ${id} has ${right.length} right picks (needs exactly 1)`, loc);
      picks.forEach((p, j) => {
        textPair(p.t, O, `deduce ${id} pick ${j + 1}`, 'ash', {});
        if (!p.right) { if (!p.hint) FAIL('mystery', `${O.id}: deduction ${id}: wrong pick "${short((pairOf(p.t) || {}).full || '?', 40)}" has no hint`, loc); else textPair(p.hint, O, `deduce ${id} pick ${j + 1} hint`, null, {}); }
      });
      eachEffect(x.then, (e) => checkEffect(e, O, `deduce ${id}`));
    }
    for (const [id, sc] of Object.entries(d.scene || {})) beats(sc, O, `scene ${id}`);
    checkTalk(d.talk, O);
    if (d.hint) for (const [k, h] of Object.entries(isStr(d.hint) || Array.isArray(d.hint) ? { hint: d.hint } : d.hint)) textPair(h, O, `hint ${k}`, null, {});
    for (const [id, it] of Object.entries(d.item || {})) { if (it.name) textPair(it.name, O, `item ${id} name`, null, {}); if (it.desc) textPair(it.desc, O, `item ${id} desc`, null, {}); }
    for (const [id, pg] of Object.entries(d.page || {})) { if (pg.title) textPair(pg.title, O, `page ${id} title`, null, {}); arr(pg.text).forEach((x, i) => textPair(x, O, `page ${id} text ${i + 1}`, null, {})); }
    for (const [id, n] of Object.entries(d.npc || {})) for (const w of arr(n.where)) { if (w.if) checkCond(w.if, O, `npc ${id} where`); }
    if (d.payoff) { /* rule 4 below */ }
    // replaces: { 'STORY.a.b': sceneId } (a data scene put in place of a nested old STORY entry)
    for (const [k, sc] of Object.entries(d.replaces || {})) { if (Array.isArray(sc) && sc.length && sc.every(isStr)) { if (!/^(STORY|TALK)\./.test(k)) FAIL('ids', `${O.id}: replaces ${k}: write STORY.<path> or TALK.<path>`, W(O, at(O))); textPair(sc, O, `replaces ${k}`, null, {}); continue; } if (sc === null) { if (!/^(STORY|TALK)\./.test(k)) FAIL('ids', `${O.id}: replaces ${k}: write STORY.<path> or TALK.<path>`, W(O, at(O))); continue; } if (!M.scenes[sc]) FAIL('ids', `${O.id}: replaces ${k} with scene ${sc}, which is not defined`, W(O, at(O, sc))); else addTo(scenesUsed, sc, { O, where: `replaces ${k}` }); }
    // act migrate: [{ if, then }] (once at load, for old saves), end_act: { title, lines }
    arr(d.migrate).forEach((m, i) => { if (m && m.if) checkCond(m.if, O, `migrate ${i + 1}`); eachEffect(m && m.then, (e) => checkEffect(e, O, `migrate ${i + 1}`)); });
    if (d.end_act) { if (d.end_act.title) textVar(d.end_act.title, O, 'end_act title'); arr(d.end_act.lines).forEach((x, i) => textVar(x, O, `end_act line ${i + 1}`)); }
  }

  // promises and refs: an entity, quest, item, clue or scene, or (a promise) a flag or event something sets
  for (const p of promiseLater) {
    const id = p.id;
    if (isEnt(id) || isNpc(id) || M.quests[id] || isItem(id) || M.clues[id] || M.scenes[id]) continue;
    if (p.k === 'promise' && (flagSetInData.has(id) || emitsInData.has(id) || G.flagSets.has(id))) continue;
    FAIL(p.k === 'promise' ? 'uses' : 'ids', `${p.O.id}.${p.where}: ${p.k} ${id} has no entity, quest, item, clue or scene${p.k === 'promise' ? ', and no flag or event by that name is ever set' : ''}`, p.loc);
  }
  for (const [id, sc] of Object.entries(M.scenes)) if (!scenesUsed.has(id) && !knownGame(id)) WARN('ids', `scene ${id} is never played (no step, talk, pick, place or ending plays it)`, W(sc.owner, { file: sc.file, line: sc.line, scene: id }));

  // ---------- 6. simple words, 7 em dash (texts), and the watch-word warning
  for (const t of texts) {
    const loc = W(t.O, { file: t.file, line: t.line });
    if (words(t.full) > SIMPLE_WORDS && !t.simple) (/ name$/.test(t.where) ? WARN : FAIL)('simple', `${t.O.id}.${t.where}: ${words(t.full)} words and no simple version: "${short(t.full)}"`, loc);
    const tagged = t.tags && (t.tags.fact || t.tags.promise || t.tags.dir || t.tags.ref);
    if (!tagged && WATCH.test(t.full) && t.who !== 'ash' + '_pick') {
      const w = WATCH.exec(t.full)[1].toLowerCase();
      if (!/obj|hint|ask|pick|clue|so_far|title|name|desc|banner/.test(t.where)) WARN('words', `${t.O.id}.${t.where} "${short(t.full, 50)}" says "${w}" with no fact, promise, dir or ref tag`, loc);
    }
  }
  // em dash anywhere in data, game/src, game/simple and the page html: the real character, a string literal whose
  // value holds one (an escape in a string shows an em dash on screen), and the html entities in html. An escape
  // inside a regular expression or a comment is how code DETECTS em dashes, so it is not one.
  const emFiles = [];
  for (const F of M.files) emFiles.push([F.rel, F.text]);
  for (const [mod, t] of Object.entries(G.files)) emFiles.push([`game/src/${mod}.js`, t]);
  for (const extra of opts.extraTextFiles || []) emFiles.push(extra);
  const ESC = /\\u2014|\\u\{2014\}|\\x97/i;
  for (const [rel, t] of emFiles) {
    const bad = new Map();   // line -> text
    if (t.includes(EM)) t.split('\n').forEach((l, i) => { if (l.includes(EM)) bad.set(i + 1, l); });
    if (/\.html?$/.test(rel) && /&mdash;|&#8212;|&#x2014;/i.test(t)) t.split('\n').forEach((l, i) => { if (/&mdash;|&#8212;|&#x2014;/i.test(l)) bad.set(i + 1, l); });
    if (/\.json$/.test(rel) && ESC.test(t)) t.split('\n').forEach((l, i) => { if (ESC.test(l)) bad.set(i + 1, l); });
    if (/\.m?js$/.test(rel) && ESC.test(t)) {
      const L = t.split('\n');
      for (const k of tokenize(t)) if ((k.t === 'str' || k.t === 'tpl') && String(k.v).includes(EM)) bad.set(k.line, L[k.line - 1] || '');
    }
    let n = 0;
    for (const [ln, l] of [...bad].sort((x, y) => x[0] - y[0])) if (n++ < 5) FAIL('emdash', `${rel}:${ln} has an em dash: "${short(l.trim(), 50)}"`, { file: rel, line: ln, act: actOfPath(rel) });
    if (n > 5) FAIL('emdash', `${rel}: ${n - 5} more lines with an em dash`, { file: rel, line: 0, act: actOfPath(rel) });
  }

  // ---------- 10. facts
  for (const t of texts) if (t.tags && t.tags.fact) factCheckLater.push({ O: t.O, where: t.where, fact: t.tags.fact, conds: t.conds, full: t.full, file: t.file, line: t.line });
  for (const f of factCheckLater) {
    const loc = W(f.O, { file: f.file || f.O.file, line: f.line || at(f.O, f.full).line });
    const m = /^([A-Za-z0-9_]+)=([A-Za-z0-9_]+)$/.exec(String(f.fact));
    if (!m) { FAIL('fact', `${f.O.id}.${f.where}: fact "${f.fact}" should be entity=state`, loc); continue; }
    const [, id, st] = m;
    const e = M.ents[id];
    if (!e) { FAIL('fact', `${f.O.id}.${f.where}: fact ${f.fact}: no entity ${id}`, loc); continue; }
    const states = new Set([...Object.keys(e.states || {}), ...(worldStates.get(id) || [])]);
    if (states.size && !states.has(st)) FAIL('fact', `${f.O.id}.${f.where}: fact ${f.fact}: ${id} has no state ${st} (states: ${[...states].join(', ')})`, loc);
    const canChange = states.size !== 1;
    if (!canChange) continue;
    if (!f.conds.length) { FAIL('fact', `${f.O.id}.${f.where}: "${short(f.full || '', 40)}" states ${f.fact}, which can change, but the line has no if:`, loc); continue; }
    const want = e.states && isStr(e.states[st]) && /^(!?flag|item|stage|world)/.test(e.states[st]) ? e.states[st] : (e.states && e.states[st] && e.states[st].if) || null;
    if (want && !f.conds.some((c) => condText(c).includes(want))) FAIL('fact', `${f.O.id}.${f.where}: fact ${f.fact} holds when "${want}", but the line's condition is "${f.conds.map(condText).join(' ')}"`, loc);
  }

  // ---------- 11. directions (tagged lines)
  const pos = (id) => { const e = M.ents[id]; if (!e) return null; if (e.at) return e.at; if (e.path && e.path.length) { const p = e.path; return [p.reduce((s, q) => s + q[0], 0) / p.length, p.reduce((s, q) => s + q[1], 0) / p.length]; } return null; };
  const bearing = (a, b) => { const dx = b[0] - a[0], dy = b[1] - a[1]; const ns = Math.abs(dy) > Math.abs(dx) * 0.414 ? (dy < 0 ? 'north' : 'south') : ''; const ew = Math.abs(dx) > Math.abs(dy) * 0.414 ? (dx > 0 ? 'east' : 'west') : ''; return ns && ew ? `${ns}-${ew}` : ns || ew || 'here'; };
  const dirOK = (claim, a, b) => {
    const parts = String(claim).toLowerCase().split(/[-\s]+/).filter((p) => DIRV[p]);
    if (!parts.length) return null;
    let vx = 0, vy = 0; for (const p of parts) { vx += DIRV[p][0]; vy += DIRV[p][1]; }
    const dx = b[0] - a[0], dy = b[1] - a[1];
    const cos = (vx * dx + vy * dy) / (Math.hypot(vx, vy) * Math.hypot(dx, dy) || 1);
    return cos >= Math.cos(67.5 * Math.PI / 180);
  };
  for (const t of texts) {
    const d = t.tags && t.tags.dir;
    if (!d) continue;
    const loc = W(t.O, { file: t.file, line: t.line });
    const [from, to, claim] = arr(d);
    const a = pos(from), b = pos(to);
    if (!a || !b) { FAIL('dir', `${t.O.id}.${t.where}: dir ${JSON.stringify(d)}: ${!a ? from : to} has no position`, loc); continue; }
    const e1 = M.ents[from], e2 = M.ents[to];
    if (e1.map !== e2.map) { FAIL('dir', `${t.O.id}.${t.where}: dir ${from} and ${to} are on different maps`, loc); continue; }
    const ok = dirOK(claim, a, b);
    if (ok === null) FAIL('dir', `${t.O.id}.${t.where}: dir "${claim}" is not a compass direction`, loc);
    else if (!ok) FAIL('dir', `${t.O.id}.${t.where} "${short(t.full, 40)}": ${to} is ${bearing(a, b)} of ${from}, not ${claim}`, loc);
  }

  // ---------- 12. duplicates: talk options to one scene, two cards for one npc
  for (const [sc, L] of optionScenes) if (L.length > 1) FAIL('dup', `scene ${sc} is offered by ${L.length} talk options (${L.map((q) => `${q.O.id} ${q.where}`).join('; ')})`, W(L[1].O, at(L[1].O, sc)));
  {
    const names = Object.values(M.npcs).filter((n) => n.name && (n.card !== false)).map((n) => ({ id: n.id, name: (pairOf(n.name) || {}).full || String(n.name), n }));
    for (let i = 0; i < names.length; i++) for (let j = i + 1; j < names.length; j++) {
      const a = names[i], b = names[j];
      if (a.id === b.id) continue;
      const A = a.name.toLowerCase(), B = b.name.toLowerCase();
      if (A === B || A.startsWith(B + ' ') || B.startsWith(A + ' ')) FAIL('dup', `npcs ${a.id} ("${a.name}") and ${b.id} ("${b.name}") would make two journal cards for one person (set card: false on one)`, { file: b.n.file, line: b.n.line, act: b.n.owner ? b.n.owner.act : actOfPath(b.n.file) });
    }
  }

  // ---------- 2. uses: items, keys, gates' openers (promises were checked with the lines)
  const itemDefinedInData = Object.values(M.items).filter((i) => i.from === 'item' || i.from === 'legacy');
  const opensWith = new Set();
  for (const e of Object.values(M.ents)) for (const o of arr(e.opens_with)) opensWith.add(o);
  const allItems = new Set([...itemDefinedInData.map((i) => i.id), ...itemsGivenData.keys()]);
  for (const id of allItems) {
    if (id === 'coins') continue;
    const def = M.items[id] || {};
    const O = def.owner || (itemsGivenData.get(id) || [{}])[0].O || null;
    const loc = Object.assign(W(O), { file: def.file || (O ? O.file : ''), line: def.line || (O ? at(O, id).line : 0) });
    const usedData = itemsUsedData.has(id) || opensWith.has(id) || Object.values(M.ents).some((e) => isStr(e.show) && e.show.includes(`item ${id}`));
    const usedGame = G.itemReads.has(id) || [...G.itemReadPrefixes].some((p) => id.startsWith(p));
    if (!usedData && !usedGame && !def.keepsake) FAIL('uses', `item ${id} is given but never used (use it, or mark it keepsake: true)`, loc);
    const isKey = /(^|_)key($|_)|key$/i.test(id) || /\bkey\b/i.test((pairOf(def.name) || {}).full || '');
    if (isKey && !opensWith.has(id) && !Object.values(M.ents).some((e) => isStr(e.opens_with) && e.opens_with.includes(id)) && !usedGame) FAIL('uses', `key ${id} opens nothing (no gate or door has opens_with: ${id})`, loc);
    if (def.from && !itemsGivenData.has(id) && !G.itemGives.has(id) && !Object.values(M.ents).some((e) => arr(e.loot).some((l) => isStr(l) && l.split(/\s+/).includes(id)))) WARN('uses', `item ${id} is defined but nothing gives it`, loc);
  }
  for (const e of Object.values(M.ents)) {
    if (!(e.kind === 'gate' || e.gate || e.opens_with)) continue;
    const O = e.owner || { id: e.id, file: e.file, line: e.line, act: actOfPath(e.file) };
    const loc = W(O, { file: e.file, line: e.line, ent: e.id });
    const ow = arr(e.opens_with);
    if (e.gate && GATE_POWER[e.gate]) continue;
    if (!ow.length && e.from === 'legacy') continue; // the old code opens it
    // a story gate (gate kind with power null, or any gate an `open` effect opens) needs no other opener
    if (!ow.length && openedByData.has(e.id)) continue;
    if (e.gate && (G.gateKinds || {})[e.gate] === null) { FAIL('uses', `gate ${e.id} (${e.gate}) opens only by the story's "open ${e.id}" effect, and nothing runs it`, loc); continue; }
    if (!ow.length) { FAIL('uses', `gate ${e.id} has no opener (gate: kind or opens_with:)`, loc); continue; }
    for (const o of ow) {
      if (ALL_POWERS.has(o)) continue;
      if (isItem(o)) { if (!itemsGivenData.has(o) && !G.itemGives.has(o) && !Object.values(M.ents).some((x) => arr(x.loot).includes(o))) FAIL('uses', `gate ${e.id} opens with ${o}, which nothing gives`, loc); continue; }
      if (isStr(o) && parseCond(o).every((q) => !q.bad)) continue;
      FAIL('uses', `gate ${e.id} opens with ${o}: not a power, an item or a condition`, loc);
    }
  }

  const info = { gates: [], gatesMin: {}, quests: {}, scenes: {} };
  // ---------- 3, 8, 9: the act walk
  const state0 = () => ({ powers: new Set(), items: new Set(), flags: new Map(), clues: new Set(), solved: new Set(), trust: {}, bonus: [], quests: new Set(), seen: new Set(), stage: null, act: 0, events: new Set() });
  const clone = (s) => ({ powers: new Set(s.powers), items: new Set(s.items), flags: new Map([...s.flags].map(([k, v]) => [k, new Set(v)])), clues: new Set(s.clues), solved: new Set(s.solved), trust: Object.assign({}, s.trust), bonus: s.bonus.slice(), quests: new Set(s.quests), seen: new Set(s.seen), stage: s.stage, act: s.act, events: new Set(s.events) });
  const oldSetsFlag = (k) => G.flagSets.has(k);
  function condSat(c, st) {
    for (const q of parseCond(c)) if (!oneSat(q, st)) return false;
    return true;
  }
  function oneSat(q, st) {
    if (q.any) return q.any.some((sub) => sub.every((x) => oneSat(x, st)));
    const v = rawSat(q, st);
    if (v === null) return true;
    if (!q.neg) return v;
    // negations are optimistic (a flag or item may not be set yet on some branch), except powers, acts and stages
    return ['power', 'weapon', 'act', 'stage'].includes(q.k) ? !v : true;
  }
  function rawSat(q, st) {
    const a = q.a[0];
    switch (q.k) {
      case 'flag': { const [k, v] = (a || '').split('='); const s = st.flags.get(k); if (s) return v == null ? true : s.has(v) || s.has('*'); return oldSetsFlag(k) && !flagSetInData.has(k) ? true : false; }
      case 'item': { const m = /^([A-Za-z0-9_]+)(>=|<=|>|<|=)?(\d+)?$/.exec(a || ''); if (!m) return false; if (m[1] === 'coins') return true; return st.items.has(m[1]); }
      case 'power': case 'weapon': return st.powers.has(a);
      case 'trust': { const m = /^([a-z0-9_]+)(>=|<=|>|<|=)(\d+)$/.exec(a || ''); if (!m) return false; const v = st.trust[m[1]] || 0, n = +m[3]; return m[2] === '>=' ? v >= n : m[2] === '>' ? v > n : m[2] === '<=' ? true : m[2] === '<' ? true : v >= n; }
      case 'clue': return st.clues.has(a);
      case 'solved': return st.solved.has(a);
      case 'quest': return q.a[1] === 'active' ? null : st.quests.has(a);
      case 'seen': return st.seen.has(a) || !M.scenes[a];
      case 'stage': { const i = orderIdx(a), j = orderIdx(st.stage); if (i < 0 || j < 0) return null; return q.op === '>=' ? j >= i : q.op === '>' ? j > i : q.op === '<' ? j < i : q.op === '<=' ? j <= i : j === i; }
      case 'act': { const n = +a; return q.op === '>=' ? st.act >= n : q.op === '>' ? st.act > n : q.op === '<' ? st.act < n : q.op === '<=' ? st.act <= n : st.act === n; }
      case 'coins': case 'true': case 'step': return true;
      case 'false': return false;
      case 'event': return st.events.has(a) || emitsInData.has(a) || G.emits.has(a) || /^(dungeon_done|boss_done|beat|gate_open|fight):/.test(a || '');
      default: return null; // night, day, hour, near, diff, choice, area, outdoors, ending, world: time and place pass
    }
  }
  // why a condition fails (the first failing part)
  function whyNot(c, st) {
    for (const q of parseCond(c)) if (!oneSat(q, st)) {
      if (q.any) return { text: `any of (${q.any.map((sub) => sub.map((x) => `${x.neg ? '!' : ''}${x.k} ${(x.a || []).join(' ')}`).join(' ')).join(' | ')})` };
      if (q.k === 'trust') { const m = /^([a-z0-9_]+)/.exec(q.a[0]); return { trust: m && m[1], text: `trust ${q.a[0]}` }; }
      return { text: `${q.neg ? '!' : ''}${q.k} ${q.a.join(' ')}`, k: q.k, a: q.a };
    }
    return null;
  }
  // a wait_for condition the old code or the game's flow brings about later: flags and items the old code names,
  // the next act, a later stage
  function waitLater(c, st) {
    return parseCond(c).every((q) => {
      if (oneSat(q, st)) return true;
      if (q.neg || q.any) return false;
      const a = (q.a[0] || '').split(/[<>=!]/)[0];
      if (q.k === 'flag' || q.k === 'item') return knownGame(a) || flagSetInData.has(a) || itemsGivenData.has(a);
      if (q.k === 'act') return +q.a[0] === st.act + 1;
      if (q.k === 'stage') return orderIdx(q.a[0]) > orderIdx(st.stage);
      return false;
    });
  }
  // the stage order: legacy stages in order, data chapters inserted after their `after`
  const ORDER = [];
  {
    const legacy = G.stages.slice();
    const data = Object.values(M.chapters);
    for (const s of legacy) ORDER.push(s);
    let changed = true, guard = 0;
    while (changed && guard++ < 50) {
      changed = false;
      for (const c of data) {
        if (ORDER.includes(c.id)) continue;
        const i = ORDER.indexOf(c.def.after);
        if (i >= 0) { ORDER.splice(i + 1, 0, c.id); changed = true; }
      }
    }
    for (const c of data) if (!ORDER.includes(c.id)) ORDER.push(c.id);
  }
  function orderIdx(s) { return ORDER.indexOf(s); }
  const actOfStage = (s) => (M.chapters[s] ? +M.chapters[s].def.act : G.stageAct[s] || null);

  // what an entity needs: alternatives of { powers:Set, conds:[] }
  function entNeeds(id, seen = new Set()) {
    const e = M.ents[id];
    if (!e || seen.has(id)) return [{ powers: new Set(), conds: [] }];
    seen.add(id);
    const own = { powers: new Set(), conds: [] };
    if (e.show) own.conds.push(e.show);
    if (e.need && !(e.kind === 'door' || e.kind === 'gate' || e.gate)) own.conds.push(e.need);
    const gates = Object.values(M.ents).filter((g) => g.leads === id && (g.gate || g.kind === 'gate' || g.opens_with || (g.kind === 'door' && g.need)));
    if (!gates.length) return [own];
    const alts = [];
    for (const g of gates) {
      for (const sub of entNeeds(g.id, new Set(seen))) {
        const a = { powers: new Set([...own.powers, ...sub.powers]), conds: own.conds.concat(sub.conds), via: g.id };
        if (g.gate && GATE_POWER[g.gate]) a.powers.add(GATE_POWER[g.gate]);
        else if (g.gate && (G.gateKinds || {})[g.gate] === null) a.conds.push(`event gate_open:${g.id}`);
        for (const o of arr(g.opens_with)) { if (ALL_POWERS.has(o)) a.powers.add(o); else if (isItem(o)) a.conds.push(`item ${o}`); else a.conds.push(o); }
        if (g.need) a.conds.push(g.need);
        alts.push(a);
      }
    }
    return alts;
  }
  function reach(id, st) {
    const e = M.ents[id];
    const res = { ok: true, why: '' };
    if (e && e.map != null && st.act && ACT_MAP[st.act] != null && e.map > ACT_MAP[st.act] && (!e.at || e.at[0] < IZX - 50)) return { ok: false, why: `${id} is on map ${e.map}, which act ${st.act} never reaches` };
    const alts = entNeeds(id);
    for (const a of alts) {
      const miss = [...a.powers].filter((p) => !st.powers.has(p));
      const cmiss = a.conds.filter((c) => !condSat(c, st));
      if (!miss.length && !cmiss.length) return res;
      res.why = res.why || `${id} needs ${[...miss].map((p) => 'power ' + p).concat(cmiss.map(condText)).join(' and ')}${a.via ? ` (behind ${a.via})` : ''}`;
    }
    res.ok = false;
    return res;
  }
  // scene effects: mutates st (union of branches) and adds trust as the best branch; returns nothing
  function playScene(key, st, ctx, depth = 0) {
    const sc = M.scenes[key];
    st.seen.add(key);
    if (!sc || depth > 6) return;
    const gain = sceneGain(sc.beats, st, ctx, depth);
    for (const [tr, n] of Object.entries(gain)) st.trust[tr] = (st.trust[tr] || 0) + n;
  }
  // returns { track: best gain } for a beat list, applying non-trust effects to st (optimistic union)
  function sceneGain(list, st, ctx, depth) {
    const total = {};
    const addG = (g) => { for (const [k, v] of Object.entries(g)) total[k] = (total[k] || 0) + v; };
    for (const b of arr(list)) {
      if (Array.isArray(b)) {
        const tags = (b[3] && typeof b[3] === 'object') ? b[3] : (b[2] && typeof b[2] === 'object' ? b[2] : {});
        if (tags.if && !condSat(tags.if, st)) { noteBonus(tags.do, tags.if, st, ctx); continue; }
        if (tags.clue) addClue(tags.clue, st, ctx);
        addG(applyEffects(tags.do, st, ctx));
        continue;
      }
      if (!b || typeof b !== 'object') continue;
      if ('choose' in b) {
        let best = {};
        for (const p of arr(b.pick)) {
          if (p.if && !condSat(p.if, st)) { ctx.locked.push({ pick: (pairOf(p.t) || {}).full, need: p.if, why: whyNot(p.if, st), where: ctx.where }); noteBonus(p.then, p.if, st, ctx); continue; }
          const g = {};
          const add2 = (x) => { for (const [k, v] of Object.entries(x)) g[k] = (g[k] || 0) + v; };
          add2(applyEffects(p.then, st, ctx));
          for (const l of arr(p.say)) if (Array.isArray(l)) { const tg = (l[3] && typeof l[3] === 'object') ? l[3] : (l[2] && typeof l[2] === 'object' ? l[2] : {}); if (tg.clue) addClue(tg.clue, st, ctx); add2(applyEffects(tg.do, st, ctx)); }
          if (p.scene && M.scenes[p.scene]) { st.seen.add(p.scene); add2(sceneGain(M.scenes[p.scene].beats, st, ctx, depth + 1)); }
          for (const [k, v] of Object.entries(g)) best[k] = Math.max(best[k] || 0, v);
        }
        addG(best);
        continue;
      }
      if ('if' in b && ('then' in b || 'else' in b)) {
        const isEff = (L) => arr(L).every((x) => isStr(x) || (x && x.banner));
        const run = (L) => (isEff(L) ? applyEffects(L, st, ctx) : sceneGain(L, st, ctx, depth + 1));
        if (condSat(b.if, st)) { const g1 = run(b.then); const g2 = b.else ? run(b.else) : {}; const keys = new Set([...Object.keys(g1), ...Object.keys(g2)]); const g = {}; for (const k of keys) g[k] = Math.max(g1[k] || 0, g2[k] || 0); addG(g); }
        else { noteBonus(isEff(b.then) ? b.then : collectEffects(b.then), b.if, st, ctx); if (b.else) addG(run(b.else)); }
        continue;
      }
      if (b.do) addG(applyEffects(b.do, st, ctx));
    }
    return total;
  }
  function collectEffects(list) { const out = []; for (const b of arr(list)) { if (Array.isArray(b)) { const t = b[3] || b[2]; if (t && typeof t === 'object' && t.do) out.push(...arr(t.do)); } else if (b && b.do) out.push(...arr(b.do)); } return out; }
  function noteBonus(effects, cond, st, ctx) {
    for (const e of arr(effects)) if (isStr(e) && /^trust\s/.test(e)) { const [, tr, n] = e.split(/\s+/); const w = whyNot(cond, st); st.bonus.push({ track: tr, n: +n, cond: condText(cond), why: w ? w.text : condText(cond), where: ctx.where }); }
  }
  function addClue(id, st, ctx) { st.clues.add(id); if (ctx.main) { const c = M.clues[id]; if (c) c.mainFound = c.mainFound || ctx.where; } }
  // apply effects; returns trust gains
  function applyEffects(list, st, ctx) {
    const g = {};
    for (const e of arr(list)) {
      if (!isStr(e)) continue;
      const p = e.trim().split(/\s+/), v = p[0], a = p.slice(1);
      switch (v) {
        case 'set': { const [k, val] = a[0].split('='); if (!st.flags.has(k)) st.flags.set(k, new Set()); st.flags.get(k).add(val == null ? '1' : val); break; }
        case 'give': st.items.add(a[0]); break;
        case 'take': break; // optimistic: keep (a branch may not take it)
        case 'trust': g[a[0]] = (g[a[0]] || 0) + (+a[1] || 0); break;
        case 'power': st.powers.add(a[0]); break;
        case 'weapon': if (WEAPON_POWERS.has(a[0])) st.powers.add(a[0]); break;
        case 'clue': addClue(a[0], st, ctx); break;
        case 'quest': if (a[0] === 'done') st.quests.add(a[1]); break;
        case 'emit': st.events.add(a[0]); break;
        case 'heart_ember': break;
        default: break;
      }
    }
    return g;
  }
  // walk one step on the main path (or a quest); reports unreachable targets
  function walkStep(s, O, st, ctx, label) {
    if (!s || typeof s !== 'object') return;
    const { verb, args } = parseDo(s.do);
    const where = `${O.id}.${s.id || label}`;
    const loc = W(O, Object.assign(at(O, s.do), { step: s.id }));
    ctx.where = where;
    const report = (msg) => ctx.fail(msg, loc);
    const target = ['goto', 'examine', 'track'].includes(verb) ? args[0] : verb === 'use_power_at' ? args[1] : verb === 'talk' || verb === 'give' ? (verb === 'talk' ? args[0] : args[1]) : null;
    if (s.if && !condSat(s.if, st)) { const w = whyNot(s.if, st); report(`${where}: step needs ${w ? w.text : condText(s.if)}`); }
    if (target && M.ents[target]) { const r = reach(target, st); if (!r.ok) report(`${where}: ${verb} ${target}: ${r.why}`); }
    if (s.at && M.ents[s.at]) { const r = reach(s.at, st); if (!r.ok) report(`${where}: at ${s.at}: ${r.why}`); }
    if (ctx.main && ctx.steps) { const tid = (target && M.ents[target]) ? target : (s.at && M.ents[s.at] ? s.at : null); const e = tid ? M.ents[tid] : null; const pt = e ? (e.at || (e.path && e.path[0])) : null; ctx.steps.push({ chapter: O.id, step: s.id || label, verb, target: tid, map: e ? e.map : null, at: pt && !e.area ? pt : null, area: e && e.area ? e.area : null, powers: [...st.powers] }); }
    switch (verb) {
      case 'use_power_at': if (!st.powers.has(args[0])) report(`${where}: needs power ${args[0]}, which the player does not have yet (has ${[...st.powers].join(', ') || 'none'})`); break;
      case 'give': if (args[0] !== 'coins' && !st.items.has(args[0])) report(`${where}: give ${args[0]}: the player does not have ${args[0]} here on the main path`); break;
      case 'find': { const holder = Object.values(M.ents).find((e) => e.id === args[0] || arr(e.loot).some((l) => isStr(l) && l.split(/\s+/).includes(args[0]))); if (holder) { const r = reach(holder.id, st); if (!r.ok) report(`${where}: find ${args[0]}: ${r.why}`); } st.items.add(args[0]); break; }
      case 'deduce': {
        const D = M.deduce[args[0]];
        if (D) {
          const miss = arr(D.needs).filter((c) => !st.clues.has(c));
          if (miss.length) ctx.failMys(`${where}: deduce ${args[0]} needs ${miss.join(', ')}, which ${ctx.main ? 'the main path' : 'this quest'} has not found by then${miss.map((c) => (cluesAdded.has(c) ? '' : ` (nothing adds ${c})`)).join('')}`, loc);
          st.solved.add(args[0]);
          const g = applyEffects(D.then, st, ctx);
          for (const [k, v] of Object.entries(g)) st.trust[k] = (st.trust[k] || 0) + v;
        }
        break;
      }
      case 'wait_for': if (!['event', 'night', 'day', 'hour'].includes(args[0])) { const c = args.join(' '); if (!condSat(c, st) && !waitLater(c, st)) { const wn = whyNot(c, st); report(`${where}: waits for "${c}", which ${ctx.main ? 'the main path' : 'this quest'} never gets (${wn ? wn.text : '?'})`); } } else if (args[0] === 'event') {
        const ev = args[1] || '';
        const m = /^(dungeon_done|boss_done|beat):(.+)$/.exec(ev);
        const ok = st.events.has(ev) || emitsInData.has(ev) || G.emits.has(ev) || (m && (m[1] === 'dungeon_done' ? G.dungeons.has(m[2]) : m[1] === 'boss_done' ? (G.foes.has(m[2]) || knownGame(m[2])) : knownGame(m[2])));
        if (!ok) report(`${where}: waits for event ${ev}, which nothing emits`);
        break;
      }
      case 'dungeon': { const pw = DUNGEON_POWER[args[0]]; if (pw) { st.powers.add(pw); ctx.granted.add(pw); } st.events.add(`dungeon_done:${args[0]}`); st.flags.set(`trial_${args[0]}_done`, new Set(['1'])); break; }
      case 'fight': st.events.add(`boss_done:${args[0]}`); break;
      case 'all': case 'any': {
        const parts = arr(s.parts);
        if (verb === 'any') {
          const okParts = parts.filter((p) => { const t = p && parseDo(p.do); const tg = t && (['goto', 'examine', 'track'].includes(t.verb) ? t.args[0] : t.verb === 'talk' ? t.args[0] : null); return !tg || !M.ents[tg] || reach(tg, st).ok; });
          if (!okParts.length) report(`${where}: no part of this any-step can be reached`);
          okParts.forEach((p, i) => walkStep(p, O, st, Object.assign(ctx, { fail: ctx.fail }), `${label} part ${i + 1}`));
        } else parts.forEach((p, i) => walkStep(p, O, st, ctx, `${label} part ${i + 1}`));
        for (const [i, x] of arr(s.extra).entries()) ctx.extras.push({ step: x, O, label: `${s.id || label} extra ${i + 1}` });
        ctx.where = where;
        break;
      }
      default: break;
    }
    if (verb === 'cutscene' && M.scenes[args[0]]) playScene(args[0], st, ctx);
    for (const k of STEP_SCENES) if (k !== 'lose' && s[k] && M.scenes[s[k]]) playScene(s[k], st, ctx);
    const g = applyEffects(s.then, st, ctx);
    for (const [k, v] of Object.entries(g)) st.trust[k] = (st.trust[k] || 0) + v;
    if (s.optional) { /* optional steps are walked but do not block */ }
  }

  // the chapters of each act, in order (after/next chain)
  const chaptersOf = (n) => Object.values(M.chapters).filter((c) => +c.def.act === n).sort((a, b) => orderIdx(a.id) - orderIdx(b.id));
  const acts = [...new Set([...Object.values(M.chapters).map((c) => +c.def.act), ...Object.keys(M.acts).map(Number), ...Object.values(M.quests).map((q) => +q.def.act)])].filter((n) => !isNaN(n)).sort((a, b) => a - b);
  const walkLog = {};
  let st = state0();
  let lastAct = 0;
  const powersBefore = (n) => { const s = new Set(); for (const [p, a] of Object.entries(POWER_ACT)) if (a < n && !['whip', 'glaive'].includes(p)) s.add(p); return s; };
  const allClueSources = cluesAdded;
  for (const n of acts) {
    // powers at the start of this act: every main-path power of earlier acts
    for (const p of powersBefore(n)) st.powers.add(p);
    st.act = n;
    const chs = chaptersOf(n);
    const A = M.acts[n];
    const log = walkLog[n] = { act: n, chapters: [], trust: {}, endings: {}, powersAt: {}, locked: [], granted: [] };
    // chain integrity
    for (const c of chs) {
      const d = c.def;
      const loc = W(c, at(c, d.after));
      if (d.after && !M.chapters[d.after] && stageIdx(d.after) < 0) FAIL('ids', `${c.id}: after ${d.after}: no chapter or old stage has that id`, loc);
      if (d.next && !M.chapters[d.next] && stageIdx(d.next) < 0) FAIL('ids', `${c.id}: next ${d.next}: no chapter or old stage has that id`, W(c, at(c, d.next)));
      if (d.next && M.chapters[d.next] && M.chapters[d.next].def.after !== c.id) FAIL('solve', `${c.id}: next is ${d.next}, but ${d.next}.after is ${M.chapters[d.next].def.after}`, loc);
      if (d.after && M.chapters[d.after] && M.chapters[d.after].def.next !== c.id) FAIL('solve', `${c.id}: after is ${d.after}, but ${d.after}.next is ${M.chapters[d.after].def.next}`, loc);
      if (d.after && actOfStage(d.after) && actOfStage(d.after) > n) FAIL('solve', `${c.id}: after ${d.after}, a stage of a later act`, loc);
    }
    // walk the act's stages in order: data chapters step by step, old stages by their known power grants
    const actStages = ORDER.filter((s) => actOfStage(s) === n);
    log.steps = [];
    const ctxBase = { main: true, steps: log.steps, locked: log.locked, extras: [], granted: new Set(), fail: (msg, loc) => FAIL('solve', msg, loc), failMys: (msg, loc) => FAIL('mystery', msg, loc) };
    for (const s of actStages) {
      st.stage = s;
      const c = M.chapters[s];
      if (c) {
        const ctx = Object.assign(ctxBase, { where: c.id, granted: new Set() });
        arr(c.def.step).forEach((x, i) => { if (x && x.optional) { ctx.extras.push({ step: x, O: c, label: x.id || `step ${i + 1}` }); return; } walkStep(x, c, st, ctx, `step ${i + 1}`); });
        for (const p of LEGACY_STAGE_POWER[s] || []) if (!ctx.granted.has(p) && !st.powers.has(p)) { st.powers.add(p); log.granted.push({ stage: s, power: p, legacy: true }); }
        log.chapters.push({ id: c.id, trust: Object.assign({}, st.trust), powers: [...st.powers], clues: [...st.clues] });
      } else {
        for (const p of LEGACY_STAGE_POWER[s] || []) if (!st.powers.has(p)) { st.powers.add(p); log.granted.push({ stage: s, power: p, legacy: true }); }
      }
      log.powersAt[s] = [...st.powers];
      // endings decided at this chapter
      if (A) for (const [id, en] of Object.entries(A.def.ending || {})) if (en.at === s) endingCheck(id, en, A, st, log);
    }
    if (A) for (const [id, en] of Object.entries(A.def.ending || {})) if (!en.at) endingCheck(id, en, A, st, log);
    log.trust = Object.assign({}, st.trust);
    log.bonus = st.bonus.filter((b) => true);
    // optional steps and extras: reachable at the end of the act
    for (const x of ctxBase.extras) { const s2 = clone(st); walkStep(x.step, x.O, s2, Object.assign({}, ctxBase, { main: false, steps: null, extras: [], fail: (msg, loc) => FAIL('solve', `${msg} (optional, checked with every power of act ${n})`, loc), failMys: (msg, loc) => FAIL('mystery', msg, loc) }), x.label); }
    // side quests of this act: walked with the end-of-act state
    for (const q of Object.values(M.quests).filter((q) => +q.def.act === n)) {
      const s2 = clone(st);
      const qctx = { main: false, locked: [], extras: [], granted: new Set(), where: q.id, fail: (msg, loc) => FAIL('solve', `${msg} (side quest, even with every power of act ${n})`, loc), failMys: (msg, loc) => FAIL('mystery', msg, loc) };
      arr(q.def.step).forEach((x, i) => walkStep(x, q, s2, qctx, `step ${i + 1}`));
      for (const x of qctx.extras) walkStep(x.step, x.O, s2, qctx, x.label);
      q.walk = { clues: [...s2.clues].filter((c) => !st.clues.has(c)), items: [...s2.items].filter((c) => !st.items.has(c)), powers: [...s2.powers].filter((p) => !st.powers.has(p)) };
    }
    lastAct = n;
    // 9. mysteries of this act
    if (A) mysteryRules(n, A, st);
    else if (chs.length) WARN('act', `act ${n} has no act file (game/story/act${n}/_act.js): mystery, ending and backtracking rules were skipped`, { act: n, file: '', line: 0 });
    if (A) backtrackRules(n, A);
  }
  function endingCheck(id, en, A, st, log) {
    const loc = W(A, Object.assign(at(A, id), { ending: id }));
    if (en.else) { log.endings[id] = { ok: true, else: true }; return; }
    if (!en.if) { FAIL('solve', `act ${A.act}: ending ${id} has neither if: nor else: true`, loc); return; }
    const ok = condSat(en.if, st);
    log.endings[id] = { ok, if: en.if, trust: Object.assign({}, st.trust) };
    if (ok) return;
    const w = whyNot(en.if, st);
    if (w && w.trust) {
      const m = new RegExp(`trust ${w.trust}(>=|>)(\\d+)`).exec(condText(en.if));
      const need = m ? +m[2] + (m[1] === '>' ? 1 : 0) : '?';
      const have = st.trust[w.trust] || 0;
      const bon = st.bonus.filter((b) => b.track === w.trust);
      const withs = bon.length ? ` (${have + bon.reduce((s, b) => s + b.n, 0)} with ${[...new Set(bon.map((b) => b.why.replace(/^item |^quest |^flag /, '').replace(/ done$/, '')))].join(', ')})` : '';
      FAIL('solve', `ending ${id} needs trust ${w.trust}>=${need}; main path gives ${have}${withs}`, loc);
    } else FAIL('solve', `ending ${id} needs "${condText(en.if)}"; the main path never gets ${w ? w.text : 'there'}`, loc);
  }

  // ---------- 9. mysteries
  function mysteryRules(n, A, stEnd) {
    const mys = Object.values(M.mysteries).filter((m) => m.act === n);
    const loc = W(A, at(A));
    const ded = Object.values(M.deduce).filter((d) => d.owner && +d.owner.act === n);
    const mains = mys.filter((m) => m.main);
    if (mains.length !== 1) FAIL('mystery', `act ${n} has ${mains.length} main mysteries (needs exactly 1; mark it main: true)`, loc);
    for (const m of mains) { const k = ded.filter((d) => d.mystery === m.id).length; if (k < 3) FAIL('mystery', `act ${n}: main mystery ${m.id} has ${k} deductions (needs 3 or more)`, W(A, { file: m.file, line: m.line })); }
    const smalls = mys.filter((m) => !m.main);
    if (smalls.length < 2) FAIL('mystery', `act ${n} has ${smalls.length} small mysteries (needs 2)`, loc);
    for (const m of smalls) if (!ded.some((d) => d.mystery === m.id)) FAIL('mystery', `act ${n}: small mystery ${m.id} has no deduction`, W(A, { file: m.file, line: m.line }));
    const herrings = Object.values(M.clues).filter((c) => c.herring && c.owner && +c.owner.act === n);
    if (!herrings.length) FAIL('mystery', `act ${n} has no red herring (a clue with herring: true)`, loc);
    for (const h of herrings) if (!cluesAdded.has(h.id)) FAIL('mystery', `act ${n}: herring ${h.id} is never found (nothing adds it)`, W(h.owner, { file: h.file, line: h.line }));
    // deductions no main-path step asks (the Case Book asks them once their clues are found): every clue must be findable
    const asked = new Set();
    for (const c of Object.values(M.chapters)) for (const s of flatSteps(c.def.step)) { const p = parseDo(s.do); if (p.verb === 'deduce') asked.add(p.args[0]); }
    for (const d of ded) {
      if (asked.has(d.id)) continue;
      const miss = arr(d.needs).filter((c) => !allClueSources.has(c));
      if (miss.length) FAIL('mystery', `${d.owner.id}: deduction ${d.id} needs ${miss.join(', ')}, which nothing in the game adds`, W(d.owner, { file: d.file, line: d.line, ded: d.id }));
    }
    for (const c of Object.values(M.clues).filter((c) => c.owner && +c.owner.act === n)) if (!allClueSources.has(c.id)) WARN('mystery', `clue ${c.id} is defined but nothing adds it`, W(c.owner, { file: c.file, line: c.line }));
  }
  function flatSteps(list) { const out = []; for (const s of arr(list)) { if (!s) continue; out.push(s); out.push(...flatSteps(s.parts), ...flatSteps(s.extra)); } return out; }

  // ---------- 8. backtracking, and 4. side quest payoffs
  function mainUsesItem(id) { return Object.values(M.chapters).some((c) => !!JSON.stringify(c.def).match(new RegExp(`(item |give |take )${id}\\b`))); }
  function feedsMain(clue) { return Object.values(M.deduce).some((d) => (arr(d.needs).includes(clue) || arr(d.bonus).includes(clue)) && M.mysteries[d.mystery] && M.mysteries[d.mystery].main); }
  function payoffOf(entId, seen = new Set()) {
    const e = M.ents[entId];
    if (!e || seen.has(entId)) return null;
    seen.add(entId);
    if (e.payoff && PAYOFF_KINDS.has(e.payoff.kind)) return e.payoff.kind;
    for (const ef of arr(e.then)) if (isStr(ef)) { const w = ef.split(/\s+/); if (['heart_ember', 'power', 'upgrade', 'weapon'].includes(w[0])) return w[0] === 'weapon' ? 'power' : w[0]; if (w[0] === 'clue' && feedsMain(w[1])) return 'truth'; if (w[0] === 'give' && mainUsesItem(w[1])) return 'item_main'; if (w[0] === 'open' || (w[0] === 'world' && /open|built|rebuilt|down|lowered/.test(w[2] || ''))) return 'shortcut'; }
    for (const l of arr(e.loot)) {
      if (!isStr(l)) continue;
      let w = l.split(/\s+/);
      if (w[0] === 'give' && w[1] && w[1] !== 'coins') w = w.slice(1);
      if (w[0] === 'heart_ember') return 'heart_ember';
      if (w[0] === 'power' || w[0] === 'upgrade') return w[0];
      if (isItem(w[0]) && mainUsesItem(w[0])) return 'item_main';
    }
    // a quest or chapter step at this entity that gives a payoff
    for (const O of M.owners) for (const s of flatSteps(O.def.step)) {
      const p = parseDo(s.do);
      if (!(p.args.includes(entId) || s.at === entId)) continue;
      if (O.type === 'quest' && O.def.payoff && PAYOFF_KINDS.has(O.def.payoff.kind)) return `quest ${O.id}`;
      for (const ef of arr(s.then)) if (isStr(ef)) { const w = ef.split(/\s+/); if (w[0] === 'heart_ember' || w[0] === 'power' || w[0] === 'upgrade') return w[0]; if (w[0] === 'clue' && feedsMain(w[1])) return 'truth'; if (w[0] === 'open' || (w[0] === 'world' && /open|built|rebuilt/.test(w[2] || ''))) return 'shortcut'; }
    }
    if (e.leads && e.leads !== entId) return payoffOf(e.leads, seen);
    if (e.kind === 'door' || e.shortcut) return e.shortcut ? 'shortcut' : null;
    return null;
  }
  function backtrackRules(n, A) {
    const map = ACT_MAP[n];
    if (!map) return; // Act I has no earlier map
    const gates = Object.values(M.ents).filter((e) => e.gate && GATE_POWER[e.gate] && POWER_ACT[GATE_POWER[e.gate]] === n && e.map != null && e.map < map && !(e.at && e.at[0] >= IZX - 50));
    const min = A.def.gates_min != null ? A.def.gates_min : 5;
    if (gates.length < min) FAIL('backtrack', `act ${n}: ${gates.length} new-power gates on earlier maps (needs ${min})`, W(A, at(A, 'gates_min')));
    for (const g of gates) {
      const loc = { act: n, file: g.file, line: g.line, owner: g.owner ? g.owner.id : null, ent: g.id };
      if (!g.leads) { FAIL('backtrack', `gate ${g.id} (${g.gate}, map ${g.map}) leads nowhere (no leads:)`, loc); continue; }
      const p = payoffOf(g.leads) || (g.payoff && PAYOFF_KINDS.has(g.payoff.kind) ? g.payoff.kind : null);
      if (!p) {
        const L = M.ents[g.leads] || {};
        const gives = [...arr(L.loot), ...arr(L.then)].filter(isStr);
        const clueNote = gives.map((x) => /^clue\s+(\S+)/.exec(x)).filter(Boolean).map((m) => { const c = M.clues[m[1]]; const mys = c && c.mystery; return ` (clue ${m[1]} feeds ${mys ? `the small mystery ${mys}` : 'no main-mystery deduction'}; a truth payoff must feed the main mystery)`; }).join('');
        FAIL('backtrack', `gate ${g.id} (${g.gate}, map ${g.map}) leads to ${g.leads}, which pays off nothing from the payoff list${gives.length ? ` (it gives: ${gives.join(', ')})` : ''}${clueNote}`, loc);
      }
      g.payoffFound = p;
    }
    info.gates.push(...gates.map((g) => ({ id: g.id, act: n, gate: g.gate, power: GATE_POWER[g.gate], map: g.map, at: g.at, leads: g.leads || null, payoff: g.payoffFound || null, owner: g.owner ? g.owner.id : null, file: g.file, line: g.line })));
    info.gatesMin[n] = min;
    return gates;
  }
  for (const q of Object.values(M.quests)) {
    const loc = W(q, at(q, 'payoff'));
    const p = q.def.payoff;
    if (!p || !PAYOFF_KINDS.has(p.kind)) { FAIL('quest', `side quest ${q.id} has no payoff from the list (${[...PAYOFF_KINDS].join(', ')})`, loc); continue; }
    const all = JSON.stringify(q.def);
    const has = (re) => re.test(all);
    let ok = true, why = '';
    switch (p.kind) {
      case 'power': ok = has(new RegExp(`(power|weapon) ${p.id}\\b`)); why = `no "power ${p.id}" or "weapon ${p.id}" effect`; break;
      case 'upgrade': ok = has(new RegExp(`upgrade ${p.id}\\b`)); why = `no "upgrade ${p.id}" effect`; break;
      case 'heart_ember': ok = has(/heart_ember/) || Object.values(M.ents).some((e) => arr(e.loot).includes('heart_ember') && all.includes(e.id)); why = 'no heart_ember effect or chest'; break;
      case 'item_main': ok = has(new RegExp(`give ${p.id}\\b`)) && mainUsesItem(p.id); why = !has(new RegExp(`give ${p.id}\\b`)) ? `never gives ${p.id}` : `the main path never uses ${p.id}`; break;
      case 'truth': ok = (has(new RegExp(`clue ${p.id}\\b`)) || has(new RegExp(`"clue":"${p.id}"`))) && !!feedsMain(p.id); why = !M.clues[p.id] ? `clue ${p.id} is not defined` : !feedsMain(p.id) ? `clue ${p.id} feeds no main-mystery deduction` : `never adds clue ${p.id}`; break;
      case 'shortcut': {
        ok = has(/"(open|world) [a-z0-9_]+/) || has(/"kind":"(gate|door)"/);
        // or the payoff names a door or gate the old code opens on a flag this quest sets (opens_with/need: 'flag x')
        const E = p.id && M.ents[p.id];
        if (!ok && E) { const fl = [...arr(E.opens_with), ...arr(E.need)].filter(isStr).flatMap((c) => parseCond(c)).filter((q) => q.k === 'flag' && !q.neg).map((q) => q.a[0].split('=')[0]); ok = fl.length > 0 && fl.every((f) => has(new RegExp(`"set ${f}(=|")`))); }
        why = E ? `no open/world effect or gate, and ${p.id} does not open on a flag this quest sets` : 'no open/world effect or gate'; break;
      }
      case 'ally': ok = !!p.id && (has(new RegExp(`ally ${p.id}\\b`)) || has(new RegExp(`set [a-z0-9_]*${p.id}`))); why = p.id ? `no "ally ${p.id}" effect` : 'payoff.id should name the ally'; break;
      default: break;
    }
    if (!ok) FAIL('quest', `side quest ${q.id}: payoff ${p.kind}${p.id ? ' ' + p.id : ''} is not delivered (${why})`, loc);
    info.quests[q.id] = { ok, kind: p.kind, id: p.id || null, why: ok ? '' : why };
  }

  // ---------- 5. scene length (per branch, after a boss 6)
  const sceneLen = (list, depth = 0, seen = new Set()) => {
    let n = 0;
    for (const b of arr(list)) {
      if (Array.isArray(b)) { n++; continue; }
      if (!b || typeof b !== 'object') continue;
      if ('choose' in b) {
        let best = 0;
        for (const p of arr(b.pick)) {
          let k = arr(p.say).filter(Array.isArray).length;
          if (p.scene && M.scenes[p.scene] && !seen.has(p.scene) && depth < 6) k += sceneLen(M.scenes[p.scene].beats, depth + 1, new Set([...seen, p.scene]));
          best = Math.max(best, k);
        }
        n += best;
        continue;
      }
      if ('if' in b && ('then' in b || 'else' in b)) { const a = arr(b.then).some(Array.isArray) || arr(b.then).some((x) => x && typeof x === 'object' && !x.banner) ? sceneLen(b.then, depth + 1, seen) : 0; const c = b.else ? sceneLen(b.else, depth + 1, seen) : 0; n += Math.max(a, c); }
    }
    return n;
  };
  const afterBoss = new Map(); // scene -> boss
  for (const O of M.owners) {
    const steps = arr(O.def.step);
    steps.forEach((s, i) => {
      const p = parseDo(s && s.do);
      const bossy = p.verb === 'fight' || p.verb === 'dungeon' || (p.verb === 'wait_for' && /^(boss_done|dungeon_done):/.test(p.args[1] || ''));
      if (!bossy) return;
      const boss = p.verb === 'wait_for' ? p.args[1].split(':')[1] : p.args[0];
      for (const k of ['win', 'after', 'kneel']) if (s[k]) afterBoss.set(s[k], boss);
      const nx = steps[i + 1];
      if (nx && nx.scene && ['cutscene', 'choose', 'wait_for'].includes(parseDo(nx.do).verb)) afterBoss.set(nx.scene, boss);
      if (nx && parseDo(nx.do).verb === 'cutscene') afterBoss.set(parseDo(nx.do).args[0], boss);
    });
  }
  for (const [id, sc] of Object.entries(M.scenes)) {
    const n = sceneLen(sc.beats);
    const boss = afterBoss.get(id);
    const max = boss ? AFTER_BOSS_MAX : SCENE_MAX;
    sc.len = n; sc.afterBoss = boss || null;
    info.scenes[id] = { len: n, max, afterBoss: boss || null, owner: sc.owner ? sc.owner.id : null };
    if (n > max) FAIL('length', `${id}: ${n} lines${boss ? ` after boss ${boss}` : ''} (max ${max})`, W(sc.owner, { file: sc.file, line: sc.line, scene: id }));
  }

  // ---------- 13. old saves
  oldSaveRules();
  function oldSaveRules() {
    const fx = opts.fixtures || [];
    if (!fx.length) { WARN('saves', 'no save fixtures found (../fixtures/save_*.json): rule 13 skipped', { file: '', line: 0 }); return; }
    const dataText = M.files.map((f) => f.text).join('\n');
    const trustFlags = new Set(); for (const A of Object.values(M.acts)) for (const f of Object.values(A.def.trust || {})) trustFlags.add(f);
    const dataReadsFlag = (k) => new RegExp(`flag ${k}\\b`).test(dataText) || trustFlags.has(k);
    const dataReadsChoice = (k) => new RegExp(`choice ${k}\\b`).test(dataText);
    const buildReaders = (map, k) => (map.get(k) || []).filter((m) => G.inBuild.has(m));
    const base = baseReaders(opts.root, fx);
    for (const f of fx) {
      for (const k of Object.keys(f.flags)) {
        if (base.flags && base.flags.has(k) === false) continue; // the old code never read it either
        if (!buildReaders(G.flagReads, k).length && !dataReadsFlag(k)) FAIL('saves', `${f.name}: flag ${k} is in the save, but nothing in the build or the data reads it any more`, { file: f.rel, line: 0 });
      }
      for (const k of Object.keys(f.choices)) {
        if (base.choices && base.choices.has(k) === false) continue;
        if (!buildReaders(G.choiceReads, k).length && !dataReadsChoice(k)) FAIL('saves', `${f.name}: choice ${k} is in the save, but nothing reads it any more`, { file: f.rel, line: 0 });
      }
      if (f.stage && stageIdx(f.stage) < 0 && !M.chapters[f.stage]) FAIL('saves', `${f.name}: stage ${f.stage} is in the save, but no stage has that id any more`, { file: f.rel, line: 0 });
    }
  }

  // ---------- legacy text scan (Act I modules): watch words, with a direction check where the line names places
  if (actFilter == null || actFilter === 1) legacyScan();
  function legacyScan() {
    const ents0 = Object.values(M.ents).filter((e) => e.map === 0 && (e.at || e.path));
    const names = [];
    for (const e of ents0) for (const nm of [e.name, ...arr(e.aliases)]) { const p = pairOf(nm); if (p && p.full) names.push({ e, n: p.full.toLowerCase().replace(/^the /, '') }); }
    names.sort((a, b) => b.n.length - a.n.length);
    for (const mod of LEGACY_ACT1) {
      const t = G.files[mod];
      if (!t) continue;
      const seenLine = new Set();
      for (const s of tokenize(t)) {
        if (s.t !== 'str' && s.t !== 'tpl') continue;
        const v = s.v;
        if (!/\s/.test(v) || words(v) < 3 || !WATCH.test(v)) continue;
        if (/^[a-z0-9_.:-]+$/i.test(v) || /[{};=]|=>/.test(v) && !/[.!?]["']?$/.test(v)) continue;
        if (seenLine.has(s.line)) continue;
        seenLine.add(s.line);
        const rel = `${mod}.js:${s.line}`;
        const w = WATCH.exec(v)[1].toLowerCase();
        const lower = v.toLowerCase();
        let dirMsg = null;
        const dm = /\b(north|south|east|west)(?:-?(east|west))?\s+of\s+(?:the\s+)?([a-z' ]{3,40})/.exec(lower);
        if (dm && names.length) {
          const anchor = names.find((q) => dm[3].startsWith(q.n));
          if (anchor) {
            const subj = names.find((q) => q.e !== anchor.e && lower.includes(q.n) && lower.indexOf(q.n) !== lower.indexOf(anchor.n));
            if (subj && subj.e.map === anchor.e.map) {
              const a = pos(anchor.e.id), b = pos(subj.e.id);
              const claim = dm[1] + (dm[2] ? '-' + dm[2] : '');
              if (a && b && dirOK(claim, a, b) === false) dirMsg = `${subj.e.id} is ${bearing(a, b)} of ${anchor.e.id}`;
            }
          }
        }
        if (dirMsg) WARN('dir', `${rel} "${short(dm[0], 40)}": ${dirMsg}`, { act: 1, file: `game/src/${mod}.js`, line: s.line, legacy: true });
        else WARN('legacy', `${rel} "${short(v, 70)}" (${w})`, { act: 1, file: `game/src/${mod}.js`, line: s.line, legacy: true });
      }
    }
  }

  return { fails, warns, walk: walkLog, order: ORDER, afterBoss: Object.fromEntries(afterBoss), info };
}

// which fixture flags and choices the old code (main at BASE_REF) read: a Set, or null when git is not there
function baseReaders(root, fx) {
  if (!root) return {};
  const keys = new Set(); const ch = new Set();
  for (const f of fx) { Object.keys(f.flags).forEach((k) => keys.add(k)); Object.keys(f.choices).forEach((k) => ch.add(k)); }
  const look = (prefix, set) => {
    if (!set.size) return new Set();
    try {
      const pat = `(flags|F)\\.(${[...set].join('|')})\\b`.replace('(flags|F)', prefix);
      const out = execFileSync('git', ['-C', root, 'grep', '-h', '-o', '-E', pat, BASE_REF, '--', 'game/src'], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'], maxBuffer: 1 << 26 });
      const got = new Set();
      for (const m of out.matchAll(/\.([A-Za-z0-9_]+)/g)) got.add(m[1]);
      return got;
    } catch (e) { return null; }
  };
  return { flags: look('(flags|F)', keys), choices: look('choices', ch) };
}

export function loadFixtures(dir, root) {
  const out = [];
  if (!dir || !existsSync(dir)) return out;
  for (const n of readdirSync(dir).filter((x) => /^save_.*\.json$/.test(x)).sort()) {
    try {
      const d = JSON.parse(readFileSync(join(dir, n), 'utf8'));
      const w = typeof d.eb_world3 === 'string' ? JSON.parse(d.eb_world3) : d.eb_world3 || d;
      out.push({ name: n, rel: join(dir, n), flags: w.flags || {}, choices: w.choices || {}, stage: w.stage, quests: w.quests || {} });
    } catch (e) { /* not a save */ }
  }
  return out;
}

// ---------------------------------------------------------------- the report
export function report(res, M, opts) {
  const { fails, warns } = res;
  const by = (L) => { const m = {}; for (const x of L) m[x.rule] = (m[x.rule] || 0) + 1; return m; };
  const nf = fails.length, nw = warns.length;
  const dataW = warns.filter((w) => !w.legacy), legW = warns.filter((w) => w.legacy);
  const pad = (s) => (s.length >= 8 ? s + ' ' : (s + '        ').slice(0, 8));
  const lines = [];
  lines.push(`check: ${nf} failed, ${nw} warning${nw === 1 ? '' : 's'}${opts.act != null ? ` (act ${opts.act})` : ''}`);
  lines.push('');
  lines.push(`data: ${M.files.length} files, ${Object.keys(M.chapters).length} chapters, ${Object.keys(M.quests).length} side quests, ${Object.keys(M.ents).length} entities, ${Object.keys(M.clues).length} clues, ${Object.keys(M.deduce).length} deductions, ${Object.keys(M.scenes).length} scenes`);
  const fb = by(fails), wb = by(warns);
  if (nf) lines.push(`failed by rule: ${Object.entries(fb).map(([k, v]) => `${k} ${v}`).join(', ')}`);
  if (nw) lines.push(`warnings by rule: ${Object.entries(wb).map(([k, v]) => `${k} ${v}`).join(', ')}`);
  for (const [n, L] of Object.entries(res.walk)) {
    const tr = Object.entries(L.trust || {}).map(([k, v]) => `${k} ${v}`).join(', ');
    const en = Object.entries(L.endings || {}).map(([k, v]) => `${k} ${v.ok ? 'reachable' : 'NOT reachable'}`).join(', ');
    if (L.chapters.length || tr || en) lines.push(`act ${n}: ${L.chapters.length} data chapters walked${tr ? `; main-path trust: ${tr}` : ''}${en ? `; endings: ${en}` : ''}`);
  }
  lines.push('');
  lines.push('```');
  for (const f of fails) lines.push(`FAIL ${pad(f.rule)}${f.msg}`);
  for (const w of dataW) lines.push(`WARN ${pad(w.rule)}${w.msg}`);
  for (const w of legW) lines.push(`WARN ${pad(w.rule)}${w.msg}`);
  lines.push('```');
  return lines.join('\n') + '\n';
}

// ---------------------------------------------------------------- the CLI
export async function main(argv) {
  const t0 = Date.now();
  const arg = (k, d) => { const i = argv.indexOf(k); return i >= 0 ? argv[i + 1] : d; };
  const root = resolve(arg('--root', resolve(HERE, '..')));
  const storyDir = resolve(arg('--story', join(root, 'game/story')));
  const outDir = resolve(arg('--out', join(root, 'dist')));
  const act = arg('--act', null);
  const fxDir = arg('--fixtures', findFixtures(root));
  const game = scanGame(arg('--game', root));
  const loaded = loadStory(storyDir, root);
  const M = buildModel(loaded, game);
  const extra = [];
  for (const d of ['game/simple']) { const p = join(root, d); if (existsSync(p)) for (const n of readdirSync(p)) extra.push([`${d}/${n}`, readFileSync(join(p, n), 'utf8')]); }
  for (const n of ['game/head.html', 'game/body.html']) if (existsSync(join(root, n))) extra.push([n, readFileSync(join(root, n), 'utf8')]);
  const fixtures = loadFixtures(fxDir, root);
  const res = runChecks(M, { act, loadFails: loaded.loadFails, extraTextFiles: extra, fixtures, root });
  const md = report(res, M, { act });
  mkdirSync(outDir, { recursive: true });
  writeFileSync(join(outDir, 'check.md'), md);
  const json = {
    ok: res.fails.length === 0, act: act != null ? +act : null, ms: Date.now() - t0,
    counts: { fail: res.fails.length, warn: res.warns.length, files: M.files.length, chapters: Object.keys(M.chapters).length, quests: Object.keys(M.quests).length, entities: Object.keys(M.ents).length, clues: Object.keys(M.clues).length, deductions: Object.keys(M.deduce).length, scenes: Object.keys(M.scenes).length },
    fails: res.fails, warns: res.warns, walk: res.walk, order: res.order, info: res.info,
  };
  writeFileSync(join(outDir, 'check.json'), JSON.stringify(json, null, 1));
  if (!argv.includes('--quiet')) {
    const head = md.split('\n').slice(0, 8).join('\n');
    console.log(head.replace(/\n```[\s\S]*$/, ''));
    const L = md.split('\n').filter((l) => l.startsWith('FAIL'));
    for (const l of L.slice(0, 40)) console.log(l);
    if (L.length > 40) console.log(`... ${L.length - 40} more FAIL lines in ${relative(process.cwd(), join(outDir, 'check.md'))}`);
    console.log(`(${json.ms} ms) wrote ${relative(process.cwd(), join(outDir, 'check.md'))} and check.json`);
  }
  return res.fails.length ? 1 : 0;
}
function findFixtures(root) {
  const cands = [process.env.EB_FIXTURES, join(root, 'tools/test_fixtures/saves'), '/tmp/claude-0/-home-claude-emberblood/a874aad5-2855-573e-a8ed-e72c7a38d4bc/scratchpad/fixtures'];
  return cands.find((c) => c && existsSync(c)) || null;
}

if (import.meta.url === pathToFileURL(process.argv[1] || '').href) {
  main(process.argv.slice(2)).then((code) => process.exit(code), (e) => { console.error(e); process.exit(2); });
}
