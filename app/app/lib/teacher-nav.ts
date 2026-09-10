/**
 * Information architecture for the teacher area.
 *
 * Pure and DOM-free so it can be unit-tested: it is the single source of truth
 * for which pages exist, how they group, and which of the two sections each one
 * belongs to. Components read it; they never hold route strings of their own.
 *
 * Subject-agnostic by construction — only labelKeys live here, resolved through
 * `t()` against the locale strings.
 */

import { subjectConfig } from "../config/subject";

export type TeacherSection = "clase" | "pedagogie";

/** Tab key for one shelf of the teacher library. */
export function collectionTabKey(slug: string): string {
	return `pedagogie:${slug}`;
}

export type NavTab = {
	/** Matches the `active` prop each teacher route already passes to TeacherShell. */
	key: string;
	to: string;
	labelKey: string;
	descKey: string;
};

export type NavGroup = {
	/** null when the group needs no heading (a section with a single group). */
	labelKey: string | null;
	tabs: NavTab[];
};

export type SectionDef = {
	labelKey: string;
	descKey: string;
	/** Where the hub card for this section lands. */
	home: string;
	groups: NavGroup[];
};

export const TEACHER_SECTIONS: Record<TeacherSection, SectionDef> = {
	clase: {
		labelKey: "teacher.section.clase.label",
		descKey: "teacher.section.clase.desc",
		home: "/profesor/clase",
		groups: [
			{
				labelKey: "teacher.group.clasa",
				tabs: [
					{
						key: "materiale",
						to: "/profesor/materiale",
						labelKey: "teacher.tab.materiale",
						descKey: "teacher.tab.materiale.desc",
					},
					{
						key: "tokenuri",
						to: "/profesor/tokenuri",
						labelKey: "teacher.tab.tokenuri",
						descKey: "teacher.tab.tokenuri.desc",
					},
					{
						key: "anunturi",
						to: "/profesor/anunturi",
						labelKey: "teacher.tab.anunturi",
						descKey: "teacher.tab.anunturi.desc",
					},
				],
			},
			{
				labelKey: "teacher.group.evaluare",
				tabs: [
					{
						key: "teme",
						to: "/profesor/teme",
						labelKey: "teacher.tab.teme",
						descKey: "teacher.tab.teme.desc",
					},
					{
						key: "exerseaza",
						to: "/profesor/exerseaza",
						labelKey: "teacher.tab.exerseaza",
						descKey: "teacher.tab.exerseaza.desc",
					},
					{
						key: "rezultate",
						to: "/profesor/rezultate",
						labelKey: "teacher.tab.rezultate",
						descKey: "teacher.tab.rezultate.desc",
					},
					{
						key: "statistici",
						to: "/profesor/statistici",
						labelKey: "teacher.tab.statistici",
						descKey: "teacher.tab.statistici.desc",
					},
				],
			},
		],
	},
	pedagogie: {
		labelKey: "teacher.section.pedagogie.label",
		descKey: "teacher.section.pedagogie.desc",
		home: "/profesor/pedagogie",
		// One tab per shelf, straight from the subject config: adding a shelf
		// there puts it in the nav, the landing cards and the tab bar at once.
		groups: [
			{
				labelKey: null,
				tabs: subjectConfig.teacherCollections.map((c) => ({
					key: collectionTabKey(c.slug),
					to: `/profesor/pedagogie/${c.slug}`,
					labelKey: c.labelKey,
					descKey: c.descKey,
				})),
			},
		],
	},
};

export const TEACHER_SECTION_ORDER: TeacherSection[] = ["clase", "pedagogie"];

/** Every tab of a section, groups flattened. */
export function tabsOf(section: TeacherSection): NavTab[] {
	return TEACHER_SECTIONS[section].groups.flatMap((g) => g.tabs);
}

/**
 * Which section a page belongs to, from the `active` key it reports.
 *
 * A section's own id is accepted too, so a section landing page can pass
 * `active="clase"` and get the right shell without lighting up any tab.
 * Anything unrecognised falls back to `clase`, the larger section — a new page
 * that forgets to declare itself still lands somewhere sensible (and the unit
 * test catches the omission).
 */
export function sectionForTab(active: string | undefined): TeacherSection {
	if (!active) return "clase";
	if (active in TEACHER_SECTIONS) return active as TeacherSection;
	for (const section of TEACHER_SECTION_ORDER) {
		if (tabsOf(section).some((tab) => tab.key === active)) return section;
	}
	return "clase";
}

/** A section shows its tab bar only when there is more than one place to go. */
export function showsTabBar(section: TeacherSection): boolean {
	return tabsOf(section).length > 1;
}
