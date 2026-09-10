import { and, desc, eq, gt, isNull, or } from "drizzle-orm";
import type { DB } from "../db/client";
import { announcements, type Announcement } from "../db/schema";
import { randomId } from "./crypto";

const BODY_MAX = 2000;

export interface AnnouncementInput {
	gradeId: string;
	tokenId: string | null;
	body: string;
	pinned: boolean;
	expiresAt: number | null;
}

export function announcementInputFromForm(form: FormData): AnnouncementInput | { error: string } {
	const gradeId = String(form.get("gradeId") ?? "");
	const body = String(form.get("body") ?? "").trim().slice(0, BODY_MAX);
	if (!gradeId) return { error: "Alege clasa." };
	if (!body) return { error: "Scrie textul anunțului." };
	const expiresRaw = String(form.get("expiresAt") ?? "").trim(); // yyyy-mm-dd from <input type="date">
	const expiresAt = expiresRaw ? new Date(`${expiresRaw}T23:59:59`).getTime() : null;
	return {
		gradeId,
		tokenId: String(form.get("tokenId") ?? "") || null,
		body,
		pinned: form.get("pinned") === "on",
		expiresAt,
	};
}

/** owner_id NULL = admin — SQL NULL needs isNull, not eq. */
function ownerCond(ownerId: string | null) {
	return ownerId === null ? isNull(announcements.ownerId) : eq(announcements.ownerId, ownerId);
}

export async function createAnnouncement(db: DB, ownerId: string | null, input: AnnouncementInput): Promise<string> {
	const id = randomId();
	const now = Date.now();
	await db.insert(announcements).values({
		id,
		ownerId,
		gradeId: input.gradeId,
		tokenId: input.tokenId,
		body: input.body,
		pinned: input.pinned ? 1 : 0,
		expiresAt: input.expiresAt,
		createdAt: now,
		updatedAt: now,
	});
	return id;
}

/** Edit is limited to body/pin/expiry; retargeting means delete + recreate. Owner-scoped. */
export async function updateAnnouncement(
	db: DB,
	id: string,
	ownerId: string | null,
	patch: { body: string; pinned: boolean; expiresAt: number | null },
): Promise<void> {
	await db
		.update(announcements)
		.set({ body: patch.body.trim().slice(0, BODY_MAX), pinned: patch.pinned ? 1 : 0, expiresAt: patch.expiresAt, updatedAt: Date.now() })
		.where(and(eq(announcements.id, id), ownerCond(ownerId)));
}

export async function deleteAnnouncement(db: DB, id: string, ownerId: string | null): Promise<void> {
	await db.delete(announcements).where(and(eq(announcements.id, id), ownerCond(ownerId)));
}

export async function listAnnouncementsByOwner(db: DB, ownerId: string | null): Promise<Announcement[]> {
	return db
		.select()
		.from(announcements)
		.where(ownerCond(ownerId))
		.orderBy(desc(announcements.pinned), desc(announcements.createdAt));
}

/** The student matching rule from the spec: own class, or grade-wide from the token's issuer. */
export async function listAnnouncementsForStudent(
	db: DB,
	opts: { gradeId: string; tokenId: string; issuedBy: string | null },
): Promise<Announcement[]> {
	const now = Date.now();
	return db
		.select()
		.from(announcements)
		.where(
			and(
				eq(announcements.gradeId, opts.gradeId),
				or(
					eq(announcements.tokenId, opts.tokenId),
					and(isNull(announcements.tokenId), opts.issuedBy === null ? isNull(announcements.ownerId) : eq(announcements.ownerId, opts.issuedBy)),
				),
				or(isNull(announcements.expiresAt), gt(announcements.expiresAt, now)),
			),
		)
		.orderBy(desc(announcements.pinned), desc(announcements.createdAt));
}
