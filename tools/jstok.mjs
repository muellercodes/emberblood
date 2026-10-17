// A small JavaScript tokenizer and literal parser shared by the CHK tools (check.mjs, extract.mjs).
// No npm packages. It knows enough JS to find string literals (with their line numbers), calls, and to turn
// literal expressions (strings, numbers, arrays, objects, calls to known helpers) into values. Anything else is
// kept as { code: '...' } so nothing is lost.

const PUNCT3 = ['===', '!==', '...', '**=', '<<=', '>>=', '>>>', '&&=', '||=', '??='];
const PUNCT2 = ['=>', '==', '!=', '<=', '>=', '&&', '||', '??', '?.', '++', '--', '+=', '-=', '*=', '/=', '%=', '&=', '|=', '^=', '**', '<<', '>>'];
const KW_BEFORE_REGEX = new Set(['return', 'typeof', 'case', 'in', 'of', 'new', 'delete', 'void', 'throw', 'else', 'do', 'yield', 'await', 'instanceof']);

function decodeEscapes(raw) {
  return raw.replace(/\\(u\{[0-9a-fA-F]+\}|u[0-9a-fA-F]{4}|x[0-9a-fA-F]{2}|\r\n|[\s\S])/g, (m, e) => {
    if (e[0] === 'u') return String.fromCodePoint(parseInt(e[1] === '{' ? e.slice(2, -1) : e.slice(1), 16));
    if (e[0] === 'x') return String.fromCharCode(parseInt(e.slice(1), 16));
    switch (e) {
      case 'n': return '\n'; case 't': return '\t'; case 'r': return '\r'; case 'b': return '\b'; case 'f': return '\f';
      case 'v': return '\v'; case '0': return '\0'; case '\n': case '\r\n': return '';
      default: return e;
    }
  });
}

