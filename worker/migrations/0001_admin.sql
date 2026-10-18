-- 2026-10-18: the admin page. Run once on a database made from the older schema.sql:
--   npx wrangler d1 execute emberblood --remote --file=migrations/0001_admin.sql
ALTER TABLE sessions ADD COLUMN kind TEXT;
ALTER TABLE users ADD COLUMN paused_at INTEGER;
CREATE TABLE IF NOT EXISTS save_backups (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  data TEXT NOT NULL,
  save_at INTEGER,
  made_at INTEGER NOT NULL,
  note TEXT
);
CREATE INDEX IF NOT EXISTS save_backups_user ON save_backups(user_id);
