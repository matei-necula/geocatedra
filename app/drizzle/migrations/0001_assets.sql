-- Catedra — material attachments (images, PDFs) stored in R2.
CREATE TABLE IF NOT EXISTS material_assets (
	id TEXT PRIMARY KEY,
	material_id TEXT NOT NULL,
	role TEXT NOT NULL DEFAULT 'image',
	idx INTEGER NOT NULL DEFAULT 0,
	r2_key TEXT NOT NULL,
	mime TEXT NOT NULL,
	bytes INTEGER NOT NULL,
	created_at INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_assets_material ON material_assets (material_id, idx, created_at);
