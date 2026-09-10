import { and, desc, eq, inArray, isNull, sql } from "drizzle-orm";
import type { DB } from "../db/client";
import { users, accessTokens, type User } from "../db/schema";
import { randomId } from "./crypto";

const enc = new TextEncoder();

function b64(bytes: Uint8Array): string {
	let bin = "";
	for (const b of bytes) bin += String.fromCharCode(b);
	return btoa(bin);
}
function unb64(s: string): Uint8Array {
	const bin = atob(s);
	const out = new Uint8Array(bin.length);
	for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
	return out;
}

// PBKDF2-HMAC-SHA256 work factor. Raised from 100k toward OWASP guidance. Native WebCrypto
// keeps this fast; stored hashes embed their own iteration count, so older hashes still verify.
const ITERATIONS = 310_000;

export async function hashPassword(password: string): Promise<string> {
	const salt = crypto.getRandomValues(new Uint8Array(16));
	const key = await crypto.subtle.importKey("raw", enc.encode(password), "PBKDF2", false, ["deriveBits"]);
	const bits = await crypto.subtle.deriveBits(
		{ name: "PBKDF2", salt: salt as BufferSource, iterations: ITERATIONS, hash: "SHA-256" },
		key,
		256,
	);
	return `pbkdf2$${ITERATIONS}$${b64(salt)}$${b64(new Uint8Array(bits))}`;
}

export async function verifyPassword(password: string, stored: string): Promise<boolean> {
	const parts = stored.split("$");
	if (parts.length !== 4 || parts[0] !== "pbkdf2") return false;
	const iterations = Number(parts[1]);
	const salt = unb64(parts[2]);
	const key = await crypto.subtle.importKey("raw", enc.encode(password), "PBKDF2", false, ["deriveBits"]);
	const bits = await crypto.subtle.deriveBits(
		{ name: "PBKDF2", salt: salt as BufferSource, iterations, hash: "SHA-256" },
		key,
		256,
	);
	const computed = b64(new Uint8Array(bits));
	// constant-time-ish compare
	const a = computed;
	const b = parts[3];
	if (a.length !== b.length) return false;
	let diff = 0;
	for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
	return diff === 0;
}

export function normalizeEmail(email: string): string {
	return email.trim().toLowerCase();
}

export async function findUserByEmail(db: DB, email: string): Promise<User | null> {
	const rows = await db.select().from(users).where(eq(users.email, normalizeEmail(email))).limit(1);
	return rows[0] ?? null;
}

export async function getUserById(db: DB, id: string): Promise<User | null> {
	const rows = await db.select().from(users).where(eq(users.id, id)).limit(1);
	return rows[0] ?? null;
}

export interface CreateUserResult {
	ok: boolean;
	user?: User;
	error?: string;
}

export async function createTeacher(db: DB, email: string, password: string): Promise<CreateUserResult> {
	const normalized = normalizeEmail(email);
	if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(normalized)) return { ok: false, error: "Adresă de e-mail invalidă." };
	if (password.length < 8) return { ok: false, error: "Parola trebuie să aibă cel puțin 8 caractere." };
	if (await findUserByEmail(db, normalized)) return { ok: false, error: "Există deja un cont cu acest e-mail." };
	const user: User = {
		id: randomId(),
		email: normalized,
		passwordHash: await hashPassword(password),
		role: "teacher",
		emailVerified: 0,
		suspendedAt: null,
		createdAt: Date.now(),
	};
	await db.insert(users).values(user);
	return { ok: true, user };
}

export async function markEmailVerified(db: DB, userId: string): Promise<void> {
	await db.update(users).set({ emailVerified: 1 }).where(eq(users.id, userId));
}

export interface TeacherRow {
	id: string;
	email: string;
	emailVerified: number;
	suspendedAt: number | null;
	createdAt: number;
	activeTokens: number;
}

export async function listTeachers(db: DB): Promise<TeacherRow[]> {
	const now = Date.now();
	const rows = await db
		.select({
			id: users.id,
			email: users.email,
			emailVerified: users.emailVerified,
			suspendedAt: users.suspendedAt,
			createdAt: users.createdAt,
			activeTokens: sql<number>`(
				SELECT COUNT(*) FROM access_tokens at
				WHERE at.issued_by = ${users.id} AND at.revoked_at IS NULL AND at.valid_until >= ${now}
			)`,
		})
		.from(users)
		.where(eq(users.role, "teacher"))
		.orderBy(desc(users.createdAt));
	return rows.map((r) => ({ ...r, activeTokens: Number(r.activeTokens) }));
}

/** Map of user id → email for the given ids (used to label token issuers in admin views). */
export async function emailsByIds(db: DB, ids: string[]): Promise<Record<string, string>> {
	if (ids.length === 0) return {};
	const rows = await db.select({ id: users.id, email: users.email }).from(users).where(inArray(users.id, ids));
	return Object.fromEntries(rows.map((r) => [r.id, r.email]));
}

export async function setSuspended(db: DB, userId: string, suspended: boolean): Promise<void> {
	await db.update(users).set({ suspendedAt: suspended ? Date.now() : null }).where(eq(users.id, userId));
}

/** Revoke the teacher's active tokens (students lose access), then delete the account. */
export async function deleteTeacher(db: DB, userId: string): Promise<void> {
	await db
		.update(accessTokens)
		.set({ revokedAt: Date.now() })
		.where(and(eq(accessTokens.issuedBy, userId), isNull(accessTokens.revokedAt)));
	await db.delete(users).where(eq(users.id, userId));
}
