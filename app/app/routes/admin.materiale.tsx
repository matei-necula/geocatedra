import { useState } from "react";
import { Form, Link, redirect } from "react-router";
import type { Route } from "./+types/admin.materiale";
import { subjectConfig, t, topicsForGrade } from "../config/subject";
import { getDb } from "../db/client";
import { getAdminSession } from "../lib/session";
import { getSecrets } from "../lib/env";
import { deleteMaterial, listAllForAdmin } from "../lib/admin-content";
import { deleteAsset, listAssets } from "../lib/assets";
import { fold } from "../lib/text";
import { AdminShell } from "../components/AdminShell";
import { TypeChip } from "../components/TypeChip";
import { seo } from "../lib/seo";

export function meta(_: Route.MetaArgs) {
	return seo({ title: "Materiale", path: "/admin/materiale", noindex: true });
}

async function requireAdmin(request: Request, env: Env) {
	const admin = await getAdminSession(request, getSecrets(env).sessionSecret);
	if (!admin) throw redirect("/admin/login");
}

export async function loader({ request, context }: Route.LoaderArgs) {
	const env = context.cloudflare.env;
	await requireAdmin(request, env);
	const all = await listAllForAdmin(getDb(env), subjectConfig.defaultLocale);

	// Materials are shelved either on a student topic or on a pedagogy
	// collection, and both live in `topic_slug`. List both kinds, plus a
	// catch-all, so a material can never become invisible to the admin.
	const collections = subjectConfig.teacherCollections.map((c) => ({ slug: c.slug, label: t(c.labelKey) }));
	const grades = subjectConfig.grades
		.map((g) => {
			const mine = all.filter((m) => m.gradeId === g.id);
			const shelves = [...topicsForGrade(g.id), ...collections];
			const known = new Set(shelves.map((sh) => sh.slug));
			const orphans = mine.filter((m) => !known.has(m.topicSlug));
			return {
				grade: g,
				topics: [
					...shelves.map((topic) => ({ topic, materials: mine.filter((m) => m.topicSlug === topic.slug) })),
					...(orphans.length > 0
						? [{ topic: { slug: "__fara-tema", label: t("admin.materials.no_topic") }, materials: orphans }]
						: []),
				].filter((x) => x.materials.length > 0),
			};
		})
		.filter((g) => g.topics.length > 0);

	return { grades, total: all.length };
}

export async function action({ request, context }: Route.ActionArgs) {
	const env = context.cloudflare.env;
	await requireAdmin(request, env);
	const form = await request.formData();
	if (String(form.get("intent")) === "delete") {
		const db = getDb(env);
		const id = String(form.get("id"));
		// Remove attached files (R2 + rows) so nothing is orphaned.
		for (const a of await listAssets(db, id)) await deleteAsset(env, db, a.id);
		await deleteMaterial(db, id);
	}
	return { ok: true };
}

