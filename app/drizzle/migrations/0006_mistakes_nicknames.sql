CREATE TABLE practice_mistakes (
	nickname_key TEXT NOT NULL,
	grade_id TEXT NOT NULL,
	question_id TEXT NOT NULL,
	missed_at INTEGER NOT NULL,
	PRIMARY KEY (nickname_key, grade_id, question_id)
);

CREATE TABLE nicknames (
	nickname_key TEXT NOT NULL,
	grade_id TEXT NOT NULL,
	nickname TEXT NOT NULL,
	created_at INTEGER NOT NULL,
	last_seen_at INTEGER NOT NULL,
	PRIMARY KEY (nickname_key, grade_id)
);
