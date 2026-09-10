import { Form, Link } from "react-router";
import { t } from "../config/subject";
import {
	TEACHER_SECTIONS,
	TEACHER_SECTION_ORDER,
	sectionForTab,
	showsTabBar,
} from "../lib/teacher-nav";
import { SiteHeader } from "./site";

/**
 * Chrome for every teacher page inside a section.
 *
 * The section is derived from `active` — the key each route already passes — so
 * adding a page never means touching this file: declare it in `teacher-nav.ts`
 * and the bar picks it up. A section landing page passes its own section id,
 * which selects the right bar without lighting up any tab.
 */
export function TeacherShell({
	title,
	active,
	email,
	children,
}: {
	title: string;
	active?: string;
	email?: string;
	children: React.ReactNode;
}) {
	const section = sectionForTab(active);
	const def = TEACHER_SECTIONS[section];

	return (
		<div className="min-h-screen motion-playful">
			<SiteHeader
				right={
					<>
						{email && <span className="hidden text-sm text-muted sm:inline">{email}</span>}
						<Form method="post" action="/iesire" className="inline">
							<button
								type="submit"
								className="cursor-pointer text-sm font-medium text-muted hover:text-ink"
							>
								{t("nav.logout")}
							</button>
						</Form>
					</>
				}
			/>
			<div className="mx-auto max-w-5xl px-5 pt-5">
				<div className="mb-4 flex flex-wrap items-center gap-3">
					<Link
						to="/profesor"
						viewTransition
						className="inline-flex min-h-[44px] items-center gap-1.5 text-sm font-medium text-muted hover:text-ink"
					>
						<span aria-hidden>←</span> {t("teacher.home")}
					</Link>
					<nav aria-label={t("teacher.sections.aria")} className="flex gap-1 rounded-full border border-border bg-surface p-1">
						{TEACHER_SECTION_ORDER.map((key) => {
							const on = key === section;
							return (
								<Link
									key={key}
									to={TEACHER_SECTIONS[key].home}
									viewTransition
									aria-current={on ? "page" : undefined}
									className={`rounded-full px-3.5 py-1.5 text-sm font-medium transition ${
										on ? "bg-primary text-on-primary" : "text-muted hover:text-ink"
									}`}
								>
									{t(TEACHER_SECTIONS[key].labelKey)}
								</Link>
							);
						})}
					</nav>
				</div>

				{showsTabBar(section) && (
					<nav className="mb-6 flex items-end gap-1 overflow-x-auto overflow-y-hidden border-b border-border">
						{def.groups.map((group, i) => (
							<div
								key={group.labelKey ?? i}
								className={`flex shrink-0 flex-col ${i > 0 ? "ml-3 border-l border-border pl-3" : ""}`}
							>
								{group.labelKey && (
									<span className="px-4 pt-1 text-[11px] font-semibold uppercase tracking-wider text-muted/70">
										{t(group.labelKey)}
									</span>
								)}
								<div className="flex">
									{group.tabs.map((tab) => (
										<Link
											key={tab.key}
											to={tab.to}
											viewTransition
											aria-current={active === tab.key ? "page" : undefined}
											className={`-mb-px whitespace-nowrap border-b-2 px-4 py-2.5 text-sm font-medium transition ${
												active === tab.key
													? "border-primary text-primary"
													: "border-transparent text-muted hover:text-ink"
											}`}
										>
											{t(tab.labelKey)}
										</Link>
									))}
								</div>
							</div>
						))}
					</nav>
				)}

				<h1 className="mb-6 text-3xl font-bold">{title}</h1>
				{children}
			</div>
		</div>
	);
}
