import { describe, expect, it } from "vitest";
import { assetAllowed, firstParagraph, inDemoSet, MAX_PREVIEW_PAGES, pageBudget } from "./demo";

describe("pageBudget", () => {
	it("shows about half of a short deck", () => {
		expect(pageBudget(11)).toBe(6);
		expect(pageBudget(12)).toBe(6);
		expect(pageBudget(3)).toBe(2);
		expect(pageBudget(1)).toBe(1);
	});

	it("never shows more than the ceiling, however long the deck", () => {
		expect(pageBudget(40)).toBe(MAX_PREVIEW_PAGES);
		expect(pageBudget(400)).toBe(MAX_PREVIEW_PAGES);
	});

	it("treats nonsense as nothing shown", () => {
		expect(pageBudget(0)).toBe(0);
		expect(pageBudget(-5)).toBe(0);
		expect(pageBudget(Number.NaN)).toBe(0);
	});
});

describe("assetAllowed", () => {
	it("allows exactly the pages inside the budget", () => {
		expect(assetAllowed(0, 11)).toBe(true);
		expect(assetAllowed(5, 11)).toBe(true);
		expect(assetAllowed(6, 11)).toBe(false); // page 7 — the wall
		expect(assetAllowed(10, 11)).toBe(false);
	});

	it("refuses junk indexes", () => {
		expect(assetAllowed(-1, 11)).toBe(false);
		expect(assetAllowed(1.5, 11)).toBe(false);
		expect(assetAllowed(0, 0)).toBe(false);
	});
});

describe("inDemoSet", () => {
	it("recognises a curated pick", () => {
		expect(inDemoSet("9", "hidrosfera-apele-pamantului")).toBe(true);
		expect(inDemoSet("9", "schema-climatele-terestre")).toBe(true);
	});

	it("refuses anything not curated", () => {
		expect(inDemoSet("9", "solurile-terrei")).toBe(false);
		expect(inDemoSet("8", "hidrosfera-apele-pamantului")).toBe(false);
		expect(inDemoSet("", "")).toBe(false);
	});
});

describe("firstParagraph", () => {
	it("skips headings and returns the first real paragraph", () => {
		const body = "# Titlu\n\n## Subtitlu\n\nApa acoperă trei sferturi din suprafața planetei.\n\nAlt paragraf.";
		expect(firstParagraph(body)).toBe("Apa acoperă trei sferturi din suprafața planetei.");
	});

	it("skips lists, rules and tables", () => {
		const body = "---\n\n- unu\n- doi\n\n| a | b |\n| - | - |\n\nTextul adevărat.";
		expect(firstParagraph(body)).toBe("Textul adevărat.");
	});

	it("strips inline markup and flattens single newlines", () => {
		expect(firstParagraph("Un **cuvânt** și\no continuare.")).toBe("Un cuvânt și o continuare.");
	});

	it("truncates on a word boundary", () => {
		const out = firstParagraph("unu doi trei patru cinci sase", 12);
		expect(out).toBe("unu doi trei…");
	});

	it("returns empty string when there is no prose", () => {
		expect(firstParagraph("")).toBe("");
		expect(firstParagraph("# Doar un titlu")).toBe("");
	});
});
