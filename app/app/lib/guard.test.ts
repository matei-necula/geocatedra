import { describe, expect, it, vi, beforeEach } from "vitest";

// resolveViewer atinge DB-ul prin getUserById (verifică profesorul nu e suspendat) și
// tokenStillValid (re-verifică tokenul de elev la fiecare cerere). Mock-uim toate cele
// patru dependențe externe ca să testăm doar logica de compunere a sesiunilor din guard.ts —
// exact bug-ul de aici (bucla /clasa ⇄ /intra) a fost o eroare de compunere, nu de I/O.
vi.mock("../db/client", () => ({ getDb: vi.fn(() => ({})) }));
vi.mock("./users", () => ({ getUserById: vi.fn() }));
vi.mock("./tokens", () => ({ tokenStillValid: vi.fn() }));
vi.mock("./session", async () => {
	const actual = await vi.importActual<typeof import("./session")>("./session");
	return {
		...actual,
		getAdminSession: vi.fn(),
		getTeacherSession: vi.fn(),
		getStudentSession: vi.fn(),
	};
});
vi.mock("./env", () => ({ getSecrets: vi.fn(() => ({ sessionSecret: "test-secret" })) }));

import { getAdminSession, getStudentSession, getTeacherSession } from "./session";
import { getUserById } from "./users";
import { tokenStillValid } from "./tokens";
import { resolveViewer } from "./guard";
import type { User } from "../db/schema";
import type { AccessToken } from "../db/schema";

const req = new Request("https://x/");

function activeUser(over: Partial<User> = {}): User {
	return {
		id: "u1",
		email: "prof@example.com",
		passwordHash: "x",
		role: "teacher",
		emailVerified: 1,
		suspendedAt: null,
		createdAt: Date.now(),
		...over,
	} as User;
}

function validToken(over: Partial<AccessToken> = {}): AccessToken {
	const now = Date.now();
	return {
		id: "tok1",
		tokenHash: "h",
		label: "Clasa a 9-a",
		gradeId: "9",
		validFrom: now - 1000,
		validUntil: now + 1000,
		revokedAt: null,
		createdAt: now,
		issuedBy: "u1",
		...over,
	} as AccessToken;
}

beforeEach(() => {
	vi.mocked(getAdminSession).mockReset().mockResolvedValue(null);
	vi.mocked(getTeacherSession).mockReset().mockResolvedValue(null);
	vi.mocked(getStudentSession).mockReset().mockResolvedValue(null);
	vi.mocked(getUserById).mockReset().mockResolvedValue(activeUser());
	vi.mocked(tokenStillValid).mockReset().mockResolvedValue(validToken());
});

describe("resolveViewer — nimic autentificat", () => {
	it("întoarce role none și isStudent/isTeacher/isAdmin toate false", async () => {
		const r = await resolveViewer(req, {} as Env);
		expect(r).toEqual({ viewer: { role: "none" }, isAdmin: false, isTeacher: false, isStudent: false });
	});
});

describe("resolveViewer — doar profesor", () => {
	it("viewer teacher, isTeacher true, isStudent false", async () => {
		vi.mocked(getTeacherSession).mockResolvedValue({ kind: "teacher", userId: "u1", exp: Date.now() + 1000 });
		const r = await resolveViewer(req, {} as Env);
		expect(r.viewer).toEqual({ role: "teacher", hasPedagogy: true, subscribed: true });
		expect(r.isTeacher).toBe(true);
		expect(r.isAdmin).toBe(false);
		expect(r.isStudent).toBe(false);
		expect(r.gradeId).toBeUndefined();
	});

	it("profesor suspendat cade pe role none (nu pe teacher)", async () => {
		vi.mocked(getTeacherSession).mockResolvedValue({ kind: "teacher", userId: "u1", exp: Date.now() + 1000 });
		vi.mocked(getUserById).mockResolvedValue(activeUser({ suspendedAt: Date.now() }));
		const r = await resolveViewer(req, {} as Env);
		expect(r.viewer).toEqual({ role: "none" });
		expect(r.isTeacher).toBe(false);
	});
});

