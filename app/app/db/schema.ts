import { sqliteTable, text, integer, primaryKey } from "drizzle-orm/sqlite-core";

// Content lives in D1. Taxonomy (grades/topics/types) lives in subject.config.
// Students are anonymous — there is intentionally NO student/PII table.

export const materials = sqliteTable("materials", {
	id: text("id").primaryKey(),
	gradeId: text("grade_id").notNull(),
	topicSlug: text("topic_slug").notNull(),
	type: text("type").notNull(), // key from subjectConfig.materialTypes
	library: text("library").notNull().default("student"), // 'student' | 'teacher'
	slug: text("slug").notNull(),
	position: integer("position").notNull().default(0),
	status: text("status").notNull().default("published"), // 'draft' | 'published'
	isTeaser: integer("is_teaser").notNull().default(0),
	createdAt: integer("created_at").notNull(),
	updatedAt: integer("updated_at").notNull(),
});

export const materialTranslations = sqliteTable(
	"material_translations",
	{
		materialId: text("material_id").notNull(),
		locale: text("locale").notNull(),
		title: text("title").notNull(),
		description: text("description").notNull().default(""),
		// For 'scris' this is HTML-ish prose; for 'joc'/'examen'/'prezentare' a JSON payload.
		body: text("body").notNull().default(""),
	},
	(table) => [primaryKey({ columns: [table.materialId, table.locale] })],
);

// Shared class token: unlocks the whole grade until end of school year.
export const accessTokens = sqliteTable("access_tokens", {
	id: text("id").primaryKey(),
	tokenHash: text("token_hash").notNull().unique(), // SHA-256 of normalized token
	label: text("label").notNull(),
	gradeId: text("grade_id").notNull(),
	validFrom: integer("valid_from").notNull(),
	validUntil: integer("valid_until").notNull(),
	revokedAt: integer("revoked_at"),
	createdAt: integer("created_at").notNull(),
	issuedBy: text("issued_by"), // null = admin; otherwise a teacher user id
});

// Accounts for teachers (and later public). Students are NOT users.
export const users = sqliteTable("users", {
	id: text("id").primaryKey(),
	email: text("email").notNull().unique(),
	passwordHash: text("password_hash").notNull(),
	role: text("role").notNull().default("teacher"), // 'teacher' | 'public' (later) | 'admin'
	emailVerified: integer("email_verified").notNull().default(0),
	suspendedAt: integer("suspended_at"), // null = active; timestamp = suspended
	createdAt: integer("created_at").notNull(),
});

// Binary attachments (images, PDFs) stored in R2; DB holds only references.
// Streaming URLs are access-controlled server-side (see routes/media.tsx).
export const materialAssets = sqliteTable("material_assets", {
	id: text("id").primaryKey(),
	materialId: text("material_id").notNull(),
	role: text("role").notNull().default("image"), // 'image' | 'pdf'
	idx: integer("idx").notNull().default(0),
	r2Key: text("r2_key").notNull(),
	mime: text("mime").notNull(),
	bytes: integer("bytes").notNull(),
	createdAt: integer("created_at").notNull(),
});

// ---- MCQ practice exams ----

export const questions = sqliteTable("questions", {
	id: text("id").primaryKey(),
	gradeId: text("grade_id").notNull(),
	topicSlug: text("topic_slug").notNull(),
	status: text("status").notNull().default("draft"), // 'draft' | 'published'
	correctIndex: integer("correct_index").notNull(),
	position: integer("position").notNull().default(0),
	createdAt: integer("created_at").notNull(),
	updatedAt: integer("updated_at").notNull(),
});

export const questionTranslations = sqliteTable(
	"question_translations",
	{
		questionId: text("question_id").notNull(),
		locale: text("locale").notNull(),
		stem: text("stem").notNull(),
		optionsJson: text("options_json").notNull().default("[]"), // JSON array of option strings
		explanation: text("explanation").notNull().default(""),
	},
	(table) => [primaryKey({ columns: [table.questionId, table.locale] })],
);

// One row per submitted practice test. Stores only a self-chosen non-identifying nickname.
export const practiceAttempts = sqliteTable("practice_attempts", {
	id: text("id").primaryKey(),
	nickname: text("nickname").notNull(),
	nicknameKey: text("nickname_key").notNull(),
	gradeId: text("grade_id").notNull(),
	topicSlug: text("topic_slug"), // null = whole-grade mix
	ownerId: text("owner_id"), // null = admin-issued class; else issuing teacher's user id
	assignmentId: text("assignment_id"), // null = free practice; else a temă attempt
	total: integer("total").notNull(),
	correct: integer("correct").notNull(),
	createdAt: integer("created_at").notNull(),
});

