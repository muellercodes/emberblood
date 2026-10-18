// Emberblood API: tiny account + cloud save + leaderboard service.
// Runs on Cloudflare Workers with a D1 (SQLite) database. Nothing here pauses when idle.
const ENC = new TextEncoder();
const NAME_RE = /^[A-Za-z0-9_-]{3,20}$/;
const DAY = 86400000;
const SESSION_MS = 365 * DAY;      // sessions last a year and renew while you keep playing
const RENEW_BELOW = 330 * DAY;
const MAX_SAVE = 256 * 1024;
const ITER = 100000;               // PBKDF2 iterations (the Workers runtime caps this at 100k)

const b64u = (buf) => { const b = new Uint8Array(buf); let s = ''; for (let i = 0; i < b.length; i++) s += String.fromCharCode(b[i]); return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, ''); };
const unb64u = (s) => { s = s.replace(/-/g, '+').replace(/_/g, '/'); while (s.length % 4) s += '='; const bin = atob(s); const u = new Uint8Array(bin.length); for (let i = 0; i < bin.length; i++) u[i] = bin.charCodeAt(i); return u; };
const sha256 = async (s) => b64u(await crypto.subtle.digest('SHA-256', ENC.encode(s)));
const randToken = (n = 32) => b64u(crypto.getRandomValues(new Uint8Array(n)));
function safeEq(a, b) { if (a.length !== b.length) return false; let r = 0; for (let i = 0; i < a.length; i++) r |= a[i] ^ b[i]; return r === 0; }
async function pbkdf2(pass, salt, iter) {
  const key = await crypto.subtle.importKey('raw', ENC.encode(pass), 'PBKDF2', false, ['deriveBits']);
  return new Uint8Array(await crypto.subtle.deriveBits({ name: 'PBKDF2', hash: 'SHA-256', salt, iterations: iter }, key, 256));
}
async function hashPassword(pass) {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  return `pbkdf2$${ITER}$${b64u(salt)}$${b64u(await pbkdf2(pass, salt, ITER))}`;
}
async function checkPassword(pass, stored) {
  const [kind, iter, salt, hash] = String(stored).split('$');
  if (kind !== 'pbkdf2') return false;
  return safeEq(await pbkdf2(pass, unb64u(salt), +iter), unb64u(hash));
}

class HttpError extends Error { constructor(status, msg) { super(msg); this.status = status; } }

