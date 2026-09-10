import { getDb } from "../db/client";
import { getAdminSession, getStudentSession, getTeacherSession } from "./session";
import { getSecrets } from "./env";
import { tokenStillValid } from "./tokens";
import { getUserById } from "./users";
import { parseSiteMode } from "./site-mode";
import type { User } from "../db/schema";
import type { Viewer } from "./entitlement";

/** Resolve the logged-in teacher (account), or null. */
export async function getTeacher(request: Request, env: Env): Promise<User | null> {
	const session = await getTeacherSession(request, getSecrets(env).sessionSecret);
	if (!session) return null;
	const user = await getUserById(getDb(env), session.userId);
	if (!user || user.suspendedAt != null) return null;
	return user;
}

/** Viewer for a teacher. Payments deferred → full view-only access granted for now. */
export function teacherViewer(): Viewer {
	return { role: "teacher", hasPedagogy: true, subscribed: true };
}

/**
 * Vizitator anonim pe vitrina publică. NU se construiește în `resolveViewer` — altfel
 * fiecare anonim de pe site ar deveni vizitator de vitrină. Îl construiesc doar rutele
 * /demo/* și routes/media.tsx, și doar pentru materialele din setul curat.
 */
export function demoViewer(): Viewer {
	return { role: "demo" };
}

/**
 * Vizitatorul instanței libere: oricine, fără cont. Spre deosebire de `demoViewer`, ăsta
 * SE construiește în `resolveViewer` — pe instanța liberă chiar toți vizitatorii sunt el.
 */
export function liberViewer(): Viewer {
	return { role: "liber" };
}

export interface ResolvedViewer {
	viewer: Viewer;
	isAdmin: boolean;
	/** logged in with a teacher account (independent of any student session — see below) */
	isTeacher: boolean;
	isStudent: boolean;
	gradeId?: string;
	/** the student's class token id (students only) */
	tokenId?: string;
	/** per-session watermark code (students only) */
	wm?: string;
}

/**
 * Resolve who is asking, re-checking token validity server-side every request.
 *
 * Modelul de coexistență (rezolvă bucla infinită /clasa ⇄ /intra): cele trei cookie-uri
 * (admin/profesor/elev) sunt complet independente — vezi session.ts — deci un profesor
 * logat poate avea SIMULTAN o sesiune de elev validă, dacă a intrat cu un token de clasă.
 * Vechiul cod se oprea la prima sesiune găsită (admin > profesor > elev) și nu se mai uita
 * deloc la cookie-ul de elev când exista o sesiune de profesor — `isStudent` rămânea `false`,
 * `/clasa/:id` redirecționa spre `/intra`, care vedea cookie-ul de elev tot valid și
 * redirecționa înapoi spre `/clasa/:id`: ping-pong etern.
 *
 * Fixul: verificăm sesiunea de elev INDEPENDENT de admin/profesor, și populăm
 * isStudent/gradeId/tokenId/wm de câte ori există un token încă valid — indiferent ce
 * altă sesiune mai există. `viewer` (folosit de `resolveVisibility`, deci de tot ce ține
 * de acces la conținut) rămâne însă rolul cel mai LARG — admin > profesor > elev — ca să
 * nu regreseze previzualizarea de profesor la /media/:id sau la biblioteca de pedagogie
 * (comentariul de mai jos, păstrat din codul vechi). `isTeacher` e nou: rutele care au
 * nevoie să distingă „profesor care se uită ca elev" de „elev simplu" îl pot citi separat
 * de `viewer.role`.
 */
export async function resolveViewer(request: Request, env: Env): Promise<ResolvedViewer> {
	// Pe instanța liberă nu există sesiuni: nici admin, nici profesor, nici elev. Ieșim înainte
	// de orice citire de cookie sau atingere a bazei — nu doar mai rapid, ci și imposibil de
	// escaladat, fiindcă niciun cookie nu e citit ca să poată fi crezut.
	if (parseSiteMode(env.SITE_MODE) === "liber") {
		return { viewer: liberViewer(), isAdmin: false, isTeacher: false, isStudent: false };
	}

	const secret = getSecrets(env).sessionSecret;

	// Elevul se rezolvă primul și independent — nu sub un `else` de admin/profesor.
	let studentPart: Pick<ResolvedViewer, "isStudent" | "gradeId" | "tokenId" | "wm"> = {
		isStudent: false,
	};
	const student = await getStudentSession(request, secret);
	if (student) {
		// Re-verify the underlying token hasn't been revoked / expired.
		const still = await tokenStillValid(getDb(env), student.tokenId);
		if (still) {
			studentPart = {
				isStudent: true,
				gradeId: student.gradeId,
				tokenId: student.tokenId,
				wm: student.wm,
			};
		}
	}

	const admin = await getAdminSession(request, secret);
	if (admin) {
		return { viewer: { role: "admin" }, isAdmin: true, isTeacher: false, ...studentPart };
	}

	// Logged-in teachers get view-only access (payments deferred). Without this,
	// a teacher's requests — e.g. streaming /media/:id in the profesor preview —
	// fall through to role "none" and are refused.
	const teacher = await getTeacherSession(request, secret);
	if (teacher) {
		const user = await getUserById(getDb(env), teacher.userId);
		if (user && user.suspendedAt == null) {
			return { viewer: teacherViewer(), isAdmin: false, isTeacher: true, ...studentPart };
		}
	}

	if (studentPart.isStudent) {
		return {
			viewer: { role: "student", gradeId: studentPart.gradeId! },
			isAdmin: false,
			isTeacher: false,
			...studentPart,
		};
	}

	return { viewer: { role: "none" }, isAdmin: false, isTeacher: false, isStudent: false };
}
