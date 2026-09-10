import { Form, redirect, useActionData } from "react-router";
import type { Route } from "./+types/profesor.exerseaza";
import { gradeById, subjectConfig, t } from "../config/subject";
import { getDb } from "../db/client";
import { getTeacher } from "../lib/guard";
import { getSecrets } from "../lib/env";
import { signPayload, verifyPayload } from "../lib/crypto";
import { countPublished, loadForScoring, sampleQuestions } from "../lib/questions";
import { TeacherShell } from "../components/TeacherShell";
import { PracticeTest, PracticeReview, Expired, type ReviewItem } from "../components/Practice";
import { seo } from "../lib/seo";

export function meta(_: Route.MetaArgs) {
	return seo({ title: "Exersează (previzualizare)", path: "/profesor/exerseaza", noindex: true });
}

interface PreviewPayload {
	ids: string[];
	gradeId: string;
	length: number;
	ts: number;
}

export async function loader({ request, context }: Route.LoaderArgs) {
	const env = context.cloudflare.env;
	const teacher = await getTeacher(request, env);
	if (!teacher) throw redirect("/profesor/login");
	const db = getDb(env);
	const grades = await Promise.all(
		subjectConfig.grades.map(async (g) => ({ id: g.id, label: g.label, count: await countPublished(db, g.id, null) })),
	);
	return { grades: grades.filter((g) => g.count > 0), email: teacher.email };
}

export async function action({ request, context }: Route.ActionArgs) {
	const env = context.cloudflare.env;
	const teacher = await getTeacher(request, env);
	if (!teacher) throw redirect("/profesor/login");
	const db = getDb(env);
	const secret = getSecrets(env).sessionSecret;
	const form = await request.formData();
	const intent = String(form.get("intent") ?? "");

	if (intent === "start") {
		const gradeId = String(form.get("gradeId") ?? "");
		if (!gradeById(gradeId)) return { phase: "config" as const, error: "Alege o clasă." };
		const length = Math.min(50, Math.max(1, Number(form.get("length")) || 10));
		const sampled = await sampleQuestions(db, gradeId, null, length);
		if (sampled.length === 0) return { phase: "config" as const, error: t("practice.empty") };
		const payload: PreviewPayload = { ids: sampled.map((s) => s.id), gradeId, length, ts: Date.now() };
		return { phase: "test" as const, questions: sampled, signed: await signPayload(payload, secret), gradeId, length };
	}

	if (intent === "submit") {
		const payload = await verifyPayload<PreviewPayload>(String(form.get("signed") ?? ""), secret);
		if (!payload || Date.now() - payload.ts > 2 * 3600 * 1000) return { phase: "expired" as const };
		const scoring = await loadForScoring(db, payload.ids);
		const items: ReviewItem[] = payload.ids.map((id) => {
			const q = scoring.get(id);
			const chosen = Number(form.get(`q_${id}`) ?? -1);
			const ok = q ? chosen === q.correctIndex : false;
			return {
				stem: q?.stem ?? "",
				options: q?.options ?? [],
				chosen,
				correctIndex: q?.correctIndex ?? -1,
				explanation: q?.explanation ?? "",
				ok,
			};
		});
		// Preview only — attempts are intentionally NOT recorded.
		const total = items.length;
		const correct = items.filter((i) => i.ok).length;
		return { phase: "results" as const, items, correct, total, pct: Math.round((correct / total) * 100), gradeId: payload.gradeId, length: payload.length };
	}

	return { phase: "config" as const };
}

export default function ProfesorExerseaza({ loaderData }: Route.ComponentProps) {
	const { grades, email } = loaderData;
	const actionData = useActionData<typeof action>();
	return (
		<TeacherShell title="Exersează (previzualizare)" active="exerseaza" email={email}>
			<p className="mb-6 text-muted">Încearcă testele grilă exact cum le văd elevii. Rezultatele tale nu sunt salvate.</p>
			{actionData?.phase === "test" ? (
				<PracticeTest questions={actionData.questions} signed={actionData.signed} />
			) : actionData?.phase === "results" ? (
				<div className="cat-rise grid gap-5">
					<div className="rounded-2xl border-2 border-primary bg-primary/5 p-6 text-center">
						<p className="my-1 font-heading text-4xl font-bold">{actionData.correct} / {actionData.total}</p>
						<p className="text-muted">{actionData.pct}%</p>
						<Form method="post" className="mt-4">
							<input type="hidden" name="intent" value="start" />
							<input type="hidden" name="gradeId" value={actionData.gradeId} />
							<input type="hidden" name="length" value={actionData.length} />
							<button className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-on-primary transition hover:bg-primary-strong">
								{t("practice.again")}
							</button>
						</Form>
					</div>
					<PracticeReview items={actionData.items} />
				</div>
			) : actionData?.phase === "expired" ? (
				<Expired retryTo="/profesor/exerseaza" />
			) : grades.length === 0 ? (
				<p className="rounded-xl border border-dashed border-border p-6 text-center text-muted">{t("practice.empty")}</p>
			) : (
				<Form method="post" className="grid max-w-md gap-5 rounded-2xl border border-border bg-surface p-6">
					<input type="hidden" name="intent" value="start" />
					<label className="grid gap-1.5 text-sm">
						<span className="text-muted">Clasa</span>
						<select name="gradeId" defaultValue={grades[0]?.id} className="rounded-lg border border-border bg-bg px-3 py-2.5 outline-none focus:border-primary">
							{grades.map((g) => (
								<option key={g.id} value={g.id}>{g.label} ({g.count})</option>
							))}
						</select>
					</label>
					<label className="grid gap-1.5 text-sm">
						<span className="text-muted">{t("practice.length")}</span>
						<select name="length" defaultValue="10" className="rounded-lg border border-border bg-bg px-3 py-2.5 outline-none focus:border-primary">
							<option value="5">5</option>
							<option value="10">10</option>
							<option value="20">20</option>
						</select>
					</label>
					{actionData?.phase === "config" && actionData.error && (
						<p className="rounded-lg bg-accent/10 px-3 py-2 text-sm text-accent-strong">{actionData.error}</p>
					)}
					<button className="rounded-xl bg-primary px-5 py-3 font-semibold text-on-primary transition hover:bg-primary-strong">
						{t("practice.start")}
					</button>
				</Form>
			)}
		</TeacherShell>
	);
}
