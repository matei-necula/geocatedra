import { redirect } from "react-router";
import type { Route } from "./+types/logout";
import { clearCookie, COOKIE_NAMES, getStudentSession, getTeacherSession, isSecureRequest } from "../lib/session";
import { getSecrets } from "../lib/env";

// State-changing (clears auth cookies) — must be a POST action, not a loader. A loader here
// would let a third-party page force-logout a signed-in user via e.g. <img src="/iesire">.
export async function action({ request, context }: Route.ActionArgs) {
	const env = context.cloudflare.env;
	const secure = isSecureRequest(request);
	const secret = getSecrets(env).sessionSecret;
	const headers = new Headers();

	// Stare mixtă: un profesor logat poate avea și o sesiune de elev (a intrat cu un token
	// de clasă — vezi guard.ts). „Ieșire" apăsat din vizualizarea de elev trebuie să închidă
	// DOAR sesiunea de elev și să-l întoarcă la contul lui de profesor, nu să-l delogheze de
	// tot — altfel ar trebui să se autentifice din nou ca profesor doar ca să iasă din clasă.
	const [teacherSession, studentSession] = await Promise.all([
		getTeacherSession(request, secret),
		getStudentSession(request, secret),
	]);
	if (teacherSession && studentSession) {
		headers.append("Set-Cookie", clearCookie(COOKIE_NAMES.STUDENT_COOKIE, secure));
		throw redirect("/profesor", { headers });
	}

	headers.append("Set-Cookie", clearCookie(COOKIE_NAMES.STUDENT_COOKIE, secure));
	headers.append("Set-Cookie", clearCookie(COOKIE_NAMES.ADMIN_COOKIE, secure));
	headers.append("Set-Cookie", clearCookie(COOKIE_NAMES.TEACHER_COOKIE, secure));
	throw redirect("/", { headers });
}

// A GET must not clear cookies — that is the whole point of the change above. But an old
// bookmark or a link prefetch shouldn't land on a blank page either, so GET just goes home
// without touching any session state.
export async function loader() {
	throw redirect("/");
}

export default function Logout() {
	return null;
}
