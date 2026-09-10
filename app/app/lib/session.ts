import { signPayload, verifyPayload } from "./crypto";

// Two independent signed cookies. Students are anonymous (token only, no PII).
const STUDENT_COOKIE = "cat_student";
const ADMIN_COOKIE = "cat_admin";
const TEACHER_COOKIE = "cat_teacher";
const STUDENT_TTL = 60 * 60 * 6; // 6h rolling session; token validity is re-checked server-side
const ADMIN_TTL = 60 * 60 * 8;
const TEACHER_TTL = 60 * 60 * 12;

export interface StudentSession {
	kind: "student";
	tokenId: string;
	gradeId: string;
	/** per-session watermark code stamped onto delivered content */
	wm: string;
	exp: number;
}

export interface AdminSession {
	kind: "admin";
	exp: number;
}

export interface TeacherSession {
	kind: "teacher";
	userId: string;
	exp: number;
}

function parseCookies(header: string | null): Record<string, string> {
	const out: Record<string, string> = {};
	if (!header) return out;
	for (const part of header.split(";")) {
		const idx = part.indexOf("=");
		if (idx < 0) continue;
		out[part.slice(0, idx).trim()] = decodeURIComponent(part.slice(idx + 1).trim());
	}
	return out;
}

function buildCookie(name: string, value: string, maxAge: number, secure: boolean): string {
	const attrs = [
		`${name}=${encodeURIComponent(value)}`,
		"Path=/",
		"HttpOnly",
		"SameSite=Lax",
		`Max-Age=${maxAge}`,
	];
	if (secure) attrs.push("Secure");
	return attrs.join("; ");
}

export function isSecureRequest(request: Request): boolean {
	return new URL(request.url).protocol === "https:";
}

// ---- student ----

export async function getStudentSession(
	request: Request,
	secret: string,
): Promise<StudentSession | null> {
	const raw = parseCookies(request.headers.get("Cookie"))[STUDENT_COOKIE];
	if (!raw) return null;
	const session = await verifyPayload<StudentSession>(raw, secret);
	if (!session || session.kind !== "student" || session.exp < Date.now()) return null;
	return session;
}

export async function createStudentCookie(
	data: { tokenId: string; gradeId: string; wm: string },
	secret: string,
	secure: boolean,
): Promise<string> {
	const session: StudentSession = { kind: "student", ...data, exp: Date.now() + STUDENT_TTL * 1000 };
	const signed = await signPayload(session, secret);
	return buildCookie(STUDENT_COOKIE, signed, STUDENT_TTL, secure);
}

// ---- admin ----

export async function getAdminSession(
	request: Request,
	secret: string,
): Promise<AdminSession | null> {
	const raw = parseCookies(request.headers.get("Cookie"))[ADMIN_COOKIE];
	if (!raw) return null;
	const session = await verifyPayload<AdminSession>(raw, secret);
	if (!session || session.kind !== "admin" || session.exp < Date.now()) return null;
	return session;
}

export async function createAdminCookie(secret: string, secure: boolean): Promise<string> {
	const session: AdminSession = { kind: "admin", exp: Date.now() + ADMIN_TTL * 1000 };
	const signed = await signPayload(session, secret);
	return buildCookie(ADMIN_COOKIE, signed, ADMIN_TTL, secure);
}

// ---- teacher ----

export async function getTeacherSession(
	request: Request,
	secret: string,
): Promise<TeacherSession | null> {
	const raw = parseCookies(request.headers.get("Cookie"))[TEACHER_COOKIE];
	if (!raw) return null;
	const session = await verifyPayload<TeacherSession>(raw, secret);
	if (!session || session.kind !== "teacher" || session.exp < Date.now()) return null;
	return session;
}

export async function createTeacherCookie(
	userId: string,
	secret: string,
	secure: boolean,
): Promise<string> {
	const session: TeacherSession = { kind: "teacher", userId, exp: Date.now() + TEACHER_TTL * 1000 };
	const signed = await signPayload(session, secret);
	return buildCookie(TEACHER_COOKIE, signed, TEACHER_TTL, secure);
}

// ---- nickname device cookie (not auth; remembers nicknames claimed on this device) ----
const NICK_COOKIE = "cat_nick";
const NICK_TTL = 60 * 60 * 24 * 30; // 30 days
const NICK_MAX_PER_GRADE = 10;

export type NickMap = Record<string, string[]>; // gradeId -> claimed nickname keys

export async function readNickMap(request: Request, secret: string): Promise<NickMap> {
	const raw = parseCookies(request.headers.get("Cookie"))[NICK_COOKIE];
	if (!raw) return {};
	const map = await verifyPayload<NickMap>(raw, secret);
	return map && typeof map === "object" && !Array.isArray(map) ? map : {};
}

export async function buildNickCookie(map: NickMap, secret: string, secure: boolean): Promise<string> {
	const signed = await signPayload(map, secret);
	return buildCookie(NICK_COOKIE, signed, NICK_TTL, secure);
}

/** Return a new map with `key` recorded for `gradeId` (newest first, capped). */
export function addNick(map: NickMap, gradeId: string, key: string): NickMap {
	const list = map[gradeId] ?? [];
	const next = [key, ...list.filter((k) => k !== key)].slice(0, NICK_MAX_PER_GRADE);
	return { ...map, [gradeId]: next };
}

// ---- last-visit cookie (powers „Nou" badges + unread announcements; timestamps only, no PII) ----
const SEEN_COOKIE = "cat_seen";
const SEEN_TTL = 60 * 60 * 24 * 90; // 90 days
export const SEEN_REFRESH_MS = 4 * 60 * 60 * 1000; // advance at most every 4h so badges survive a browsing session

export type SeenMap = Record<string, number>; // gradeId -> lastSeenAt (ms)

export async function readSeenMap(request: Request, secret: string): Promise<SeenMap> {
	const raw = parseCookies(request.headers.get("Cookie"))[SEEN_COOKIE];
	if (!raw) return {};
	const map = await verifyPayload<SeenMap>(raw, secret);
	return map && typeof map === "object" && !Array.isArray(map) ? map : {};
}

export async function buildSeenCookie(map: SeenMap, secret: string, secure: boolean): Promise<string> {
	const signed = await signPayload(map, secret);
	return buildCookie(SEEN_COOKIE, signed, SEEN_TTL, secure);
}

export function clearCookie(name: string, secure: boolean): string {
	return buildCookie(name, "", 0, secure);
}

export const COOKIE_NAMES = { STUDENT_COOKIE, ADMIN_COOKIE, TEACHER_COOKIE, NICK_COOKIE, SEEN_COOKIE };
