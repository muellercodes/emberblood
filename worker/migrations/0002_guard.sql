-- 2026-10-24: approve new names, Arena score tickets. Run once on the live database, before deploying the new Worker:
--   npx wrangler d1 execute emberblood --remote --file=migrations/0002_guard.sql
ALTER TABLE users ADD COLUMN approved_at INTEGER;
-- every account made so far is approved, except the spam account, which waits for Drew on the admin page
UPDATE users SET approved_at = created_at WHERE name <> 'Spammer';
CREATE TABLE IF NOT EXISTS runs (
  id TEXT PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  diff INTEGER NOT NULL,
  started_at INTEGER NOT NULL,
  used_at INTEGER
);
CREATE INDEX IF NOT EXISTS runs_user ON runs(user_id);
CREATE INDEX IF NOT EXISTS runs_started ON runs(started_at);
