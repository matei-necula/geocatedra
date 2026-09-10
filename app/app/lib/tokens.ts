import { desc, eq } from "drizzle-orm";
import type { DB } from "../db/client";
import { accessTokens, type AccessToken } from "../db/schema";
import { hashToken, randomCode, randomId } from "./crypto";

/** End of the Romanian school year: 15 June (23:59:59), this year or next. */
export function endOfSchoolYear(now = new Date()): number {
	const year = now.getUTCFullYear();
	const thisJune = Date.UTC(year, 5, 15, 23, 59, 59);
	return now.getTime() <= thisJune ? thisJune : Date.UTC(year + 1, 5, 15, 23, 59, 59);
}

export interface CreatedToken {
	plaintext: string;
	row: AccessToken;
}

export async function createToken(
	db: DB,
	opts: { gradeId: string; label: string; prefix: string; issuedBy?: string | null },
): Promise<CreatedToken> {
	const plaintext = `${opts.prefix}-${opts.gradeId}-${randomCode(4)}`;
	const now = Date.now();
	const row: AccessToken = {
		id: randomId(),
		tokenHash: await hashToken(plaintext),
		label: opts.label,
		gradeId: opts.gradeId,
		validFrom: now,
		validUntil: endOfSchoolYear(),
		revokedAt: null,
		createdAt: now,
		issuedBy: opts.issuedBy ?? null,
	};
	await db.insert(accessTokens).values(row);
	return { plaintext, row };
}

export async function listTokensByIssuer(db: DB, issuedBy: string): Promise<AccessToken[]> {
	return db
		.select()
		.from(accessTokens)
		.where(eq(accessTokens.issuedBy, issuedBy))
		.orderBy(desc(accessTokens.createdAt));
}

export async function getTokenById(db: DB, id: string): Promise<AccessToken | null> {
	const rows = await db.select().from(accessTokens).where(eq(accessTokens.id, id)).limit(1);
	return rows[0] ?? null;
}

/** Server-side validation: hash input, look it up, check window + revocation. */
export async function validateToken(db: DB, rawInput: string): Promise<AccessToken | null> {
	const hash = await hashToken(rawInput);
	const rows = await db.select().from(accessTokens).where(eq(accessTokens.tokenHash, hash)).limit(1);
	const token = rows[0];
	if (!token) return null;
	const now = Date.now();
	if (token.revokedAt != null) return null;
	if (token.validFrom > now || token.validUntil < now) return null;
	return token;
}

/** Re-check a token is still valid by id (used on every student request). */
export async function tokenStillValid(db: DB, tokenId: string): Promise<AccessToken | null> {
	const rows = await db.select().from(accessTokens).where(eq(accessTokens.id, tokenId)).limit(1);
	const token = rows[0];
	if (!token) return null;
	const now = Date.now();
	if (token.revokedAt != null || token.validFrom > now || token.validUntil < now) return null;
	return token;
}

export async function listTokens(db: DB): Promise<AccessToken[]> {
	return db.select().from(accessTokens).orderBy(desc(accessTokens.createdAt));
}

export async function revokeToken(db: DB, id: string): Promise<void> {
	await db.update(accessTokens).set({ revokedAt: Date.now() }).where(eq(accessTokens.id, id));
}
