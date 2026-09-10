import { Form, Link, useActionData } from "react-router";
import type { Route } from "./+types/liber.exerseaza";
import { gradeById, t, topicsForGrade } from "../config/subject";
import { getDb } from "../db/client";
import { getSecrets } from "../lib/env";
import { signPayload, verifyPayload } from "../lib/crypto";
import { countPublished, firstSentence, loadForScoring, sampleQuestions, scorePractice } from "../lib/questions";
import { clientIp, RATE_LIMIT_MESSAGE, underLimit } from "../lib/ratelimit";
import { LiberFooter, LiberHeader } from "../components/liber/LiberChrome";
import { Breadcrumbs } from "../components/Breadcrumbs";
import { PracticeTest, PracticeReview, Expired } from "../components/Practice";
import { Kicker, StampCircle } from "../components/atlas";
import { seo } from "../lib/seo";
import { intrebariPlural } from "../lib/plural";
import { breadcrumbJsonLd, educationalLevelLabel, ldJson, learningResourceJsonLd, type CrumbRef } from "../lib/jsonld";

export function meta({ data }: Route.MetaArgs) {
	const path = `/elevi/${data?.grade.id ?? ""}/exerseaza`;
	// Titlul poartă și clasa. Ruta e aceeași pentru fiecare clasă din sitemap, deci un titlu fix
	// ar fi însemnat opt pagini distincte cu exact același `<title>` — semnalul clasic de
	// conținut duplicat. Nu e un șir nou de interfață: e eticheta clasei, aceeași pe care pagina
	// o scrie sub titlu. Fără `data` (ramura de eroare) rămâne titlul simplu, fără liniuță goală.
	const title = data ? `${t("practice.cta")} — ${data.grade.label}` : t("practice.cta");
	// Descrierea poartă clasa ȘI mărimea reală a bancului de întrebări — vezi `practice.seo.desc`.
	// Fără `data` cădem pe textul scurt de dinainte: mai bine o descriere slabă decât una cu
	// „{clasa}" neînlocuit tipărit în rezultatele Google.
	const description = data
		? t("practice.seo.desc")
				.replace("{clasa}", data.grade.label.toLowerCase())
				.replace("{n}", intrebariPlural(data.wholeCount))
		: t("practice.sheet.sub");
	return [
		...seo({
			title,
			description,
			path,
			origin: data?.origin,
		}),
		...ldJson(
			breadcrumbJsonLd(data?.crumbs ?? [], data?.origin),
			data
				? learningResourceJsonLd({
						name: title,
						description,
						path,
						origin: data.origin,
						// schema.org n-are un tip `Quiz`, iar unul inventat n-ar fi citit de nimeni
						// (vezi `docs/09-seo-strategy.md`): pagina rămâne `LearningResource`, iar
						// felul ei e spus în cuvintele sitului, cu cheia care denumește chiar
						// lucrul ăsta în interfață — „Fișă de exersare".
						learningResourceType: t("practice.sheet"),
						educationalLevel: educationalLevelLabel(data.grade.label),
						audienceRole: "student",
						interactivityType: "active",
						// NU se emite marcaj `Question`/`acceptedAnswer`. Răspunsul corect nu ajunge
						// niciodată la client (`lib/questions.ts`: se punctează pe server, din
						// mulțimea de id-uri semnată HMAC); un `acceptedAnswer` l-ar scrie chiar în
						// sursa paginii, adică exact scurgerea pe care o previne toată arhitectura
						// testului. Un răspuns fals, doar ca să existe marcajul, ar fi marcaj
						// mincinos — la fel de exclus.
					})
				: null,
		),
	];
}

/**
 * Testul de pe instanța liberă nu ține minte nimic: fără poreclă, fără cookie, fără
 * `practice_attempts`, fără `question_stats`. Suprafața de date personale rămâne zero, iar
 * analiza reală a profesoarei — de pe instanța cu clase — nu se murdărește cu trafic public.
 */
interface LiberPayload {
	ids: string[];
	gradeId: string;
	topicSlug: string | null;
	length: number;
	ts: number;
	scored: Record<string, number>; // questionId -> primul răspuns ales
}

const MAX_AGE_MS = 2 * 3600 * 1000;

