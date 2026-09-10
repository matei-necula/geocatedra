import { Form, redirect, useActionData, useNavigation } from "react-router";
import type { Route } from "./+types/student.intra";
import { subjectConfig, t } from "../config/subject";
import { getDb } from "../db/client";
import { validateToken } from "../lib/tokens";
import { createStudentCookie, getStudentSession, isSecureRequest } from "../lib/session";
import { getSecrets, turnstileKeys } from "../lib/env";
import { randomCode } from "../lib/crypto";
import { clientIp, RATE_LIMIT_MESSAGE, underLimit } from "../lib/ratelimit";
import { checkTurnstile } from "../lib/turnstile";
import { Logo } from "../components/site";
import { Turnstile } from "../components/Turnstile";
import { seo } from "../lib/seo";
import { Plate } from "../components/atlas";

export function meta(_: Route.MetaArgs) {
	// noindex: an auth entry point has nothing to offer a crawler (runbook 4.2).
	return seo({ title: t("student.enter.title"), path: "/intra", noindex: true });
}

export async function loader({ request, context }: Route.LoaderArgs) {
	const env = context.cloudflare.env;
	const session = await getStudentSession(request, getSecrets(env).sessionSecret);
	if (session) throw redirect(`/clasa/${session.gradeId}`);
	return { devHint: import.meta.env.DEV ? "GEO-9-DEMO" : null, turnstileSiteKey: turnstileKeys(env).siteKey };
}

export async function action({ request, context }: Route.ActionArgs) {
	const env = context.cloudflare.env;
	if (!(await underLimit(env, "TOKEN_LIMITER", `token:${clientIp(request)}`))) {
		return { error: RATE_LIMIT_MESSAGE };
	}
	const db = getDb(env);
	const form = await request.formData();
	const turnstileError = await checkTurnstile(turnstileKeys(env), request, form);
	if (turnstileError) return { error: turnstileError };
	const raw = String(form.get("token") ?? "");

	const token = await validateToken(db, raw);
	if (!token) return { error: t("student.enter.error") };

	const cookie = await createStudentCookie(
		{ tokenId: token.id, gradeId: token.gradeId, wm: randomCode(6) },
		getSecrets(env).sessionSecret,
		isSecureRequest(request),
	);
	throw redirect(`/clasa/${token.gradeId}`, { headers: { "Set-Cookie": cookie } });
}

export default function StudentEnter({ loaderData }: Route.ComponentProps) {
	const actionData = useActionData<typeof action>();
	const nav = useNavigation();
	const busy = nav.state !== "idle";

	return (
		<main className="motion-playful relative isolate grid min-h-screen place-items-center px-5">
			<Plate className="cat-rise w-full max-w-md p-8 sm:p-10" label={subjectConfig.siteName}>
				<div className="mb-6 flex flex-col items-center text-center">
					<Logo size={52} />
					<h1 className="font-heading mt-4 text-2xl font-bold">{t("student.enter.title")}</h1>
					<p className="mt-2 text-sm text-muted">{t("student.enter.help")}</p>
				</div>

				<Form method="post" className="grid gap-3">
					<input
						name="token"
						autoFocus
						autoComplete="off"
						spellCheck={false}
						placeholder={t("student.enter.placeholder")}
						className="border-0 border-b-2 border-border bg-transparent px-2 py-3 text-center font-heading text-xl tracking-[0.15em] uppercase outline-none focus:border-primary"
					/>
					<Turnstile siteKey={loaderData.turnstileSiteKey} />
					{actionData?.error && (
						<p className="rounded-md bg-accent/10 px-3 py-2 text-center text-sm text-accent-strong">
							{actionData.error}
						</p>
					)}
					<button
						type="submit"
						disabled={busy}
						className="rounded-md bg-accent px-4 py-3 font-semibold text-on-accent transition hover:bg-accent-strong disabled:opacity-60"
					>
						{busy ? "Se verifică…" : t("student.enter.button")}
					</button>
				</Form>

				{loaderData.devHint && (
					<p className="mt-5 rounded-md border border-dashed border-border px-3 py-2 text-center text-xs text-muted">
						Demo (doar în dev): token <strong>{loaderData.devHint}</strong> → Clasa a 9-a
					</p>
				)}

				<a href="/" className="mt-5 block text-center text-sm text-muted hover:text-ink">
					← {subjectConfig.siteName}
				</a>
			</Plate>
		</main>
	);
}
