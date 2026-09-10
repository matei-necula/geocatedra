import { describe, expect, it } from "vitest";
import { firstSentence, scorePractice } from "./questions";

describe("scorePractice", () => {
	it("notă maximă când toate răspunsurile sunt corecte din prima", () => {
		expect(scorePractice([true, true, true, true])).toEqual({ correct: 4, total: 4, pct: 100, nota: 10 });
	});

	it("un răspuns corect abia după indiciu primește credit parțial, nu zero", () => {
		// 3 din prima + 1 cu indiciu = credit 3.5/4 = 87,5% → nota 9, nu 8 (cum ar ieși dacă
		// indiciul ar tăia tot creditul) și nu 10 (cum ar ieși dacă indiciul n-ar costa nimic).
		const r = scorePractice([true, true, true, false]);
		expect(r).toEqual({ correct: 3, total: 4, pct: 88, nota: 9 });
	});

	it("toate cu indiciu tot dau notă de trecere, nu minimă", () => {
		// Credit 0.5/întrebare pe tot testul → 50% → nota 6, nu 1 (ar fi cazul unui test all-or-
		// nothing pe prima încercare) — UI-ul oricum îl obligă să ajungă la răspunsul corect.
		const r = scorePractice([false, false, false, false]);
		expect(r).toEqual({ correct: 0, total: 4, pct: 50, nota: 6 });
	});

	it("un test gol nu împarte la zero", () => {
		expect(scorePractice([])).toEqual({ correct: 0, total: 0, pct: 0, nota: 1 });
	});
});

describe("firstSentence", () => {
	it("taie la primul semn de punctuație terminal", () => {
		expect(firstSentence("Prima propoziție. A doua propoziție.")).toBe("Prima propoziție.");
	});

	it("întoarce tot textul dacă n-are punctuație", () => {
		expect(firstSentence("fără punct")).toBe("fără punct");
	});

	it("text gol → șir gol", () => {
		expect(firstSentence("")).toBe("");
	});
});
