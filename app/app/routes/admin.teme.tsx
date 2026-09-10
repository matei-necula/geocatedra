import { redirect } from "react-router";
import type { Route } from "./+types/admin.teme";
import { subjectConfig, t } from "../config/subject";
import { getDb } from "../db/client";
import { getAdminSession } from "../lib/session";
import { getSecrets } from "../lib/env";
import { listTokens } from "../lib/tokens";
import {
	assignmentInputFromForm,
	closeAssignment,
	createAssignment,
	deleteAssignment,
	listAssignmentsByOwner,
} from "../lib/assignments";
import { AdminShell } from "../components/AdminShell";
import { AssignmentsManager } from "../components/AssignmentsManager";
import type { TokenOption } from "../components/AnnouncementsManager";
import { seo } from "../lib/seo";

export function meta(_: Route.MetaArgs) {
	return seo({ title: t("assignments.title"), path: "/admin/teme", noindex: true });
}

async function requireAdmin(request: Request, env: Env) {
	const admin = await getAdminSession(request, getSecrets(env).sessionSecret);
	if (!admin) throw redirect("/admin/login");
}

export async function loader({ request, context }: Route.LoaderArgs) {
	const env = context.cloudflare.env;
	await requireAdmin(request, env);
	const db = getDb(env);
	const teme = await listAssignmentsByOwner(db, null);
	const now = Date.now();
	const all = await listTokens(db);
	const tokensByGrade: Record<string, TokenOption[]> = {};
	const tokenLabels: Record<string, string> = {};
	for (const tk of all) {
		tokenLabels[tk.id] = tk.label;
		if (tk.issuedBy === null && tk.revokedAt === null && tk.validUntil > now) {
			(tokensByGrade[tk.gradeId] ??= []).push({ id: tk.id, label: tk.label });
		}
	}
	return { assignments: teme, tokensByGrade, tokenLabels, grades: subjectConfig.grades };
}

export async function action({ request, context }: Route.ActionArgs) {
	const env = context.cloudflare.env;
	await requireAdmin(request, env);
	const db = getDb(env);
	const form = await request.formData();
	const intent = String(form.get("intent"));
	if (intent === "create") {
		const input = assignmentInputFromForm(form);
		if ("error" in input) return { error: input.error };
		if (input.tokenId) {
			const admins = (await listTokens(db)).filter((tk) => tk.issuedBy === null);
			if (!admins.some((tk) => tk.id === input.tokenId)) return { error: "Clasă necunoscută." };
		}
		const res = await createAssignment(db, null, input);
		if ("error" in res) return { error: res.error };
	} else if (intent === "close") {
		await closeAssignment(db, String(form.get("id")), null);
	} else if (intent === "delete") {
		await deleteAssignment(db, String(form.get("id")), null);
	}
	return { ok: true };
}

export default function AdminTeme({ loaderData, actionData }: Route.ComponentProps) {
	const { assignments, tokensByGrade, tokenLabels, grades } = loaderData;
	return (
		<AdminShell title={t("assignments.title")}>
			<AssignmentsManager
				assignments={assignments}
				grades={grades}
				tokensByGrade={tokensByGrade}
				tokenLabels={tokenLabels}
				resultsBasePath="/admin/rezultate"
				error={actionData && "error" in actionData ? actionData.error : undefined}
			/>
		</AdminShell>
	);
}
