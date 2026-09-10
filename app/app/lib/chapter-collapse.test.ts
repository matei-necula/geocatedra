import { describe, expect, it } from "vitest";
import { allChaptersOpen, chapterSummary, isChapterOpen, nextOpenChapters } from "./chapter-collapse";

describe("isChapterOpen", () => {
	it("închis când nu e nici deschis manual, nici forțat de filtru", () => {
		expect(isChapterOpen(false, false)).toBe(false);
	});

	it("deschis când utilizatorul l-a deschis manual, chiar fără filtru activ", () => {
		expect(isChapterOpen(true, false)).toBe(true);
	});

	it("deschis când filtrul îl forțează, chiar dacă utilizatorul nu l-a atins", () => {
		expect(isChapterOpen(false, true)).toBe(true);
	});

	it("deschis când ambele condiții sunt adevărate", () => {
		expect(isChapterOpen(true, true)).toBe(true);
	});
});

describe("chapterSummary", () => {
	it("arată doar materialele când nu sunt întrebări", () => {
		expect(chapterSummary(1, 0)).toBe("1 material");
		expect(chapterSummary(8, 0)).toBe("8 materiale");
	});

	it("alătură materiale și întrebări cu «·» când există amândouă", () => {
		expect(chapterSummary(8, 12)).toBe("8 materiale · 12 întrebări");
	});

	it("pluralul corect la 1 întrebare", () => {
		expect(chapterSummary(3, 1)).toBe("3 materiale · 1 întrebare");
	});

	// Capcana pluralului românesc: „de” apare la 0 sau ≥20 (ultimele două cifre), nu doar la >19.
	it("pune «de» la 20+ materiale/întrebări, dar nu la 101", () => {
		expect(chapterSummary(20, 0)).toBe("20 de materiale");
		expect(chapterSummary(101, 0)).toBe("101 materiale");
		expect(chapterSummary(1, 20)).toBe("1 material · 20 de întrebări");
	});
});

describe("nextOpenChapters", () => {
	const slugs = ["relief", "clima", "hidrografie"];

	it("de la «nu toate deschise» trece la toate deschise", () => {
		const next = nextOpenChapters(slugs, false);
		expect([...next].sort()).toEqual([...slugs].sort());
	});

	it("de la «toate deschise» trece la toate închise", () => {
		const next = nextOpenChapters(slugs, true);
		expect(next.size).toBe(0);
	});
});

describe("allChaptersOpen", () => {
	const slugs = ["relief", "clima", "hidrografie"];

	it("fals dacă lipsește măcar un capitol din mulțimea deschisă", () => {
		expect(allChaptersOpen(slugs, new Set(["relief", "clima"]))).toBe(false);
	});

	it("adevărat doar când toate capitolele sunt în mulțimea deschisă", () => {
		expect(allChaptersOpen(slugs, new Set(slugs))).toBe(true);
	});

	it("fals pe o listă goală de capitole (nu există «tot» de deschis)", () => {
		expect(allChaptersOpen([], new Set())).toBe(false);
	});
});
