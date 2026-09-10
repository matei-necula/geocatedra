CREATE TABLE announcements (
	id TEXT PRIMARY KEY,
	owner_id TEXT,
	grade_id TEXT NOT NULL,
	token_id TEXT,
	body TEXT NOT NULL,
	pinned INTEGER NOT NULL DEFAULT 0,
	expires_at INTEGER,
	created_at INTEGER NOT NULL,
	updated_at INTEGER NOT NULL
);
CREATE INDEX idx_announcements_grade ON announcements (grade_id);

CREATE TABLE assignments (
	id TEXT PRIMARY KEY,
	owner_id TEXT,
	grade_id TEXT NOT NULL,
	token_id TEXT,
	topic_slug TEXT,
	title TEXT NOT NULL,
	question_ids_json TEXT NOT NULL,
	due_at INTEGER,
	created_at INTEGER NOT NULL,
	closed_at INTEGER
);
CREATE INDEX idx_assignments_grade ON assignments (grade_id);

CREATE TABLE material_view_stats (
	material_id TEXT NOT NULL,
	token_id TEXT NOT NULL,
	day TEXT NOT NULL,
	views INTEGER NOT NULL DEFAULT 0,
	PRIMARY KEY (material_id, token_id, day)
);

ALTER TABLE practice_attempts ADD COLUMN assignment_id TEXT;
