-- Emberblood accounts, saves and leaderboard (Cloudflare D1 / SQLite)
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL UNIQUE COLLATE NOCASE,
  pass TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  last_seen INTEGER NOT NULL,
  paused_at INTEGER,              -- set when an admin pauses the account (it can't sign in or save)
  approved_at INTEGER             -- set when an admin approves the name for the leaderboard (NULL = waiting)
);
CREATE TABLE IF NOT EXISTS sessions (
  token_hash TEXT PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at INTEGER NOT NULL,
  expires_at INTEGER NOT NULL,
  kind TEXT                       -- NULL for a normal sign-in, 'view' for a look-only session from the admin page
);
CREATE INDEX IF NOT EXISTS sessions_user ON sessions(user_id);
CREATE INDEX IF NOT EXISTS sessions_exp ON sessions(expires_at);
CREATE TABLE IF NOT EXISTS saves (
  user_id INTEGER PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  data TEXT NOT NULL,
  updated_at INTEGER NOT NULL
);
CREATE TABLE IF NOT EXISTS best (
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  diff INTEGER NOT NULL,
  wave INTEGER NOT NULL,
  score INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  PRIMARY KEY (user_id, diff)
);
CREATE INDEX IF NOT EXISTS best_board ON best(diff, score DESC);
-- saves an admin replaced or restored, so every admin change can be undone
CREATE TABLE IF NOT EXISTS save_backups (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  data TEXT NOT NULL,
  save_at INTEGER,
  made_at INTEGER NOT NULL,
  note TEXT
);
CREATE INDEX IF NOT EXISTS save_backups_user ON save_backups(user_id);
CREATE TABLE IF NOT EXISTS limits (
  k TEXT PRIMARY KEY,
  n INTEGER NOT NULL,
  reset_at INTEGER NOT NULL
);
-- Arena score tickets: one per run, handed out by POST /api/arena/start and used up by POST /api/score
CREATE TABLE IF NOT EXISTS runs (
  id TEXT PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  diff INTEGER NOT NULL,
  started_at INTEGER NOT NULL,
  used_at INTEGER
);
CREATE INDEX IF NOT EXISTS runs_user ON runs(user_id);
CREATE INDEX IF NOT EXISTS runs_started ON runs(started_at);
