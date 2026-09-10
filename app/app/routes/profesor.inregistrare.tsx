import { data, Form, Link, redirect, useActionData, useNavigation } from "react-router";
import type { Route } from "./+types/profesor.inregistrare";
import { getDb } from "../db/client";
import { createTeacher, markEmailVerified } from "../lib/users";
import { getTeacher } from "../lib/guard";
import { makeVerifyToken, sendVerificationEmail, verifyLink } from "../lib/email";
import { clearCookie, COOKIE_NAMES, createTeacherCookie, getTeacherSession, isSecureRequest } from "../lib/session";
import { emailVerificationRequired, getSecrets } from "../lib/env";
import { clientIp, RATE_LIMIT_MESSAGE, underLimit } from "../lib/ratelimit";
import { timingSafeEqual } from "../lib/crypto";
import { Logo } from "../components/site";
import { seo } from "../lib/seo";

export function meta(_: Route.MetaArgs) {
	return seo({ title: "Cont profesor", path: "/profesor/inregistrare", noindex: true });
}

export async function loader({ request, context }: Route.LoaderArgs) {
	const env = context.cloudflare.env;
	// Validate against the DB (not just the signed cookie) to avoid a deleted/suspended
	// account bouncing forever between /profesor and the auth pages.
	const teacher = await getTeacher(request, env);
	if (teacher) throw redirect("/profesor");
	const session = await getTeacherSession(request, getSecrets(env).sessionSecret);
	if (session) {
		return data(null, { headers: { "Set-Cookie": clearCookie(COOKIE_NAMES.TEACHER_COOKIE, isSecureRequest(request)) } });
	}
	return null;
}

export async function action({ request, context }: Route.ActionArgs) {
	const env = context.cloudflare.env;
	if (!(await underLimit(env, "TOKEN_LIMITER", `signup:${clientIp(request)}`))) {
		return { error: RATE_LIMIT_MESSAGE };
	}
	const form = await request.formData();
	const email = String(form.get("email") ?? "");
	const password = String(form.get("password") ?? "");
	const confirm = String(form.get("confirm") ?? "");
	const code = String(form.get("code") ?? "");
	if (!timingSafeEqual(code, getSecrets(env).signupPassword)) return { error: "Cod de acces invalid." };
	if (password !== confirm) return { error: "Parolele nu coincid." };

	const db = getDb(env);
	const result = await createTeacher(db, email, password);
	if (!result.ok || !result.user) return { error: result.error ?? "Nu am putut crea contul." };

	const secret = getSecrets(env).sessionSecret;
	if (emailVerificationRequired(env)) {
		const token = await makeVerifyToken(result.user.id, result.user.email, secret);
		await sendVerificationEmail(env, result.user.email, verifyLink(new URL(request.url).origin, token));
	} else {
		// Verification turned off (no sending domain yet) — activate the account immediately.
		await markEmailVerified(getDb(env), result.user.id);
	}

	const cookie = await createTeacherCookie(result.user.id, secret, isSecureRequest(request));
	throw redirect("/profesor", { headers: { "Set-Cookie": cookie } });
}

const inputCls =
	"rounded-xl border border-border bg-bg px-4 py-3 outline-none focus:border-primary focus:ring-2 focus:ring-primary/20";

export default function Inregistrare() {
	const actionData = useActionData<typeof action>();
	const nav = useNavigation();
	return (
		<main className="motion-playful grid min-h-screen place-items-center px-5">
			<div className="cat-rise w-full max-w-md rounded-2xl border border-border bg-surface p-8 shadow-xl shadow-ink/5">
				<div className="mb-6 flex flex-col items-center text-center">
					<Logo size={48} />
					<h1 className="mt-4 text-2xl font-bold">Cont de profesor</h1>
					<p className="mt-2 text-sm text-muted">Creează un cont gratuit. Ai nevoie de codul de acces primit de la administrator.</p>
				</div>
				<Form method="post" className="grid gap-3">
					<input name="code" type="password" required placeholder="Cod de acces" className={inputCls} />
					<input name="email" type="email" required autoComplete="email" placeholder="E-mail" className={inputCls} />
					<input name="password" type="password" required autoComplete="new-password" placeholder="Parolă (min. 8 caractere)" className={inputCls} />
					<input name="confirm" type="password" required autoComplete="new-password" placeholder="Confirmă parola" className={inputCls} />
					{actionData?.error && (
						<p className="rounded-lg bg-accent/10 px-3 py-2 text-center text-sm text-accent-strong">{actionData.error}</p>
					)}
					<button type="submit" disabled={nav.state !== "idle"} className="rounded-xl bg-primary px-4 py-3 font-semibold text-on-primary transition hover:bg-primary-strong disabled:opacity-60">
						{nav.state !== "idle" ? "Se creează…" : "Creează cont"}
					</button>
				</Form>
				<p className="mt-5 text-center text-sm text-muted">
					Ai deja cont?{" "}
					<Link to="/profesor/login" viewTransition className="font-medium text-primary hover:underline">
						Autentifică-te
					</Link>
				</p>
			</div>
		</main>
	);
}
