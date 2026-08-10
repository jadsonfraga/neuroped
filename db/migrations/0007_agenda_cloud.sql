CREATE TABLE IF NOT EXISTS agenda_workspace_demo (
  id TEXT PRIMARY KEY,
  payload_json TEXT NOT NULL,
  revision INTEGER NOT NULL DEFAULT 0,
  updated_by_user_id TEXT,
  is_demo INTEGER NOT NULL DEFAULT 1 CHECK (is_demo = 1),
  updated_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_agenda_workspace_demo_updated_at
  ON agenda_workspace_demo(updated_at DESC);

CREATE TABLE IF NOT EXISTS agenda_audit_demo (
  id TEXT PRIMARY KEY,
  workspace_id TEXT NOT NULL,
  user_id TEXT,
  action TEXT NOT NULL,
  summary TEXT NOT NULL,
  revision INTEGER NOT NULL,
  is_demo INTEGER NOT NULL DEFAULT 1 CHECK (is_demo = 1),
  created_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_agenda_audit_demo_workspace_time
  ON agenda_audit_demo(workspace_id, created_at DESC);
