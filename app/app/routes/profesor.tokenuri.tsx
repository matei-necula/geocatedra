import { Form, redirect, useActionData } from "react-router";
import type { Route } from "./+types/profesor.tokenuri";
import { gradeById, subjectConfig } from "../config/subject";
import { getDb } from "../db/client";
import { getTeacher } from "../lib/guard";
import { emailVerificationRequired } from "../lib/env";
import { createToken, getTokenById, listTokensByIssuer, revokeToken } from "../lib/tokens";
import { TeacherShell } from "../components/TeacherShell";
import { seo } from "../lib/seo";

const TOKEN_PREFIX = subjectConfig.instanceId.slice(0, 3).toUpperCase();

export function meta(_: Route.MetaArgs) {
	return seo({ title: "Tokenuri", path: "/profesor/tokenuri", noindex: true });
}

export async function loader({ request, context }: Route.LoaderArgs) {
	const env = context.cloudflare.env;
	const teacher = await getTeacher(request, env);
	if (!teacher) throw redirect("/profesor/login");
	const tokens = await listTokensByIssuer(getDb(env), teacher.id);
	const verified = teacher.emailVerified === 1 || !emailVerificationRequired(env);
	return { email: teacher.email, verified, tokens, grades: subjectConfig.grades };
}

export async function action({ request, context }: Route.ActionArgs) {
	const env = context.cloudflare.env;
	const teacher = await getTeacher(request, env);
	if (!teacher) throw redirect("/profesor/login");

	const db = getDb(env);
	const form = await request.formData();
	const intent = String(form.get("intent") ?? "");

	if (intent === "revoke") {
		const tok = await getTokenById(db, String(form.get("id")));
		if (tok && tok.issuedBy === teacher.id) await revokeToken(db, tok.id);
		return { created: null, error: null };
	}

	if (intent === "create") {
		if (emailVerificationRequired(env) && teacher.emailVerified !== 1) {
			return { created: null, error: "Verifică-ți e-mailul înainte de a genera tokenuri." };
		}
		const gradeId = String(form.get("gradeId"));
		const label = String(form.get("label") || `${gradeById(gradeId)?.label ?? gradeId}`);
		const { plaintext, row } = await createToken(db, { gradeId, label, prefix: TOKEN_PREFIX, issuedBy: teacher.id });
		return { created: { plaintext, label: row.label, gradeId, validUntil: row.validUntil }, error: null };
	}
	return { created: null, error: null };
}

export default function ProfesorTokenuri({ loaderData }: Route.ComponentProps) {
	const { email, verified, tokens, grades } = loaderData;
	const actionData = useActionData<typeof action>();
	const created = actionData?.created;
	const fmt = (ts: number) => new Date(ts).toLocaleDateString("ro-RO");

	return (
		<TeacherShell title="Tokenuri" active="tokenuri" email={email}>
			{!verified && (
				<div className="mb-6 rounded-xl border border-accent/40 bg-accent/10 p-4 text-sm text-accent-strong">
					Confirmă-ți adresa de e-mail (din panou) pentru a putea genera tokenuri.
				</div>
			)}
			{actionData?.error && (
				<p className="mb-6 rounded-lg bg-accent/10 px-3 py-2 text-sm text-accent-strong">{actionData.error}</p>
			)}
			{created && (
				<div className="cat-rise mb-6 rounded-2xl border-2 border-primary bg-primary/5 p-5">
					<p className="text-sm font-semibold text-primary">
						Token nou pentru {gradeById(created.gradeId)?.label} — „{created.label}"
					</p>
					<p className="my-3 text-center font-mono text-2xl font-bold tracking-widest">{created.plaintext}</p>
					<p className="text-center text-sm text-muted">
						Valabil până la {fmt(created.validUntil)}. Notează-l acum — nu îl vei mai putea vedea.
					</p>
					<button onClick={() => window.print()} className="mx-auto mt-3 block rounded-lg border border-primary px-4 py-2 text-sm font-medium text-primary">
						Printează fișa pentru clasă
					</button>
				</div>
			)}

			<section className="mb-8 rounded-2xl border border-border bg-surface p-6">
				<h2 className="mb-4 text-xl font-semibold">Generează token pentru o clasă</h2>
				<Form method="post" className="grid gap-3 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
					<input type="hidden" name="intent" value="create" />
					<label className="grid gap-1 text-sm">
						<span className="text-muted">Clasa</span>
						<select name="gradeId" className="rounded-lg border border-border bg-bg px-3 py-2.5 outline-none focus:border-primary">
							{grades.map((g) => (
								<option key={g.id} value={g.id}>{g.label}</option>
							))}
						</select>
					</label>
					<label className="grid gap-1 text-sm">
						<span className="text-muted">Etichetă</span>
						<input name="label" placeholder="Clasa 6A 2025–2026" className="rounded-lg border border-border bg-bg px-3 py-2.5 outline-none focus:border-primary" />
					</label>
					<button type="submit" className="rounded-lg bg-primary px-4 py-2.5 font-semibold text-on-primary transition hover:bg-primary-strong">
						Generează
					</button>
				</Form>
			</section>

			<section>
				<h2 className="mb-3 text-xl font-semibold">Tokenurile tale</h2>
				{tokens.length === 0 ? (
					<p className="rounded-xl border border-dashed border-border p-5 text-sm text-muted">Niciun token încă.</p>
				) : (
					<div className="overflow-hidden rounded-2xl border border-border">
						<table className="w-full text-left text-sm">
							<thead className="bg-bg text-muted">
								<tr>
									<th className="px-4 py-3 font-medium">Etichetă</th>
									<th className="px-4 py-3 font-medium">Clasa</th>
									<th className="px-4 py-3 font-medium">Valabil până la</th>
									<th className="px-4 py-3 font-medium">Stare</th>
									<th className="px-4 py-3"></th>
								</tr>
							</thead>
							<tbody>
								{tokens.map((tok) => {
									const revoked = tok.revokedAt != null;
									return (
										<tr key={tok.id} className="border-t border-border bg-surface">
											<td className="px-4 py-3 font-medium">{tok.label}</td>
											<td className="px-4 py-3">{gradeById(tok.gradeId)?.label ?? tok.gradeId}</td>
											<td className="px-4 py-3">{fmt(tok.validUntil)}</td>
											<td className="px-4 py-3">
												<span className={`rounded-full px-2.5 py-1 text-xs font-medium ${revoked ? "bg-ink/10 text-muted" : "bg-emerald-50 text-emerald-700"}`}>
													{revoked ? "Revocat" : "Activ"}
												</span>
											</td>
											<td className="px-4 py-3 text-right">
												{!revoked && (
													<Form method="post">
														<input type="hidden" name="intent" value="revoke" />
														<input type="hidden" name="id" value={tok.id} />
														<button className="text-sm font-medium text-accent-strong hover:underline">Revocă</button>
													</Form>
												)}
											</td>
										</tr>
									);
								})}
							</tbody>
						</table>
					</div>
				)}
			</section>
		</TeacherShell>
	);
}
