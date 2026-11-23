-- Keep small public website image files and recovery snapshots in D1.
ALTER TABLE backup_runs ADD COLUMN snapshot_json TEXT;
ALTER TABLE storage_objects ADD COLUMN file_data BLOB;