export async function loader({ request, context, params }: Route.LoaderArgs) {
	const env = context.cloudflare.env;
	const grade = gradeById(params.gradeId);
	if (!grade) throw new Response("Not found", { status: 404 });

	const db = getDb(env);
	const topics = await Promise.all(
		topicsForGrade(params.gradeId).map(async (tp) => ({
			...tp,
			count: await countPublished(db, params.gradeId, tp.slug),
		})),
	);

	// Tema cerută prin ?topic= vine dintr-un link generat de GradeBrowse, dar tot e intrare
	// de utilizator: validăm că e o temă reală, cu întrebări publicate — altfel un slug ghicit
	// ar deveni un mod de a sonda banca de întrebări prin numărul afișat.
	const requestedTopic = new URL(request.url).searchParams.get("topic");
	const initialTopic =
		requestedTopic && topics.some((tp) => tp.slug === requestedTopic && tp.count > 0) ? requestedTopic : null;

	// Aceleași firimituri pentru navigarea vizibilă și pentru `BreadcrumbList`. Frunza e
	// „Testează-te" (`material.practice.title`), formularea cu care puntea de pe pagina de
	// material trimite aici — drumul citit în firimituri trebuie să sune ca linkul apăsat.
	const crumbs: CrumbRef[] = [
		{ label: t("crumb.home"), to: "/" },
		{ label: t("crumb.elevi"), to: "/elevi" },
		{ label: grade.label },
		{ label: t("material.practice.title") },
	];

	return {
		grade,
		crumbs,
		topics: topics.filter((tp) => tp.count > 0),
		wholeCount: await countPublished(db, params.gradeId, null),
		initialTopic,
		origin: new URL(request.url).origin,
	};
}

export async function action({ request, context, params }: Route.ActionArgs) {
	const env = context.cloudflare.env;
	const gradeId = params.gradeId;
	if (!gradeById(gradeId)) throw new Response("Not found", { status: 404 });

	const db = getDb(env);
	const secret = getSecrets(env).sessionSecret;
	const form = await request.formData();
	const intent = String(form.get("intent") ?? "");

	// Cheia rămâne prefixată cu „liber:" ca să nu se amestece cu găleata `practice:${rlKey}`
	// a instanței cu clase, deși cele două medii împart același `namespace_id` pentru
	// PRACTICE_LIMITER în wrangler.json — disjuncția vine din cheie, nu din binding.
	const rlKey = `liber:${clientIp(request)}`;

	if (intent === "start") {
		// Pornirea e suprafața de răzuit banca de întrebări: DEMO_LIMITER (mai strict) ține.
		if (!(await underLimit(env, "DEMO_LIMITER", rlKey))) {
			return { phase: "config" as const, error: RATE_LIMIT_MESSAGE };
		}
		const topicSlug = String(form.get("topicSlug") || "") || null;
		const length = Math.min(50, Math.max(1, Number(form.get("length")) || 10));
		const sampled = await sampleQuestions(db, gradeId, topicSlug, length);
		if (sampled.length === 0) return { phase: "config" as const, error: t("practice.empty") };
		const payload: LiberPayload = { ids: sampled.map((s) => s.id), gradeId, topicSlug, length, ts: Date.now(), scored: {} };
		return {
			phase: "test" as const,
			questions: sampled,
			signed: await signPayload(payload, secret),
		};
	}

	if (intent === "check") {
		// Un test de 20 de întrebări trimite 22 de cereri — DEMO_LIMITER (20/60s) l-ar arunca
		// pe la mijloc. PRACTICE_LIMITER (60/60s), ca pe instanța cu clase, ține pasul.
		if (!(await underLimit(env, "PRACTICE_LIMITER", rlKey))) {
			return { phase: "expired" as const, error: RATE_LIMIT_MESSAGE };
		}
		const payload = await verifyPayload<LiberPayload>(String(form.get("signed") ?? ""), secret);
		if (!payload || payload.gradeId !== gradeId || Date.now() - payload.ts > MAX_AGE_MS) {
			return { phase: "expired" as const };
		}
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
		if (!(await underLimit(env, "PRACTICE_LIMITER", rlKey))) {
			return { phase: "expired" as const, error: RATE_LIMIT_MESSAGE };
		}
		const payload = await verifyPayload<LiberPayload>(String(form.get("signed") ?? ""), secret);
		if (!payload || payload.gradeId !== gradeId || Date.now() - payload.ts > MAX_AGE_MS) {
			return { phase: "expired" as const };
		}
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
			topicSlug: payload.topicSlug,
			length: payload.length,
		};
	}

	return { phase: "config" as const, error: undefined as string | undefined };
}

