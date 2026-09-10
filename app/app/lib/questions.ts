import { and, asc, desc, eq, inArray, isNull, sql } from "drizzle-orm";
import type { DB } from "../db/client";
import { questions, questionTranslations, practiceAttempts, questionStats, practiceMistakes } from "../db/schema";
import { randomId } from "./crypto";

export function normalizeNickname(raw: string): string {
	return raw.trim().toLowerCase().replace(/\s+/g, " ");
}

/** The explanation's first sentence — used as the wrong-answer hint (server-side only). */
export function firstSentence(text: string): string {
	const trimmed = (text ?? "").trim();
	if (!trimmed) return "";
	const m = trimmed.match(/^[\s\S]*?[.!?](\s|$)/);
	return (m ? m[0] : trimmed).trim();
}

/**
 * Nota de la finalul unui test — ține cont dacă elevul a răspuns corect din prima sau doar
 * după ce a văzut indiciul (explicația de la un răspuns greșit). UI-ul din `Practice.tsx` îl
 * obligă oricum să ajungă la răspunsul corect ca să treacă la întrebarea următoare, deci `ok`
 * (calculat din PRIMA încercare, vezi `scored` din payload-ul semnat) nu mai spune „a răspuns
 * corect", ci „a răspuns corect fără ajutor" — exact semnalul care trebuie să conteze la notă.
 * Corect din prima = credit 1; corect abia după indiciu = credit 0.5, nu 0 — recompensează
 * elevul care a înțeles explicația, dar tot îl diferențiază de cel care știa deja materia.
 */
export function scorePractice(oks: boolean[]): { correct: number; total: number; pct: number; nota: number } {
	const total = oks.length;
	const correct = oks.filter(Boolean).length;
	if (total === 0) return { correct: 0, total: 0, pct: 0, nota: 1 };
	const credit = oks.reduce((sum, ok) => sum + (ok ? 1 : 0.5), 0);
	return {
		correct,
		total,
		pct: Math.round((credit / total) * 100),
		nota: Math.round(1 + 9 * (credit / total)),
	};
}

/** How many practice sets a nickname has completed, grouped by topic (null = whole grade). */
export async function attemptsByTopic(
	db: DB,
	nicknameKey: string,
	gradeId: string,
): Promise<{ topicSlug: string | null; count: number }[]> {
	const rows = await db
		.select({ topicSlug: practiceAttempts.topicSlug, count: sql<number>`COUNT(*)` })
		.from(practiceAttempts)
		.where(and(eq(practiceAttempts.nicknameKey, nicknameKey), eq(practiceAttempts.gradeId, gradeId)))
		.groupBy(practiceAttempts.topicSlug);
	return rows.map((r) => ({ topicSlug: r.topicSlug, count: Number(r.count) }));
}

export interface QuestionInput {
	gradeId: string;
	topicSlug: string;
	status: string;
	stem: string;
	options: string[];
	correctIndex: number;
	explanation: string;
	position: number;
}

export interface AdminQuestionRow {
	id: string;
	gradeId: string;
	topicSlug: string;
	status: string;
	position: number;
	correctIndex: number;
	stem: string;
	options: string[];
	explanation: string;
}

function safeOptions(json: string | null): string[] {
	try {
		const a = JSON.parse(json ?? "[]");
		return Array.isArray(a) ? a.map(String) : [];
	} catch {
		return [];
	}
}

async function nextQuestionPosition(db: DB, gradeId: string, topicSlug: string): Promise<number> {
	const rows = await db
		.select({ max: sql<number>`COALESCE(MAX(${questions.position}), 0)` })
		.from(questions)
		.where(and(eq(questions.gradeId, gradeId), eq(questions.topicSlug, topicSlug)));
	return (rows[0]?.max ?? 0) + 1;
}

