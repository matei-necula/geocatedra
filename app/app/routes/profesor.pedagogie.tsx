import { Link, redirect } from "react-router";
import type { Route } from "./+types/profesor.pedagogie";
import { subjectConfig, t } from "../config/subject";
import { getTeacher } from "../lib/guard";
import { TeacherShell } from "../components/TeacherShell";
import { seo } from "../lib/seo";

export function meta(_: Route.MetaArgs) {
	return seo({
		title: t("teacher.section.pedagogie.label"),
		path: "/profesor/pedagogie",
		noindex: true,
	});
}

export async function loader({ request, context }: Route.LoaderArgs) {
	const teacher = await getTeacher(request, context.cloudflare.env);
	if (!teacher) throw redirect("/profesor/login");
	return { email: teacher.email };
}

/**
 * Landing page of the Pedagogie section: one card per shelf of the teacher
 * library. No grade picker — pedagogy is browsed by kind of material, and the
 * grade only appears as a grouping once you are inside a shelf.
 */
export default function ProfesorPedagogie({ loaderData }: Route.ComponentProps) {
	return (
		<TeacherShell title={t("teacher.section.pedagogie.label")} active="pedagogie" email={loaderData.email}>
			<p className="mb-8 max-w-2xl text-muted">{t("teacher.section.pedagogie.desc")}</p>
			<div className="stagger grid gap-5 sm:grid-cols-2">
				{subjectConfig.teacherCollections.map((c) => (
					<Link
						key={c.slug}
						to={`/profesor/pedagogie/${c.slug}`}
						viewTransition
						className="glow flex flex-col rounded-2xl border-2 border-border bg-surface p-7 transition hover:border-primary"
					>
						<h2 className="font-heading text-2xl font-semibold">{t(c.labelKey)}</h2>
						<p className="mt-2 flex-1 text-sm leading-relaxed text-muted">{t(c.descKey)}</p>
						<span className="mt-5 text-sm font-medium text-primary">Deschide →</span>
					</Link>
				))}
			</div>
		</TeacherShell>
	);
}
