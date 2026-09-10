import { describe, expect, it } from "vitest";
import { formaPlural, plansePlural } from "./plural";

describe("formaPlural", () => {
	it("singular doar pentru 1", () => {
		expect(formaPlural(1)).toBe("one");
		expect(formaPlural(0)).toBe("many"); // „0 de planșe"
	});

	it("plural simplu pentru 2–19", () => {
		for (const n of [2, 5, 12, 19]) expect(formaPlural(n)).toBe("few");
	});

	it("plural cu «de» de la 20 în sus", () => {
		for (const n of [20, 42, 99, 171]) expect(formaPlural(n)).toBe("many");
	});

	// Capcana care face diferența față de un `n > 19` naiv: contează ULTIMELE DOUĂ cifre.
	// 101 e „101 planșe", nu „101 de planșe"; 120 e „120 de planșe".
	it("se uită la ultimele două cifre, nu la mărimea numărului", () => {
		expect(formaPlural(101)).toBe("few");
		expect(formaPlural(103)).toBe("few");
		expect(formaPlural(119)).toBe("few");
		expect(formaPlural(120)).toBe("many");
		expect(formaPlural(100)).toBe("many");
		expect(formaPlural(200)).toBe("many");
	});
});

describe("plansePlural", () => {
	it("pune numărul în text", () => {
		expect(plansePlural(1)).toBe("1 planșă");
		expect(plansePlural(12)).toBe("12 planșe");
		expect(plansePlural(171)).toBe("171 de planșe");
		expect(plansePlural(101)).toBe("101 planșe");
	});
});
