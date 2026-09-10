import { describe, expect, it } from "vitest";
import {
	BODY_MAX,
	BODY_MIN,
	NAME_MAX,
	ROLES,
	cleanText,
	isReviewRole,
	monthLabel,
	validateReview,
	visibleReviews,
} from "./reviews";
import type { Review } from "../db/schema";

const good = { name: "Ana", role: "profesor", rating: "5", body: "Materialele sunt foarte utile la clasă." };

function ok(input: Record<string, unknown>) {
	const res = validateReview(input);
	if (!res.ok) throw new Error(`așteptam valid, am primit: ${JSON.stringify(res.errors)}`);
	return res.review;
}

function errs(input: Record<string, unknown>) {
	const res = validateReview(input);
	if (res.ok) throw new Error("așteptam erori, dar intrarea a trecut");
	return res.errors;
}

describe("cleanText", () => {
	it("collapses runs of whitespace to a single space", () => {
		expect(cleanText("a   b\t\tc")).toBe("a b c");
		expect(cleanText("primul rând\n\n\nal doilea")).toBe("primul rând al doilea");
	});

	it("strips control characters instead of keeping them in the text", () => {
		expect(cleanText("bun\u0000\u0007 text")).toBe("bun text");
		expect(cleanText("a\u001Bb")).toBe("a b");
	});

	it("removes zero-width and direction-override characters entirely", () => {
		// U+200B lățime zero, U+202E suprascriere de direcție — invizibile, deci scoase de tot,
		// nu înlocuite cu spațiu (altfel „te\u200Bxt" ar deveni „te xt").
		expect(cleanText("te\u200Bxt\u202E")).toBe("text");
	});

	it("trims the ends", () => {
		expect(cleanText("   spațiat   ")).toBe("spațiat");
		expect(cleanText("\n\t")).toBe("");
	});

	it("keeps Romanian diacritics intact", () => {
		expect(cleanText("Înțelegere, țărm, șansă")).toBe("Înțelegere, țărm, șansă");
	});
});

describe("isReviewRole", () => {
	it("accepts exactly the closed list", () => {
		for (const role of ROLES) expect(isReviewRole(role)).toBe(true);
	});

	it("refuses anything else", () => {
		expect(isReviewRole("admin")).toBe(false);
		expect(isReviewRole("Elev")).toBe(false); // fără potrivire aproximativă
		expect(isReviewRole("")).toBe(false);
		expect(isReviewRole(null)).toBe(false);
		expect(isReviewRole(3)).toBe(false);
	});

	it("carries nothing subject-specific", () => {
		// Motorul e subiect-agnostic: lista de roluri n-are voie să știe de geografie.
		expect(ROLES.join(" ")).not.toMatch(/geograf/i);
	});
});

describe("validateReview — stele", () => {
	it("accepts every integer from 1 to 5, as string or number", () => {
		for (let n = 1; n <= 5; n++) {
			expect(ok({ ...good, rating: String(n) }).rating).toBe(n);
			expect(ok({ ...good, rating: n }).rating).toBe(n);
		}
	});

	it("refuses values outside 1–5", () => {
		expect(errs({ ...good, rating: "0" }).rating).toBeTruthy();
		expect(errs({ ...good, rating: "6" }).rating).toBeTruthy();
		expect(errs({ ...good, rating: "-3" }).rating).toBeTruthy();
	});

	it("refuses non-integers and junk", () => {
		expect(errs({ ...good, rating: "3.5" }).rating).toBeTruthy();
		expect(errs({ ...good, rating: "3 stele" }).rating).toBeTruthy();
		expect(errs({ ...good, rating: "" }).rating).toBeTruthy();
		expect(errs({ ...good, rating: undefined }).rating).toBeTruthy();
		expect(errs({ ...good, rating: Number.NaN }).rating).toBeTruthy();
	});
});

describe("validateReview — rol", () => {
	it("accepts each role in the list", () => {
		for (const role of ROLES) expect(ok({ ...good, role }).role).toBe(role);
	});

	it("refuses a role outside the list", () => {
		expect(errs({ ...good, role: "director" }).role).toBeTruthy();
		expect(errs({ ...good, role: "" }).role).toBeTruthy();
		expect(errs({ ...good, role: undefined }).role).toBeTruthy();
	});
});

