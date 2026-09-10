import { useEffect, useRef } from "react";
import { Form, Link, redirect, useActionData, data } from "react-router";
import type { Route } from "./+types/exerseaza";
import { gradeById, t, topicLabelBySlug, topicsForGrade } from "../config/subject";
import { getDb } from "../db/client";
import { getSecrets } from "../lib/env";
import { resolveViewer } from "../lib/guard";
import { signPayload, verifyPayload } from "../lib/crypto";
import { attemptsByTopic, countMistakes, countPublished, firstSentence, loadForScoring, normalizeNickname, questionsByIds, recordAttempt, sampleMistakes, sampleQuestions, scorePractice } from "../lib/questions";
import { assignmentQuestionIds, doneAssignmentIds, getAssignment, hasAssignmentAttempt, listOpenAssignmentsForStudent } from "../lib/assignments";
import { addNick, buildNickCookie, getStudentSession, isSecureRequest, readNickMap } from "../lib/session";
import { resolveNickname } from "../lib/nicknames";
import { getTokenById } from "../lib/tokens";
import { clientIp, RATE_LIMIT_MESSAGE, underLimit } from "../lib/ratelimit";
import { SiteHeader } from "../components/site";
import { PracticeTest, PracticeReview, Expired } from "../components/Practice";
import { Kicker, StampCircle } from "../components/atlas";
import { seo } from "../lib/seo";

export function meta(_: Route.MetaArgs) {
	return seo({ title: t("practice.cta"), path: "/exerseaza", noindex: true });
}

interface PracticePayload {
	ids: string[];
	gradeId: string;
	topicSlug: string | null;
	nickname: string;
	length: number;
	ts: number;
	mistakes?: boolean;
	assignmentId?: string;
	scored: Record<string, number>; // questionId -> first-attempt chosen option index
}

async function guardScope(request: Request, env: Env, gradeId: string) {
	const resolved = await resolveViewer(request, env);
	if (!resolved.isAdmin) {
		if (!resolved.isStudent) throw redirect("/intra");
		if (resolved.gradeId !== gradeId) throw redirect(`/clasa/${resolved.gradeId}/exerseaza`);
	}
	return resolved;
}

export async function loader({ request, context, params }: Route.LoaderArgs) {
	const env = context.cloudflare.env;
	const grade = gradeById(params.gradeId);
	if (!grade) throw new Response("Not found", { status: 404 });
	const resolved = await guardScope(request, env, params.gradeId);

	const db = getDb(env);
	const topics = await Promise.all(
		topicsForGrade(params.gradeId).map(async (tp) => ({ ...tp, count: await countPublished(db, params.gradeId, tp.slug) })),
	);
	const nickMap = await readNickMap(request, getSecrets(env).sessionSecret);
	const ownedKey = (nickMap[params.gradeId] ?? [])[0] ?? null;
	const mistakesCount = ownedKey ? await countMistakes(db, ownedKey, params.gradeId) : 0;
	const runsByTopic = ownedKey ? await attemptsByTopic(db, ownedKey, params.gradeId) : [];

	// Open teme for this student's class, with a „rezolvat" mark per device nickname.
	let teme: { id: string; title: string; count: number; dueAt: number | null; done: boolean }[] = [];
	if (resolved.isStudent && resolved.tokenId) {
		const token = await getTokenById(db, resolved.tokenId);
		if (token) {
			const open = await listOpenAssignmentsForStudent(db, { gradeId: params.gradeId, tokenId: token.id, issuedBy: token.issuedBy });
			const doneSet = await doneAssignmentIds(db, open.map((a) => a.id), nickMap[params.gradeId] ?? []);
			teme = open.map((a) => ({
				id: a.id,
				title: a.title,
				count: assignmentQuestionIds(a).length,
				dueAt: a.dueAt,
				done: doneSet.has(a.id),
			}));
		}
	}

	const requestedTopic = new URL(request.url).searchParams.get("topic");
	const initialTopic = requestedTopic && topics.some((tp) => tp.slug === requestedTopic && tp.count > 0) ? requestedTopic : null;

	return {
		grade,
		topics: topics.filter((tp) => tp.count > 0),
		wholeCount: await countPublished(db, params.gradeId, null),
		ownedNick: ownedKey,
		mistakesCount,
		runsByTopic,
		teme,
		initialTopic,
	};
}

