import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { subjectConfig } from "../config/subject";
import {
	TEACHER_SECTIONS,
	TEACHER_SECTION_ORDER,
	collectionTabKey,
	sectionForTab,
	showsTabBar,
	tabsOf,
} from "./teacher-nav";

const ROUTES_DIR = join(__dirname, "..", "routes");

/** Every `active="…"` a teacher route hands to TeacherShell. */
function activeKeysUsedByRoutes(): string[] {
	const keys = new Set<string>();
	for (const file of readdirSync(ROUTES_DIR)) {
		if (!file.startsWith("profesor") || !file.endsWith(".tsx")) continue;
		const src = readFileSync(join(ROUTES_DIR, file), "utf8");
		for (const m of src.matchAll(/active=(?:"([\w:-]+)"|\{[^}]*?"([\w:-]+)"[^}]*?\})/g)) {
			for (const g of [m[1], m[2]]) if (g) keys.add(g);
		}
	}
	return [...keys];
}

const allTabs = TEACHER_SECTION_ORDER.flatMap((s) => tabsOf(s));

describe("teacher navigation map", () => {
	it("gives every tab key exactly one section", () => {
		const seen = new Map<string, number>();
		for (const tab of allTabs) seen.set(tab.key, (seen.get(tab.key) ?? 0) + 1);
		expect([...seen].filter(([, n]) => n > 1)).toEqual([]);
	});

	it("routes every key the real routes use", () => {
		const known = new Set([...allTabs.map((t) => t.key), ...TEACHER_SECTION_ORDER]);
		const orphans = activeKeysUsedByRoutes().filter((k) => !known.has(k));
		expect(orphans).toEqual([]);
	});

	it("points every tab and section home at a registered route", () => {
		// Guards the reverse drift: a nav entry aimed at a page nobody built.
		const config = readFileSync(join(__dirname, "..", "routes.ts"), "utf8");
		const registered = [...config.matchAll(/route\("([^"]+)"/g)].map((m) => `/${m[1]}`);
		const isRegistered = (to: string) => {
			const path = to.split("?")[0];
			return registered.some((r) => {
				const rp = r.split("/");
				const tp = path.split("/");
				if (rp.length !== tp.length) return false;
				return rp.every((seg, i) => seg.startsWith(":") || seg === tp[i]);
			});
		};
		const targets = [...allTabs.map((t) => t.to), ...TEACHER_SECTION_ORDER.map((s) => TEACHER_SECTIONS[s].home)];
		expect(targets.filter((to) => !isRegistered(to))).toEqual([]);
	});

	it("resolves section ids as well as tab keys", () => {
		expect(sectionForTab("clase")).toBe("clase");
		expect(sectionForTab("pedagogie")).toBe("pedagogie");
		expect(sectionForTab("tokenuri")).toBe("clase");
		expect(sectionForTab("statistici")).toBe("clase");
		expect(sectionForTab("materiale")).toBe("clase");
	});

	it("falls back to clase for missing or unknown keys", () => {
		expect(sectionForTab(undefined)).toBe("clase");
		expect(sectionForTab("ceva-nou")).toBe("clase");
	});

	it("shows the tab bar exactly when a section has somewhere to go", () => {
		for (const section of TEACHER_SECTION_ORDER) {
			expect(showsTabBar(section)).toBe(tabsOf(section).length > 1);
		}
	});

	it("gives the pedagogy section one tab per configured collection", () => {
		const tabs = tabsOf("pedagogie");
		expect(tabs.map((t) => t.to)).toEqual(
			subjectConfig.teacherCollections.map((c) => `/profesor/pedagogie/${c.slug}`),
		);
		expect(tabs.map((t) => t.key)).toEqual(
			subjectConfig.teacherCollections.map((c) => collectionTabKey(c.slug)),
		);
	});

	it("points each section home at a /profesor path", () => {
		for (const section of TEACHER_SECTION_ORDER) {
			expect(TEACHER_SECTIONS[section].home).toMatch(/^\/profesor(\/|$)/);
		}
	});

	it("gives every tab a label and a description key", () => {
		for (const tab of allTabs) {
			expect(tab.labelKey.startsWith("teacher.")).toBe(true);
			expect(tab.descKey.startsWith("teacher.")).toBe(true);
			expect(tab.to.startsWith("/profesor")).toBe(true);
		}
	});
});
