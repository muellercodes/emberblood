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

// ---------- the name filter (v12): runs when an account is made, never on sign-in, so no old name is ever renamed.
// It refuses swear words, slurs, sexual words, spam words and names that pretend to be staff. Silly kid names
// ("Is_a_fart") stay allowed, and ordinary words that hide a bad word inside ("Scunthorpe", "Classic", "Therapist",
// "Badminton") pass: short words only count as a whole word, and the longer ones carry their own exceptions.
// Every new name also waits for the admin to approve it before anyone else can see it, so this is the first fence only.
const NAME_NO = "Pick another name. That one isn't allowed here.";
const LEET = { 0: 'o', 3: 'e', 4: 'a', 5: 's', 7: 't', 8: 'b', 9: 'g', '@': 'a', $: 's', '!': 'i', '|': 'l', '+': 't' };
// matched anywhere in the name, after joining its parts (so "f_u_c_k" and "FuCk" are caught)
const NAME_ROOTS = {
  rude: [
    // swear words
    /fuck/, /fuk(?!uo|ush|uy|ien)/, /fuq/, /fvck/, /phuc?k(?!et)/, /(?<!yama|cu)shit(?!ta)/, /bitch/, /biatch/, /bastard/, /cunt(?!horpe)/, /twat(?!ch|er|t)/,
    /(?<!s)wank(?!el)/, /bollock/, /bolock/, /arsehole/, /asshole/, /dumbass/, /jackass/, /smartass/, /fatass/, /asswipe/, /asshat/, /assclown/,
    /(?<!ni|ns)piss(?!ar)/, /dickhead/, /cocksuck/,
    // slurs
    /(?<!s)nigg(?!l)/, /nigga/, /fagg?ot/, /retard(?!ant)/, /trann(y|ie)/, /wetback/, /beaner(?!y)/, /towelhead/, /raghead/, /chingchong/,
    /(?<!ke|mo)nazi(?!r)/, /hitler/, /kkk/, /siegheil/, /whitepower/, /(?<!b)lesbo/, /shemale/,
    // sexual words
    /porn/, /sexy/, /sexting/, /penis(?!ton)/, /vagina/, /vulva/, /pussy(?!cat|willow|foot)/, /dildo/, /orgasm/, /cumshot/, /jizz?/, /blowjob/,
    /handjob/, /rimjob/, /boobie/, /titt(y|ie)/, /milf(?!ord)/, /hentai/, /onlyfans/, /nsfw/, /slut/, /whore/, /(?<!the)rapist/, /molest/,
    /pa?edophil/, /paedo/, /(?<!pr)incest/, /bdsm/, /(?<!scl)erotic/, /bukkake/, /ballsack/, /nutsack/, /scrotum/, /testicle/, /clit(?![heiut])/, /condom(?!in)/, /viagra/,
  ],
  spam: [/spam/, /http/, /www/, /dotcom/, /freerobux/, /freevbucks/, /freecoins/, /freegems/, /freemoney/, /freestuff/, /freegift/, /giveaway/, /casino/, /bitcoin/],
  staff: [/(?<!b)admin(?!d)/, /moderator/, /official/, /(?<![drl])owner/, /developer/, /devteam/, /^(the|real)?emberblood(team|staff|dev|devs|help|support|game|hq)?$/],
};
// matched only as a whole word (a part of the name split at spaces, _, -, dots and capitals), plural or not
const NAME_WORDS = {
  rude: new Set(('ass arse tit tits titty cum cock dick prick fag hoe sex sexx rape raped raping pedo anal anus horny nude naked boob boner thot ' +
    'spic chink kike gook coon negro paki jap dyke homo wtf stfu gtfo mofo').split(' ')),
  spam: new Set(['bot', 'free']),
  staff: new Set(['mod', 'staff']),
};
const lev = (a, b) => {
  const n = b.length, d = Array.from({ length: n + 1 }, (_, j) => j);
  for (let i = 1; i <= a.length; i++) { let prev = d[0]; d[0] = i; for (let j = 1; j <= n; j++) { const t = d[j]; d[j] = Math.min(d[j] + 1, d[j - 1] + 1, prev + (a[i - 1] === b[j - 1] ? 0 : 1)); prev = t; } }
  return d[n];
};
// "close to" a staff name: the whole name within a few edits, or a stretch of it within fewer (MuellerCodez, The_Mueller_Codes)
function nearName(s, staff) {
  const whole = Math.min(3, Math.floor(staff.length / 4)), part = Math.min(2, Math.floor(staff.length / 5));
  if (s.length < 4 || staff.length < 4) return s === staff;
  if (lev(s, staff) <= whole) return true;
  for (let w = staff.length - 1; w <= staff.length + 1; w++) for (let i = 0; i + w <= s.length; i++) if (lev(s.slice(i, i + w), staff) <= part) return true;
  return false;
}
// the spellings a name is checked in: look-alikes read as letters (1 as i and as l), and long runs of a letter squeezed
// to one and to two. Each keeps where its parts start and end (cuts).
function nameForms(parts) {
  const out = [];
  for (const one of ['i', 'l']) for (const sq of [0, 1, 2]) {
    let s = ''; const cuts = [0];
    for (const p of parts) {
      let t = p.replace(/[0-9@$!|+]/g, (c) => (c === '1' ? one : LEET[c] || c)).replace(/[^a-z]/g, '');
      if (sq) t = t.replace(/(.)\1{2,}/g, sq === 1 ? '$1' : '$1$1');
      if (t) { s += t; cuts.push(s.length); }
    }
    if (s && !out.some((f) => f.s === s && f.cuts.join() === cuts.join())) out.push({ s, cuts });
  }
  return out;
}
// a bad word counts when it sits inside one part ("BigShitHead"), or when it is made of whole parts ("Sh_it", "f_u_c_k"),
// but not when it only borrows the end of one real word and the start of the next ("GusHitter", "PrinceStar", "GrassHole")
function rootIn(re, f) {
  const g = new RegExp(re.source, 'g'); let m;
  while ((m = g.exec(f.s))) {
    const a = m.index, b = a + m[0].length;
    for (let i = 0; i + 1 < f.cuts.length; i++) if (a >= f.cuts[i] && b <= f.cuts[i + 1]) return true;
    if (f.cuts.includes(a) && f.cuts.includes(b)) return true;
    if (b === a) g.lastIndex++;
  }
  return false;
}
const wordIn = (set, f) => set.has(f) || (f.length > 3 && /[sz]$/.test(f) && set.has(f.slice(0, -1))) || (f.length > 4 && /es$/.test(f) && set.has(f.slice(0, -2)));
// null for a fine name, or why it was refused ('rude', 'spam' or 'staff', for the admin page; the player only sees NAME_NO)
function nameProblem(raw, env) {
  raw = String(raw || '');
  if (/\.com|1488/i.test(raw)) return 'spam';
  // the parts: split at separators and at a capital after a small letter; a part that is only digits stays a number
  const parts = raw.replace(/([a-z])([A-Z])/g, '$1 $2').toLowerCase().split(/[\s_.\-]+/).filter((p) => p && !/^\d+$/.test(p));
  const staff = ['muellercodes', ...String((env && env.ADMIN_USERS) || '').split(',').map((s) => s.trim().toLowerCase().replace(/[^a-z]/g, '')).filter(Boolean)];
  for (const f of nameForms(parts)) {
    for (const why in NAME_ROOTS) if (NAME_ROOTS[why].some((re) => rootIn(re, f))) return why;
    if (staff.some((st) => nearName(f.s, st))) return 'staff';
  }
  // a short word counts as a whole part, or as the whole name ("A_S_S", "MoFo")
  for (const p of [...parts, parts.join('')]) for (const f of nameForms([p])) for (const why in NAME_WORDS) if (wordIn(NAME_WORDS[why], f.s)) return why;
  return null;
}

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
  const row = await env.DB.prepare('SELECT s.user_id AS id, s.expires_at AS exp, s.kind AS kind, u.name AS name, u.paused_at AS paused, u.approved_at AS approved FROM sessions s JOIN users u ON u.id = s.user_id WHERE s.token_hash = ?').bind(th).first();
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
  return { id: row.id, name: row.name, th, view, approved: !!row.approved || isAdminName(env, row.name) };
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
  const u = await env.DB.prepare('SELECT id, name, created_at, last_seen, paused_at, approved_at FROM users WHERE id = ?').bind(id).first();
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
    const { results } = await env.DB.prepare(`SELECT u.id, u.name, u.created_at, u.last_seen, u.paused_at, u.approved_at, s.updated_at AS save_at, length(s.data) AS save_bytes, s.data AS data,
      (SELECT count(*) FROM sessions x WHERE x.user_id = u.id AND x.kind IS NULL AND x.expires_at > ?) AS sessions,
      (SELECT count(*) FROM sessions x WHERE x.user_id = u.id AND x.kind = 'view' AND x.expires_at > ?) AS views,
      (SELECT count(*) FROM save_backups b WHERE b.user_id = u.id) AS backups
      FROM users u LEFT JOIN saves s ON s.user_id = u.id ORDER BY u.id`).bind(now, now).all();
    const best = (await env.DB.prepare('SELECT user_id, diff, wave, score FROM best').all()).results || [];
    return { now, users: (results || []).map((r) => {
      let blob = null; try { blob = r.data ? JSON.parse(r.data) : null; } catch {}
      const admin = isAdminName(env, r.name);
      return { id: r.id, name: r.name, created: r.created_at, last_seen: r.last_seen, paused: r.paused_at || null, save_at: r.save_at || null, save_bytes: r.save_bytes || 0,
        sessions: r.sessions, views: r.views, backups: r.backups, admin, slots: slotsOf(blob),
        // approved: when the name was let onto the leaderboard (null while it waits); name_check: what the filter thinks of it now
        approved: r.approved_at || (admin ? r.created_at : null), name_check: admin ? null : nameProblem(r.name, env),
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

  // approve: the name may show on the Arena leaderboard. Unapprove hides it again (the scores are kept).
  'POST /api/admin/approve': async (req, env) => {
    await authAdmin(req, env);
    const b = await body(req);
    const u = await userById(env, +b.id | 0);
    if (isAdminName(env, u.name) && !b.approved) throw new HttpError(400, 'An admin account is always approved.');
    const at = b.approved ? (u.approved_at || Date.now()) : null;
    await env.DB.prepare('UPDATE users SET approved_at = ? WHERE id = ?').bind(at, u.id).run();
    return { ok: true, approved: at };
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
      env.DB.prepare('DELETE FROM runs WHERE user_id = ?').bind(u.id),
      env.DB.prepare('DELETE FROM users WHERE id = ?').bind(u.id),
    ]);
    return { ok: true, deleted: u.name };
  },
};
const ip = (req) => req.headers.get('CF-Connecting-IP') || 'local';

// ---------- the bot check on Create account (Cloudflare Turnstile). The site key is public (wrangler.toml [vars]); the
// secret is a Worker secret (TURNSTILE_SECRET). Until the secret exists the check is skipped, so nothing breaks before then.
const SITEVERIFY = 'https://challenges.cloudflare.com/turnstile/v0/siteverify';
// tests may point it at a stand-in on this machine, never anywhere else
const verifyUrl = (env) => (/^http:\/\/(127\.0\.0\.1|localhost)(:\d+)?\//.test(String(env.TURNSTILE_VERIFY_URL || '')) ? env.TURNSTILE_VERIFY_URL : SITEVERIFY);
async function botCheck(req, env, token) {
  if (!env.TURNSTILE_SECRET) return;
  token = typeof token === 'string' ? token : '';
  if (!token || token.length > 2048) throw new HttpError(400, 'Please finish the robot check first.');
  const form = new FormData();
  form.append('secret', env.TURNSTILE_SECRET); form.append('response', token);
  const rip = req.headers.get('CF-Connecting-IP'); if (rip) form.append('remoteip', rip);
  let j = null;
  try { const r = await fetch(verifyUrl(env), { method: 'POST', body: form }); j = await r.json(); }
  catch { throw new HttpError(503, 'The robot check could not be reached. Try again in a moment.'); }
  if (!j || j.success !== true) throw new HttpError(400, 'The robot check did not pass. Try it again.');
}

// ---------- Arena score tickets. POST /api/arena/start hands out a run id when a run begins; POST /api/score needs an
// unused one of the same player and difficulty, and the score must fit the time and the wave. A refused score is quiet
// for the player (200, ok false) and says why in the response and the Worker log.
const RUN_MS = 6 * 3600000;        // a ticket is good for 6 hours
// The Arena's own numbers (game/src/a9b_flow.js genWave, nextNormalWave, checkWave, normalBossDone; a6_player.js
// killEnemy and comboMult; a7a_enemies.js makeEnemy; a1b_data.js EDEF):
// - an ordinary wave n spends a budget of 4 + 1.8n on foes that cost 1 to 4 budget and are worth at most 10 points per
//   budget point (kobold 10 for 1, drakeling 20 for 2); an elite is worth double; the streak multiplies by at most 4;
//   clearing the wave adds 100n
// - every fifth wave is a champion (worth at most 1500, the old dragon) with adds from genWave(n/3); beating it adds 250n
// - champions keep calling more foes for as long as the fight lasts, so time itself can earn points: FARM_PTS a second
// The cap takes all of that at once (every foe elite, the streak always at its best) and then adds a quarter on top.
const FARM_PTS = 120;
function waveCap(n) {
  const kills = (b) => (4 + 1.8 * b) * 10 * 2 * 4;
  return n % 5 === 0 ? 1500 * 4 + kills(Math.floor(n / 3)) + 250 * n : kills(n) + 100 * n;
}
function scoreCap(wave, secs) { let s = 0; for (let n = 1; n <= wave; n++) s += waveCap(n); return Math.ceil(s * 1.25 + secs * FARM_PTS + 1000); }
// The quickest a wave can be reached. Measured in the real Arena (Easy and Hard) with every foe falling the moment it
// lands and every blessing taken at once (v12 GUARD_NOTES.md): wave 1 starts at 2.4 s, an ordinary wave n takes at
// least about 4.5 + 0.3n seconds (spawning paces it), a champion wave about 5. That floor is then halved, less 3 seconds
// for a slow network, so no real player is ever refused for being quick.
function minSecs(wave) {
  let t = 2.4;
  for (let n = 1; n < wave; n++) t += n % 5 === 0 ? 5 : 4.5 + 0.3 * n;
  return Math.max(0, t * 0.5 - 3);
}
async function ticketProblem(env, u, b, diff, wave, score) {
  const run = typeof b.run === 'string' && /^[A-Za-z0-9_-]{16,64}$/.test(b.run) ? b.run : null;
  if (!run) return 'no ticket';
  const row = await env.DB.prepare('SELECT user_id, diff, started_at, used_at FROM runs WHERE id = ?').bind(run).first();
  if (!row || row.user_id !== u.id) return 'unknown ticket';
  if (row.used_at) return 'ticket already used';
  const now = Date.now();
  // one try per ticket, whatever the outcome
  const res = await env.DB.prepare('UPDATE runs SET used_at = ? WHERE id = ? AND used_at IS NULL').bind(now, run).run();
  if (!res.meta.changes) return 'ticket already used';
  if (row.diff !== diff) return 'wrong difficulty';
  if (now - row.started_at > RUN_MS) return 'ticket too old';
  const secs = (now - row.started_at) / 1000;
  if (secs < minSecs(wave)) return 'too fast';
  if (score > scoreCap(wave, secs)) return 'score too high';
  return null;
}
function creds(b) {
  const username = String(b.username || '').trim(), password = String(b.password || '');
  if (!NAME_RE.test(username)) throw new HttpError(400, 'Names are 3 to 20 letters, numbers, - or _.');
  if (password.length < 8 || password.length > 128) throw new HttpError(400, 'Passwords need 8 to 128 characters.');
  return { username, password };
}

const routes = {
  'GET /api/health': async () => ({ ok: true, service: 'emberblood', time: Date.now() }),

  // what the game needs to know before it shows Create account
  'GET /api/config': async (req, env) => ({ turnstile: env.TURNSTILE_SITEKEY || null }),

  'POST /api/register': async (req, env) => {
    const b = await body(req);
    const { username, password } = creds(b);
    // the admin's own name (ADMIN_USERS) can only ever be made once, like before; anything else goes through the filter
    const admin = isAdminName(env, username);
    if (!admin && nameProblem(username, env)) throw new HttpError(400, NAME_NO);
    await botCheck(req, env, b.turnstile);
    await limit(env, 'reg:' + ip(req), 6, 3600000);
    const exists = await env.DB.prepare('SELECT id FROM users WHERE name = ?').bind(username).first();
    if (exists) throw new HttpError(409, 'That name is taken. Try another one.');
    const now = Date.now();
    // a new account plays and saves at once; its name waits for the admin before anyone else can see it
    const res = await env.DB.prepare('INSERT INTO users (name, pass, created_at, last_seen, approved_at) VALUES (?, ?, ?, ?, ?)').bind(username, await hashPassword(password), now, now, admin ? now : null).run();
    const id = res.meta.last_row_id;
    return { token: await newSession(env, id), user: { id, name: username }, approved: admin };
  },

  'POST /api/login': async (req, env) => {
    const { username, password } = creds(await body(req));
    const key = 'login:' + ip(req);
    const lim = await env.DB.prepare('SELECT n, reset_at FROM limits WHERE k = ?').bind(key).first();
    if (lim && lim.reset_at > Date.now() && lim.n >= 12) throw new HttpError(429, 'Too many tries. Take a breather and try again in a few minutes.');
    const u = await env.DB.prepare('SELECT id, name, pass, paused_at, approved_at FROM users WHERE name = ?').bind(username).first();
    if (!u || !(await checkPassword(password, u.pass))) { await limit(env, key, 1000, 600000); throw new HttpError(401, 'That name and password do not match.'); }
    if (u.paused_at) throw new HttpError(403, PAUSED_MSG);
    await env.DB.prepare('UPDATE users SET last_seen = ? WHERE id = ?').bind(Date.now(), u.id).run();
    return { token: await newSession(env, u.id), user: { id: u.id, name: u.name }, approved: !!u.approved_at || isAdminName(env, u.name) };
  },

  'POST /api/logout': async (req, env) => {
    const u = await authUser(req, env);
    await env.DB.prepare('DELETE FROM sessions WHERE token_hash = ?').bind(u.th).run();
    return { ok: true };
  },

  'GET /api/me': async (req, env) => { const u = await authUser(req, env); return u.view ? { user: { id: u.id, name: u.name }, view: true, approved: u.approved } : { user: { id: u.id, name: u.name }, approved: u.approved }; },

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

  // an Arena run starts: a ticket for its score (signed in only; a "view as" session gets none)
  'POST /api/arena/start': async (req, env) => {
    const u = await authUser(req, env);
    if (u.view) return { run: null, view: true };
    const diff = (await body(req)).diff;
    if (!Number.isInteger(diff) || diff < 0 || diff > 2) throw new HttpError(400, 'Which difficulty?');
    await limit(env, 'run:' + u.id, 120, 3600000);
    const run = randToken(18), now = Date.now();
    await env.DB.prepare('INSERT INTO runs (id, user_id, diff, started_at) VALUES (?, ?, ?, ?)').bind(run, u.id, diff, now).run();
    return { run, started: now };
  },

  'POST /api/score': async (req, env) => {
    const u = await authUser(req, env);
    if (u.view) return { ok: true, view: true };
    const b = await body(req);
    const diff = b.diff | 0, wave = b.wave | 0, score = b.score | 0;
    if (diff < 0 || diff > 2 || wave < 1 || wave > 500 || score < 0 || score > 50000000) throw new HttpError(400, 'That score does not look right.');
    await limit(env, 'score:' + u.id, 60, 3600000);
    const why = await ticketProblem(env, u, b, diff, wave, score);
    if (why) { console.log(`score refused: user ${u.id}, diff ${diff}, wave ${wave}, score ${score}: ${why}`); return { ok: false, kept: false, refused: why }; }
    await env.DB.prepare('INSERT INTO best (user_id, diff, wave, score, updated_at) VALUES (?, ?, ?, ?, ?) ON CONFLICT(user_id, diff) DO UPDATE SET wave = excluded.wave, score = excluded.score, updated_at = excluded.updated_at WHERE excluded.score > best.score')
      .bind(u.id, diff, wave, score, Date.now()).run();
    return { ok: true, kept: true, approved: u.approved };
  },

  'GET /api/leaderboard': async (req, env) => {
    const diff = Math.max(0, Math.min(2, +new URL(req.url).searchParams.get('diff') | 0));
    // only approved names are ever shown to other players
    const { results } = await env.DB.prepare('SELECT u.name AS name, b.wave AS wave, b.score AS score FROM best b JOIN users u ON u.id = b.user_id WHERE b.diff = ? AND u.approved_at IS NOT NULL ORDER BY b.score DESC, b.updated_at ASC LIMIT 20').bind(diff).all();
    const out = { diff, rows: results || [] };
    // a signed-in player always sees their own best, also while their name waits
    if (req.headers.get('Authorization')) {
      try {
        const u = await authUser(req, env);
        const mine = await env.DB.prepare('SELECT wave, score FROM best WHERE user_id = ? AND diff = ?').bind(u.id, diff).first();
        out.me = { name: u.name, approved: u.approved, wave: mine ? mine.wave : 0, score: mine ? mine.score : 0 };
      } catch {}
    }
    return out;
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
  // daily tidy-up: expired sessions, old rate-limit rows and old score tickets
  async scheduled(event, env) {
    const now = Date.now();
    await env.DB.batch([
      env.DB.prepare('DELETE FROM sessions WHERE expires_at < ?').bind(now),
      env.DB.prepare('DELETE FROM limits WHERE reset_at < ?').bind(now),
      env.DB.prepare('DELETE FROM runs WHERE started_at < ?').bind(now - 2 * DAY),
    ]);
  },
};
