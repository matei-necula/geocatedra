import { Form, Link, redirect } from "react-router";
import type { Route } from "./+types/admin.intrebari";
import { subjectConfig, t, topicsForGrade } from "../config/subject";
import { getDb } from "../db/client";
import { getAdminSession } from "../lib/session";
import { getSecrets } from "../lib/env";
import { deleteQuestion, listQuestionsForAdmin } from "../lib/questions";
import { AdminShell } from "../components/AdminShell";
import { seo } from "../lib/seo";

export function meta(_: Route.MetaArgs) {
	return seo({ title: "Întrebări", path: "/admin/intrebari", noindex: true });
}

async function requireAdmin(request: Request, env: Env) {
	const admin = await getAdminSession(request, getSecrets(env).sessionSecret);
	if (!admin) throw redirect("/admin/login");
}

export async function loader({ request, context }: Route.LoaderArgs) {
	const env = context.cloudflare.env;
	await requireAdmin(request, env);
	const all = await listQuestionsForAdmin(getDb(env), subjectConfig.defaultLocale);
	const grades = subjectConfig.grades
		.map((g) => ({
			grade: g,
			topics: topicsForGrade(g.id)
				.map((tp) => ({ topic: tp, questions: all.filter((q) => q.gradeId === g.id && q.topicSlug === tp.slug) }))
				.filter((x) => x.questions.length > 0),
		}))
		.filter((g) => g.topics.length > 0);
	return { grades, total: all.length, published: all.filter((q) => q.status === "published").length };
}

export async function action({ request, context }: Route.ActionArgs) {
	const env = context.cloudflare.env;
	await requireAdmin(request, env);
	const form = await request.formData();
	if (String(form.get("intent")) === "delete") {
		await deleteQuestion(getDb(env), String(form.get("id")));
	}
	return { ok: true };
}

export default function AdminIntrebari({ loaderData }: Route.ComponentProps) {
	const { grades, total, published } = loaderData;
	return (
		<AdminShell title="Întrebări">
			<div className="mb-6 flex items-center justify-between">
				<p className="text-sm text-muted">{total} întrebări · {published} publicate</p>
				<div className="flex items-center gap-3">
					<Link to="/admin/teme" className="rounded-lg border border-primary px-4 py-2.5 text-sm font-semibold text-primary transition hover:bg-primary/5">
						{t("assignments.title")} →
					</Link>
					<Link to="/admin/intrebari/nou" className="rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-on-primary transition hover:bg-primary-strong">
						+ Adaugă întrebare
					</Link>
				</div>
			</div>

			{grades.length === 0 ? (
				<p className="rounded-xl border border-dashed border-border p-6 text-center text-muted">
					Nicio întrebare încă. Adaugă întrebări pentru a activa „Exersează" la elevi.
				</p>
			) : (
				<div className="grid gap-8">
					{grades.map(({ grade, topics }) => (
						<section key={grade.id}>
							<h2 className="mb-3 text-xl font-semibold">{grade.label}</h2>
							<div className="grid gap-5">
								{topics.map(({ topic, questions }) => (
									<div key={topic.slug}>
										<h3 className="mb-2 text-sm font-semibold tracking-wide text-muted uppercase">{topic.label}</h3>
										<div className="overflow-hidden rounded-xl border border-border">
											{questions.map((q) => (
												<div key={q.id} className="flex items-center gap-3 border-b border-border bg-surface px-4 py-3 last:border-b-0">
													<div className="min-w-0 flex-1">
														<span className="line-clamp-1 font-medium">{q.stem}</span>
														<span className="text-xs text-muted">{q.options.length} variante</span>
													</div>
													<span className={`rounded-full px-2.5 py-1 text-xs font-medium ${q.status === "published" ? "bg-emerald-50 text-emerald-700" : "bg-ink/10 text-muted"}`}>
														{q.status === "published" ? "Publicat" : "Ciornă"}
													</span>
													<Link to={`/admin/intrebari/${q.id}`} className="text-sm font-medium text-primary hover:underline">Editează</Link>
													<Form method="post" onSubmit={(e) => { if (!confirm("Ștergi întrebarea?")) e.preventDefault(); }}>
														<input type="hidden" name="intent" value="delete" />
														<input type="hidden" name="id" value={q.id} />
														<button className="text-sm font-medium text-accent-strong hover:underline">Șterge</button>
													</Form>
												</div>
											))}
										</div>
									</div>
								))}
							</div>
						</section>
					))}
				</div>
			)}
		</AdminShell>
	);
}
