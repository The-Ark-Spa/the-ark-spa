-- The Ark Spa & Salon: staged Cloudflare D1 schema.
-- Apply only to the new D1 database. This does not modify Supabase.
PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS site_content (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  data TEXT NOT NULL CHECK (json_valid(data)),
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);

CREATE TABLE IF NOT EXISTS appointments (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL DEFAULT '',
  phone TEXT NOT NULL,
  email TEXT NOT NULL DEFAULT '',
  service TEXT NOT NULL DEFAULT '',
  offer TEXT NOT NULL DEFAULT '',
  guests INTEGER NOT NULL DEFAULT 1 CHECK (guests BETWEEN 1 AND 20),
  date TEXT NOT NULL,
  time TEXT NOT NULL,
  final_price TEXT NOT NULL DEFAULT '',
  total_amount REAL,
  status TEXT NOT NULL DEFAULT 'Pending' CHECK (status IN ('Pending','Confirmed','Completed','Cancelled','No-show')),
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);

CREATE INDEX IF NOT EXISTS appointments_created_at_idx ON appointments(created_at DESC);
CREATE INDEX IF NOT EXISTS appointments_date_time_idx ON appointments(date, time);
CREATE INDEX IF NOT EXISTS appointments_status_idx ON appointments(status);

CREATE TABLE IF NOT EXISTS audit_events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  request_id TEXT NOT NULL,
  actor TEXT NOT NULL,
  action TEXT NOT NULL,
  resource TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);

CREATE INDEX IF NOT EXISTS audit_events_created_at_idx ON audit_events(created_at DESC);
