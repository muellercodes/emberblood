#!/usr/bin/env node
// tools/extract.mjs: pulls every scene and line out of the old story modules into draft data, one file per stage,
// with file:line on every line, so converting a chapter to game/story data starts from the existing writing.
//
//   node tools/extract.mjs <outDir> [--src game/src] [--only x1_story,x1_people]
//
// Writes, for each act: <outDir>/act2/<stage>.js (the stage's card, so far, objectives, hints, Mom's lines, its talk
// lines and every scene that belongs to it), <outDir>/act2/<module>_other.js (scenes and lines that belong to no
// stage: dungeon lines, people, side quests, barks, grouped by where they sit in the old file), and
// <outDir>/index.json (every line as { file, line, act, group, key, who, full, simple }).
// Drafts are data-shaped JS (draft({...})); they are never loaded by the game. A `code:` beat is old logic that
// a writer turns into effects (set, give, trust ...).
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { join, resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { tokenize, parseValue, matchClose } from './jstok.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(HERE, '..');
const args = process.argv.slice(2);
const outDir = args.find((a) => !a.startsWith('--') && !isOptVal(a));
function isOptVal(a) { const i = args.indexOf(a); return i > 0 && (args[i - 1] === '--src' || args[i - 1] === '--only'); }
const opt = (k, d) => { const i = args.indexOf(k); return i >= 0 ? args[i + 1] : d; };
if (!outDir) { console.error('usage: node tools/extract.mjs <outDir> [--src game/src] [--only x1_story,x1_people]'); process.exit(2); }
const SRC = resolve(opt('--src', join(ROOT, 'game/src')));
const MODULES = [
  ['x1_story', 2], ['x1_people', 2], ['x2_story', 3], ['x2_people', 3], ['x3_story', 4], ['x3_people', 4], ['x4_story', 5],
].filter(([m]) => !opt('--only') || opt('--only').split(',').includes(m));

// ---------- the old line helpers (game/src): what each argument means
const LINE3 = new Set(['xl', 'vl', 'x1pL', 'f2pL', 'm3pL']);           // (who, full, simple)
const LINE_IF = new Set(['c1If', 'f2sIf', 'm3sIf', 'vls', 'n4fL']);     // (who, full, simple, cond)
const NARR = new Set(['x1pN', 'f2pN', 'm3pN', 'm3sAct']);              // (full, simple[, fn])
const PIP = new Set(['c1Pip', 'f2sPip', 'm3sPip', 'n4sPip']);           // (full, simple)
const OBJ = new Set(['c1sObj', 'f2sObj', 'm3sObj', 'n4sObj', 'c1DunObj']); // objective text (full, simple, ...)
const DO = new Set(['xdo', 'n4sDo']);
const DEFS = new Set(['c1Def', 'f2sDef', 'm3sDef', 'n4sDef']);
const TEXT_FNS = new Set([...LINE3, ...LINE_IF, ...NARR, ...PIP, ...OBJ, 'S', 'xo', 'xc', 'v', 'n4sBubDef', 'n4sIfL']);

const str = (x) => typeof x === 'string';
const code = (x) => (x && x.$code) ? x.$code : x && x.$call ? `${x.$call}(${x.args.map(code).join(', ')})` : x && x.$fn ? `()=>${code(x.$fn)}` : Array.isArray(x) ? `[${x.map(code).join(', ')}]` : JSON.stringify(x);
const short = (s, n = 240) => (s.length > n ? s.slice(0, n) + ' ...' : s);

// a parsed S(full, simple) or a plain string -> [full, simple]
function pair(x) {
  if (str(x)) return [x];
  if (x && x.$call === 'S') return x.args.filter(str).length ? [x.args[0], x.args[1]].filter((q) => q != null) : null;
  return null;
}

// normalize one parsed old beat into draft data. Returns a value; lines are arrays [who, full, simple, extra?]
function norm(x, file) {
  const at = (n) => ({ _at: `${file}:${n}` });
  if (x == null) return x;
  if (str(x) || typeof x === 'number' || typeof x === 'boolean') return x;
  if (Array.isArray(x)) {
    // [who, S(full, simple)] or [who, 'text']
    if (x.length >= 2 && str(x[0]) && (pair(x[1]) || (x[1] && x[1].$code))) {
      const p = pair(x[1]);
      const line = p ? [x[0], ...p] : [x[0], { code: short(x[1].$code) }];
      return Object.assign(line, at(x.$at || (x[1] && x[1].$at) || 0));
    }
    return x.map((q) => norm(q, file));
  }
  if (x.$fn) return norm(x.$fn, file);
  if (x.$code) return Object.assign({ code: short(x.$code) }, at(x.$at));
  if (x.$call) {
    const a = x.args, f = x.$call;
    const mk = (who, i, extra) => {
      const line = [who, a[i], a[i + 1]].filter((q, k) => !(k === 2 && q == null));
      for (const k of [1, 2]) if (line[k] && !str(line[k])) line[k] = { code: short(code(line[k])) };
      if (extra) line.push(extra);
      return Object.assign(line, at(x.$at));
    };
    if (LINE3.has(f)) return mk(str(a[0]) ? a[0] : code(a[0]), 1);
    if (LINE_IF.has(f)) return mk(str(a[0]) ? a[0] : code(a[0]), 1, a[3] ? { if_code: short(code(a[3])) } : undefined);
    if (NARR.has(f)) return mk('narr', 0, a[2] ? { code: short(code(a[2])) } : undefined);
    if (PIP.has(f)) return mk('pip', 0);
    if (f === 'v') return mk(str(a[0]) ? a[0] : code(a[0]), 2);
    if (f === 'n4sBubDef') return Object.assign([a[1], a[2], a[3], { bubble: a[0] }], at(x.$at));
    if (f === 'S') return Object.assign([null, a[0], a[1]].filter((q, k) => !(k === 2 && q == null)), at(x.$at));
    if (OBJ.has(f)) return Object.assign({ obj: [a[0], a[1]].filter((q) => q != null) }, at(x.$at));
    if (DO.has(f)) return Object.assign({ code: short(code(a[0])) }, at(x.$at));
    if (f === 'xo') {
      const o = a[2] || {};
      const p = { t: [a[0], a[1]].filter((q) => q != null) };
      if (o.tone) p.tone = o.tone;
      if (o.then) p.say = norm(o.then, file);
      if (o.fn) p.code = short(code(o.fn));
      for (const k of Object.keys(o)) if (!['tone', 'then', 'fn'].includes(k)) p[k] = str(o[k]) ? o[k] : short(code(o[k]));
      return Object.assign(p, at(x.$at));
    }
    if (f === 'xc') {
      return Object.assign({ choose: '?', who: a[0], ask: [a[1], a[2]].filter((q) => q != null), pick: (Array.isArray(a[3]) ? a[3] : []).map((q) => norm(q, file)) }, at(x.$at));
    }
    if (f === 'n4sIfL') return Object.assign({ if_code: short(code(a[0])), then: a.slice(1).map((q) => norm(q, file)) }, at(x.$at));
    return Object.assign({ code: short(`${f}(${a.map(code).join(', ')})`) }, at(x.$at));
  }
  // object beat: {who, text:S(...), fn, skipIf, ...}
  if (typeof x === 'object') {
    if ('who' in x && 'text' in x) {
      const p = pair(x.text);
      const line = [str(x.who) ? x.who : code(x.who), ...(p || [{ code: short(code(x.text)) }])];
      const extra = {};
      if (x.fn) extra.code = short(code(x.fn));
      if (x.skipIf) extra.skip_code = short(code(x.skipIf));
      for (const k of Object.keys(x)) if (!['who', 'text', 'fn', 'skipIf'].includes(k)) extra[k] = str(x[k]) ? x[k] : short(code(x[k]));
      if (Object.keys(extra).length) line.push(extra);
      return Object.assign(line, at(x.$at || (x.text && x.text.$at) || 0));
    }
    const o = {};
    for (const k of Object.keys(x)) o[k] = norm(x[k], file);
    if (x.$extra) o.code = x.$extra.map((s) => short(s)).join(' ; ');
    return o;
  }
  return x;
}

// every text-making call inside toks[a..b) not inside an earlier one: [{ v (normalized), s, e }]
function textCalls(toks, src, a, b, file) {
  const out = [];
  for (let i = a; i < b; i++) {
    const t = toks[i];
    if (t.t !== 'id' || !TEXT_FNS.has(t.v) || !toks[i + 1] || toks[i + 1].v !== '(') continue;
    if (toks[i - 1] && toks[i - 1].v === '.') continue;
    // a definition `const xl=(...)` or `function xl(` is not a call
    if (toks[i - 1] && (toks[i - 1].v === 'function' || toks[i - 1].v === 'const')) continue;
    const close = matchClose(toks, i + 1);
    let [pv] = parseValue(toks, i, src, { at: true });
    if (pv && pv.$code) { // the call is part of a bigger expression: parse the call alone
      const sub = toks.slice(i, close + 1).concat([{ t: 'punc', v: ',', s: toks[close].e, e: toks[close].e, line: toks[close].line }]);
      [pv] = parseValue(sub, 0, src, { at: true });
    }
    // [who, S(...)] right before: take the speaker
    let v = norm(pv, file);
    if (t.v === 'S' && toks[i - 1] && toks[i - 1].v === ',' && toks[i - 2] && toks[i - 2].t === 'str' && toks[i - 3] && toks[i - 3].v === '[') {
      if (Array.isArray(v)) v[0] = toks[i - 2].v;
    }
    if (t.v === 'S' && toks[i - 1] && toks[i - 1].v === ':' && toks[i - 2] && toks[i - 2].v === 'text') {
      // {who:'x', text:S(...)}: find who in the same object, a few tokens back
      for (let k = i - 3; k > Math.max(0, i - 12); k--) if (toks[k].v === 'who' && toks[k + 1].v === ':' && toks[k + 2].t === 'str') { if (Array.isArray(v)) v[0] = toks[k + 2].v; break; }
    }
    out.push({ v, s: i, e: close, line: t.line });
    i = close;
  }
  return out;
}

// the keys of the object literal opened at toks[o] ('{'): [{ key, s, e }] (token ranges of each member)
function memberRanges(toks, o) {
  const close = matchClose(toks, o), res = [];
  let i = o + 1;
  while (i < close) {
    const t = toks[i];
    let d = 0, j = i;
    for (; j < close; j++) {
      const q = toks[j];
      if (q.t === 'punc' && '([{'.includes(q.v)) d++;
      else if (q.t === 'punc' && ')]}'.includes(q.v)) d--;
      else if (d === 0 && q.t === 'punc' && q.v === ',') break;
    }
    let key = t.t === 'id' || t.t === 'str' ? String(t.v) : null;
    if (key === 'get' || key === 'set' || key === 'async') key = toks[i + 1] && toks[i + 1].t === 'id' ? toks[i + 1].v : key;
    if (key) res.push({ key, s: i, e: j });
    i = j + 1;
  }
  return res;
}

function lineOf(toks, i) { return toks[Math.min(i, toks.length - 1)].line; }

// ---------- one module
function extractModule(mod, act) {
  const file = `${mod}.js`;
  const path = join(SRC, file);
  if (!existsSync(path)) return null;
  const src = readFileSync(path, 'utf8');
  const toks = tokenize(src);
  const covered = [];   // token ranges already turned into scenes or stages
  const scenes = [];    // { key, line, beats, sIdx }
  const stages = [];    // { id, line, card, chapter, so_far, obj, hint, mom, idle, talk, other, refs:Set }
  // section comments: top-level `// ...` lines, for grouping and for the dungeon -> stage guess
  const lines = src.split('\n');
  const sectionAt = (line) => { for (let l = line - 1; l >= 1; l--) { const s = lines[l - 1]; if (/^\/\/ /.test(s) && !/^\/\/ -{3,}/.test(s)) return s.slice(3).trim(); if (/^\/\/ -{3,}/.test(s)) return s.replace(/^\/\/ -+\s*/, '').trim(); } return ''; };
  const majorAt = (line) => { for (let l = line - 1; l >= 1; l--) { const s = lines[l - 1]; if (/^\/\/ -{3,}/.test(s)) return s.replace(/^\/\/ -+\s*/, '').trim(); } return ''; };

  for (let i = 0; i < toks.length; i++) {
    const t = toks[i];
    // c1Def('key', [...]) and friends
    if (t.t === 'id' && DEFS.has(t.v) && toks[i + 1] && toks[i + 1].v === '(' && toks[i + 2] && toks[i + 2].t === 'str' && toks[i - 1] && toks[i - 1].v !== 'function') {
      const close = matchClose(toks, i + 1);
      const sub = toks.slice(i, close + 1).concat([{ t: 'punc', v: ';', s: toks[close].e, e: toks[close].e, line: toks[close].line }]);
      const [pv] = parseValue(sub, 0, src, { at: true });
      let beats = pv && pv.args ? norm(pv.args[1], file) : [];
      if (!Array.isArray(beats)) beats = [beats];
      if (!beats.length || (beats.length === 1 && beats[0] && beats[0].code)) beats = textCalls(toks, src, i + 4, close, file).map((q) => q.v);
      scenes.push({ key: toks[i + 2].v, line: t.line, beats, sIdx: i });
      covered.push([i, close]);
      i = close; continue;
    }
    // STORY.key = ... / STORY['key'] = ...
    if (t.t === 'id' && t.v === 'STORY' && (!toks[i - 1] || toks[i - 1].v !== '.')) {
      let key = null, k = i + 1;
      if (toks[k] && toks[k].v === '.' && toks[k + 1] && toks[k + 1].t === 'id') { key = toks[k + 1].v; k += 2; }
      else if (toks[k] && toks[k].v === '[' && toks[k + 1] && toks[k + 1].t === 'str' && toks[k + 2] && toks[k + 2].v === ']') { key = toks[k + 1].v; k += 3; }
      if (key && toks[k] && toks[k].v === '=' && key !== 'c_hints') {
        const [pv, j] = parseValue(toks, k + 1, src, { at: true });
        let beats = norm(pv, file);
        if (!Array.isArray(beats) || (beats.length === 1 && beats[0] && beats[0].code)) beats = textCalls(toks, src, k + 1, j, file).map((q) => q.v);
        scenes.push({ key, line: t.line, beats, sIdx: i });
        covered.push([i, j]);
        i = j; continue;
      }
      if (key === 'c_hints' || (key && /hints$/.test(key))) {
        // STORY.c_hints = { stage: S(...) }
        if (toks[k] && toks[k].v === '=' && toks[k + 1] && toks[k + 1].v === '{') {
          for (const m of memberRanges(toks, k + 1)) {
            const tc = textCalls(toks, src, m.s, m.e, file);
            scenes.push({ key: `${key}.${m.key}`, line: lineOf(toks, m.s), beats: tc.map((q) => q.v), sIdx: m.s, hintFor: m.key });
          }
          const close = matchClose(toks, k + 1);
          covered.push([i, close]); i = close; continue;
        }
      }
    }
    // defineStages(n, [ {...}, ... ])
    if (t.t === 'id' && t.v === 'defineStages' && toks[i + 1] && toks[i + 1].v === '(' && toks[i + 2] && toks[i + 2].t === 'num' && toks[i + 4] && toks[i + 4].v === '[') {
      const arrClose = matchClose(toks, i + 4);
      let k = i + 5;
      while (k < arrClose) {
        if (toks[k].v === '{') {
          const oc = matchClose(toks, k);
          const st = { id: null, line: toks[k].line, card: null, chapter: null, so_far: [], obj: [], hint: [], mom: [], idle: [], talk: [], other: [], refs: new Set(), s: k, e: oc };
          for (const m of memberRanges(toks, k)) {
            if (m.key === 'id' && toks[m.s + 2] && toks[m.s + 2].t === 'str') st.id = toks[m.s + 2].v;
            for (let q = m.s; q < m.e; q++) if (toks[q].t === 'str') st.refs.add(toks[q].v);
            const tc = textCalls(toks, src, m.s, m.e, file).map((q) => q.v);
            if (m.key === 'card') { const [cv] = parseValue(toks, m.s + 2, src); if (Array.isArray(cv)) st.card = cv.map((q) => (pair(q) || [code(q)])[0]); }
            else if (m.key === 'chapter') st.chapter = tc[0] ? tc[0][1] : null;
            else if (m.key === 'soFar') st.so_far.push(...tc);
            else if (m.key === 'objectives') st.obj.push(...tc);
            else if (m.key === 'hint') st.hint.push(...tc);
            else if (m.key === 'mom') st.mom.push(...tc);
            else if (m.key === 'idle') st.idle.push(...tc);
            else if (m.key === 'talk') st.talk.push(...tc);
            else st.other.push(...tc.map((q) => Object.assign(Array.isArray(q) ? q : q, { _from: m.key })));
          }
          if (st.id) stages.push(st);
          k = oc + 1; continue;
        }
        k++;
      }
      covered.push([i, arrClose]);
      i = arrClose; continue;
    }
  }
  const isCovered = (i) => covered.some(([a, b]) => i >= a && i <= b);
  // everything else: text calls grouped by context (the nearest preceding opener)
  const openers = [];
  for (let i = 0; i < toks.length; i++) {
    const t = toks[i];
    if (t.t === 'id' && t.v === 'id' && toks[i + 1] && toks[i + 1].v === ':' && toks[i + 2] && toks[i + 2].t === 'str' && toks[i - 1] && (toks[i - 1].v === '{')) openers.push({ i, ctx: toks[i + 2].v });
    else if ((t.t === 'id' || t.t === 'str') && toks[i + 1] && toks[i + 1].v === ':' && toks[i + 2] && toks[i + 2].v === '{' && toks[i + 3] && ['title', 'giver', 'name', 'lines', 'steps', 'min'].includes(toks[i + 3].v) && /^[a-z][a-z0-9_]*$/.test(t.v)) openers.push({ i, ctx: String(t.v) });
    else if (t.t === 'id' && t.v === 'function' && toks[i + 1] && toks[i + 1].t === 'id') openers.push({ i, ctx: toks[i + 1].v + '()' });
    else if (t.t === 'id' && (t.v === 'const' || t.v === 'let') && toks[i + 1] && toks[i + 1].t === 'id' && /^[A-Z0-9_]{3,}$/.test(toks[i + 1].v)) openers.push({ i, ctx: toks[i + 1].v });
    else if (t.t === 'id' && /^[A-Z]$/.test(t.v) && toks[i + 1] && toks[i + 1].v === '(' && toks[i + 2] && toks[i + 2].t === 'str' && /^[a-z]/.test(toks[i + 2].v) && t.v !== 'S') openers.push({ i, ctx: toks[i + 2].v });
  }
  let oi = 0, ctx = '(top)';
  const loose = [];
  const tcAll = textCalls(toks, src, 0, toks.length, file);
  for (const q of tcAll) {
    if (isCovered(q.s)) continue;
    while (oi < openers.length && openers[oi].i <= q.s) { ctx = openers[oi].ctx; oi++; }
    loose.push({ ctx, section: majorAt(q.line), v: q.v, line: q.line });
  }

  // ---------- which stage does each scene belong to
  const stageIds = stages.map((s) => s.id);
  const sceneKeys = new Set(scenes.map((s) => s.key));
  const byKey = {};
  for (const st of stages) for (const r of st.refs) if (sceneKeys.has(r) && !byKey[r]) byKey[r] = st.id;
  // also: a stage's id named in the scene's section comment, or a dungeon id that a stage block names
  const dunStage = {};
  for (const st of stages) for (const r of st.refs) if (/^[a-z][a-z0-9]*_[a-z0-9_]+$/.test(r) && !stageIds.includes(r) && !sceneKeys.has(r) && !dunStage[r]) dunStage[r] = st.id;
  for (const sc of scenes) {
    if (sc.hintFor) { sc.stage = stageIds.includes(sc.hintFor) ? sc.hintFor : null; continue; }
    if (byKey[sc.key]) { sc.stage = byKey[sc.key]; continue; }
    const sec = sectionAt(sc.line);
    const ids = sec.match(/\b[a-z][a-z0-9]*_[a-z0-9_]+\b/g) || [];
    let st = ids.find((x) => stageIds.includes(x)) || ids.map((x) => dunStage[x]).find(Boolean);
    sc.section = sec;
    sc.stage = st || null;
  }
  // scenes still unplaced: same section as a placed scene -> that stage
  const secStage = {};
  for (const sc of scenes) if (sc.stage && !sc.hintFor) { const sec = sectionAt(sc.line); secStage[sec] = secStage[sec] || {}; secStage[sec][sc.stage] = (secStage[sec][sc.stage] || 0) + 1; }
  for (const sc of scenes) if (!sc.stage && !sc.hintFor) {
    const m = secStage[sectionAt(sc.line)];
    if (m) sc.stage = Object.entries(m).sort((a, b) => b[1] - a[1])[0][0];
  }
  return { mod, file, act, stages, scenes, loose, sectionAt };
}

// ---------- writing data-shaped JS with a file:line comment on each line
function q(s) { return JSON.stringify(s); }
function fmtLine(v) {
  // a line array, printed on one line
  const parts = v.map((x) => (x && typeof x === 'object' && !Array.isArray(x)) ? fmtInline(x) : q(x));
  return `[${parts.join(', ')}]`;
}
function fmtInline(o) {
  return '{ ' + Object.entries(o).filter(([k]) => k !== '_at' && k !== '_from').map(([k, x]) => `${/^[A-Za-z_$][\w$]*$/.test(k) ? k : q(k)}: ${Array.isArray(x) ? fmtLine(x) : (x && typeof x === 'object') ? fmtInline(x) : q(x)}`).join(', ') + ' }';
}
const isLine = (v) => Array.isArray(v) && v.length >= 2 && (v[0] === null || typeof v[0] === 'string') && (typeof v[1] === 'string' || (v[1] && v[1].code));
function fmt(v, ind) {
  const pad = '  '.repeat(ind);
  const cm = (x) => (x && x._at ? `  // ${x._at}` : '');
  if (isLine(v)) return fmtLine(v);
  if (Array.isArray(v)) {
    if (!v.length) return '[]';
    return '[\n' + v.map((x) => `${pad}  ${fmt(x, ind + 1)},${cm(x)}`).join('\n') + `\n${pad}]`;
  }
  if (v && typeof v === 'object') {
    const ents = Object.entries(v).filter(([k, x]) => k !== '_at' && k !== '_from' && x !== undefined);
    if (!ents.length) return '{}';
    const flat = ents.every(([, x]) => x == null || typeof x !== 'object' || (isLine(x) && JSON.stringify(x).length < 120));
    if (flat && JSON.stringify(v).length < 150) return fmtInline(v);
    return '{\n' + ents.map(([k, x]) => `${pad}  ${/^[A-Za-z_$][\w$]*$/.test(k) ? k : q(k)}: ${fmt(x, ind + 1)},${cm(x)}`).join('\n') + `\n${pad}}`;
  }
  return q(v);
}

function writeIfChanged(p, s) { mkdirSync(dirname(p), { recursive: true }); writeFileSync(p, s); }

// ---------- run
const index = [];
const summary = [];
const ACTN = { 2: 'Act II', 3: 'Act III', 4: 'Act IV', 5: 'the Finale' };
for (const [mod, act] of MODULES) {
  const r = extractModule(mod, act);
  if (!r) { summary.push(`${mod}: missing`); continue; }
  const dir = join(resolve(outDir), `act${act}`);
  const head = (what) => `// ${ACTN[act]}, ${what}: text extracted from the old code by tools/extract.mjs for converting it to\n// game/story data. Every line ends with its source file:line. Not loaded by the game. A \`code:\` beat or field is\n// old logic (flags, items, trust, camera) for the writer to turn into effects. Lines are [who, full, simple].\n`;
  const addIdx = (group, key, v) => {
    const walk = (x) => {
      if (isLine(x)) { index.push({ file: (x._at || '').split(':')[0] || r.file, line: +((x._at || '').split(':')[1] || 0), act, group, key, who: x[0], full: typeof x[1] === 'string' ? x[1] : null, simple: typeof x[2] === 'string' ? x[2] : null }); return; }
      if (Array.isArray(x)) x.forEach(walk);
      else if (x && typeof x === 'object') {
        if (x.ask) index.push({ file: r.file, line: +((x._at || '').split(':')[1] || 0), act, group, key, who: x.who || null, full: x.ask[0], simple: x.ask[1] || null, kind: 'ask' });
        if (x.t && Array.isArray(x.t)) index.push({ file: r.file, line: +((x._at || '').split(':')[1] || 0), act, group, key, who: 'ash', full: x.t[0], simple: x.t[1] || null, kind: 'pick' });
        if (x.obj) index.push({ file: r.file, line: +((x._at || '').split(':')[1] || 0), act, group, key, who: null, full: x.obj[0], simple: x.obj[1] || null, kind: 'obj' });
        Object.values(x).forEach(walk);
      }
    };
    walk(v);
  };
  let nStageFiles = 0;
  if (r.stages.length) {
    for (const st of r.stages) {
      const scenes = r.scenes.filter((s) => s.stage === st.id && !s.hintFor);
      const hints = r.scenes.filter((s) => s.hintFor === st.id);
      const d = { stage: st.id, act, src: `${r.file}:${st.line}` };
      if (st.card) d.card = st.card;
      if (st.chapter) d.chapter = st.chapter;
      const one = (L) => L.map((x) => (isLine(x) ? Object.assign(x.slice(1), { _at: x._at }) : x));
      if (st.so_far.length) d.so_far = one(st.so_far);
      if (st.obj.length) d.obj = st.obj.map((x) => (x && x.obj ? Object.assign(x.obj, { _at: x._at }) : isLine(x) ? Object.assign(x.slice(1), { _at: x._at }) : x));
      if (hints.length) d.hint = hints.flatMap((h) => one(h.beats));
      if (st.hint.length) d.hint = (d.hint || []).concat(one(st.hint));
      if (st.mom.length) d.mom = one(st.mom);
      if (st.idle.length) d.idle = one(st.idle);
      if (st.talk.length) d.talk_lines = st.talk;
      if (st.other.length) d.other_lines = st.other;
      d.scene = {};
      for (const sc of scenes) { d.scene[sc.key] = sc.beats; Object.defineProperty(d.scene, '$at_' + sc.key, { value: sc.line, enumerable: false }); }
      let body = fmt(d, 0);
      // put the scene's own file:line after its key
      for (const sc of scenes) body = body.replace(new RegExp(`\\n    ${sc.key}: \\[\\n`), `\n    ${sc.key}: [  // ${r.file}:${sc.line}\n`);
      writeIfChanged(join(dir, `${st.id}.js`), head(`stage ${st.id}`) + `draft(${body})\n`);
      addIdx(st.id, null, d.scene); addIdx(st.id, 'obj', st.obj); addIdx(st.id, 'so_far', st.so_far);
      nStageFiles++;
    }
  }
  // scenes with no stage, and the loose lines
  const rest = r.scenes.filter((s) => !s.stage && !s.hintFor);
  const groups = {};
  for (const sc of rest) { const g = sc.section || r.sectionAt(sc.line) || '(top)'; (groups[g] = groups[g] || { scene: {}, lines: {} }).scene[sc.key] = { beats: sc.beats, line: sc.line }; }
  for (const L of r.loose) { const g = L.section || '(top)'; const G = (groups[g] = groups[g] || { scene: {}, lines: {} }); (G.lines[L.ctx] = G.lines[L.ctx] || []).push(L.v); }
  let other = head(`${r.file}, everything not in a stage file`);
  let nLoose = 0;
  for (const [g, G] of Object.entries(groups)) {
    const d = {};
    if (Object.keys(G.scene).length) { d.scene = {}; for (const [k, s] of Object.entries(G.scene)) d.scene[k] = s.beats; }
    if (Object.keys(G.lines).length) d.lines = G.lines;
    let body = fmt(d, 0);
    for (const [k, s] of Object.entries(G.scene)) body = body.replace(new RegExp(`\\n    ${k}: \\[\\n`), `\n    ${k}: [  // ${r.file}:${s.line}\n`);
    other += `\n// ---------- ${g}\ndraft(${body})\n`;
    for (const [k, s] of Object.entries(G.scene)) addIdx(g, k, s.beats);
    for (const [k, L] of Object.entries(G.lines)) { addIdx(g, k, L); nLoose += L.length; }
  }
  writeIfChanged(join(dir, `${r.mod}_other.js`), other);
  summary.push(`${r.file}: ${r.stages.length} stages, ${r.scenes.length} scenes (${rest.length} with no stage), ${nLoose} loose texts`);
}
// no em dash may leave this tool (old text has none, but be sure)
const idxJson = JSON.stringify(index, null, 0).replace(new RegExp(String.fromCharCode(0x2014), 'g'), ', ');
writeIfChanged(join(resolve(outDir), 'index.json'), idxJson.replace(/\},\{/g, '},\n{'));
console.log(summary.join('\n'));
console.log(`extract: ${index.length} lines indexed into ${resolve(outDir)}`);