function corsHeaders(req, env) {
  const origin = req.headers.get('Origin');
  if (!origin) return {};
  const allowed = String(env.ALLOWED_ORIGINS || '').split(',').map((s) => s.trim()).filter(Boolean);
  const ok = allowed.includes(origin) || /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin);
  if (!ok) return {};
  return { 'Access-Control-Allow-Origin': origin, 'Access-Control-Allow-Methods': 'GET,POST,PUT,OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type,Authorization', 'Access-Control-Max-Age': '86400', Vary: 'Origin' };
}
const json = (data, status, cors) => new Response(JSON.stringify(data), { status: status || 200, headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', ...cors } });

async function body(req) {
  const len = +(req.headers.get('Content-Length') || 0);
  if (len > MAX_SAVE + 4096) throw new HttpError(413, 'That is too big.');
  const text = await req.text();
  if (text.length > MAX_SAVE + 4096) throw new HttpError(413, 'That is too big.');
  try { return JSON.parse(text || '{}'); } catch { throw new HttpError(400, 'Bad request.'); }
}

// simple fixed-window rate limit stored in D1
async function limit(env, key, max, windowMs) {
  const now = Date.now();
  const row = await env.DB.prepare('SELECT n, reset_at FROM limits WHERE k = ?').bind(key).first();
  if (!row || row.reset_at < now) { await env.DB.prepare('INSERT INTO limits (k, n, reset_at) VALUES (?, 1, ?) ON CONFLICT(k) DO UPDATE SET n = 1, reset_at = excluded.reset_at').bind(key, now + windowMs).run(); return; }
  if (row.n >= max) throw new HttpError(429, 'Too many tries. Take a breather and try again in a few minutes.');
  await env.DB.prepare('UPDATE limits SET n = n + 1 WHERE k = ?').bind(key).run();
}

async function newSession(env, userId) {
  const token = randToken(), now = Date.now();
  await env.DB.prepare('INSERT INTO sessions (token_hash, user_id, created_at, expires_at) VALUES (?, ?, ?, ?)').bind(await sha256(token), userId, now, now + SESSION_MS).run();
  return token;
}
async function authUser(req, env) {
  const h = req.headers.get('Authorization') || '';
  const m = h.match(/^Bearer ([A-Za-z0-9_-]{20,100})$/);
  if (!m) throw new HttpError(401, 'Please sign in.');
  const th = await sha256(m[1]), now = Date.now();
  const row = await env.DB.prepare('SELECT s.user_id AS id, s.expires_at AS exp, s.kind AS kind, u.name AS name, u.paused_at AS paused FROM sessions s JOIN users u ON u.id = s.user_id WHERE s.token_hash = ?').bind(th).first();
  if (!row) throw new HttpError(401, 'Please sign in again.');
  if (row.exp < now) { await env.DB.prepare('DELETE FROM sessions WHERE token_hash = ?').bind(th).run(); throw new HttpError(401, 'Your session expired. Please sign in again.'); }
  const view = row.kind === 'view';
  if (row.paused && !view) throw new HttpError(403, PAUSED_MSG);
  // a "view as" session from the admin page never renews and never counts as the player being seen
  if (!view && row.exp - now < RENEW_BELOW) {
    await env.DB.batch([
      env.DB.prepare('UPDATE sessions SET expires_at = ? WHERE token_hash = ?').bind(now + SESSION_MS, th),
      env.DB.prepare('UPDATE users SET last_seen = ? WHERE id = ?').bind(now, row.id),
    ]);
  }
  return { id: row.id, name: row.name, th, view };
}

// ---------- admin: accounts named in ADMIN_USERS (comma separated) can see and fix every account
const VIEW_MS = 12 * 3600000;      // "view as" sessions last 12 hours and are look-only
const PAUSED_MSG = 'This account is paused. Ask a grown-up to turn it back on.';
const isAdminName = (env, name) => String(env.ADMIN_USERS || '').split(',').map((s) => s.trim().toLowerCase()).filter(Boolean).includes(String(name).toLowerCase());
async function authAdmin(req, env) {
  const u = await authUser(req, env);
  if (u.view || !isAdminName(env, u.name)) throw new HttpError(403, 'That account is not an admin.');
  return u;
}
const qid = (req) => { const n = +new URL(req.url).searchParams.get('id'); if (!Number.isInteger(n) || n < 1) throw new HttpError(400, 'Which account?'); return n; };
async function userById(env, id) {
  const u = await env.DB.prepare('SELECT id, name, created_at, last_seen, paused_at FROM users WHERE id = ?').bind(id).first();
  if (!u) throw new HttpError(404, 'No account with that id.');
  return u;
}
function slotSummary(s) {
  if (!s || s.v !== 3) return null;
  if (s.deleted) return { deleted: true, at: s.at || 0 };
  if (s.empty) return null;
  const f = s.flags || {}, q = s.quests ? Object.values(s.quests).filter((x) => x && x.done).length : 0;
  return { at: s.at || 0, stage: s.stage || null, done: !!s.done, act1_done: !!f.act1_done, level: (s.p && s.p.level) || 1, time: Math.round(s.time || 0), diff: s.diff | 0, coins: s.coins | 0, quests: q, pages: s.pages ? Object.keys(s.pages).length : 0 };
}
function slotsOf(blob) {
  if (!blob || blob.v !== 3) return [null, null, null];
  if (Array.isArray(blob.slots)) return [0, 1, 2].map((i) => slotSummary(blob.slots[i]));
  return [blob.empty ? null : slotSummary(blob), null, null];
}
function checkSave(s) {
  if (!s || typeof s !== 'object' || Array.isArray(s) || s.v !== 3) throw new HttpError(400, 'That does not look like an Emberblood save.');
  const data = JSON.stringify(s);
  if (data.length > MAX_SAVE) throw new HttpError(413, 'That save is too big.');
  return data;
}
// keep the save that is about to be replaced, so an admin change can always be undone
async function backupSave(env, userId, note) {
  const row = await env.DB.prepare('SELECT data, updated_at FROM saves WHERE user_id = ?').bind(userId).first();
  if (!row) return null;
  const res = await env.DB.prepare('INSERT INTO save_backups (user_id, data, save_at, made_at, note) VALUES (?, ?, ?, ?, ?)').bind(userId, row.data, row.updated_at, Date.now(), String(note || '').slice(0, 120)).run();
  return res.meta.last_row_id;
}
async function writeSave(env, userId, data) {
  const now = Date.now();
  await env.DB.prepare('INSERT INTO saves (user_id, data, updated_at) VALUES (?, ?, ?) ON CONFLICT(user_id) DO UPDATE SET data = excluded.data, updated_at = excluded.updated_at').bind(userId, data, now).run();
  return now;
}

const adminRoutes = {
  'GET /api/admin/me': async (req, env) => { const u = await authAdmin(req, env); return { user: { id: u.id, name: u.name }, admin: true }; },

  'GET /api/admin/users': async (req, env) => {
    await authAdmin(req, env);
    const now = Date.now();
    const { results } = await env.DB.prepare(`SELECT u.id, u.name, u.created_at, u.last_seen, u.paused_at, s.updated_at AS save_at, length(s.data) AS save_bytes, s.data AS data,
      (SELECT count(*) FROM sessions x WHERE x.user_id = u.id AND x.kind IS NULL AND x.expires_at > ?) AS sessions,
      (SELECT count(*) FROM sessions x WHERE x.user_id = u.id AND x.kind = 'view' AND x.expires_at > ?) AS views,
      (SELECT count(*) FROM save_backups b WHERE b.user_id = u.id) AS backups
      FROM users u LEFT JOIN saves s ON s.user_id = u.id ORDER BY u.id`).bind(now, now).all();
    const best = (await env.DB.prepare('SELECT user_id, diff, wave, score FROM best').all()).results || [];
    return { now, users: (results || []).map((r) => {
      let blob = null; try { blob = r.data ? JSON.parse(r.data) : null; } catch {}
      return { id: r.id, name: r.name, created: r.created_at, last_seen: r.last_seen, paused: r.paused_at || null, save_at: r.save_at || null, save_bytes: r.save_bytes || 0,
        sessions: r.sessions, views: r.views, backups: r.backups, admin: isAdminName(env, r.name), slots: slotsOf(blob),
        arena: best.filter((b) => b.user_id === r.id).map((b) => ({ diff: b.diff, wave: b.wave, score: b.score })) };
    }) };
  },

  'GET /api/admin/save': async (req, env) => {
    await authAdmin(req, env);
    const u = await userById(env, qid(req));
    const row = await env.DB.prepare('SELECT data, updated_at FROM saves WHERE user_id = ?').bind(u.id).first();
    return { user: u, save: row ? JSON.parse(row.data) : null, updated: row ? row.updated_at : null };
  },

  'PUT /api/admin/save': async (req, env) => {
    const a = await authAdmin(req, env);
    const u = await userById(env, qid(req));
    const data = checkSave((await body(req)).save);
    const backup = await backupSave(env, u.id, 'before ' + a.name + ' replaced it');
    return { ok: true, updated: await writeSave(env, u.id, data), backup };
  },

  'GET /api/admin/backups': async (req, env) => {
    await authAdmin(req, env);
    const u = await userById(env, qid(req));
    const { results } = await env.DB.prepare('SELECT id, save_at, made_at, note, length(data) AS bytes FROM save_backups WHERE user_id = ? ORDER BY id DESC LIMIT 50').bind(u.id).all();
    return { user: u, backups: results || [] };
  },

  'GET /api/admin/backup': async (req, env) => {
    await authAdmin(req, env);
    const row = await env.DB.prepare('SELECT id, user_id, data, save_at, made_at, note FROM save_backups WHERE id = ?').bind(qid(req)).first();
    if (!row) throw new HttpError(404, 'No backup with that id.');
    return { backup: { id: row.id, user_id: row.user_id, save_at: row.save_at, made_at: row.made_at, note: row.note }, save: JSON.parse(row.data) };
  },

  'POST /api/admin/restore': async (req, env) => {
    const a = await authAdmin(req, env);
    const bid = +(await body(req)).backup;
    const row = await env.DB.prepare('SELECT user_id, data FROM save_backups WHERE id = ?').bind(bid | 0).first();
    if (!row) throw new HttpError(404, 'No backup with that id.');
    const backup = await backupSave(env, row.user_id, 'before ' + a.name + ' restored backup ' + bid);
    return { ok: true, updated: await writeSave(env, row.user_id, row.data), backup };
  },

  // a look-only session for another account: its saves and scores are never written
  'POST /api/admin/viewas': async (req, env) => {
    await authAdmin(req, env);
    const u = await userById(env, +(await body(req)).id | 0);
    const token = randToken(), now = Date.now();
    await env.DB.prepare("INSERT INTO sessions (token_hash, user_id, created_at, expires_at, kind) VALUES (?, ?, ?, ?, 'view')").bind(await sha256(token), u.id, now, now + VIEW_MS).run();
    return { token, user: { id: u.id, name: u.name }, expires: now + VIEW_MS };
  },

  'POST /api/admin/endviews': async (req, env) => {
    await authAdmin(req, env);
    const res = await env.DB.prepare("DELETE FROM sessions WHERE kind = 'view'").run();
    return { ok: true, ended: res.meta.changes || 0 };
  },

  // set a new password for an account (kids forget theirs); their other sign-ins stay signed in
  'POST /api/admin/password': async (req, env) => {
    await authAdmin(req, env);
    const b = await body(req);
    const u = await userById(env, +b.id | 0);
    const password = String(b.password || '');
    if (password.length < 8 || password.length > 128) throw new HttpError(400, 'Passwords need 8 to 128 characters.');
    await env.DB.prepare('UPDATE users SET pass = ? WHERE id = ?').bind(await hashPassword(password), u.id).run();
    return { ok: true };
  },

  // pause: the account can't sign in, load or save until it is turned back on. Nothing is lost.
  'POST /api/admin/pause': async (req, env) => {
    await authAdmin(req, env);
    const b = await body(req);
    const u = await userById(env, +b.id | 0);
    if (isAdminName(env, u.name)) throw new HttpError(400, 'An admin account cannot be paused.');
    const at = b.paused ? Date.now() : null;
    await env.DB.prepare('UPDATE users SET paused_at = ? WHERE id = ?').bind(at, u.id).run();
    return { ok: true, paused: at };
  },

  // delete: the account, its save, its backups, its scores and its sign-ins are gone for good.
  // The page must send the account's exact name as `confirm`.
  'POST /api/admin/delete': async (req, env) => {
    await authAdmin(req, env);
    const b = await body(req);
    const u = await userById(env, +b.id | 0);
    if (isAdminName(env, u.name)) throw new HttpError(400, 'An admin account cannot be deleted.');
    if (String(b.confirm || '') !== u.name) throw new HttpError(400, 'Type the account name exactly to delete it.');
    await env.DB.batch([
      env.DB.prepare('DELETE FROM sessions WHERE user_id = ?').bind(u.id),
      env.DB.prepare('DELETE FROM saves WHERE user_id = ?').bind(u.id),
      env.DB.prepare('DELETE FROM save_backups WHERE user_id = ?').bind(u.id),
      env.DB.prepare('DELETE FROM best WHERE user_id = ?').bind(u.id),
      env.DB.prepare('DELETE FROM users WHERE id = ?').bind(u.id),
    ]);
    return { ok: true, deleted: u.name };
  },
};
const ip = (req) => req.headers.get('CF-Connecting-IP') || 'local';
function creds(b) {
  const username = String(b.username || '').trim(), password = String(b.password || '');
  if (!NAME_RE.test(username)) throw new HttpError(400, 'Names are 3 to 20 letters, numbers, - or _.');
  if (password.length < 8 || password.length > 128) throw new HttpError(400, 'Passwords need 8 to 128 characters.');
  return { username, password };
}

const routes = {
  'GET /api/health': async () => ({ ok: true, service: 'emberblood', time: Date.now() }),

  'POST /api/register': async (req, env) => {
    const { username, password } = creds(await body(req));
    await limit(env, 'reg:' + ip(req), 6, 3600000);
    const exists = await env.DB.prepare('SELECT id FROM users WHERE name = ?').bind(username).first();
    if (exists) throw new HttpError(409, 'That name is taken. Try another one.');
    const now = Date.now();
    const res = await env.DB.prepare('INSERT INTO users (name, pass, created_at, last_seen) VALUES (?, ?, ?, ?)').bind(username, await hashPassword(password), now, now).run();
    const id = res.meta.last_row_id;
    return { token: await newSession(env, id), user: { id, name: username } };
  },

  'POST /api/login': async (req, env) => {
    const { username, password } = creds(await body(req));
    const key = 'login:' + ip(req);
    const lim = await env.DB.prepare('SELECT n, reset_at FROM limits WHERE k = ?').bind(key).first();
    if (lim && lim.reset_at > Date.now() && lim.n >= 12) throw new HttpError(429, 'Too many tries. Take a breather and try again in a few minutes.');
    const u = await env.DB.prepare('SELECT id, name, pass, paused_at FROM users WHERE name = ?').bind(username).first();
    if (!u || !(await checkPassword(password, u.pass))) { await limit(env, key, 1000, 600000); throw new HttpError(401, 'That name and password do not match.'); }
    if (u.paused_at) throw new HttpError(403, PAUSED_MSG);
    await env.DB.prepare('UPDATE users SET last_seen = ? WHERE id = ?').bind(Date.now(), u.id).run();
    return { token: await newSession(env, u.id), user: { id: u.id, name: u.name } };
  },

  'POST /api/logout': async (req, env) => {
    const u = await authUser(req, env);
    await env.DB.prepare('DELETE FROM sessions WHERE token_hash = ?').bind(u.th).run();
    return { ok: true };
  },

  'GET /api/me': async (req, env) => { const u = await authUser(req, env); return u.view ? { user: { id: u.id, name: u.name }, view: true } : { user: { id: u.id, name: u.name } }; },

  'GET /api/save': async (req, env) => {
    const u = await authUser(req, env);
    const row = await env.DB.prepare('SELECT data, updated_at FROM saves WHERE user_id = ?').bind(u.id).first();
    return { save: row ? JSON.parse(row.data) : null, updated: row ? row.updated_at : null };
  },

  'PUT /api/save': async (req, env) => {
    const u = await authUser(req, env);
    const data = checkSave((await body(req)).save);
    if (u.view) return { ok: true, updated: Date.now(), view: true };   // look-only: the real save is never touched
    return { ok: true, updated: await writeSave(env, u.id, data) };
  },

  'POST /api/score': async (req, env) => {
    const u = await authUser(req, env);
    if (u.view) return { ok: true, view: true };
    const b = await body(req);
    const diff = b.diff | 0, wave = b.wave | 0, score = b.score | 0;
    if (diff < 0 || diff > 2 || wave < 1 || wave > 500 || score < 0 || score > 50000000) throw new HttpError(400, 'That score does not look right.');
    await limit(env, 'score:' + u.id, 60, 3600000);
    await env.DB.prepare('INSERT INTO best (user_id, diff, wave, score, updated_at) VALUES (?, ?, ?, ?, ?) ON CONFLICT(user_id, diff) DO UPDATE SET wave = excluded.wave, score = excluded.score, updated_at = excluded.updated_at WHERE excluded.score > best.score')
      .bind(u.id, diff, wave, score, Date.now()).run();
    return { ok: true };
  },

  'GET /api/leaderboard': async (req, env) => {
    const diff = Math.max(0, Math.min(2, +new URL(req.url).searchParams.get('diff') | 0));
    const { results } = await env.DB.prepare('SELECT u.name AS name, b.wave AS wave, b.score AS score FROM best b JOIN users u ON u.id = b.user_id WHERE b.diff = ? ORDER BY b.score DESC, b.updated_at ASC LIMIT 20').bind(diff).all();
    return { diff, rows: results || [] };
  },
};

export default {
  async fetch(req, env) {
    const cors = corsHeaders(req, env);
    if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: cors });
    const url = new URL(req.url);
    const route = routes[`${req.method} ${url.pathname}`] || adminRoutes[`${req.method} ${url.pathname}`];
    if (!route) return json({ error: 'Not found.' }, 404, cors);
    try { return json(await route(req, env), 200, cors); }
    catch (e) {
      if (e instanceof HttpError) return json({ error: e.message }, e.status, cors);
      console.error(e);
      return json({ error: 'The server tripped over its tail. Try again.' }, 500, cors);
    }
  },
  // daily tidy-up: expired sessions and old rate-limit rows
  async scheduled(event, env) {
    const now = Date.now();
    await env.DB.batch([
      env.DB.prepare('DELETE FROM sessions WHERE expires_at < ?').bind(now),
      env.DB.prepare('DELETE FROM limits WHERE reset_at < ?').bind(now),
    ]);
  },
};
