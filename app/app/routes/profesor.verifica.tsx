import { Link } from "react-router";
import type { Route } from "./+types/profesor.verifica";
import { getDb } from "../db/client";
import { getSecrets } from "../lib/env";
import { readVerifyToken } from "../lib/email";
import { getUserById, markEmailVerified } from "../lib/users";
import { Logo } from "../components/site";
import { seo } from "../lib/seo";

export function meta(_: Route.MetaArgs) {
	return seo({ title: "Verificare e-mail", path: "/profesor/verifica", noindex: true });
}

export async function loader({ request, context }: Route.LoaderArgs) {
	const env = context.cloudflare.env;
	const token = new URL(request.url).searchParams.get("t") ?? "";
	const payload = await readVerifyToken(token, getSecrets(env).sessionSecret);
	if (!payload) return { ok: false };

	const db = getDb(env);
	const user = await getUserById(db, payload.userId);
	if (!user || user.email !== payload.email) return { ok: false };
	await markEmailVerified(db, user.id);
	return { ok: true };
}

export default function Verifica({ loaderData }: Route.ComponentProps) {
	return (
		<main className="grid min-h-screen place-items-center px-5">
			<div className="cat-rise w-full max-w-sm rounded-2xl border border-border bg-surface p-8 text-center shadow-xl shadow-ink/5">
				<div className="mb-4 flex justify-center">
					<Logo size={44} />
				</div>
				{loaderData.ok ? (
					<>
						<h1 className="text-xl font-bold">E-mail confirmat ✓</h1>
						<p className="mt-2 text-sm text-muted">Mulțumim! Contul tău este verificat.</p>
					</>
				) : (
					<>
						<h1 className="text-xl font-bold">Link invalid sau expirat</h1>
						<p className="mt-2 text-sm text-muted">Cere un link nou din panoul de profesor.</p>
					</>
				)}
				<Link to="/profesor" viewTransition className="mt-5 inline-block rounded-lg bg-primary px-5 py-2.5 font-medium text-on-primary transition hover:bg-primary-strong">
					Mergi la panou
				</Link>
			</div>
		</main>
	);
}
