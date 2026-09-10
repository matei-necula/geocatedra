import { Form, redirect, useActionData } from "react-router";
import type { Route } from "./+types/admin";
import { gradeById, subjectConfig, t } from "../config/subject";
import { getDb } from "../db/client";
import { getAdminSession } from "../lib/session";
import { getSecrets } from "../lib/env";
import { createToken, listTokens, revokeToken } from "../lib/tokens";
import { emailsByIds } from "../lib/users";
import { getStats } from "../lib/admin-content";
import { AdminShell } from "../components/AdminShell";
import { seo } from "../lib/seo";

const TOKEN_PREFIX = subjectConfig.instanceId.slice(0, 3).toUpperCase();

export function meta(_: Route.MetaArgs) {
	return seo({ title: t("admin.title"), path: "/admin", noindex: true });
}

export async function loader({ request, context }: Route.LoaderArgs) {
	const env = context.cloudflare.env;
	const admin = await getAdminSession(request, getSecrets(env).sessionSecret);
	if (!admin) throw redirect("/admin/login");
	const db = getDb(env);
	const tokens = await listTokens(db);
	const stats = await getStats(db);
	const now = Date.now();
	const activeTokens = tokens.filter(
		(tok) => tok.revokedAt == null && tok.validFrom <= now && tok.validUntil >= now,
	).length;
	const issuerIds = [...new Set(tokens.map((tok) => tok.issuedBy).filter((x): x is string => !!x))];
	const issuerEmails = await emailsByIds(db, issuerIds);
	return { tokens, grades: subjectConfig.grades, stats, activeTokens, issuerEmails };
}

export async function action({ request, context }: Route.ActionArgs) {
	const env = context.cloudflare.env;
	const admin = await getAdminSession(request, getSecrets(env).sessionSecret);
	if (!admin) throw redirect("/admin/login");

	const db = getDb(env);
	const form = await request.formData();
	const intent = String(form.get("intent") ?? "");

	if (intent === "revoke") {
		await revokeToken(db, String(form.get("id")));
		return { created: null };
	}

	if (intent === "create") {
		const gradeId = String(form.get("gradeId"));
		const label = String(form.get("label") || `${gradeById(gradeId)?.label ?? gradeId}`);
		const { plaintext, row } = await createToken(db, { gradeId, label, prefix: TOKEN_PREFIX });
		return {
			created: { plaintext, label: row.label, gradeId, validUntil: row.validUntil },
		};
	}
	return { created: null };
}

export default function Admin({ loaderData }: Route.ComponentProps) {
	const { tokens, grades, stats, activeTokens, issuerEmails } = loaderData;
	const actionData = useActionData<typeof action>();
	const created = actionData?.created;

	const fmt = (ts: number) => new Date(ts).toLocaleDateString("ro-RO");

	return (
		<AdminShell title={t("admin.title")}>
				<div className="mb-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
					<Stat label="Materiale" value={stats.total} />
					<Stat label="Publicate" value={stats.published} />
					<Stat label="Ciorne" value={stats.drafts} />
					<Stat label="Tokenuri active" value={activeTokens} />
				</div>
				{created && (
					<div className="cat-rise mb-6 rounded-2xl border-2 border-primary bg-primary/5 p-5">
						<p className="text-sm font-semibold text-primary">
							Token nou pentru {gradeById(created.gradeId)?.label} — „{created.label}”
						</p>
						<p className="my-3 text-center font-mono text-2xl font-bold tracking-widest">
							{created.plaintext}
						</p>
						<p className="text-center text-sm text-muted">
							Valabil până la {fmt(created.validUntil)}. {t("admin.tokens.new_note")}
						</p>
						<button
							onClick={() => window.print()}
							className="mx-auto mt-3 block rounded-lg border border-primary px-4 py-2 text-sm font-medium text-primary"
						>
							Printează fișa pentru clasă
						</button>
					</div>
				)}

				<section className="mb-8 rounded-2xl border border-border bg-surface p-6">
					<h2 className="mb-4 text-xl font-semibold">{t("admin.tokens.generate")}</h2>
					<Form method="post" className="grid gap-3 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
						<input type="hidden" name="intent" value="create" />
						<label className="grid gap-1 text-sm">
							<span className="text-muted">{t("admin.tokens.grade")}</span>
							<select
								name="gradeId"
								className="rounded-lg border border-border bg-bg px-3 py-2.5 outline-none focus:border-primary"
							>
								{grades.map((g) => (
									<option key={g.id} value={g.id}>
										{g.label}
									</option>
								))}
							</select>
						</label>
						<label className="grid gap-1 text-sm">
							<span className="text-muted">{t("admin.tokens.label")}</span>
							<input
								name="label"
								placeholder="Clasa 6A 2025–2026"
								className="rounded-lg border border-border bg-bg px-3 py-2.5 outline-none focus:border-primary"
							/>
						</label>
						<button
							type="submit"
							className="rounded-lg bg-primary px-4 py-2.5 font-semibold text-on-primary transition hover:bg-primary-strong"
						>
							{t("admin.tokens.create")}
						</button>
					</Form>
				</section>

				<section>
					<h2 className="mb-3 text-xl font-semibold">{t("admin.tokens.existing")}</h2>
					{tokens.length === 0 ? (
						<p className="rounded-xl border border-dashed border-border p-5 text-sm text-muted">
							Niciun token încă.
						</p>
					) : (
						<div className="overflow-hidden rounded-2xl border border-border">
							<table className="w-full text-left text-sm">
								<thead className="bg-bg text-muted">
									<tr>
										<th className="px-4 py-3 font-medium">Etichetă</th>
										<th className="px-4 py-3 font-medium">Clasa</th>
										<th className="px-4 py-3 font-medium">Emis de</th>
										<th className="px-4 py-3 font-medium">{t("admin.tokens.valid_until")}</th>
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
												<td className="px-4 py-3 text-muted">
													{tok.issuedBy ? (issuerEmails[tok.issuedBy] ?? "profesor șters") : "Admin"}
												</td>
												<td className="px-4 py-3">{fmt(tok.validUntil)}</td>
												<td className="px-4 py-3">
													<span
														className={`rounded-full px-2.5 py-1 text-xs font-medium ${
															revoked ? "bg-ink/10 text-muted" : "bg-emerald-50 text-emerald-700"
														}`}
													>
														{revoked ? t("admin.tokens.revoked") : t("admin.tokens.active")}
													</span>
												</td>
												<td className="px-4 py-3 text-right">
													{!revoked && (
														<Form method="post">
															<input type="hidden" name="intent" value="revoke" />
															<input type="hidden" name="id" value={tok.id} />
															<button className="text-sm font-medium text-accent-strong hover:underline">
																{t("admin.tokens.revoke")}
															</button>
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
		</AdminShell>
	);
}

function Stat({ label, value }: { label: string; value: number }) {
	return (
		<div className="rounded-xl border border-border bg-surface px-4 py-3">
			<div className="font-heading text-2xl font-bold">{value}</div>
			<div className="text-xs text-muted">{label}</div>
		</div>
	);
}
