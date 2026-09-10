import { data, Form, Link, redirect, useActionData, useNavigation } from "react-router";
import type { Route } from "./+types/profesor.login";
import { subjectConfig } from "../config/subject";
import { getDb } from "../db/client";
import { findUserByEmail, verifyPassword } from "../lib/users";
import { getTeacher } from "../lib/guard";
import { clearCookie, COOKIE_NAMES, createTeacherCookie, getTeacherSession, isSecureRequest } from "../lib/session";
import { getSecrets, turnstileKeys } from "../lib/env";
import { clientIp, RATE_LIMIT_MESSAGE, underLimit } from "../lib/ratelimit";
import { checkTurnstile } from "../lib/turnstile";
import { Logo } from "../components/site";
import { Turnstile } from "../components/Turnstile";
import { seo } from "../lib/seo";

export function meta(_: Route.MetaArgs) {
	// noindex: an auth entry point has nothing to offer a crawler (runbook 4.2).
	return seo({ title: "Autentificare profesor", path: "/profesor/login", noindex: true });
}

export async function loader({ request, context }: Route.LoaderArgs) {
	const env = context.cloudflare.env;
	// Validate against the DB, not just the signed cookie: a deleted or suspended account
	// still has a valid-looking cookie. Redirecting on that alone bounces between /profesor
	// and /profesor/login forever ("too many redirects").
	const teacher = await getTeacher(request, env);
	if (teacher) throw redirect("/profesor");
	const turnstileSiteKey = turnstileKeys(env).siteKey;
	// If a stale teacher cookie lingers (account deleted/suspended), clear it so the browser
	// stops sending a dead session — teachers shouldn't have to clear cookies by hand.
	const session = await getTeacherSession(request, getSecrets(env).sessionSecret);
	if (session) {
		return data(
			{ turnstileSiteKey },
			{ headers: { "Set-Cookie": clearCookie(COOKIE_NAMES.TEACHER_COOKIE, isSecureRequest(request)) } },
		);
	}
	return { turnstileSiteKey };
}

export async function action({ request, context }: Route.ActionArgs) {
	const env = context.cloudflare.env;
	if (!(await underLimit(env, "LOGIN_LIMITER", `teacher:${clientIp(request)}`))) {
		return { error: RATE_LIMIT_MESSAGE };
	}
	const form = await request.formData();
	const turnstileError = await checkTurnstile(turnstileKeys(env), request, form);
	if (turnstileError) return { error: turnstileError };
	const email = String(form.get("email") ?? "");
	const password = String(form.get("password") ?? "");

	const db = getDb(env);
	const user = await findUserByEmail(db, email);
	if (!user || !(await verifyPassword(password, user.passwordHash))) {
		return { error: "E-mail sau parolă incorecte." };
	}
	if (user.suspendedAt != null) {
		return { error: "Contul a fost suspendat. Contactează administratorul." };
	}
	const cookie = await createTeacherCookie(user.id, getSecrets(env).sessionSecret, isSecureRequest(request));
	throw redirect("/profesor", { headers: { "Set-Cookie": cookie } });
}

const inputCls =
	"rounded-xl border border-border bg-bg px-4 py-3 outline-none focus:border-primary focus:ring-2 focus:ring-primary/20";

export default function ProfesorLogin({ loaderData }: Route.ComponentProps) {
	const actionData = useActionData<typeof action>();
	const nav = useNavigation();
	return (
		<main className="motion-playful grid min-h-screen place-items-center px-5">
			<div className="cat-rise w-full max-w-sm rounded-2xl border border-border bg-surface p-8 shadow-xl shadow-ink/5">
				<div className="mb-6 flex flex-col items-center text-center">
					<Logo size={44} />
					<h1 className="mt-4 text-xl font-bold">Autentificare profesor</h1>
				</div>
				<Form method="post" className="grid gap-3">
					<input name="email" type="email" required autoComplete="email" placeholder="E-mail" className={inputCls} />
					<input name="password" type="password" required autoComplete="current-password" placeholder="Parolă" className={inputCls} />
					<Turnstile siteKey={loaderData.turnstileSiteKey} />
					{actionData?.error && (
						<p className="rounded-lg bg-accent/10 px-3 py-2 text-center text-sm text-accent-strong">{actionData.error}</p>
					)}
					<button type="submit" disabled={nav.state !== "idle"} className="rounded-xl bg-primary px-4 py-3 font-semibold text-on-primary transition hover:bg-primary-strong disabled:opacity-60">
						Intră
					</button>
				</Form>
				<p className="mt-5 text-center text-sm text-muted">
					Nu ai cont?{" "}
					<Link to="/profesor/inregistrare" viewTransition className="font-medium text-primary hover:underline">
						Creează unul
					</Link>
				</p>
			</div>
		</main>
	);
}
