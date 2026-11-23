-- Store small recovery snapshots in D1; no external object storage required.
ALTER TABLE backup_runs ADD COLUMN snapshot_json TEXT;
