import { Form, redirect } from "react-router";
import type { Route } from "./+types/admin.rezultate";
import { gradeById, subjectConfig } from "../config/subject";
import { getDb } from "../db/client";
import { getAdminSession } from "../lib/session";
import { getSecrets } from "../lib/env";
import { deleteAllAttempts, getResults } from "../lib/questions";
import { clearNicknames, releaseNickname } from "../lib/nicknames";
import { listAssignmentsByOwner, getAssignmentResults } from "../lib/assignments";
import { AdminShell } from "../components/AdminShell";
import { ResultsView } from "../components/ResultsView";
import { AssignmentResults } from "../components/AssignmentResults";
import { seo } from "../lib/seo";

export function meta(_: Route.MetaArgs) {
	return seo({ title: "Rezultate", path: "/admin/rezultate", noindex: true });
}

async function requireAdmin(request: Request, env: Env) {
	const admin = await getAdminSession(request, getSecrets(env).sessionSecret);
	if (!admin) throw redirect("/admin/login");
}

export async function loader({ request, context }: Route.LoaderArgs) {
	const env = context.cloudflare.env;
	await requireAdmin(request, env);
	const gradeParam = new URL(request.url).searchParams.get("grade") || "";
	const gradeFilter = gradeById(gradeParam) ? gradeParam : "";
	const db = getDb(env);
	const results = await getResults(db, { gradeId: gradeFilter || undefined, owner: null });
	const teme = await listAssignmentsByOwner(db, null);
	const temaParam = new URL(request.url).searchParams.get("tema") || "";
	const selectedTema = teme.find((a) => a.id === temaParam) ?? null;
	const temaResults = selectedTema ? await getAssignmentResults(db, selectedTema) : null;
	return { results, grades: subjectConfig.grades, selectedGrade: gradeFilter, teme, selectedTema, temaResults };
}

export async function action({ request, context }: Route.ActionArgs) {
	const env = context.cloudflare.env;
	await requireAdmin(request, env);
	const db = getDb(env);
	const form = await request.formData();
	const intent = String(form.get("intent"));
	if (intent === "delete-all") {
		const g = String(form.get("grade") || "");
		const gradeId = gradeById(g) ? g : undefined;
		await deleteAllAttempts(db, gradeId);
		await clearNicknames(db, gradeId);
	} else if (intent === "release-nick") {
		const g = String(form.get("grade") || "");
		const nickname = String(form.get("nickname") || "");
		if (gradeById(g) && nickname) await releaseNickname(db, g, nickname);
	}
	return { ok: true };
}

export default function AdminRezultate({ loaderData }: Route.ComponentProps) {
	const { results, grades, selectedGrade, teme, selectedTema, temaResults } = loaderData;
	return (
		<AdminShell title="Rezultate">
			<ResultsView results={results} grades={grades} selectedGrade={selectedGrade} basePath="/admin/rezultate" releaseGrade={selectedGrade || undefined}>
				<AssignmentResults assignments={teme} selected={selectedTema} results={temaResults} basePath="/admin/rezultate" temePath="/admin/teme" />
				<section className="border-t border-border pt-6">
					<Form method="post" onSubmit={(e) => { if (!confirm("Ștergi toate datele de exersare" + (selectedGrade ? " pentru această clasă" : "") + "?")) e.preventDefault(); }}>
						<input type="hidden" name="intent" value="delete-all" />
						<input type="hidden" name="grade" value={selectedGrade} />
						<button className="rounded-lg border border-accent px-4 py-2 text-sm font-medium text-accent-strong hover:bg-accent/5">
							Șterge datele de exersare{selectedGrade ? " (clasa selectată)" : ""}
						</button>
					</Form>
				</section>
			</ResultsView>
		</AdminShell>
	);
}
