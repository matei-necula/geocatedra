import { describe, expect, it } from "vitest";
import { parseSiteMode } from "./site-mode";

describe("parseSiteMode", () => {
	it("recunoaște modul liber", () => {
		expect(parseSiteMode("liber")).toBe("liber");
	});

	it("recunoaște modul clase", () => {
		expect(parseSiteMode("clase")).toBe("clase");
	});

	// Fail-safe: orice necunoscut cade pe site-ul RESTRÂNS, nu pe cel deschis. O variabilă
	// scrisă greșit nu are voie să publice pedagogia pe internet.
	it("cade pe clase pentru orice altceva", () => {
		expect(parseSiteMode(undefined)).toBe("clase");
		expect(parseSiteMode("")).toBe("clase");
		expect(parseSiteMode("Liber")).toBe("clase");
		expect(parseSiteMode("public")).toBe("clase");
	});
});