export default function AdminMateriale({ loaderData }: Route.ComponentProps) {
	const { grades, total } = loaderData;

	const [query, setQuery] = useState("");
	const [gradeF, setGradeF] = useState("");
	const [typeF, setTypeF] = useState<string[]>([]);
	const [statusF, setStatusF] = useState("");
	const [libF, setLibF] = useState("");
	const q = fold(query.trim());
	const active = q.length > 0 || gradeF !== "" || typeF.length > 0 || statusF !== "" || libF !== "";
	const matches = (m: { title: string; description?: string; type: string; status: string; library: string }) =>
		(q.length === 0 || fold(m.title).includes(q) || fold(m.description ?? "").includes(q)) &&
		(typeF.length === 0 || typeF.includes(m.type)) &&
		(statusF === "" || m.status === statusF) &&
		(libF === "" || m.library === libF);
	const visible = grades
		.filter(({ grade }) => gradeF === "" || grade.id === gradeF)
		.map(({ grade, topics }) => ({
			grade,
			topics: topics.map(({ topic, materials }) => ({ topic, materials: materials.filter(matches) })).filter((x) => x.materials.length > 0),
		}))
		.filter((g) => g.topics.length > 0);

	return (
		<AdminShell title="Materiale">
			<div className="mb-6 flex items-center justify-between">
				<p className="text-sm text-muted">{total} materiale în total</p>
				<Link to="/admin/materiale/nou" className="rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-on-primary transition hover:bg-primary-strong">
					+ Adaugă material
				</Link>
			</div>

			{grades.length === 0 ? (
				<p className="rounded-xl border border-dashed border-border p-6 text-center text-muted">
					Niciun material încă. Apasă „Adaugă material" pentru a începe.
				</p>
			) : (
				<>
					<div className="mb-6 grid gap-3">
						<input
							type="search"
							value={query}
							onChange={(e) => setQuery(e.target.value)}
							placeholder={t("library.search")}
							aria-label={t("library.search")}
							className="w-full rounded-md border border-border bg-surface px-4 py-2.5 outline-none focus:border-primary"
						/>
						<div className="flex flex-wrap items-center gap-2">
							<select value={gradeF} onChange={(e) => setGradeF(e.target.value)} className="rounded-md border border-border bg-surface px-2 py-1.5 text-sm">
								<option value="">{t("library.filter_grade_all")}</option>
								{subjectConfig.grades.map((g) => (
									<option key={g.id} value={g.id}>{g.label}</option>
								))}
							</select>
							<select value={statusF} onChange={(e) => setStatusF(e.target.value)} className="rounded-md border border-border bg-surface px-2 py-1.5 text-sm">
								<option value="">{t("library.filter_status_all")}</option>
								<option value="published">Publicate</option>
								<option value="draft">Ciorne</option>
							</select>
							<select value={libF} onChange={(e) => setLibF(e.target.value)} className="rounded-md border border-border bg-surface px-2 py-1.5 text-sm">
								<option value="">{t("library.filter_lib_all")}</option>
								<option value="student">Elevi</option>
								<option value="teacher">Pedagogie</option>
							</select>
							{subjectConfig.materialTypes.map((mt) => {
								const on = typeF.includes(mt.key);
								return (
									<button
										key={mt.key}
										type="button"
										aria-pressed={on}
										onClick={() => setTypeF((cur) => (on ? cur.filter((k) => k !== mt.key) : [...cur, mt.key]))}
										className={`rounded-[6px] ring-2 transition ${on ? "ring-primary" : "ring-transparent opacity-70 hover:opacity-100"}`}
									>
										<TypeChip type={mt.key} />
									</button>
								);
							})}
						</div>
					</div>

					{active && visible.length === 0 ? (
						<p className="rounded-xl border border-dashed border-border p-6 text-center text-muted">{t("library.no_results")}</p>
					) : (
					<div className="grid gap-8">
						{visible.map(({ grade, topics }) => (
							<section key={grade.id}>
								<h2 className="mb-3 text-xl font-semibold">{grade.label}</h2>
								<div className="grid gap-5">
									{topics.map(({ topic, materials }) => (
										<div key={topic.slug}>
											<h3 className="mb-2 text-sm font-semibold tracking-wide text-muted uppercase">{topic.label}</h3>
											<div className="overflow-hidden rounded-xl border border-border">
												{materials.map((m) => (
													<div key={m.id} className="flex items-center gap-3 border-b border-border bg-surface px-4 py-3 last:border-b-0">
														<div className="min-w-0 flex-1">
															<div className="flex items-center gap-2">
																<span className="truncate font-medium">{m.title}</span>
																{m.library === "teacher" && (
																	<span className="rounded bg-sand/40 px-1.5 py-0.5 text-[11px] font-medium">pedagogie</span>
																)}
																{m.isTeaser && (
																	<span className="rounded bg-accent/15 px-1.5 py-0.5 text-[11px] font-medium text-accent-strong">demo</span>
																)}
															</div>
															<div className="mt-1"><TypeChip type={m.type} /></div>
														</div>
														<span className={`rounded-full px-2.5 py-1 text-xs font-medium ${m.status === "published" ? "bg-emerald-50 text-emerald-700" : "bg-ink/10 text-muted"}`}>
															{m.status === "published" ? "Publicat" : "Ciornă"}
														</span>
														<Link to={`/admin/materiale/${m.id}`} className="text-sm font-medium text-primary hover:underline">
															Editează
														</Link>
														{m.type === "joc" && (
															<Link to={`/admin/materiale/nou?from=${m.id}`} className="text-sm font-medium text-primary hover:underline">
																Duplică
															</Link>
														)}
														<Form method="post" onSubmit={(e) => { if (!confirm("Ștergi acest material?")) e.preventDefault(); }}>
															<input type="hidden" name="intent" value="delete" />
															<input type="hidden" name="id" value={m.id} />
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
			</>
			)}
		</AdminShell>
	);
}