export async function questionInputFromForm(db: DB, form: FormData): Promise<QuestionInput> {
	const gradeId = String(form.get("gradeId") ?? "");
	const topicSlug = String(form.get("topicSlug") ?? "");
	let options: string[] = [];
	try {
		const parsed = JSON.parse(String(form.get("options_json") ?? "[]"));
		if (Array.isArray(parsed)) options = parsed.map((s) => String(s).trim()).filter((s) => s.length > 0);
	} catch {
		options = [];
	}
	const correctIndex = Math.max(0, Number(form.get("correctIndex") ?? 0));
	const posRaw = String(form.get("position") ?? "").trim();
	const position =
		posRaw && !Number.isNaN(Number(posRaw)) ? Number(posRaw) : await nextQuestionPosition(db, gradeId, topicSlug);
	return {
		gradeId,
		topicSlug,
		status: String(form.get("status") || "draft"),
		stem: String(form.get("stem") ?? "").trim(),
		options,
		correctIndex: correctIndex < options.length ? correctIndex : 0,
		explanation: String(form.get("explanation") ?? "").trim(),
		position,
	};
}

export async function createQuestion(db: DB, input: QuestionInput): Promise<string> {
	const id = randomId();
	const now = Date.now();
	await db.insert(questions).values({
		id,
		gradeId: input.gradeId,
		topicSlug: input.topicSlug,
		status: input.status,
		correctIndex: input.correctIndex,
		position: input.position,
		createdAt: now,
		updatedAt: now,
	});
	await db.insert(questionTranslations).values({
		questionId: id,
		locale: "ro",
		stem: input.stem,
		optionsJson: JSON.stringify(input.options),
		explanation: input.explanation,
	});
	return id;
}

export async function updateQuestion(db: DB, id: string, input: QuestionInput): Promise<void> {
	await db
		.update(questions)
		.set({
			gradeId: input.gradeId,
			topicSlug: input.topicSlug,
			status: input.status,
			correctIndex: input.correctIndex,
			position: input.position,
			updatedAt: Date.now(),
		})
		.where(eq(questions.id, id));
	await db
		.insert(questionTranslations)
		.values({
			questionId: id,
			locale: "ro",
			stem: input.stem,
			optionsJson: JSON.stringify(input.options),
			explanation: input.explanation,
		})
		.onConflictDoUpdate({
			target: [questionTranslations.questionId, questionTranslations.locale],
			set: { stem: input.stem, optionsJson: JSON.stringify(input.options), explanation: input.explanation },
		});
}

export async function deleteQuestion(db: DB, id: string): Promise<void> {
	await db.delete(questionTranslations).where(eq(questionTranslations.questionId, id));
	await db.delete(questions).where(eq(questions.id, id));
	await db.delete(questionStats).where(eq(questionStats.questionId, id));
	await db.delete(practiceMistakes).where(eq(practiceMistakes.questionId, id));
}

export async function listQuestionsForAdmin(db: DB, locale: string): Promise<AdminQuestionRow[]> {
	const rows = await db
		.select()
		.from(questions)
		.leftJoin(
			questionTranslations,
			and(eq(questionTranslations.questionId, questions.id), eq(questionTranslations.locale, locale)),
		)
		.orderBy(asc(questions.gradeId), asc(questions.topicSlug), asc(questions.position));
	return rows.map((r) => ({
		id: r.questions.id,
		gradeId: r.questions.gradeId,
		topicSlug: r.questions.topicSlug,
		status: r.questions.status,
		position: r.questions.position,
		correctIndex: r.questions.correctIndex,
		stem: r.question_translations?.stem ?? "(fără text)",
		options: safeOptions(r.question_translations?.optionsJson ?? "[]"),
		explanation: r.question_translations?.explanation ?? "",
	}));
}

export async function getQuestion(db: DB, id: string, locale: string): Promise<AdminQuestionRow | null> {
	const rows = await db
		.select()
		.from(questions)
		.leftJoin(
			questionTranslations,
			and(eq(questionTranslations.questionId, questions.id), eq(questionTranslations.locale, locale)),
		)
		.where(eq(questions.id, id))
		.limit(1);
	const r = rows[0];
	if (!r) return null;
	return {
		id: r.questions.id,
		gradeId: r.questions.gradeId,
		topicSlug: r.questions.topicSlug,
		status: r.questions.status,
		position: r.questions.position,
		correctIndex: r.questions.correctIndex,
		stem: r.question_translations?.stem ?? "",
		options: safeOptions(r.question_translations?.optionsJson ?? "[]"),
		explanation: r.question_translations?.explanation ?? "",
	};
}

