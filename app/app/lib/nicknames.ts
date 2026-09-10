import { and, eq } from "drizzle-orm";
import type { DB } from "../db/client";
import { nicknames } from "../db/schema";
import { normalizeNickname } from "./questions";

export interface NickResult {
	status: "ok" | "collision";
	key: string;
}

/**
 * First-come nickname claim, unique within a grade.
 * - name free            → claim it (ok)
 * - this device owns it  → ok (refresh last_seen)
 * - taken by another     → collision
 * `ownedKeys` is the device's claimed-name list for this grade (from the cat_nick cookie).
 */
export async function resolveNickname(
	db: DB,
	gradeId: string,
	nickname: string,
	ownedKeys: string[],
): Promise<NickResult> {
	const key = normalizeNickname(nickname);
	const now = Date.now();
	const existing = (
		await db
			.select({ key: nicknames.nicknameKey })
			.from(nicknames)
			.where(and(eq(nicknames.nicknameKey, key), eq(nicknames.gradeId, gradeId)))
			.limit(1)
	)[0];

	if (!existing) {
		await db
			.insert(nicknames)
			.values({ nicknameKey: key, gradeId, nickname: nickname.trim().slice(0, 40), createdAt: now, lastSeenAt: now })
			.onConflictDoNothing();
		return { status: "ok", key };
	}
	if (ownedKeys.includes(key)) {
		await db
			.update(nicknames)
			.set({ lastSeenAt: now })
			.where(and(eq(nicknames.nicknameKey, key), eq(nicknames.gradeId, gradeId)));
		return { status: "ok", key };
	}
	return { status: "collision", key };
}

/** Free a nickname so it can be re-claimed (teacher action / lost-device recovery). */
export async function releaseNickname(db: DB, gradeId: string, nickname: string): Promise<void> {
	const key = normalizeNickname(nickname);
	await db.delete(nicknames).where(and(eq(nicknames.nicknameKey, key), eq(nicknames.gradeId, gradeId)));
}

/** Clear the nickname registry (whole grade, or everything). Used by the full results reset. */
export async function clearNicknames(db: DB, gradeId?: string): Promise<void> {
	if (gradeId) await db.delete(nicknames).where(eq(nicknames.gradeId, gradeId));
	else await db.delete(nicknames);
}
