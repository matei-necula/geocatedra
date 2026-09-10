CREATE TABLE reviews (
	id TEXT PRIMARY KEY,
	name TEXT,
	role TEXT NOT NULL,
	rating INTEGER NOT NULL,
	body TEXT NOT NULL,
	status TEXT NOT NULL DEFAULT 'pending',
	created_at INTEGER NOT NULL
);
CREATE INDEX idx_reviews_status ON reviews (status, created_at DESC);
