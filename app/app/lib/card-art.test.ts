import { describe, expect, it } from "vitest";
import { ART_HUES, ART_VARIANTS, artHue, artMotif, artVariant, HUE_CLASS, hueIndex, MOTIFS } from "./card-art";
import { subjectConfig } from "../config/subject";

describe("artMotif", () => {
	it("ia motivul din config, nu din motor", () => {
		// Regula e „subject-agnostic": maparea tip → motiv trăiește în `subject.config`.
		// Dacă cineva scoate câmpul `art` de acolo, testul ăsta cade primul.
		for (const def of subjectConfig.materialTypes) {
			expect(def.art, `tipul "${def.key}" n-are câmpul art`).toBeTruthy();
			expect(MOTIFS).toContain(def.art);
		}
	});

	it("întoarce motivul declarat pentru fiecare tip din config", () => {
		for (const def of subjectConfig.materialTypes) {
			expect(artMotif(def.key)).toBe(def.art);
		}
	});

	it("cade pe indice când tipul n-are `art` declarat", () => {
		const types = [
			{ key: "alfa", icon: "a", labelKey: "x" },
			{ key: "beta", icon: "b", labelKey: "y" },
		];
		expect(artMotif("alfa", types)).toBe(MOTIFS[0]);
		expect(artMotif("beta", types)).toBe(MOTIFS[1]);
	});

	it("un tip necunoscut nu aruncă, ci primește primul motiv", () => {
		expect(artMotif("nu-exista")).toBe(MOTIFS[0]);
		expect(artMotif("")).toBe(MOTIFS[0]);
	});

	it("ignoră un `art` scris greșit în config și cade pe indice", () => {
		const types = [{ key: "alfa", icon: "a", labelKey: "x", art: "nu-e-un-motiv" as never }];
		expect(artMotif("alfa", types)).toBe(MOTIFS[0]);
	});
});

describe("artHue", () => {
	it("e determinist — SSR și client trebuie să dea aceeași nuanță", () => {
		// Orice altceva ar produce hydration mismatch, ca la amestecarea jocurilor.
		for (const seed of ["relieful-terrei", "atmosfera", "", "9:hidrosfera"]) {
			expect(artHue(seed)).toBe(artHue(seed));
			expect(hueIndex(seed)).toBe(hueIndex(seed));
		}
	});

	it("întoarce mereu o nuanță din listă", () => {
		for (let i = 0; i < 500; i++) {
			expect(ART_HUES).toContain(artHue(`tema-${i}`));
		}
	});

	it("împrăștie temele peste toate nuanțele", () => {
		// Un hash prost (de ex. suma codurilor) ar îngrămădi capitolele pe 1–2 nuanțe și
		// grila ar arăta monocromă. Cerem ca toate nuanțele să fie folosite pe 40 de teme.
		const seen = new Set(Array.from({ length: 40 }, (_, i) => artHue(`capitolul-${i}`)));
		expect(seen.size).toBe(ART_HUES.length);
	});

	it("temele reale din config nu se îngrămădesc pe o singură nuanță", () => {
		const slugs = Object.values(subjectConfig.topics).flatMap((ts) => ts.map((t) => t.slug));
		const seen = new Set(slugs.map(artHue));
		expect(slugs.length).toBeGreaterThan(10);
		expect(seen.size).toBeGreaterThanOrEqual(4);
	});
});

describe("HUE_CLASS", () => {
	it("acoperă fiecare nuanță", () => {
		for (const h of ART_HUES) expect(HUE_CLASS[h]).toBeTruthy();
	});

	it("scrie clasele Tailwind întregi, nu compuse din bucăți", () => {
		// Tailwind scanează sursa după șiruri literale: `text-${hue}-600` n-ar genera
		// niciodată utilitarul, iar ilustrațiile ar ieși toate negre.
		for (const h of ART_HUES) {
			expect(HUE_CLASS[h]).toContain(`text-${h}-`);
			expect(HUE_CLASS[h]).toContain(`dark:text-${h}-`);
			expect(HUE_CLASS[h]).not.toContain("${");
		}
	});
});

describe("artVariant", () => {
	it("e determinist, ca și nuanța", () => {
		for (const seed of ["universul-partea-1", "", "x"]) expect(artVariant(seed)).toBe(artVariant(seed));
	});

	it("rămâne în intervalul terenurilor desenate", () => {
		for (let i = 0; i < 500; i++) {
			const v = artVariant(`material-${i}`);
			expect(v).toBeGreaterThanOrEqual(0);
			expect(v).toBeLessThan(ART_VARIANTS);
		}
	});

	it("nu e legată de nuanță — altfel un capitol ar primi mereu aceleași perechi", () => {
		// Sarea „v:" există exact pentru asta. Cu același hash pe aceeași sămânță, nuanța și
		// varianta ar fi funcții una de alta: toate cardurile roz ar avea același teren.
		const perechi = new Set(Array.from({ length: 60 }, (_, i) => `${artHue(`t${i}`)}/${artVariant(`t${i}`)}`));
		expect(perechi.size).toBeGreaterThan(ART_HUES.length);
	});

	it("desparte materialele dintr-un capitol", () => {
		// Cazul real care a cerut varianta: două jocuri din același capitol, aceeași
		// pictogramă și aceeași nuanță — ieșeau identice pixel cu pixel.
		const slugs = ["arhitectii-atmosferei", "vanturile-planetei", "detectivul-climatic"];
		expect(new Set(slugs.map(artVariant)).size).toBeGreaterThan(1);
	});
});