describe("resolveViewer — doar elev", () => {
	it("viewer student cu gradeId, isStudent true, isTeacher/isAdmin false", async () => {
		vi.mocked(getStudentSession).mockResolvedValue({
			kind: "student",
			tokenId: "tok1",
			gradeId: "9",
			wm: "ABC123",
			exp: Date.now() + 1000,
		});
		const r = await resolveViewer(req, {} as Env);
		expect(r.viewer).toEqual({ role: "student", gradeId: "9" });
		expect(r.isStudent).toBe(true);
		expect(r.gradeId).toBe("9");
		expect(r.tokenId).toBe("tok1");
		expect(r.wm).toBe("ABC123");
		expect(r.isTeacher).toBe(false);
		expect(r.isAdmin).toBe(false);
	});

	it("token revocat/expirat (tokenStillValid întoarce null) → isStudent rămâne false", async () => {
		vi.mocked(getStudentSession).mockResolvedValue({
			kind: "student",
			tokenId: "tok1",
			gradeId: "9",
			wm: "ABC123",
			exp: Date.now() + 1000,
		});
		vi.mocked(tokenStillValid).mockResolvedValue(null);
		const r = await resolveViewer(req, {} as Env);
		expect(r.isStudent).toBe(false);
		expect(r.gradeId).toBeUndefined();
		expect(r.viewer).toEqual({ role: "none" });
	});
});

describe("resolveViewer — profesor ȘI elev (bug-ul buclei /clasa ⇄ /intra)", () => {
	it("isStudent tot devine true alături de sesiunea de profesor — asta era bug-ul", async () => {
		vi.mocked(getTeacherSession).mockResolvedValue({ kind: "teacher", userId: "u1", exp: Date.now() + 1000 });
		vi.mocked(getStudentSession).mockResolvedValue({
			kind: "student",
			tokenId: "tok1",
			gradeId: "9",
			wm: "XYZ789",
			exp: Date.now() + 1000,
		});
		const r = await resolveViewer(req, {} as Env);
		// Rolul folosit pentru access control la conținut rămâne cel mai larg (profesor) —
		// ca previzualizarea de profesor la /media și pedagogie să nu regreseze.
		expect(r.viewer).toEqual({ role: "teacher", hasPedagogy: true, subscribed: true });
		expect(r.isTeacher).toBe(true);
		// Dar isStudent/gradeId/tokenId/wm sunt populate independent — clasa.tsx poate
		// acum lăsa profesorul să treacă spre vizualizarea de elev a clasei lui, în loc
		// să-l trimită într-o buclă infinită spre /intra.
		expect(r.isStudent).toBe(true);
		expect(r.gradeId).toBe("9");
		expect(r.tokenId).toBe("tok1");
		expect(r.wm).toBe("XYZ789");
		expect(r.isAdmin).toBe(false);
	});

	it("token de elev revocat alături de o sesiune de profesor validă → isStudent rămâne false", async () => {
		vi.mocked(getTeacherSession).mockResolvedValue({ kind: "teacher", userId: "u1", exp: Date.now() + 1000 });
		vi.mocked(getStudentSession).mockResolvedValue({
			kind: "student",
			tokenId: "tok1",
			gradeId: "9",
			wm: "XYZ789",
			exp: Date.now() + 1000,
		});
		vi.mocked(tokenStillValid).mockResolvedValue(null);
		const r = await resolveViewer(req, {} as Env);
		expect(r.isStudent).toBe(false);
		expect(r.viewer).toEqual({ role: "teacher", hasPedagogy: true, subscribed: true });
	});
});