export async function action({ request, context, params }: Route.ActionArgs) {
	const env = context.cloudflare.env;
	const gradeId = params.gradeId;
	if (!gradeById(gradeId)) throw new Response("Not found", { status: 404 });
	await guardScope(request, env, gradeId);

	const db = getDb(env);
	const secret = getSecrets(env).sessionSecret;
	const form = await request.formData();
	const intent = String(form.get("intent") ?? "");

	// Rate-limit key. A whole class sits behind one school NAT address, so keying on the IP
	// would let 30 pupils answering at once throttle each other. The per-session watermark is
	// unique per pupil session, so use it when present and fall back to the IP otherwise
	// (admin/teacher preview). Minting a fresh session still costs a TOKEN_LIMITER-ed login.
	const rlKey = (await getStudentSession(request, secret))?.wm ?? clientIp(request);

	if (intent === "start" || intent === "start-mistakes") {
		if (!(await underLimit(env, "NICK_LIMITER", `nick:${rlKey}`))) {
			return { phase: "config" as const, error: RATE_LIMIT_MESSAGE };
		}
		const nickname = String(form.get("nickname") ?? "").trim().slice(0, 40);
		if (!nickname) return { phase: "config" as const, error: "Scrie o poreclă (nu numele real)." };

		const nickMap = await readNickMap(request, secret);
		const owned = nickMap[gradeId] ?? [];
		const resolved = await resolveNickname(db, gradeId, nickname, owned);
		if (resolved.status === "collision") {
			return { phase: "config" as const, error: t("practice.nickname_taken") };
		}
		const setCookie = await buildNickCookie(addNick(nickMap, gradeId, resolved.key), secret, isSecureRequest(request));
		const length = Math.min(50, Math.max(1, Number(form.get("length")) || 10));

		if (intent === "start-mistakes") {
			const sampled = await sampleMistakes(db, resolved.key, gradeId, length);
			if (sampled.length === 0) {
				return data({ phase: "config" as const, notice: t("practice.mistakes_empty") }, { headers: { "Set-Cookie": setCookie } });
			}
			const payload: PracticePayload = { ids: sampled.map((s) => s.id), gradeId, topicSlug: null, nickname, length, ts: Date.now(), mistakes: true, scored: {} };
			return data(
				{ phase: "test" as const, questions: sampled, signed: await signPayload(payload, secret), nickname, topicSlug: null, length },
				{ headers: { "Set-Cookie": setCookie } },
			);
		}

		const scope = String(form.get("topicSlug") ?? "");
		const topicSlug = scope || null;
		const sampled = await sampleQuestions(db, gradeId, topicSlug, length);
		if (sampled.length === 0) return { phase: "config" as const, error: t("practice.empty") };
		const payload: PracticePayload = { ids: sampled.map((s) => s.id), gradeId, topicSlug, nickname, length, ts: Date.now(), scored: {} };
		return data(
			{ phase: "test" as const, questions: sampled, signed: await signPayload(payload, secret), nickname, topicSlug, length },
			{ headers: { "Set-Cookie": setCookie } },
		);
	}

	if (intent.startsWith("tema:")) {
		if (!(await underLimit(env, "NICK_LIMITER", `nick:${rlKey}`))) {
			return { phase: "config" as const, error: RATE_LIMIT_MESSAGE };
		}
		const assignmentId = intent.slice("tema:".length);
		const nickname = String(form.get("nickname") ?? "").trim().slice(0, 40);
		if (!nickname) return { phase: "config" as const, error: "Scrie o poreclă (nu numele real)." };
		const nickMap = await readNickMap(request, secret);
		const resolvedNick = await resolveNickname(db, gradeId, nickname, nickMap[gradeId] ?? []);
		if (resolvedNick.status === "collision") return { phase: "config" as const, error: t("practice.nickname_taken") };
		const setCookie = await buildNickCookie(addNick(nickMap, gradeId, resolvedNick.key), secret, isSecureRequest(request));

		const a = await getAssignment(db, assignmentId);
		if (!a || a.gradeId !== gradeId || a.closedAt !== null) return { phase: "config" as const, error: t("practice.empty") };
		// Server-side: the temă must actually target this student's class.
		const student = await getStudentSession(request, secret);
		if (student) {
			const tok = await getTokenById(db, student.tokenId);
			const matches = tok && (a.tokenId === tok.id || (a.tokenId === null && (a.ownerId ?? null) === (tok.issuedBy ?? null)));
			if (!matches) return { phase: "config" as const, error: t("practice.empty") };
		}
		const ids = assignmentQuestionIds(a);
		const qs = await questionsByIds(db, ids);
		if (qs.length === 0) return { phase: "config" as const, error: t("practice.empty") };
		const payload: PracticePayload = {
			ids: qs.map((q) => q.id),
			gradeId,
			topicSlug: a.topicSlug,
			nickname,
			length: qs.length,
			ts: Date.now(),
			assignmentId: a.id,
			scored: {},
		};
		return data(
			{ phase: "test" as const, questions: qs, signed: await signPayload(payload, secret), nickname, topicSlug: a.topicSlug, length: qs.length },
			{ headers: { "Set-Cookie": setCookie } },
		);
	}

	if (intent === "check") {
		if (!(await underLimit(env, "PRACTICE_LIMITER", `practice:${rlKey}`))) {
			return { phase: "expired" as const, error: RATE_LIMIT_MESSAGE };
		}
		const payload = await verifyPayload<PracticePayload>(String(form.get("signed") ?? ""), secret);
		if (!payload || payload.gradeId !== gradeId || Date.now() - payload.ts > 2 * 3600 * 1000) {
			return { phase: "expired" as const };
		}
		const questionId = String(form.get("questionId") ?? "");
		const chosen = Number(form.get("chosen") ?? -1);
		if (!payload.ids.includes(questionId)) {
			return { phase: "checked" as const, correct: false, signed: await signPayload(payload, secret) };
		}
		const map = await loadForScoring(db, [questionId]);
		const q = map.get(questionId);
		const correct = q ? chosen === q.correctIndex : false;
		if (q && !(questionId in payload.scored)) payload.scored[questionId] = chosen;
		return {
			phase: "checked" as const,
			correct,
			hint: correct ? undefined : firstSentence(q?.explanation ?? ""),
			explanation: correct ? q?.explanation ?? "" : undefined,
			signed: await signPayload(payload, secret),
		};
	}

	if (intent === "submit") {
		if (!(await underLimit(env, "PRACTICE_LIMITER", `practice:${rlKey}`))) {
			return { phase: "expired" as const, error: RATE_LIMIT_MESSAGE };
		}
		const payload = await verifyPayload<PracticePayload>(String(form.get("signed") ?? ""), secret);
		if (!payload || payload.gradeId !== gradeId || Date.now() - payload.ts > 2 * 3600 * 1000) {
			return { phase: "expired" as const };
		}
		const scoring = await loadForScoring(db, payload.ids);
		const items = payload.ids.map((id) => {
			const q = scoring.get(id);
			const chosen = payload.scored[id] ?? -1;
			const ok = q ? chosen === q.correctIndex : false;
			return {
				stem: q?.stem ?? "",
				options: q?.options ?? [],
				chosen,
				correctIndex: q?.correctIndex ?? -1,
				explanation: q?.explanation ?? "",
				ok,
				questionId: id,
			};
		});
		const student = await getStudentSession(request, secret);
		let ownerId: string | null = null;
		if (student) {
			const tok = await getTokenById(db, student.tokenId);
			ownerId = tok?.issuedBy ?? null;
		}
		// A temă counts only on the first attempt per nickname; re-runs are free practice.
		let assignmentId = payload.assignmentId ?? null;
		let alreadyDone = false;
		if (assignmentId) {
			const key = normalizeNickname(payload.nickname);
			if (await hasAssignmentAttempt(db, assignmentId, key)) {
				assignmentId = null;
				alreadyDone = true;
			}
		}
		await recordAttempt(db, {
			nickname: payload.nickname,
			gradeId: payload.gradeId,
			topicSlug: payload.topicSlug,
			ownerId,
			assignmentId,
			results: items.map((i) => ({ questionId: i.questionId, correct: i.ok })),
		});
		const { correct, total, pct, nota } = scorePractice(items.map((i) => i.ok));
		return {
			phase: "results" as const,
			items,
			correct,
			total,
			pct,
			nota,
			nickname: payload.nickname,
			topicSlug: payload.topicSlug,
			length: payload.length,
			alreadyDone,
		};
	}

	return { phase: "config" as const };
}

