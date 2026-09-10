import { Link, redirect } from "react-router";
import type { Route } from "./+types/profesor.pedagogie.$collection";
import { gradeById, subjectConfig, t } from "../config/subject";
import { getDb } from "../db/client";
import { getTeacher } from "../lib/guard";
import { listTeacherCollection } from "../lib/content";
import { collectionTabKey } from "../lib/teacher-nav";
import { TeacherShell } from "../components/TeacherShell";
import { TypeChip } from "../components/TypeChip";
import { seo } from "../lib/seo";

export function meta({ data }: Route.MetaArgs) {
	return seo({ title: data?.label ?? "", path: "/profesor/pedagogie", noindex: true });
}

export async function loader({ request, params, context }: Route.LoaderArgs) {
	const teacher = await getTeacher(request, context.cloudflare.env);
	if (!teacher) throw redirect("/profesor/login");

	const collection = subjectConfig.teacherCollections.find((c) => c.slug === params.collection);
	if (!collection) throw redirect("/profesor/pedagogie");

	const materials = await listTeacherCollection(
		getDb(context.cloudflare.env),
		collection.slug,
		subjectConfig.defaultLocale,
	);

	// Grade is a grouping here, not a filter — a shelf shows everything it holds.
	const byGrade = subjectConfig.grades
		.map((g) => ({ id: g.id, label: g.label, materials: materials.filter((m) => m.gradeId === g.id) }))
		.filter((g) => g.materials.length > 0);

	return { email: teacher.email, slug: collection.slug, label: t(collection.labelKey), desc: t(collection.descKey), byGrade };
}

export default function PedagogieCollection({ loaderData }: Route.ComponentProps) {
	const { email, slug, label, desc, byGrade } = loaderData;
	return (
		<TeacherShell title={label} active={collectionTabKey(slug)} email={email}>
			<p className="mb-8 max-w-2xl text-muted">{desc}</p>
			{byGrade.length === 0 ? (
				<p className="rounded-2xl border border-dashed border-border p-8 text-center text-muted">
					{t("teacher.collection.empty")}
				</p>
			) : (
				<div className="grid gap-8">
					{byGrade.map((grade) => (
						<section key={grade.id}>
							<h2 className="mb-3 text-xl font-semibold">{gradeById(grade.id)?.label ?? grade.label}</h2>
							<div className="stagger grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
								{grade.materials.map((m) => (
									<Link
										key={m.id}
										to={`/profesor/m/${grade.id}/${m.slug}`}
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
		</TeacherShell>
	);
}