// tokens: { t: 'str'|'tpl'|'num'|'id'|'punc'|'regex', v, s, e, line }
// str.v is the decoded value; tpl.v is the decoded text when it has no ${...}, else the raw text (tpl.expr = true)
export function tokenize(src) {
  const out = [];
  let i = 0, line = 1;
  const n = src.length;
  const prevSig = () => out.length ? out[out.length - 1] : null;
  const regexOK = () => {
    const p = prevSig();
    if (!p) return true;
    if (p.t === 'num' || p.t === 'str' || p.t === 'tpl' || p.t === 'regex') return false;
    if (p.t === 'id') return KW_BEFORE_REGEX.has(p.v);
    if (p.t === 'punc') return !(p.v === ')' || p.v === ']' || p.v === '}' || p.v === '++' || p.v === '--');
    return true;
  };
  // skip a template literal starting at j (src[j] === '`'); returns end index (after closing backtick)
  function skipTemplate(j) {
    j++;
    while (j < n) {
      const c = src[j];
      if (c === '\\') { j += 2; continue; }
      if (c === '`') return j + 1;
      if (c === '$' && src[j + 1] === '{') { j = skipBraces(j + 1); continue; }
      j++;
    }
    return j;
  }
  // skip a balanced { ... } starting at j (src[j] === '{'), respecting strings, templates and comments
  function skipBraces(j) {
    let depth = 0;
    while (j < n) {
      const c = src[j];
      if (c === '{') { depth++; j++; continue; }
      if (c === '}') { depth--; j++; if (depth === 0) return j; continue; }
      if (c === '"' || c === "'") { j = skipQuoted(j, c); continue; }
      if (c === '`') { j = skipTemplate(j); continue; }
      if (c === '/' && src[j + 1] === '/') { while (j < n && src[j] !== '\n') j++; continue; }
      if (c === '/' && src[j + 1] === '*') { const k = src.indexOf('*/', j + 2); j = k < 0 ? n : k + 2; continue; }
      j++;
    }
    return j;
  }
  function skipQuoted(j, q) {
    j++;
    while (j < n) {
      const c = src[j];
      if (c === '\\') { j += 2; continue; }
      if (c === q || c === '\n') return j + 1;
      j++;
    }
    return j;
  }
  const countLines = (a, b) => { let k = 0; for (let x = a; x < b; x++) if (src.charCodeAt(x) === 10) k++; return k; };
  while (i < n) {
    const c = src[i];
    if (c === '\n') { line++; i++; continue; }
    if (c === ' ' || c === '\t' || c === '\r' || c === '\f' || c === '\v' || c === '\u00a0' || c === '\ufeff') { i++; continue; }
    if (c === '/' && src[i + 1] === '/') { while (i < n && src[i] !== '\n') i++; continue; }
    if (c === '/' && src[i + 1] === '*') { const k = src.indexOf('*/', i + 2); const e = k < 0 ? n : k + 2; line += countLines(i, e); i = e; continue; }
    const s = i, l0 = line;
    if (c === '"' || c === "'") {
      const e = skipQuoted(i, c);
      out.push({ t: 'str', v: decodeEscapes(src.slice(s + 1, e - 1)), s, e, line: l0, q: c });
      line += countLines(s, e); i = e; continue;
    }
    if (c === '`') {
      const e = skipTemplate(i);
      const raw = src.slice(s + 1, e - 1);
      const expr = /\$\{/.test(raw.replace(/\\\$/g, ''));
      out.push({ t: 'tpl', v: expr ? raw : decodeEscapes(raw), s, e, line: l0, expr, q: '`' });
      line += countLines(s, e); i = e; continue;
    }
    if (/[0-9]/.test(c) || (c === '.' && /[0-9]/.test(src[i + 1] || ''))) {
      const m = /^(0[xX][0-9a-fA-F_]+|0[bB][01_]+|0[oO][0-7_]+|(\d[\d_]*)?\.?\d*([eE][+-]?\d+)?)n?/.exec(src.slice(i, i + 64));
      const e = i + Math.max(1, m[0].length);
      out.push({ t: 'num', v: Number(src.slice(s, e).replace(/_/g, '').replace(/n$/, '')), s, e, line: l0 });
      i = e; continue;
    }
    if (/[A-Za-z_$\u0080-\uffff]/.test(c)) {
      let e = i + 1;
      while (e < n && /[A-Za-z0-9_$\u0080-\uffff]/.test(src[e])) e++;
      out.push({ t: 'id', v: src.slice(s, e), s, e, line: l0 });
      i = e; continue;
    }
    if (c === '/' && regexOK()) {
      let e = i + 1, cls = false;
      while (e < n) {
        const d = src[e];
        if (d === '\\') { e += 2; continue; }
        if (d === '\n') break;
        if (cls) { if (d === ']') cls = false; } else if (d === '[') cls = true; else if (d === '/') { e++; break; }
        e++;
      }
      while (e < n && /[a-z]/.test(src[e])) e++;
      out.push({ t: 'regex', v: src.slice(s, e), s, e, line: l0 });
      i = e; continue;
    }
    let p = c;
    for (const q of PUNCT3) if (src.startsWith(q, i)) { p = q; break; }
    if (p === c) for (const q of PUNCT2) if (src.startsWith(q, i)) { p = q; break; }
    // ?. followed by a digit is a ternary, not optional chaining
    if (p === '?.' && /[0-9]/.test(src[i + 2] || '')) p = '?';
    out.push({ t: 'punc', v: p, s, e: i + p.length, line: l0 });
    i += p.length;
  }
  return out;
}

const OPEN = { '(': ')', '[': ']', '{': '}' };
const CLOSERS = new Set([')', ']', '}']);

// index of the matching closer for the opener at tokens[i]
export function matchClose(toks, i) {
  let d = 0;
  for (let k = i; k < toks.length; k++) {
    const t = toks[k];
    if (t.t !== 'punc') continue;
    if (OPEN[t.v]) d++;
    else if (CLOSERS.has(t.v)) { d--; if (d === 0) return k; }
  }
  return toks.length - 1;
}

// end of the expression starting at i: the index of the first ',' ';' or unmatched closer at depth 0
export function exprEnd(toks, i) {
  let d = 0;
  for (let k = i; k < toks.length; k++) {
    const t = toks[k];
    if (t.t !== 'punc') continue;
    if (OPEN[t.v]) d++;
    else if (CLOSERS.has(t.v)) { if (d === 0) return k; d--; }
    else if (d === 0 && (t.v === ',' || t.v === ';')) return k;
  }
  return toks.length;
}

const TERM = new Set([',', ')', ']', '}', ';']);
const isTerm = (t) => !t || (t.t === 'punc' && TERM.has(t.v));

// Parse a literal-ish expression at toks[i]. Returns [value, nextIndex].
// value: string | number | boolean | null | array | object | { $call: name, args:[...], $at } | { $code: src, $at }
// Arrays and objects carry a hidden $at (line) when opts.at is set.
export function parseValue(toks, i, src, opts = {}) {
  const t = toks[i];
  const end = exprEnd(toks, i);
  const code = () => {
    const last = toks[Math.max(i, end - 1)];
    return [{ $code: src.slice(t.s, last ? last.e : t.e), $at: t.line }, end];
  };
  if (!t) return [undefined, i];
  // arrow function whose body is an array or a call: keep the body (scenes built by functions)
  const arrow = arrowBody(toks, i, end);
  if (arrow != null) {
    const b = toks[arrow];
    if (b && b.t === 'punc' && (b.v === '[' || b.v === '(')) {
      const [v, j] = parseValue(toks, b.v === '(' ? arrow + 1 : arrow, src, opts);
      if (j === end || (b.v === '(' && j === end - 1)) return [{ $fn: v, $at: t.line }, end];
    }
    if (b && b.t === 'id' && toks[arrow + 1] && toks[arrow + 1].v === '(') {
      const [v, j] = parseValue(toks, arrow, src, opts);
      if (j === end) return [{ $fn: v, $at: t.line }, end];
    }
    return code();
  }
  let v, j;
  if (t.t === 'str' || (t.t === 'tpl')) { v = t.v; j = i + 1; }
  else if (t.t === 'num') { v = t.v; j = i + 1; }
  else if (t.t === 'punc' && t.v === '-' && toks[i + 1] && toks[i + 1].t === 'num') { v = -toks[i + 1].v; j = i + 2; }
  else if (t.t === 'id' && (t.v === 'true' || t.v === 'false' || t.v === 'null' || t.v === 'undefined')) {
    v = t.v === 'true' ? true : t.v === 'false' ? false : t.v === 'null' ? null : undefined; j = i + 1;
  } else if (t.t === 'punc' && t.v === '[') {
    const close = matchClose(toks, i);
    v = []; if (opts.at) Object.defineProperty(v, '$at', { value: t.line, enumerable: false });
    let k = i + 1;
    while (k < close) {
      if (toks[k].t === 'punc' && toks[k].v === ',') { k++; continue; }
      if (toks[k].t === 'punc' && toks[k].v === '...') { const e2 = exprEnd(toks, k + 1); v.push({ $code: src.slice(toks[k].s, toks[e2 - 1].e), $at: toks[k].line }); k = e2; continue; }
      const [x, k2] = parseValue(toks, k, src, opts);
      v.push(x); k = k2 > k ? k2 : k + 1;
    }
    j = close + 1;
  } else if (t.t === 'punc' && t.v === '{') {
    const close = matchClose(toks, i);
    v = {}; if (opts.at) Object.defineProperty(v, '$at', { value: t.line, enumerable: false });
    let k = i + 1;
    while (k < close) {
      const kt = toks[k];
      if (kt.t === 'punc' && kt.v === ',') { k++; continue; }
      let key = null;
      if ((kt.t === 'id' || kt.t === 'str' || kt.t === 'num') && toks[k + 1] && toks[k + 1].v === ':') key = String(kt.v);
      if (key == null) {
        // shorthand, method, getter, spread: keep as code
        const e2 = exprEnd(toks, k);
        let e3 = e2;
        // a method body `name(){...}` has no top-level comma inside braces; exprEnd stops at the comma after it
        (v.$extra = v.$extra || []).push(src.slice(kt.s, toks[Math.max(k, e3 - 1)].e));
        k = e3 > k ? e3 : k + 1; continue;
      }
      const [x, k2] = parseValue(toks, k + 2, src, opts);
      v[key] = x; k = k2 > k ? k2 : k + 1;
    }
    if (v.$extra) Object.defineProperty(v, '$extra', { value: v.$extra, enumerable: false });
    j = close + 1;
  } else if (t.t === 'id' && toks[i + 1] && toks[i + 1].t === 'punc' && toks[i + 1].v === '(') {
    const close = matchClose(toks, i + 1);
    const args = [];
    let k = i + 2;
    while (k < close) {
      if (toks[k].t === 'punc' && toks[k].v === ',') { k++; continue; }
      if (toks[k].t === 'punc' && toks[k].v === '...') { const e2 = exprEnd(toks, k + 1); args.push({ $code: src.slice(toks[k].s, toks[e2 - 1].e), $at: toks[k].line, $spread: true }); k = e2; continue; }
      const [x, k2] = parseValue(toks, k, src, opts);
      args.push(x); k = k2 > k ? k2 : k + 1;
    }
    v = { $call: t.v, args, $at: t.line };
    j = close + 1;
  } else return code();
  if (!isTerm(toks[j])) return code();
  return [v, j];
}

// if toks[i..end) is an arrow function, the index of its body's first token, else null
function arrowBody(toks, i, end) {
  const t = toks[i];
  if (!t) return null;
  if (t.t === 'id' && t.v === 'async') return arrowBody(toks, i + 1, end);
  if (t.t === 'id' && toks[i + 1] && toks[i + 1].v === '=>') return i + 2;
  if (t.t === 'punc' && t.v === '(') {
    const c = matchClose(toks, i);
    if (toks[c + 1] && toks[c + 1].v === '=>' && c + 1 < end) return c + 2;
  }
  return null;
}

// every string literal (str and tpl) with its line: for text scans
export function stringLiterals(src) {
  return tokenize(src).filter((t) => t.t === 'str' || t.t === 'tpl').map((t) => ({ v: t.v, line: t.line, s: t.s, e: t.e }));
}
