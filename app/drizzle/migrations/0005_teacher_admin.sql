-- Teacher management + practice attribution
ALTER TABLE users ADD COLUMN suspended_at integer;
ALTER TABLE practice_attempts ADD COLUMN owner_id text;