export default function Exerseaza({ loaderData }: Route.ComponentProps) {
	const { grade } = loaderData;
	const actionData = useActionData<typeof action>();
	const autoStart = Boolean(loaderData.initialTopic) && Boolean(loaderData.ownedNick) && !actionData;
	return (
		<div className="min-h-screen motion-playful">
			<SiteHeader
				right={
					<Link to={`/clasa/${grade.id}`} className="text-sm font-medium text-muted hover:text-ink">
						← {grade.label}
					</Link>
				}
			/>
			<main className="mx-auto max-w-2xl px-5 py-8">
				{actionData?.phase === "test" ? (
					<PracticeTest questions={actionData.questions} signed={actionData.signed} />
				) : actionData?.phase === "results" ? (
					<PracticeResults data={actionData} gradeId={grade.id} />
				) : actionData?.phase === "expired" ? (
					<Expired retryTo={`/clasa/${grade.id}/exerseaza`} />
				) : (
					<PracticeConfig
						data={loaderData}
						error={actionData?.phase === "config" ? (actionData as { error?: string }).error : undefined}
						notice={actionData?.phase === "config" ? (actionData as { notice?: string }).notice : undefined}
						autoStart={autoStart}
					/>
				)}
			</main>
		</div>
	);
}

function PracticeConfig({
	data,
	error,
	notice,
	autoStart,
}: {
	data: {
		grade: { id: string; label: string };
		topics: { slug: string; label: string; count: number }[];
		wholeCount: number;
		ownedNick?: string | null;
		mistakesCount?: number;
		runsByTopic?: { topicSlug: string | null; count: number }[];
		teme?: { id: string; title: string; count: number; dueAt: number | null; done: boolean }[];
		initialTopic?: string | null;
	};
	error?: string;
	notice?: string;
	autoStart: boolean;
}) {
	const formRef = useRef<HTMLFormElement>(null);
	const startBtnRef = useRef<HTMLButtonElement>(null);
	const submittedRef = useRef(false);
	useEffect(() => {
		if (autoStart && !submittedRef.current) {
			submittedRef.current = true;
			formRef.current?.requestSubmit(startBtnRef.current);
		}
	}, [autoStart]);

	if (data.wholeCount === 0) {
		return (
			<div className="cat-rise">
				<h1 className="mb-2 text-3xl font-bold">{t("practice.cta")}</h1>
				<p className="rounded-md border border-dashed border-border p-6 text-center text-muted">{t("practice.empty")}</p>
			</div>
		);
	}
	const mistakes = data.mistakesCount ?? 0;
	return (
		<div className="cat-rise">
			<Kicker>{t("practice.sheet")}</Kicker>
			<h1 className="mb-1 font-heading text-4xl font-bold">{t("practice.cta")}</h1>
			<p className="mb-6 text-muted">{data.grade.label}</p>
			<Form ref={formRef} method="post" className="plate paper grid gap-5 p-6 sm:p-8">
				<label className="grid gap-1.5 text-sm">
					<span className="text-muted">{t("practice.nickname")}</span>
					<input name="nickname" required maxLength={40} defaultValue={data.ownedNick ?? ""} placeholder="ex. Vulpe7" className="rounded-md border border-border bg-bg px-3 py-2.5 outline-none focus:border-primary focus:ring-2 focus:ring-primary/20" />
					<span className="text-xs text-muted">{t("practice.nickname_hint")}</span>
				</label>
				{(data.teme?.length ?? 0) > 0 && (
					<div className="grid gap-2">
						<span className="text-sm text-muted">{t("assignments.title")}</span>
						{data.teme!.map((a) => (
							<div key={a.id} className="flex items-center justify-between gap-3 rounded-md border border-border bg-bg px-3 py-2.5">
								<div className="min-w-0 text-sm">
									<span className="font-medium">{a.title}</span>
									<span className="ml-2 text-xs text-muted">
										{a.count} întrebări{a.dueAt ? ` · ${t("assignments.due_by")} ${new Date(a.dueAt).toLocaleDateString("ro-RO")}` : ""}
									</span>
								</div>
								{a.done ? (
									<span className="shrink-0 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700">{t("assignments.done")} ✓</span>
								) : (
									<button name="intent" value={`tema:${a.id}`} className="shrink-0 rounded-md bg-primary px-3 py-1.5 text-sm font-semibold text-on-primary hover:bg-primary-strong">
										{t("practice.start")}
									</button>
								)}
							</div>
						))}
					</div>
				)}
				<label className="grid gap-1.5 text-sm">
					<span className="text-muted">{t("practice.choose_topic")}</span>
					<select name="topicSlug" defaultValue={data.initialTopic ?? ""} className="rounded-md border border-border bg-bg px-3 py-2.5 outline-none focus:border-primary">
						<option value="">{t("practice.whole_grade")} ({data.wholeCount})</option>
						{data.topics.map((tp) => (
							<option key={tp.slug} value={tp.slug}>{tp.label} ({tp.count})</option>
						))}
					</select>
				</label>
				<label className="grid gap-1.5 text-sm">
					<span className="text-muted">{t("practice.length")}</span>
					<select name="length" defaultValue={data.initialTopic ? "20" : "10"} className="rounded-md border border-border bg-bg px-3 py-2.5 outline-none focus:border-primary">
						<option value="5">5</option>
						<option value="10">10</option>
						<option value="20">20</option>
					</select>
				</label>
				{error && <p className="rounded-md bg-accent/10 px-3 py-2 text-sm text-accent-strong">{error}</p>}
				{notice && <p className="rounded-md bg-primary/10 px-3 py-2 text-sm text-primary">{notice}</p>}
				<button ref={startBtnRef} name="intent" value="start" className="rounded-md bg-accent px-5 py-3 font-semibold text-on-accent transition hover:bg-accent-strong">
					{t("practice.start")}
				</button>
				<button
					formNoValidate
					name="intent"
					value="start-mistakes"
					className="rounded-md border border-accent px-5 py-2.5 text-sm font-semibold text-accent-strong transition hover:bg-accent/5"
				>
					{t("practice.mistakes_cta")}{mistakes > 0 ? ` (${mistakes})` : ""}
				</button>
			</Form>
			{(data.runsByTopic?.length ?? 0) > 0 && (
				<p className="mt-4 text-xs text-muted">
					{t("practice.previous_runs")}
					{data.ownedNick ? ` (${data.ownedNick})` : ""}:{" "}
					{data.runsByTopic!.map((r, i) => (
						<span key={r.topicSlug ?? "_all"}>
							{i > 0 ? " · " : ""}
							{topicLabelBySlug(r.topicSlug)} ×{r.count}
						</span>
					))}
				</p>
			)}
		</div>
	);
}

