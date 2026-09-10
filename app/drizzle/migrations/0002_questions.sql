-- Catedra — MCQ practice exams: question bank + attempts + per-question stats.
CREATE TABLE IF NOT EXISTS questions (
	id            TEXT PRIMARY KEY,
	grade_id      TEXT NOT NULL,
	topic_slug    TEXT NOT NULL,
	status        TEXT NOT NULL DEFAULT 'draft',
	correct_index INTEGER NOT NULL,
	position      INTEGER NOT NULL DEFAULT 0,
	created_at    INTEGER NOT NULL,
	updated_at    INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS question_translations (
	question_id  TEXT NOT NULL,
	locale       TEXT NOT NULL,
	stem         TEXT NOT NULL,
	options_json TEXT NOT NULL DEFAULT '[]',
	explanation  TEXT NOT NULL DEFAULT '',
	PRIMARY KEY (question_id, locale)
);

CREATE TABLE IF NOT EXISTS practice_attempts (
	id           TEXT PRIMARY KEY,
	nickname     TEXT NOT NULL,
	nickname_key TEXT NOT NULL,
	grade_id     TEXT NOT NULL,
	topic_slug   TEXT,
	total        INTEGER NOT NULL,
	correct      INTEGER NOT NULL,
	created_at   INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS question_stats (
	question_id   TEXT PRIMARY KEY,
	times_shown   INTEGER NOT NULL DEFAULT 0,
	times_correct INTEGER NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_questions_scope ON questions (grade_id, topic_slug, status);
CREATE INDEX IF NOT EXISTS idx_attempts_grade_nick ON practice_attempts (grade_id, nickname_key);
