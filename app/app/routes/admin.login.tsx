import { Form, redirect, useActionData, useNavigation } from "react-router";
import type { Route } from "./+types/admin.login";
import { subjectConfig, t } from "../config/subject";
import { createAdminCookie, getAdminSession, isSecureRequest } from "../lib/session";
import { getSecrets, turnstileKeys } from "../lib/env";
import { timingSafeEqual } from "../lib/crypto";
import { clientIp, RATE_LIMIT_MESSAGE, underLimit } from "../lib/ratelimit";
import { checkTurnstile } from "../lib/turnstile";
import { Logo } from "../components/site";
import { Turnstile } from "../components/Turnstile";
import { seo } from "../lib/seo";

export function meta(_: Route.MetaArgs) {
	// noindex: an auth entry point has nothing to offer a crawler (runbook 4.2).
	return seo({ title: t("admin.login.title"), path: "/admin/login", noindex: true });
}

export async function loader({ request, context }: Route.LoaderArgs) {
	const env = context.cloudflare.env;
	const admin = await getAdminSession(request, getSecrets(env).sessionSecret);
	if (admin) throw redirect("/admin");
	return { turnstileSiteKey: turnstileKeys(env).siteKey };
}

export async function action({ request, context }: Route.ActionArgs) {
	const env = context.cloudflare.env;
	if (!(await underLimit(env, "LOGIN_LIMITER", `admin:${clientIp(request)}`))) {
		return { error: RATE_LIMIT_MESSAGE };
	}
	const secrets = getSecrets(env);
	const form = await request.formData();
	const turnstileError = await checkTurnstile(turnstileKeys(env), request, form);
	if (turnstileError) return { error: turnstileError };
	const password = String(form.get("password") ?? "");

	if (!timingSafeEqual(password, secrets.adminPassword)) {
		return { error: t("admin.login.error") };
	}
	const cookie = await createAdminCookie(secrets.sessionSecret, isSecureRequest(request));
	throw redirect("/admin", { headers: { "Set-Cookie": cookie } });
}

export default function AdminLogin({ loaderData }: Route.ComponentProps) {
	const actionData = useActionData<typeof action>();
	const nav = useNavigation();
	return (
		<main className="grid min-h-screen place-items-center px-5">
			<div className="cat-rise w-full max-w-sm rounded-2xl border border-border bg-surface p-8 shadow-xl shadow-ink/5">
				<div className="mb-6 flex flex-col items-center text-center">
					<Logo size={44} />
					<h1 className="mt-4 text-xl font-bold">{t("admin.login.title")}</h1>
				</div>
				<Form method="post" className="grid gap-3">
					<input
						name="password"
						type="password"
						autoFocus
						placeholder="Parolă"
						className="rounded-xl border border-border bg-bg px-4 py-3 outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
					/>
					<Turnstile siteKey={loaderData.turnstileSiteKey} />
					{actionData?.error && (
						<p className="rounded-lg bg-accent/10 px-3 py-2 text-center text-sm text-accent-strong">
							{actionData.error}
						</p>
					)}
					<button
						type="submit"
						disabled={nav.state !== "idle"}
						className="rounded-xl bg-primary px-4 py-3 font-semibold text-on-primary transition hover:bg-primary-strong disabled:opacity-60"
					>
						{t("admin.login.button")}
					</button>
				</Form>
				<p className="mt-5 text-center text-xs text-muted">
					Acces privat. Doar pentru administrator.
				</p>
			</div>
		</main>
	);
}
