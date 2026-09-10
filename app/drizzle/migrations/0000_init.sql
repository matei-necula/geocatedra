-- Catedra — initial schema. Matches app/db/schema.ts.
CREATE TABLE IF NOT EXISTS materials (
	id TEXT PRIMARY KEY,
	grade_id TEXT NOT NULL,
	topic_slug TEXT NOT NULL,
	type TEXT NOT NULL,
	library TEXT NOT NULL DEFAULT 'student',
	slug TEXT NOT NULL,
	position INTEGER NOT NULL DEFAULT 0,
	status TEXT NOT NULL DEFAULT 'published',
	is_teaser INTEGER NOT NULL DEFAULT 0,
	created_at INTEGER NOT NULL,
	updated_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS material_translations (
	material_id TEXT NOT NULL,
	locale TEXT NOT NULL,
	title TEXT NOT NULL,
	description TEXT NOT NULL DEFAULT '',
	body TEXT NOT NULL DEFAULT '',
	PRIMARY KEY (material_id, locale)
);

CREATE TABLE IF NOT EXISTS access_tokens (
	id TEXT PRIMARY KEY,
	token_hash TEXT NOT NULL UNIQUE,
	label TEXT NOT NULL,
	grade_id TEXT NOT NULL,
	valid_from INTEGER NOT NULL,
	valid_until INTEGER NOT NULL,
	revoked_at INTEGER,
	created_at INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_materials_grade ON materials (grade_id, library);
CREATE INDEX IF NOT EXISTS idx_materials_slug ON materials (grade_id, slug);