export default function LiberExerseaza({ loaderData }: Route.ComponentProps) {
	const { grade, crumbs } = loaderData;
	const actionData = useActionData<typeof action>();
	return (
		<div className="min-h-screen motion-playful">
			<LiberHeader
				right={
					<Link to="/elevi" className="text-sm underline-offset-4 hover:underline">
						{t("liber.back.elevi")}
					</Link>
				}
			/>
			<main id="continut" tabIndex={-1} className="mx-auto max-w-2xl px-5 py-8">
				{/* Firimiturile stau deasupra tuturor fazelor, nu doar a configurării: marcajul
				    `BreadcrumbList` din `meta()` nu știe de faze, iar regula Google e ca marcajul
				    să corespundă cu ce se vede. În plus, în mijlocul unui test, drumul înapoi e
				    exact ce caută un elev care s-a rătăcit. */}
				<Breadcrumbs items={crumbs} className="mb-4" />
				{actionData?.phase === "test" ? (
					<PracticeTest questions={actionData.questions} signed={actionData.signed} />
				) : actionData?.phase === "results" ? (
					<LiberResults data={actionData} gradeId={grade.id} />
				) : actionData?.phase === "expired" ? (
					<Expired retryTo={`/elevi/${grade.id}/exerseaza`} message={actionData.error} />
				) : (
					<LiberConfig
						grade={grade}
						topics={loaderData.topics}
						wholeCount={loaderData.wholeCount}
						initialTopic={loaderData.initialTopic}
						error={actionData?.phase === "config" ? actionData.error : undefined}
					/>
				)}
			</main>
			<LiberFooter />
		</div>
	);
}

function LiberConfig({
	grade,
	topics,
	wholeCount,
	initialTopic,
	error,
}: {
	grade: { id: string; label: string };
	topics: { slug: string; label: string; count: number }[];
	wholeCount: number;
	initialTopic?: string | null;
	error?: string;
}) {
	if (wholeCount === 0) {
		return (
			<div className="cat-rise">
				<h1 className="mb-2 font-heading text-3xl font-bold">{t("practice.cta")}</h1>
				<p className="rounded-md border border-dashed border-border p-6 text-center text-muted">
					{t("practice.empty")}
				</p>
			</div>
		);
	}
	return (
		<div className="cat-rise">
			<Kicker>{t("practice.sheet")}</Kicker>
			<h1 className="mb-1 font-heading text-4xl font-bold">{t("practice.cta")}</h1>
			<p className="mb-6 text-muted">{grade.label}</p>
			<Form method="post" className="plate paper grid gap-5 p-6 sm:p-8">
				<label className="grid gap-1.5 text-sm">
					<span className="text-muted">{t("practice.choose_topic")}</span>
					<select
						name="topicSlug"
						defaultValue={initialTopic ?? ""}
						className="rounded-md border border-border bg-bg px-3 py-2.5 outline-none focus:border-primary"
					>
						<option value="">
							{t("practice.whole_grade")} ({wholeCount})
						</option>
						{topics.map((tp) => (
							<option key={tp.slug} value={tp.slug}>
								{tp.label} ({tp.count})
							</option>
						))}
					</select>
				</label>
				<label className="grid gap-1.5 text-sm">
					<span className="text-muted">{t("practice.length")}</span>
					<select
						name="length"
						defaultValue="10"
						className="rounded-md border border-border bg-bg px-3 py-2.5 outline-none focus:border-primary"
					>
						<option value="5">5</option>
						<option value="10">10</option>
						<option value="20">20</option>
					</select>
				</label>
				{error && <p className="rounded-md bg-accent/10 px-3 py-2 text-sm text-accent-strong">{error}</p>}
				<button
					name="intent"
					value="start"
					className="rounded-md bg-accent px-5 py-3 font-semibold text-on-accent transition hover:bg-accent-strong"
				>
					{t("practice.start")}
				</button>
			</Form>
		</div>
	);
}

function LiberResults({
	data,
	gradeId,
}: {
	data: {
		items: { stem: string; options: string[]; chosen: number; correctIndex: number; explanation: string; ok: boolean }[];
		correct: number;
		total: number;
		pct: number;
		nota: number;
		topicSlug: string | null;
		length: number;
	};
	gradeId: string;
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
						<input type="hidden" name="topicSlug" value={data.topicSlug ?? ""} />
						<input type="hidden" name="length" value={data.length} />
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

			<Link to="/elevi" className="text-center text-sm font-medium text-muted hover:text-ink">
				{t("liber.back.elevi")}
			</Link>
		</div>
	);
}
