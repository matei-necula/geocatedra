import { and, desc, eq, inArray, isNull, or } from "drizzle-orm";
import type { DB } from "../db/client";
import { assignments, practiceAttempts, type Assignment } from "../db/schema";
import { randomId } from "./crypto";
import { sampleQuestions } from "./questions";

export interface AssignmentInput {
	gradeId: string;
	tokenId: string | null;
	topicSlug: string | null;
	title: string;
	length: number;
	dueAt: number | null;
}

export function assignmentInputFromForm(form: FormData): AssignmentInput | { error: string } {
	const gradeId = String(form.get("gradeId") ?? "");
	const title = String(form.get("title") ?? "").trim().slice(0, 120);
	if (!gradeId) return { error: "Alege clasa." };
	if (!title) return { error: "Dă un titlu temei." };
	const length = Math.min(50, Math.max(1, Number(form.get("length")) || 10));
	const dueRaw = String(form.get("dueAt") ?? "").trim(); // yyyy-mm-dd
	return {
		gradeId,
		tokenId: String(form.get("tokenId") ?? "") || null,
		topicSlug: String(form.get("topicSlug") ?? "") || null,
		title,
		length,
		dueAt: dueRaw ? new Date(`${dueRaw}T23:59:59`).getTime() : null,
	};
}

function ownerCond(ownerId: string | null) {
	return ownerId === null ? isNull(assignments.ownerId) : eq(assignments.ownerId, ownerId);
}

/** Fixed set drawn ONCE here — every student gets the same questions. */
export async function createAssignment(
	db: DB,
	ownerId: string | null,
	input: AssignmentInput,
): Promise<{ id: string } | { error: string }> {
	const sampled = await sampleQuestions(db, input.gradeId, input.topicSlug, input.length);
	if (sampled.length < input.length) {
		return { error: `Doar ${sampled.length} întrebări publicate în această selecție — alege mai puține sau publică mai multe întrebări.` };
	}
	const id = randomId();
	await db.insert(assignments).values({
		id,
		ownerId,
		gradeId: input.gradeId,
		tokenId: input.tokenId,
		topicSlug: input.topicSlug,
		title: input.title,
		questionIdsJson: JSON.stringify(sampled.map((q) => q.id)),
		dueAt: input.dueAt,
		createdAt: Date.now(),
		closedAt: null,
	});
	return { id };
}

export async function getAssignment(db: DB, id: string): Promise<Assignment | null> {
	const rows = await db.select().from(assignments).where(eq(assignments.id, id)).limit(1);
	return rows[0] ?? null;
}

export function assignmentQuestionIds(a: Assignment): string[] {
	try {
		const arr = JSON.parse(a.questionIdsJson);
		return Array.isArray(arr) ? arr.map(String) : [];
	} catch {
		return [];
	}
}

export async function listAssignmentsByOwner(db: DB, ownerId: string | null): Promise<Assignment[]> {
	return db.select().from(assignments).where(ownerCond(ownerId)).orderBy(desc(assignments.createdAt));
}

/** Open teme for a student's class (same matching rule as announcements). */
export async function listOpenAssignmentsForStudent(
	db: DB,
	opts: { gradeId: string; tokenId: string; issuedBy: string | null },
): Promise<Assignment[]> {
	return db
		.select()
		.from(assignments)
		.where(
			and(
				eq(assignments.gradeId, opts.gradeId),
				isNull(assignments.closedAt),
				or(
					eq(assignments.tokenId, opts.tokenId),
					and(isNull(assignments.tokenId), opts.issuedBy === null ? isNull(assignments.ownerId) : eq(assignments.ownerId, opts.issuedBy)),
				),
			),
		)
		.orderBy(desc(assignments.createdAt));
}

export async function closeAssignment(db: DB, id: string, ownerId: string | null): Promise<void> {
	await db.update(assignments).set({ closedAt: Date.now() }).where(and(eq(assignments.id, id), ownerCond(ownerId)));
}

/** Deleting a temă keeps its attempts (they remain plain practice rows). */
export async function deleteAssignment(db: DB, id: string, ownerId: string | null): Promise<void> {
	await db.delete(assignments).where(and(eq(assignments.id, id), ownerCond(ownerId)));
}

export async function hasAssignmentAttempt(db: DB, assignmentId: string, nicknameKey: string): Promise<boolean> {
	const rows = await db
		.select({ id: practiceAttempts.id })
		.from(practiceAttempts)
		.where(and(eq(practiceAttempts.assignmentId, assignmentId), eq(practiceAttempts.nicknameKey, nicknameKey)))
		.limit(1);
	return rows.length > 0;
}

/** Which of these teme has ANY of the device's nicknames already solved? */
export async function doneAssignmentIds(db: DB, assignmentIds: string[], nicknameKeys: string[]): Promise<Set<string>> {
	if (assignmentIds.length === 0 || nicknameKeys.length === 0) return new Set();
	const rows = await db
		.select({ assignmentId: practiceAttempts.assignmentId })
		.from(practiceAttempts)
		.where(and(inArray(practiceAttempts.assignmentId, assignmentIds), inArray(practiceAttempts.nicknameKey, nicknameKeys)));
	return new Set(rows.map((r) => r.assignmentId).filter((x): x is string => x !== null));
}

export interface AssignmentResults {
	rows: { nickname: string; correct: number; total: number; pct: number; nota: number; createdAt: number; late: boolean }[];
	avgPct: number;
	completed: number;
}

export async function getAssignmentResults(db: DB, assignment: Assignment): Promise<AssignmentResults> {
	const attempts = await db
		.select()
		.from(practiceAttempts)
		.where(eq(practiceAttempts.assignmentId, assignment.id))
		.orderBy(desc(practiceAttempts.correct));
	let sumC = 0;
	let sumT = 0;
	const rows = attempts.map((a) => {
		sumC += a.correct;
		sumT += a.total;
		const pct = a.total > 0 ? Math.round((a.correct / a.total) * 100) : 0;
		return {
			nickname: a.nickname,
			correct: a.correct,
			total: a.total,
			pct,
			nota: a.total > 0 ? Math.round(1 + 9 * (a.correct / a.total)) : 1,
			createdAt: a.createdAt,
			late: assignment.dueAt !== null && a.createdAt > assignment.dueAt,
		};
	});
	return { rows, avgPct: sumT > 0 ? Math.round((sumC / sumT) * 100) : 0, completed: rows.length };
}
