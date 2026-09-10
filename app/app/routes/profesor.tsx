import { Form, Link, redirect, useActionData } from "react-router";
import type { Route } from "./+types/profesor";
import { t } from "../config/subject";
import { getDb } from "../db/client";
import { getTeacher } from "../lib/guard";
import { emailVerificationRequired, getSecrets } from "../lib/env";
import { makeVerifyToken, sendVerificationEmail, verifyLink } from "../lib/email";
import { listTokensByIssuer } from "../lib/tokens";
import { TEACHER_SECTIONS, TEACHER_SECTION_ORDER } from "../lib/teacher-nav";
import { SiteHeader } from "../components/site";
import { seo } from "../lib/seo";

export function meta(_: Route.MetaArgs) {
	return seo({ title: "Profesor", path: "/profesor", noindex: true });
}

export async function loader({ request, context }: Route.LoaderArgs) {
	const env = context.cloudflare.env;
	const teacher = await getTeacher(request, env);
	if (!teacher) throw redirect("/profesor/login");
	const tokens = await listTokensByIssuer(getDb(env), teacher.id);
	const now = Date.now();
	const activeTokens = tokens.filter((t) => t.revokedAt == null && t.validUntil >= now).length;
	const verified = teacher.emailVerified === 1 || !emailVerificationRequired(env);
	return { email: teacher.email, verified, activeTokens };
}

export async function action({ request, context }: Route.ActionArgs) {
	const env = context.cloudflare.env;
	const teacher = await getTeacher(request, env);
	if (!teacher) throw redirect("/profesor/login");
	if (String((await request.formData()).get("intent")) === "resend" && teacher.emailVerified !== 1) {
		const secret = getSecrets(env).sessionSecret;
		const token = await makeVerifyToken(teacher.id, teacher.email, secret);
		const result = await sendVerificationEmail(env, teacher.email, verifyLink(new URL(request.url).origin, token));
		return { resent: !result.error, devLink: result.devLink ?? null, failed: !!result.error };
	}
	return { resent: false, devLink: null, failed: false };
}

/**
 * The hub: the first thing a teacher sees after logging in. Two doors, no tabs —
 * the tab bars live inside the sections, so this page stays a choice, not a menu.
 */
export default function ProfesorHub({ loaderData }: Route.ComponentProps) {
	const actionData = useActionData<typeof action>();
	return (
		<div className="min-h-screen motion-playful">
			<SiteHeader
				right={
					<>
						<span className="hidden text-sm text-muted sm:inline">{loaderData.email}</span>
						<Form method="post" action="/iesire" className="inline">
							<button
								type="submit"
								className="cursor-pointer text-sm font-medium text-muted hover:text-ink"
							>
								{t("nav.logout")}
							</button>
						</Form>
					</>
				}
			/>
			<div className="mx-auto max-w-5xl px-5 pt-10">
				{!loaderData.verified && (
					<div className="mb-8 rounded-xl border border-accent/40 bg-accent/10 p-4 text-sm">
						<p className="font-semibold text-accent-strong">Confirmă-ți adresa de e-mail</p>
						<p className="mt-1 text-ink/80">
							Ți-am trimis un link de confirmare pe <strong>{loaderData.email}</strong>. Verifică-ți
							e-mailul ca să poți genera tokenuri.
						</p>
						<Form method="post" className="mt-3">
							<input type="hidden" name="intent" value="resend" />
							<button className="rounded-lg border border-accent px-3 py-1.5 text-sm font-medium text-accent-strong hover:bg-accent/5">
								Retrimite linkul
							</button>
						</Form>
						{actionData?.resent && <p className="mt-2 text-xs text-muted">Link retrimis.</p>}
						{actionData?.failed && (
							<p className="mt-2 text-xs text-accent-strong">
								Nu am putut trimite e-mailul acum. Mai încearcă peste câteva minute.
							</p>
						)}
						{actionData?.devLink && (
							<p className="mt-2 break-all rounded-lg bg-bg px-3 py-2 text-xs">
								Link (doar în dev):{" "}
								<a href={actionData.devLink} className="font-medium text-primary underline">
									{actionData.devLink}
								</a>
							</p>
						)}
					</div>
				)}

				<h1 className="font-heading text-3xl font-bold">{t("teacher.hub.title")}</h1>
				<p className="mt-2 text-muted">{t("teacher.hub.help")}</p>

				<div className="mt-8 grid gap-5 sm:grid-cols-2">
					{TEACHER_SECTION_ORDER.map((key) => {
						const section = TEACHER_SECTIONS[key];
						return (
							<Link
								key={key}
								to={section.home}
								viewTransition
								className="glow flex flex-col rounded-2xl border-2 border-border bg-surface p-7 transition hover:border-primary"
							>
								<h2 className="font-heading text-2xl font-semibold">{t(section.labelKey)}</h2>
								<p className="mt-2 flex-1 text-sm leading-relaxed text-muted">{t(section.descKey)}</p>
								<span className="mt-5 text-sm font-medium text-primary">Deschide →</span>
							</Link>
						);
					})}
				</div>

				<p className="mt-8 text-sm text-muted">
					{loaderData.activeTokens > 0
						? `Ai ${loaderData.activeTokens} token(uri) active.`
						: "Începe prin a genera un token pentru o clasă."}
				</p>
			</div>
		</div>
	);
}
