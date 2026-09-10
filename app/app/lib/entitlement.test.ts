import { describe, expect, it } from "vitest";
import { canSee, resolveVisibility, type AccessibleMaterial, type Viewer } from "./entitlement";

// Podeaua întregii aplicații. Testul acoperă și rolurile vechi, nu doar cel nou:
// o lărgire accidentală de acces trebuie să pice aici, nu în producție.
function material(over: Partial<AccessibleMaterial> = {}): AccessibleMaterial {
	return {
		id: "m1",
		status: "published",
		library: "student",
		gradeId: "9",
		slug: "solurile-terrei",
		isTeaser: false,
		...over,
	};
}

const DEMO_STUDENT = { gradeId: "9", slug: "hidrosfera-apele-pamantului" };
const DEMO_TEACHER = { gradeId: "9", slug: "schema-climatele-terestre" };

const admin: Viewer = { role: "admin" };
const student9: Viewer = { role: "student", gradeId: "9" };
const teacher: Viewer = { role: "teacher", hasPedagogy: true, subscribed: true };
const demo: Viewer = { role: "demo" };
const liber: Viewer = { role: "liber" };
const none: Viewer = { role: "none" };

describe("drafts", () => {
	it("are visible to admin only", () => {
		const draft = material({ status: "draft" });
		expect(resolveVisibility(admin, draft)).toBe("full");
		expect(resolveVisibility(student9, draft)).toBe("hidden");
		expect(resolveVisibility(teacher, draft)).toBe("hidden");
		expect(resolveVisibility(none, draft)).toBe("hidden");
	});

	it("stay hidden from the vitrina even when curated", () => {
		expect(resolveVisibility(demo, material({ ...DEMO_STUDENT, status: "draft" }))).toBe("hidden");
	});
});

describe("student", () => {
	it("sees published student material in their own grade", () => {
		expect(resolveVisibility(student9, material())).toBe("full");
	});

	it("never sees another grade or the teacher library", () => {
		expect(resolveVisibility(student9, material({ gradeId: "10" }))).toBe("hidden");
		expect(resolveVisibility(student9, material({ library: "teacher" }))).toBe("hidden");
	});
});

describe("teacher", () => {
	it("gets view-only while subscribed", () => {
		expect(resolveVisibility(teacher, material())).toBe("view_only");
		expect(resolveVisibility(teacher, material({ library: "teacher" }))).toBe("view_only");
	});

	it("is locked out of pedagogy without the entitlement", () => {
		const noPedagogy: Viewer = { role: "teacher", hasPedagogy: false, subscribed: true };
		expect(resolveVisibility(noPedagogy, material({ library: "teacher" }))).toBe("locked");
	});

	it("is locked out entirely without a subscription", () => {
		const lapsed: Viewer = { role: "teacher", hasPedagogy: true, subscribed: false };
		expect(resolveVisibility(lapsed, material())).toBe("locked");
	});
});

describe("public (B2C reader)", () => {
	it("never sees the teacher library", () => {
		const pub: Viewer = { role: "public", entitled: () => true, subscribed: true };
		expect(resolveVisibility(pub, material({ library: "teacher" }))).toBe("hidden");
	});

	it("sees teasers, and full material when entitled", () => {
		const anon: Viewer = { role: "public", entitled: () => false, subscribed: false };
		expect(resolveVisibility(anon, material({ isTeaser: true }))).toBe("teaser");
		expect(resolveVisibility(anon, material())).toBe("locked");
		const buyer: Viewer = { role: "public", entitled: () => true, subscribed: false };
		expect(resolveVisibility(buyer, material())).toBe("full");
	});
});

describe("demo (anonymous visitor on the vitrina)", () => {
	it("sees a curated student material whole — that is the proof", () => {
		expect(resolveVisibility(demo, material(DEMO_STUDENT))).toBe("full");
	});

	it("sees a curated teacher deck only as a preview", () => {
		expect(resolveVisibility(demo, material({ ...DEMO_TEACHER, library: "teacher" }))).toBe("preview");
	});

	it("sees nothing that was not curated", () => {
		expect(resolveVisibility(demo, material())).toBe("hidden");
		expect(resolveVisibility(demo, material({ library: "teacher", slug: "schema-solul" }))).toBe("hidden");
	});

	it("ignores the is_teaser column entirely", () => {
		expect(resolveVisibility(demo, material({ isTeaser: true }))).toBe("hidden");
	});
});

describe("none", () => {
	it("sees nothing at all", () => {
		expect(resolveVisibility(none, material())).toBe("hidden");
		expect(resolveVisibility(none, material(DEMO_STUDENT))).toBe("hidden");
	});
});

describe("rolul liber (site-ul public și gratuit)", () => {
	it("vede întreg orice material de elev publicat, din orice clasă", () => {
		expect(resolveVisibility(liber, material({ library: "student", gradeId: "9" }))).toBe("full");
		expect(resolveVisibility(liber, material({ library: "student", gradeId: "12" }))).toBe("full");
	});

	it("vede întreg orice material de profesor publicat — pedagogia e gratuită aici", () => {
		expect(resolveVisibility(liber, material({ library: "teacher", gradeId: "9" }))).toBe("full");
	});

	// Podeaua nu se subțiază: ciornele rămân invizibile pentru oricine în afară de admin.
	it("NU vede ciornele", () => {
		expect(resolveVisibility(liber, material({ library: "student", status: "draft" }))).toBe("hidden");
		expect(resolveVisibility(liber, material({ library: "teacher", status: "draft" }))).toBe("hidden");
	});

	it("nu depinde de coloana is_teaser", () => {
		expect(resolveVisibility(liber, material({ library: "student", isTeaser: true }))).toBe("full");
		expect(resolveVisibility(liber, material({ library: "student", isTeaser: false }))).toBe("full");
	});

	// Testul care contează: rolul nou NU are voie să schimbe nimic pentru rolurile vechi.
	it("nu slăbește rolurile existente", () => {
		expect(resolveVisibility({ role: "none" }, material({ library: "teacher" }))).toBe("hidden");
		expect(resolveVisibility({ role: "student", gradeId: "9" }, material({ library: "teacher", gradeId: "9" }))).toBe("hidden");
	});
});

describe("canSee", () => {
	it("counts preview as visible", () => {
		expect(canSee(demo, material({ ...DEMO_TEACHER, library: "teacher" }))).toBe(true);
	});

	it("counts locked and hidden as not visible", () => {
		expect(canSee(none, material())).toBe(false);
		const lapsed: Viewer = { role: "teacher", hasPedagogy: true, subscribed: false };
		expect(canSee(lapsed, material())).toBe(false);
	});
});
