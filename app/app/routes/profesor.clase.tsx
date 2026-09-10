import { Link, redirect } from "react-router";
import type { Route } from "./+types/profesor.clase";
import { t } from "../config/subject";
import { getTeacher } from "../lib/guard";
import { TEACHER_SECTIONS } from "../lib/teacher-nav";
import { TeacherShell } from "../components/TeacherShell";
import { seo } from "../lib/seo";

export function meta(_: Route.MetaArgs) {
	return seo({ title: t("teacher.section.clase.label"), path: "/profesor/clase", noindex: true });
}

export async function loader({ request, context }: Route.LoaderArgs) {
	const teacher = await getTeacher(request, context.cloudflare.env);
	if (!teacher) throw redirect("/profesor/login");
	return { email: teacher.email };
}

/**
 * Landing page of the „Clasele mele” section: the same pages as the tab bar,
 * shown as cards with a sentence each. Cards are generated from the nav map, so
 * they can never drift out of sync with the tabs above them.
 */
export default function ProfesorClase({ loaderData }: Route.ComponentProps) {
	return (
		<TeacherShell title={t("teacher.section.clase.label")} active="clase" email={loaderData.email}>
			<p className="mb-8 max-w-2xl text-muted">{t("teacher.section.clase.desc")}</p>
			<div className="grid gap-8">
				{TEACHER_SECTIONS.clase.groups.map((group, i) => (
					<section key={group.labelKey ?? i}>
						{group.labelKey && (
							<h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-muted">
								{t(group.labelKey)}
							</h2>
						)}
						<div className="stagger grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
							{group.tabs.map((tab) => (
								<Link
									key={tab.key}
									to={tab.to}
									viewTransition
									className="group glow rounded-2xl border border-border bg-surface p-5"
								>
									<h3 className="font-heading text-lg font-semibold group-hover:text-primary">
										{t(tab.labelKey)}
									</h3>
									<p className="mt-1 text-sm text-muted">{t(tab.descKey)}</p>
								</Link>
							))}
						</div>
					</section>
				))}
			</div>
		</TeacherShell>
	);
}