function PracticeResults({
	data,
	gradeId,
}: {
	data: {
		items: { stem: string; options: string[]; chosen: number; correctIndex: number; explanation: string; ok: boolean }[];
		correct: number;
		total: number;
		pct: number;
		nota: number;
		nickname: string;
		topicSlug: string | null;
		length: number;
		alreadyDone?: boolean;
	};
	gradeId: string;
}) {
	return (
		<div className="cat-rise grid gap-5">
			<div className="plate paper flex flex-col items-center justify-between gap-6 p-6 sm:flex-row sm:p-8">
				<div className="text-center sm:text-left">
					<p className="text-sm text-muted">{data.nickname} · {t("practice.score")}</p>
					<p className="my-1 font-heading text-4xl font-bold">{data.correct} / {data.total}</p>
					<p className="text-muted">{data.pct}% · {t("practice.grade_equiv")} <strong>{data.nota}</strong></p>
					{data.alreadyDone && (
						<p className="mt-3 rounded-md bg-primary/10 px-3 py-2 text-sm text-primary">{t("assignments.already_done")}</p>
					)}
					<Form method="post" className="mt-4">
						<input type="hidden" name="intent" value="start" />
						<input type="hidden" name="nickname" value={data.nickname} />
						<input type="hidden" name="topicSlug" value={data.topicSlug ?? ""} />
						<input type="hidden" name="length" value={data.length} />
						<button className="rounded-md bg-accent px-4 py-2 text-sm font-semibold text-on-accent transition hover:bg-accent-strong">
							{t("practice.again")}
						</button>
					</Form>
				</div>
				{/* Decorative: the score panel already announces the grade for screen readers. */}
				<div aria-hidden className="shrink-0 mx-auto sm:mx-0">
					<StampCircle className="h-28 w-28">
						<div className="text-center leading-none">
							<div className="font-heading text-4xl font-bold tabular-nums">{data.nota}</div>
							<div className="mt-1 text-[10px] font-semibold uppercase tracking-wider">{t("practice.grade_equiv")}</div>
						</div>
					</StampCircle>
				</div>
			</div>

			<PracticeReview items={data.items} />

			<Link to={`/clasa/${gradeId}`} className="text-center text-sm font-medium text-muted hover:text-ink">
				← Înapoi la materiale
			</Link>
		</div>
	);
}