describe("resolveViewer — admin ȘI elev", () => {
	it("viewer rămâne admin (rolul cel mai larg), dar isStudent/gradeId tot se populează", async () => {
		vi.mocked(getAdminSession).mockResolvedValue({ kind: "admin", exp: Date.now() + 1000 });
		vi.mocked(getStudentSession).mockResolvedValue({
			kind: "student",
			tokenId: "tok1",
			gradeId: "10",
			wm: "AAA111",
			exp: Date.now() + 1000,
		});
		const r = await resolveViewer(req, {} as Env);
		expect(r.viewer).toEqual({ role: "admin" });
		expect(r.isAdmin).toBe(true);
		expect(r.isTeacher).toBe(false);
		// Nu contează pentru access control (adminul vede orice oricum), dar câmpurile
		// de elev tot trebuie populate consecvent, ca orice rută care le citește direct
		// (ex. gradeId pentru afișarea clasei) să se comporte la fel ca la profesor+elev.
		expect(r.isStudent).toBe(true);
		expect(r.gradeId).toBe("10");
	});
});

describe("planșeul de acces nu se lărgește: un elev rămâne confinat la clasa lui", () => {
	it("un elev de clasa a 9-a nu poate deveni admin/profesor doar pentru că are un token valid", async () => {
		vi.mocked(getStudentSession).mockResolvedValue({
			kind: "student",
			tokenId: "tok1",
			gradeId: "9",
			wm: "Z",
			exp: Date.now() + 1000,
		});
		const r = await resolveViewer(req, {} as Env);
		expect(r.viewer.role).toBe("student");
		expect(r.isAdmin).toBe(false);
		expect(r.isTeacher).toBe(false);
		// gradeId din viewer e cel din tokenul lui — restrângerea la clasa proprie se
		// face în `resolveVisibility` (entitlement.ts) pe baza acestui câmp.
		if (r.viewer.role === "student") expect(r.viewer.gradeId).toBe("9");
	});
});

describe("resolveViewer — modul liber (SITE_MODE=liber)", () => {
	it("întoarce liber necondiționat, chiar cu un cookie de sesiune fabricat, și nu atinge sesiunile/DB-ul", async () => {
		// Cookie-ul e fabricat manual (nu semnat de `signPayload`), exact ce ar trimite un
		// atacator care a ghicit sau furat un cookie de admin. Mock-urile de mai jos sunt
		// programate să întoarcă sesiuni „valide" DACĂ ar fi apelate — proba reală e că
		// scurtcircuitul iese înainte să le apeleze deloc, nu doar că întoarce rolul corect
		// pentru o cerere goală (asta ar trece și dacă scurtcircuitul ar lipsi, cu mock-urile
		// implicite null din beforeEach).
		vi.mocked(getAdminSession).mockResolvedValue({ kind: "admin", exp: Date.now() + 1000 });
		vi.mocked(getStudentSession).mockResolvedValue({
			kind: "student",
			tokenId: "tok1",
			gradeId: "9",
			wm: "FORGED",
			exp: Date.now() + 1000,
		});
		vi.mocked(getTeacherSession).mockResolvedValue({ kind: "teacher", userId: "u1", exp: Date.now() + 1000 });

		const forged = new Request("https://x/", {
			headers: { Cookie: "cat_admin=forged.signature.value" },
		});
		const r = await resolveViewer(forged, { SITE_MODE: "liber" } as Env);

		expect(r).toEqual({ viewer: { role: "liber" }, isAdmin: false, isTeacher: false, isStudent: false });
		// „Nu atinge baza, nu citește cookie": scurtcircuitul iese ÎNAINTE de orice sesiune
		// sau interogare DB — de-asta niciunul din mock-urile de mai sus n-a fost chemat.
		expect(getAdminSession).not.toHaveBeenCalled();
		expect(getStudentSession).not.toHaveBeenCalled();
		expect(getTeacherSession).not.toHaveBeenCalled();
		expect(getUserById).not.toHaveBeenCalled();
		expect(tokenStillValid).not.toHaveBeenCalled();
	});
});