/** Count of published questions in scope (drives entry points / max length). */
export async function countPublished(db: DB, gradeId: string, topicSlug: string | null): Promise<number> {
	const conds = [eq(questions.gradeId, gradeId), eq(questions.status, "published")];
	if (topicSlug) conds.push(eq(questions.topicSlug, topicSlug));
	const rows = await db.select({ c: sql<number>`count(*)` }).from(questions).where(and(...conds));
	return Number(rows[0]?.c ?? 0);
}

export interface SampledQuestion {
	id: string;
	stem: string;
	options: string[];
}

/** Random published questions in scope — WITHOUT correct answers (never sent to client). */
export async function sampleQuestions(
	db: DB,
	gradeId: string,
	topicSlug: string | null,
	n: number,
	locale = "ro",
): Promise<SampledQuestion[]> {
	const conds = [eq(questions.gradeId, gradeId), eq(questions.status, "published")];
	if (topicSlug) conds.push(eq(questions.topicSlug, topicSlug));
	const rows = await db
		.select({ id: questions.id, stem: questionTranslations.stem, optionsJson: questionTranslations.optionsJson })
		.from(questions)
		.leftJoin(
			questionTranslations,
			and(eq(questionTranslations.questionId, questions.id), eq(questionTranslations.locale, locale)),
		)
		.where(and(...conds))
		.orderBy(sql`RANDOM()`)
		.limit(n);
	return rows.map((r) => ({ id: r.id, stem: r.stem ?? "", options: safeOptions(r.optionsJson) }));
}

/** Published questions by id, input order preserved — WITHOUT correct answers. */
export async function questionsByIds(db: DB, ids: string[], locale = "ro"): Promise<SampledQuestion[]> {
	if (ids.length === 0) return [];
	const rows = await db
		.select({ id: questions.id, stem: questionTranslations.stem, optionsJson: questionTranslations.optionsJson })
		.from(questions)
		.leftJoin(
			questionTranslations,
			and(eq(questionTranslations.questionId, questions.id), eq(questionTranslations.locale, locale)),
		)
		.where(and(inArray(questions.id, ids), eq(questions.status, "published")));
	const byId = new Map(rows.map((r) => [r.id, { id: r.id, stem: r.stem ?? "", options: safeOptions(r.optionsJson) }]));
	return ids.map((id) => byId.get(id)).filter((q): q is SampledQuestion => q !== undefined);
}

export async function loadForScoring(
	db: DB,
	ids: string[],
	locale = "ro",
): Promise<Map<string, { correctIndex: number; stem: string; options: string[]; explanation: string }>> {
	if (ids.length === 0) return new Map();
	const rows = await db
		.select({
			id: questions.id,
			correctIndex: questions.correctIndex,
			stem: questionTranslations.stem,
			optionsJson: questionTranslations.optionsJson,
			explanation: questionTranslations.explanation,
		})
		.from(questions)
		.leftJoin(
			questionTranslations,
			and(eq(questionTranslations.questionId, questions.id), eq(questionTranslations.locale, locale)),
		)
		.where(inArray(questions.id, ids));
	const map = new Map<string, { correctIndex: number; stem: string; options: string[]; explanation: string }>();
	for (const r of rows) {
		map.set(r.id, {
			correctIndex: r.correctIndex,
			stem: r.stem ?? "",
			options: safeOptions(r.optionsJson),
			explanation: r.explanation ?? "",
		});
	}
	return map;
}

