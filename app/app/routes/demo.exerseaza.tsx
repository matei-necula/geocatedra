import { Form, Link, useActionData } from "react-router";
import type { Route } from "./+types/demo.exerseaza";
import { subjectConfig, t } from "../config/subject";
import { getDb } from "../db/client";
import { getSecrets } from "../lib/env";
import { signPayload, verifyPayload } from "../lib/crypto";
import { countPublished, firstSentence, loadForScoring, sampleQuestions, scorePractice } from "../lib/questions";
import { clientIp, RATE_LIMIT_MESSAGE, underLimit } from "../lib/ratelimit";
import { SiteHeader, SiteFooter } from "../components/site";
import { PracticeTest, PracticeReview, Expired } from "../components/Practice";
import { Kicker, StampCircle } from "../components/atlas";
import { seo } from "../lib/seo";

export function meta({ data }: Route.MetaArgs) {
	return seo({
		title: t("demo.quiz.title"),
		description: t("demo.quiz.desc"),
		path: "/demo/exerseaza",
		origin: data?.origin,
	});
}

/**
 * Testul din vitrină nu ține minte nimic: fără poreclă, fără `practice_attempts`, fără
 * `question_stats`. Suprafața de date personale rămâne zero, iar analiza reală a
 * profesoarei nu se murdărește cu trafic de marketing.
 */
interface DemoPayload {
	ids: string[];
	ts: number;
	scored: Record<string, number>;
}

const MAX_AGE_MS = 2 * 3600 * 1000;

export async function loader({ request, context }: Route.LoaderArgs) {
	const db = getDb(context.cloudflare.env);
	return {
		available: await countPublished(db, subjectConfig.demo.quizGradeId, null),
		length: subjectConfig.demo.quizLength,
		origin: new URL(request.url).origin,
	};
}

export async function action({ request, context }: Route.ActionArgs) {
	const env = context.cloudflare.env;
	const db = getDb(env);
	const secret = getSecrets(env).sessionSecret;
	const form = await request.formData();
	const intent = String(form.get("intent") ?? "");

	// Endpoint deschis: fără limită ar fi un răzuitor gratuit de bancă de întrebări.
	if (!(await underLimit(env, "DEMO_LIMITER", `demo:${clientIp(request)}`))) {
		return { phase: "expired" as const, error: RATE_LIMIT_MESSAGE };
	}

	if (intent === "start") {
		const sampled = await sampleQuestions(
			db,
			subjectConfig.demo.quizGradeId,
			null, // toate temele — testul din vitrină e mixt
			subjectConfig.demo.quizLength,
		);
		if (sampled.length === 0) return { phase: "config" as const, error: t("practice.empty") };
		// (fiecare ramură "config" întoarce câmpul `error`, ca uniunea discriminată să-l
		//  lase citit fără cast în componentă)
		const payload: DemoPayload = { ids: sampled.map((s) => s.id), ts: Date.now(), scored: {} };
		return {
			phase: "test" as const,
			questions: sampled,
			signed: await signPayload(payload, secret),
		};
	}

	if (intent === "check") {
		const payload = await verifyPayload<DemoPayload>(String(form.get("signed") ?? ""), secret);
		if (!payload || Date.now() - payload.ts > MAX_AGE_MS) return { phase: "expired" as const };
		const questionId = String(form.get("questionId") ?? "");
		const chosen = Number(form.get("chosen") ?? -1);
		if (!payload.ids.includes(questionId)) {
			return { phase: "checked" as const, correct: false, signed: await signPayload(payload, secret) };
		}
		const q = (await loadForScoring(db, [questionId])).get(questionId);
		const correct = q ? chosen === q.correctIndex : false;
		if (q && !(questionId in payload.scored)) payload.scored[questionId] = chosen;
		return {
			phase: "checked" as const,
			correct,
			hint: correct ? undefined : firstSentence(q?.explanation ?? ""),
			explanation: correct ? (q?.explanation ?? "") : undefined,
			signed: await signPayload(payload, secret),
		};
	}

	if (intent === "submit") {
		const payload = await verifyPayload<DemoPayload>(String(form.get("signed") ?? ""), secret);
		if (!payload || Date.now() - payload.ts > MAX_AGE_MS) return { phase: "expired" as const };
		const scoring = await loadForScoring(db, payload.ids);
		const items = payload.ids.map((id) => {
			const q = scoring.get(id);
			const chosen = payload.scored[id] ?? -1;
			return {
				stem: q?.stem ?? "",
				options: q?.options ?? [],
				chosen,
				correctIndex: q?.correctIndex ?? -1,
				explanation: q?.explanation ?? "",
				ok: q ? chosen === q.correctIndex : false,
			};
		});
		const { correct, total, pct, nota } = scorePractice(items.map((i) => i.ok));
		// Nicio scriere în bază. Intenționat.
		return {
			phase: "results" as const,
			items,
			correct,
			total,
			pct,
			nota,
		};
	}

	return { phase: "config" as const, error: undefined as string | undefined };
}