describe("validateReview — text", () => {
	it("refuses text shorter than the minimum after trimming", () => {
		expect(errs({ ...good, body: "prea " }).body).toBeTruthy();
		expect(errs({ ...good, body: `${"a".repeat(BODY_MIN - 1)}   ` }).body).toBeTruthy();
		expect(errs({ ...good, body: "" }).body).toBeTruthy();
		expect(errs({ ...good, body: "         " }).body).toBeTruthy();
	});

	it("accepts text exactly at the minimum", () => {
		expect(ok({ ...good, body: "a".repeat(BODY_MIN) }).body).toBe("a".repeat(BODY_MIN));
	});

	it("accepts text exactly at the maximum and refuses one over", () => {
		expect(ok({ ...good, body: "a".repeat(BODY_MAX) }).body).toHaveLength(BODY_MAX);
		expect(errs({ ...good, body: "a".repeat(BODY_MAX + 1) }).body).toBeTruthy();
	});

	it("measures the CLEANED text, so padding cannot smuggle length in", () => {
		// 800 de caractere cu spații duble ar trece de prag oricum; important e că textul
		// salvat e cel curățat, nu cel primit.
		expect(ok({ ...good, body: `${"a ".repeat(400)}   ` }).body).not.toMatch(/ {2}/);
	});
});

describe("validateReview — nume", () => {
	it("is optional: missing or blank becomes null, not an error", () => {
		expect(ok({ ...good, name: "" }).name).toBeNull();
		expect(ok({ ...good, name: "   " }).name).toBeNull();
		expect(ok({ ...good, name: undefined }).name).toBeNull();
	});

	it("TRUNCATES an over-long name instead of rejecting it", () => {
		const long = "N".repeat(NAME_MAX + 30);
		expect(ok({ ...good, name: long }).name).toHaveLength(NAME_MAX);
		expect(validateReview({ ...good, name: long }).ok).toBe(true);
	});

	it("does not leave a dangling space when the cut lands mid-word", () => {
		const name = `${"a".repeat(NAME_MAX - 1)} bcd`;
		expect(ok({ ...good, name }).name).toBe("a".repeat(NAME_MAX - 1));
	});

	it("cleans the name the same way as the body", () => {
		expect(ok({ ...good, name: "  Ana    Maria " }).name).toBe("Ana Maria");
	});
});

describe("validateReview — statusul", () => {
	it("is ALWAYS pending, whatever the caller sends", () => {
		expect(ok(good).status).toBe("pending");
		expect(ok({ ...good, status: "approved" }).status).toBe("pending");
		expect(ok({ ...good, status: "rejected" }).status).toBe("pending");
		expect(ok({ ...good, Status: "approved", STATUS: "approved" }).status).toBe("pending");
	});

	it("never carries an id or a timestamp from the caller", () => {
		const review = ok({ ...good, id: "ales-de-atacator", createdAt: 0, created_at: 0 });
		expect(review).not.toHaveProperty("id");
		expect(review).not.toHaveProperty("createdAt");
	});
});

describe("validateReview — mai multe erori deodată", () => {
	it("reports every bad field, not just the first", () => {
		const e = errs({ name: "x", role: "nimeni", rating: "9", body: "scurt" });
		expect(e.role).toBeTruthy();
		expect(e.rating).toBeTruthy();
		expect(e.body).toBeTruthy();
	});

	it("returns message KEYS, so the copy stays in subject.config", () => {
		expect(errs({ ...good, rating: "9" }).rating).toMatch(/^reviews\./);
	});
});

describe("visibleReviews", () => {
	const row = (id: string, status: string, createdAt: number): Review => ({
		id,
		name: null,
		role: "elev",
		rating: 5,
		body: "text",
		status,
		createdAt,
	});

	it("keeps only the approved ones", () => {
		const rows = [row("a", "approved", 3), row("b", "pending", 2), row("c", "rejected", 1)];
		expect(visibleReviews(rows).map((r) => r.id)).toEqual(["a"]);
	});

	it("refuses a status nobody defined, rather than letting it through", () => {
		expect(visibleReviews([row("x", "APPROVED", 1), row("y", "", 1)])).toEqual([]);
	});

	it("puts the newest first", () => {
		const rows = [row("vechi", "approved", 1), row("nou", "approved", 9), row("mijloc", "approved", 5)];
		expect(visibleReviews(rows).map((r) => r.id)).toEqual(["nou", "mijloc", "vechi"]);
	});

	it("survives an empty list", () => {
		expect(visibleReviews([])).toEqual([]);
	});
});

describe("monthLabel", () => {
	it("names the month and the year in Romanian", () => {
		expect(monthLabel(Date.UTC(2026, 8, 5, 12))).toMatch(/septembrie 2026/);
	});
});
