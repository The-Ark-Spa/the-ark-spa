-- Preserve the existing booking form's per-person service and rate details.
-- Additive migration for D1 databases that already applied the base schema.
ALTER TABLE appointments ADD COLUMN guest_count INTEGER NOT NULL DEFAULT 1 CHECK (guest_count BETWEEN 1 AND 4);
ALTER TABLE appointments ADD COLUMN people TEXT NOT NULL DEFAULT '[]' CHECK (json_valid(people));
ALTER TABLE appointments ADD COLUMN selected_duration TEXT NOT NULL DEFAULT '';
ALTER TABLE appointments ADD COLUMN regular_rate TEXT NOT NULL DEFAULT '';