export default function DemoExerseaza({ loaderData }: Route.ComponentProps) {
	const actionData = useActionData<typeof action>();
	return (
		<div className="min-h-screen motion-playful">
			<SiteHeader
				right={
					<Link to="/demo" viewTransition className="text-sm font-medium text-muted hover:text-ink">
						← {t("demo.back")}
					</Link>
				}
			/>
			<main className="mx-auto max-w-2xl px-5 py-8">
				{actionData?.phase === "test" ? (
					<PracticeTest questions={actionData.questions} signed={actionData.signed} />
				) : actionData?.phase === "results" ? (
					<DemoResults data={actionData} />
				) : actionData?.phase === "expired" ? (
					<Expired retryTo="/demo/exerseaza" message={actionData.error} />
				) : (
					<DemoConfig
						available={loaderData.available}
						length={loaderData.length}
						error={actionData?.phase === "config" ? actionData.error : undefined}
					/>
				)}
				<SiteFooter />
			</main>
		</div>
	);
}

function DemoConfig({ available, length, error }: { available: number; length: number; error?: string }) {
	if (available === 0) {
		return (
			<div className="cat-rise">
				<h1 className="mb-2 font-heading text-3xl font-bold">{t("demo.quiz.title")}</h1>
				<p className="rounded-md border border-dashed border-border p-6 text-center text-muted">
					{t("practice.empty")}
				</p>
			</div>
		);
	}
	return (
		<div className="cat-rise">
			<Kicker>{t("demo.kicker")}</Kicker>
			<h1 className="mb-1 font-heading text-4xl font-bold">{t("demo.quiz.title")}</h1>
			<p className="mb-6 text-muted">{t("demo.quiz.desc")}</p>
			<Form method="post" className="plate paper grid gap-5 p-6 sm:p-8">
				<p className="text-sm text-muted">{t("demo.quiz.note").replace("{n}", String(length))}</p>
				{error && <p className="rounded-md bg-accent/10 px-3 py-2 text-sm text-accent-strong">{error}</p>}
				<button
					name="intent"
					value="start"
					className="rounded-md bg-accent px-5 py-3 font-semibold text-on-accent transition hover:bg-accent-strong"
				>
					{t("demo.quiz.start")}
				</button>
			</Form>
		</div>
	);
}

function DemoResults({
	data,
}: {
	data: {
		items: { stem: string; options: string[]; chosen: number; correctIndex: number; explanation: string; ok: boolean }[];
		correct: number;
		total: number;
		pct: number;
		nota: number;
	};
}) {
	return (
		<div className="cat-rise grid gap-5">
			<div className="plate paper flex flex-col items-center justify-between gap-6 p-6 sm:flex-row sm:p-8">
				<div className="text-center sm:text-left">
					<p className="text-sm text-muted">{t("practice.score")}</p>
					<p className="my-1 font-heading text-4xl font-bold">
						{data.correct} / {data.total}
					</p>
					<p className="text-muted">
						{data.pct}% · {t("practice.grade_equiv")} <strong>{data.nota}</strong>
					</p>
					<Form method="post" className="mt-4">
						<button
							name="intent"
							value="start"
							className="rounded-md bg-accent px-4 py-2 text-sm font-semibold text-on-accent transition hover:bg-accent-strong"
						>
							{t("practice.again")}
						</button>
					</Form>
				</div>
				<div aria-hidden className="mx-auto shrink-0 sm:mx-0">
					<StampCircle className="h-28 w-28">
						<div className="text-center leading-none">
							<div className="font-heading text-4xl font-bold tabular-nums">{data.nota}</div>
							<div className="mt-1 text-[10px] font-semibold tracking-wider uppercase">
								{t("practice.grade_equiv")}
							</div>
						</div>
					</StampCircle>
				</div>
			</div>

			<PracticeReview items={data.items} />

			<div className="flex flex-col gap-3 sm:flex-row">
				<Link
					to="/intra"
					className="flex-1 rounded-lg border border-border px-5 py-3 text-center font-semibold transition hover:border-primary"
				>
					{t("demo.cta.student")}
				</Link>
				<Link
					to="/profesor/inregistrare"
					className="flex-1 rounded-lg bg-accent px-5 py-3 text-center font-semibold text-on-accent transition hover:bg-accent-strong"
				>
					{t("demo.cta.teacher")}
				</Link>
			</div>
		</div>
	);
}
