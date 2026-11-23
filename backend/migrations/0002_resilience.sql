-- Resilience and security tables for the independent Ark backend.
-- Apply after 0001_initial_schema.sql.
PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS admin_login_attempts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  identity_hash TEXT NOT NULL,
  attempted_at INTEGER NOT NULL,
  succeeded INTEGER NOT NULL DEFAULT 0 CHECK (succeeded IN (0,1))
);
CREATE INDEX IF NOT EXISTS admin_login_attempts_identity_time_idx
  ON admin_login_attempts(identity_hash, attempted_at DESC);

CREATE TABLE IF NOT EXISTS admin_sessions (
  token_hash TEXT PRIMARY KEY,
  admin_email TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  expires_at INTEGER NOT NULL,
  revoked_at INTEGER
);
CREATE INDEX IF NOT EXISTS admin_sessions_expiry_idx
  ON admin_sessions(expires_at);

CREATE TABLE IF NOT EXISTS backup_runs (
  id TEXT PRIMARY KEY,
  status TEXT NOT NULL CHECK (status IN ('started','verified','failed','restored')),
  object_key TEXT,
  content_sha256 TEXT,
  byte_length INTEGER,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  verified_at TEXT,
  notes TEXT NOT NULL DEFAULT ''
);

CREATE TABLE IF NOT EXISTS storage_objects (
  object_key TEXT PRIMARY KEY,
  public_url TEXT NOT NULL,
  content_type TEXT NOT NULL,
  byte_length INTEGER NOT NULL,
  purpose TEXT NOT NULL CHECK (purpose IN ('gallery','hero','logo','backup')),
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  created_by TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS storage_objects_purpose_idx
  ON storage_objects(purpose, created_at DESC);

CREATE TABLE IF NOT EXISTS idempotency_keys (
  key TEXT PRIMARY KEY,
  operation TEXT NOT NULL,
  response_json TEXT NOT NULL CHECK (json_valid(response_json)),
  created_at INTEGER NOT NULL,
  expires_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idempotency_expiry_idx ON idempotency_keys(expires_at);

-- Immutable snapshots make recovery and audit review possible after each successful content save.
CREATE TABLE IF NOT EXISTS site_content_revisions (
  revision INTEGER PRIMARY KEY AUTOINCREMENT,
  data TEXT NOT NULL CHECK (json_valid(data)),
  actor TEXT NOT NULL,
  request_id TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);
CREATE INDEX IF NOT EXISTS site_content_revisions_created_idx ON site_content_revisions(created_at DESC);