export async function recordAttempt(
	db: DB,
	opts: {
		nickname: string;
		gradeId: string;
		topicSlug: string | null;
		ownerId: string | null;
		assignmentId?: string | null;
		results: { questionId: string; correct: boolean }[];
	},
): Promise<void> {
	const total = opts.results.length;
	const correct = opts.results.filter((r) => r.correct).length;
	await db.insert(practiceAttempts).values({
		id: randomId(),
		nickname: opts.nickname,
		nicknameKey: normalizeNickname(opts.nickname),
		gradeId: opts.gradeId,
		topicSlug: opts.topicSlug,
		ownerId: opts.ownerId,
		assignmentId: opts.assignmentId ?? null,
		total,
		correct,
		createdAt: Date.now(),
	});
	for (const r of opts.results) {
		await db
			.insert(questionStats)
			.values({ questionId: r.questionId, timesShown: 1, timesCorrect: r.correct ? 1 : 0 })
			.onConflictDoUpdate({
				target: questionStats.questionId,
				set: {
					timesShown: sql`${questionStats.timesShown} + 1`,
					timesCorrect: sql`${questionStats.timesCorrect} + ${r.correct ? 1 : 0}`,
				},
			});
	}
	// Greșelile mele: a wrong answer is remembered, a correct answer prunes it (mastered).
	const nicknameKey = normalizeNickname(opts.nickname);
	for (const r of opts.results) {
		if (r.correct) {
			await db
				.delete(practiceMistakes)
				.where(
					and(
						eq(practiceMistakes.nicknameKey, nicknameKey),
						eq(practiceMistakes.gradeId, opts.gradeId),
						eq(practiceMistakes.questionId, r.questionId),
					),
				);
		} else {
			await db
				.insert(practiceMistakes)
				.values({ nicknameKey, gradeId: opts.gradeId, questionId: r.questionId, missedAt: Date.now() })
				.onConflictDoNothing();
		}
	}
}

/** How many of a nickname's missed questions are still answerable (published). */
export async function countMistakes(db: DB, nicknameKey: string, gradeId: string): Promise<number> {
	const rows = await db
		.select({ c: sql<number>`count(*)` })
		.from(practiceMistakes)
		.innerJoin(questions, eq(questions.id, practiceMistakes.questionId))
		.where(
			and(
				eq(practiceMistakes.nicknameKey, nicknameKey),
				eq(practiceMistakes.gradeId, gradeId),
				eq(questions.status, "published"),
			),
		);
	return Number(rows[0]?.c ?? 0);
}

/** A nickname's missed questions, newest-missed first, published only — answers NOT included. */
export async function sampleMistakes(
	db: DB,
	nicknameKey: string,
	gradeId: string,
	n: number,
	locale = "ro",
): Promise<SampledQuestion[]> {
	const rows = await db
		.select({ id: questions.id, stem: questionTranslations.stem, optionsJson: questionTranslations.optionsJson })
		.from(practiceMistakes)
		.innerJoin(questions, eq(questions.id, practiceMistakes.questionId))
		.leftJoin(
			questionTranslations,
			and(eq(questionTranslations.questionId, questions.id), eq(questionTranslations.locale, locale)),
		)
		.where(
			and(
				eq(practiceMistakes.nicknameKey, nicknameKey),
				eq(practiceMistakes.gradeId, gradeId),
				eq(questions.status, "published"),
			),
		)
		.orderBy(desc(practiceMistakes.missedAt))
		.limit(n);
	return rows.map((r) => ({ id: r.id, stem: r.stem ?? "", options: safeOptions(r.optionsJson) }));
}

export interface ResultsView {
	perNickname: { nickname: string; attempts: number; avgPct: number; lastAt: number; byTopic: { topicSlug: string | null; count: number }[] }[];
	totalAttempts: number;
	avgPct: number;
	distribution: { label: string; count: number }[];
	hardest: { stem: string; correctPct: number; shown: number }[];
}