// Per-question difficulty counters (aggregate, anonymous).
export const questionStats = sqliteTable("question_stats", {
	questionId: text("question_id").primaryKey(),
	timesShown: integer("times_shown").notNull().default(0),
	timesCorrect: integer("times_correct").notNull().default(0),
});

// Per-nickname missed questions (Greșelile mele). Pseudonymous; auto-pruned on mastery.
export const practiceMistakes = sqliteTable(
	"practice_mistakes",
	{
		nicknameKey: text("nickname_key").notNull(),
		gradeId: text("grade_id").notNull(),
		questionId: text("question_id").notNull(),
		missedAt: integer("missed_at").notNull(),
	},
	(table) => [primaryKey({ columns: [table.nicknameKey, table.gradeId, table.questionId] })],
);

// Reserved nicknames per grade — makes a nickname unique within a grade (no PII, no PIN).
export const nicknames = sqliteTable(
	"nicknames",
	{
		nicknameKey: text("nickname_key").notNull(),
		gradeId: text("grade_id").notNull(),
		nickname: text("nickname").notNull(),
		createdAt: integer("created_at").notNull(),
		lastSeenAt: integer("last_seen_at").notNull(),
	},
	(table) => [primaryKey({ columns: [table.nicknameKey, table.gradeId] })],
);

// ---- Classroom tools ----

// Per-class noticeboard. owner_id NULL = admin, else teacher user id (same convention
// as practice_attempts.owner_id). token_id NULL = all the owner's classes in the grade.
export const announcements = sqliteTable("announcements", {
	id: text("id").primaryKey(),
	ownerId: text("owner_id"),
	gradeId: text("grade_id").notNull(),
	tokenId: text("token_id"),
	body: text("body").notNull(),
	pinned: integer("pinned").notNull().default(0),
	expiresAt: integer("expires_at"),
	createdAt: integer("created_at").notNull(),
	updatedAt: integer("updated_at").notNull(),
});

// Assigned tests (Teme). Fixed question set drawn once at creation → comparable scores.
export const assignments = sqliteTable("assignments", {
	id: text("id").primaryKey(),
	ownerId: text("owner_id"),
	gradeId: text("grade_id").notNull(),
	tokenId: text("token_id"),
	topicSlug: text("topic_slug"),
	title: text("title").notNull(),
	questionIdsJson: text("question_ids_json").notNull(),
	dueAt: integer("due_at"),
	createdAt: integer("created_at").notNull(),
	closedAt: integer("closed_at"),
});

// Aggregate material view counters — no identity, finest grain is (material, class, day).
export const materialViewStats = sqliteTable(
	"material_view_stats",
	{
		materialId: text("material_id").notNull(),
		tokenId: text("token_id").notNull(),
		day: text("day").notNull(), // YYYY-MM-DD, Europe/Bucharest
		views: integer("views").notNull().default(0),
	},
	(table) => [primaryKey({ columns: [table.materialId, table.tokenId, table.day] })],
);

// ---- Păreri publice ----

// Prima cale de scriere publică din tot proiectul (ADR-0008 spunea că instanța liberă nu
// scrie nimic în D1). Ca să nu strice garanția: fără cont, fără cookie, fără sesiune, fără
// e-mail și fără IP — nici măcar hash-uit. `name` e opțional și poate fi o poreclă.
// Nimic nu ajunge public înainte ca admina să treacă rândul pe `approved` din /admin/pareri.
export const reviews = sqliteTable("reviews", {
	id: text("id").primaryKey(),
	name: text("name"), // NULL = anonim
	role: text("role").notNull(), // listă închisă în lib/reviews.ts — nimic subiect-specific
	rating: integer("rating").notNull(), // 1–5, validat pe server
	body: text("body").notNull(),
	status: text("status").notNull().default("pending"), // 'pending' | 'approved' | 'rejected'
	createdAt: integer("created_at").notNull(),
});

export type Material = typeof materials.$inferSelect;
export type MaterialTranslation = typeof materialTranslations.$inferSelect;
export type AccessToken = typeof accessTokens.$inferSelect;
export type MaterialAsset = typeof materialAssets.$inferSelect;
export type Question = typeof questions.$inferSelect;
export type PracticeAttempt = typeof practiceAttempts.$inferSelect;
export type User = typeof users.$inferSelect;
export type PracticeMistake = typeof practiceMistakes.$inferSelect;
export type Nickname = typeof nicknames.$inferSelect;
export type Announcement = typeof announcements.$inferSelect;
export type Assignment = typeof assignments.$inferSelect;
export type Review = typeof reviews.$inferSelect;
