import { describe, expect, it } from "vitest";
import { reduPrimaImagine } from "./assets";

// Partea pură a interogării de miniaturi. Interogarea în sine ordonează după
// (materialId, idx, createdAt); funcția de aici se bazează pe ordonarea aia, deci testele
// dau rânduri deja ordonate, cum vin din SQL.
describe("reduPrimaImagine", () => {
	it("ia prima imagine a fiecărui material și le numără", () => {
		const { first, count } = reduPrimaImagine([
			{ materialId: "m1", id: "a" },
			{ materialId: "m1", id: "b" },
			{ materialId: "m1", id: "c" },
			{ materialId: "m2", id: "d" },
		]);
		expect(first).toEqual({ m1: "a", m2: "d" });
		expect(count).toEqual({ m1: 3, m2: 1 });
	});

	// Un material fără imagini (o lecție scrisă) pur și simplu nu apare în rânduri. Nu are
	// voie să ajungă cu `undefined` în obiect — cardul verifică `thumbs[id]`, iar o cheie
	// existentă cu valoare `undefined` ar trece de un `in` și ar randa <img src="/media/undefined">.
	it("materialele fără imagini lipsesc din rezultat", () => {
		const { first, count } = reduPrimaImagine([{ materialId: "m1", id: "a" }]);
		expect("m2" in first).toBe(false);
		expect("m2" in count).toBe(false);
	});

	it("lista goală dă obiecte goale", () => {
		expect(reduPrimaImagine([])).toEqual({ first: {}, count: {} });
	});
});
