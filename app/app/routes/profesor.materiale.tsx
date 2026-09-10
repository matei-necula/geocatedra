import { useMemo, useState } from "react";
import { Link, redirect } from "react-router";
import type { Route } from "./+types/profesor.materiale";
import { gradeById, subjectConfig, t, topicsForGrade } from "../config/subject";
import { getDb } from "../db/client";
import { getTeacher } from "../lib/guard";
import { listMaterialsForGrade } from "../lib/content";
import { fold } from "../lib/text";
import { TeacherShell } from "../components/TeacherShell";
import { TypeChip } from "../components/TypeChip";
import { seo } from "../lib/seo";

export function meta(_: Route.MetaArgs) {
	return seo({ title: "Materiale", path: "/profesor/materiale", noindex: true });
}

export async function loader({ request, context }: Route.LoaderArgs) {
	const env = context.cloudflare.env;
	const teacher = await getTeacher(request, env);
	if (!teacher) throw redirect("/profesor/login");

	const url = new URL(request.url);
	// The teacher library moved to its own section, browsed by collection.
	if (url.searchParams.get("lib") === "teacher") throw redirect("/profesor/pedagogie");
	const gradeParam = url.searchParams.get("grade") || subjectConfig.grades[0].id;
	const grade = gradeById(gradeParam) ? gradeParam : subjectConfig.grades[0].id;

	const materials = await listMaterialsForGrade(getDb(env), grade, subjectConfig.defaultLocale, "student", false);
	const topics = topicsForGrade(grade)
		.map((tp) => ({ ...tp, materials: materials.filter((m) => m.topicSlug === tp.slug) }))
		.filter((t) => t.materials.length > 0);

	return { email: teacher.email, grade, grades: subjectConfig.grades, topics };
}

export default function ProfesorMateriale({ loaderData }: Route.ComponentProps) {
	const { email, grade, grades, topics } = loaderData;
	const q = (g: string) => `/profesor/materiale?grade=${g}`;

	const [query, setQuery] = useState("");
	const [types, setTypes] = useState<string[]>([]);

	// Types actually present for this grade/library, in config order (subject-agnostic).
	const presentTypes = useMemo(() => {
		const present = new Set<string>();
		for (const tp of topics) for (const m of tp.materials) present.add(m.type);
		return subjectConfig.materialTypes.map((mt) => mt.key).filter((k) => present.has(k));
	}, [topics]);

	const qf = fold(query.trim());
	const active = qf.length > 0 || types.length > 0;

	const filteredTopics = useMemo(() => {
		return topics
			.map((tp) => ({
				...tp,
				materials: tp.materials.filter((m) => {
					const matchesText = qf.length === 0 || fold(m.title).includes(qf) || fold(m.description ?? "").includes(qf);
					const matchesType = types.length === 0 || types.includes(m.type);
					return matchesText && matchesType;
				}),
			}))
			.filter((tp) => tp.materials.length > 0 || !active);
	}, [topics, qf, types, active]);

	const nothing = active && filteredTopics.every((tp) => tp.materials.length === 0);

	return (
		<TeacherShell title={t("teacher.tab.materiale")} active="materiale" email={email}>
			<div className="mb-5 flex flex-wrap gap-2">
				{grades.map((g) => (
					<Link
						key={g.id}
						to={q(g.id)}
						className={`rounded-full border px-3 py-1.5 text-sm ${grade === g.id ? "border-primary bg-primary text-on-primary" : "border-border"}`}
					>
						{g.label}
					</Link>
				))}
			</div>

			{topics.length > 0 && (
				<p className="mb-6 text-sm text-muted">Doar vizualizare — materialele nu pot fi descărcate.</p>
			)}

			{topics.length === 0 ? (
				<p className="rounded-xl border border-dashed border-border p-6 text-center text-muted">
					Niciun material publicat pentru această clasă.
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
						{presentTypes.length > 1 && (
							<div className="flex flex-wrap gap-2">
								{presentTypes.map((key) => {
									const on = types.includes(key);
									return (
										<button
											key={key}
											type="button"
											aria-pressed={on}
											onClick={() => setTypes((cur) => (on ? cur.filter((k) => k !== key) : [...cur, key]))}
											className={`rounded-[6px] ring-2 transition ${on ? "ring-primary" : "ring-transparent opacity-70 hover:opacity-100"}`}
										>
											<TypeChip type={key} />
										</button>
									);
								})}
							</div>
						)}
					</div>

					{nothing ? (
						<p className="rounded-xl border border-dashed border-border p-6 text-center text-muted">{t("library.no_results")}</p>
					) : (
						<div className="grid gap-8">
							{filteredTopics.map((topic) => (
								<section key={topic.slug}>
									<h2 className="mb-3 text-xl font-semibold">{topic.label}</h2>
									<div className="stagger grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
										{topic.materials.map((m) => (
											<Link
												key={m.id}
												to={`/profesor/m/${grade}/${m.slug}`}
												viewTransition
												className="group glow rounded-2xl border border-border bg-surface p-5"
											>
												<div className="mb-3">
													<TypeChip type={m.type} />
												</div>
												<h3 className="text-lg font-semibold group-hover:text-primary">{m.title}</h3>
												{m.description && <p className="mt-1 line-clamp-2 text-sm text-muted">{m.description}</p>}
											</Link>
										))}
									</div>
								</section>
							))}
						</div>
					)}
				</>
			)}
		</TeacherShell>
	);
}
