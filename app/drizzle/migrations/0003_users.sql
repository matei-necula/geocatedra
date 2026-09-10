-- Catedra — teacher (and later public) accounts + per-teacher token ownership.
CREATE TABLE IF NOT EXISTS users (
	id            TEXT PRIMARY KEY,
	email         TEXT NOT NULL UNIQUE,
	password_hash TEXT NOT NULL,
	role          TEXT NOT NULL DEFAULT 'teacher',
	created_at    INTEGER NOT NULL
);

ALTER TABLE access_tokens ADD COLUMN issued_by TEXT;