export async function getResults(db: DB, opts: { gradeId?: string; owner?: string | null } = {}): Promise<ResultsView> {
	const gradeCond = opts.gradeId ? eq(practiceAttempts.gradeId, opts.gradeId) : undefined;
	const ownerCond =
		opts.owner === undefined ? undefined : opts.owner === null ? isNull(practiceAttempts.ownerId) : eq(practiceAttempts.ownerId, opts.owner);
	const whereAttempts = and(gradeCond, ownerCond);

	const grouped = await db
		.select({
			key: practiceAttempts.nicknameKey,
			name: sql<string>`MAX(${practiceAttempts.nickname})`,
			attempts: sql<number>`COUNT(*)`,
			sumCorrect: sql<number>`SUM(${practiceAttempts.correct})`,
			sumTotal: sql<number>`SUM(${practiceAttempts.total})`,
			last: sql<number>`MAX(${practiceAttempts.createdAt})`,
		})
		.from(practiceAttempts)
		.where(whereAttempts)
		.groupBy(practiceAttempts.nicknameKey)
		.orderBy(desc(sql`MAX(${practiceAttempts.createdAt})`));

	const topicRows = await db
		.select({
			key: practiceAttempts.nicknameKey,
			topicSlug: practiceAttempts.topicSlug,
			count: sql<number>`COUNT(*)`,
		})
		.from(practiceAttempts)
		.where(whereAttempts)
		.groupBy(practiceAttempts.nicknameKey, practiceAttempts.topicSlug);
	const byKey = new Map<string, { topicSlug: string | null; count: number }[]>();
	for (const r of topicRows) {
		const arr = byKey.get(r.key) ?? [];
		arr.push({ topicSlug: r.topicSlug, count: Number(r.count) });
		byKey.set(r.key, arr);
	}

	const perNickname = grouped.map((g) => ({
		nickname: g.name,
		attempts: Number(g.attempts),
		avgPct: Number(g.sumTotal) > 0 ? Math.round((Number(g.sumCorrect) / Number(g.sumTotal)) * 100) : 0,
		lastAt: Number(g.last),
		byTopic: byKey.get(g.key) ?? [],
	}));

	const all = await db
		.select({ correct: practiceAttempts.correct, total: practiceAttempts.total })
		.from(practiceAttempts)
		.where(whereAttempts);
	const buckets = { "<50%": 0, "50–70%": 0, "70–85%": 0, "85–100%": 0 };
	let sumC = 0;
	let sumT = 0;
	for (const a of all) {
		sumC += a.correct;
		sumT += a.total;
		const pct = a.total > 0 ? (a.correct / a.total) * 100 : 0;
		if (pct < 50) buckets["<50%"]++;
		else if (pct < 70) buckets["50–70%"]++;
		else if (pct < 85) buckets["70–85%"]++;
		else buckets["85–100%"]++;
	}

	const statRows = await db
		.select({
			stem: questionTranslations.stem,
			shown: questionStats.timesShown,
			correct: questionStats.timesCorrect,
		})
		.from(questionStats)
		.innerJoin(questions, eq(questions.id, questionStats.questionId))
		.leftJoin(
			questionTranslations,
			and(eq(questionTranslations.questionId, questions.id), eq(questionTranslations.locale, "ro")),
		)
		.where(and(opts.gradeId ? eq(questions.gradeId, opts.gradeId) : undefined, sql`${questionStats.timesShown} > 0`))
		.orderBy(asc(sql`(${questionStats.timesCorrect} * 1.0 / ${questionStats.timesShown})`))
		.limit(10);

	return {
		perNickname,
		totalAttempts: all.length,
		avgPct: sumT > 0 ? Math.round((sumC / sumT) * 100) : 0,
		distribution: Object.entries(buckets).map(([label, count]) => ({ label, count })),
		hardest: statRows.map((s) => ({
			stem: s.stem ?? "",
			shown: Number(s.shown),
			correctPct: Number(s.shown) > 0 ? Math.round((Number(s.correct) / Number(s.shown)) * 100) : 0,
		})),
	};
}

export async function deleteAllAttempts(db: DB, gradeId?: string): Promise<void> {
	if (gradeId) {
		await db.delete(practiceAttempts).where(eq(practiceAttempts.gradeId, gradeId));
		await db.delete(practiceMistakes).where(eq(practiceMistakes.gradeId, gradeId));
		await db
			.delete(questionStats)
			.where(inArray(questionStats.questionId, db.select({ id: questions.id }).from(questions).where(eq(questions.gradeId, gradeId))));
	} else {
		await db.delete(practiceAttempts);
		await db.delete(practiceMistakes);
		await db.delete(questionStats);
	}
}
