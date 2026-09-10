import { Form, redirect } from "react-router";
import type { Route } from "./+types/admin.profesori";
import { getDb } from "../db/client";
import { getAdminSession } from "../lib/session";
import { getSecrets } from "../lib/env";
import { listTeachers, setSuspended, deleteTeacher } from "../lib/users";
import { AdminShell } from "../components/AdminShell";
import { seo } from "../lib/seo";

export function meta(_: Route.MetaArgs) {
	return seo({ title: "Profesori", path: "/admin/profesori", noindex: true });
}

async function requireAdmin(request: Request, env: Env) {
	const admin = await getAdminSession(request, getSecrets(env).sessionSecret);
	if (!admin) throw redirect("/admin/login");
}

export async function loader({ request, context }: Route.LoaderArgs) {
	const env = context.cloudflare.env;
	await requireAdmin(request, env);
	return { teachers: await listTeachers(getDb(env)) };
}

export async function action({ request, context }: Route.ActionArgs) {
	const env = context.cloudflare.env;
	await requireAdmin(request, env);
	const form = await request.formData();
	const intent = String(form.get("intent") ?? "");
	const userId = String(form.get("userId") ?? "");
	const db = getDb(env);
	if (userId) {
		if (intent === "suspend") await setSuspended(db, userId, true);
		else if (intent === "reactivate") await setSuspended(db, userId, false);
		else if (intent === "delete") await deleteTeacher(db, userId);
	}
	return { ok: true };
}

export default function AdminProfesori({ loaderData }: Route.ComponentProps) {
	const { teachers } = loaderData;
	const fmt = (ts: number) => new Date(ts).toLocaleDateString("ro-RO");
	return (
		<AdminShell title="Profesori">
			{teachers.length === 0 ? (
				<p className="rounded-xl border border-dashed border-border p-6 text-center text-muted">
					Niciun cont de profesor încă.
				</p>
			) : (
				<div className="overflow-hidden rounded-2xl border border-border">
					<table className="w-full text-left text-sm">
						<thead className="bg-bg text-muted">
							<tr>
								<th className="px-4 py-3 font-medium">E-mail</th>
								<th className="px-4 py-3 font-medium">Stare</th>
								<th className="px-4 py-3 font-medium">Tokenuri active</th>
								<th className="px-4 py-3 font-medium">Înscris</th>
								<th className="px-4 py-3 font-medium">Acțiuni</th>
							</tr>
						</thead>
						<tbody>
							{teachers.map((t) => {
								const suspended = t.suspendedAt != null;
								return (
									<tr key={t.id} className="border-t border-border bg-surface align-middle">
										<td className="px-4 py-3 font-medium">{t.email}</td>
										<td className="px-4 py-3">
											{suspended ? (
												<span className="rounded-full bg-accent/15 px-2.5 py-1 text-xs font-medium text-accent-strong">Suspendat</span>
											) : (
												<span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700">Activ</span>
											)}
										</td>
										<td className="px-4 py-3">{t.activeTokens}</td>
										<td className="px-4 py-3 text-muted">{fmt(t.createdAt)}</td>
										<td className="px-4 py-3">
											<div className="flex flex-wrap gap-2">
												<Form method="post">
													<input type="hidden" name="userId" value={t.id} />
													<input type="hidden" name="intent" value={suspended ? "reactivate" : "suspend"} />
													<button className="rounded-lg border border-border px-3 py-1.5 text-xs font-medium hover:bg-bg">
														{suspended ? "Reactivează" : "Suspendă"}
													</button>
												</Form>
												<Form method="post" onSubmit={(e) => { if (!confirm("Ștergi acest cont? Tokenurile profesorului vor fi revocate, iar elevii vor pierde accesul.")) e.preventDefault(); }}>
													<input type="hidden" name="userId" value={t.id} />
													<input type="hidden" name="intent" value="delete" />
													<button className="rounded-lg border border-accent px-3 py-1.5 text-xs font-medium text-accent-strong hover:bg-accent/5">
														Șterge
													</button>
												</Form>
											</div>
										</td>
									</tr>
								);
							})}
						</tbody>
					</table>
				</div>
			)}
		</AdminShell>
	);
}
