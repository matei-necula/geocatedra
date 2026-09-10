import { redirect } from "react-router";
import type { Route } from "./+types/profesor.teme";
import { subjectConfig, t } from "../config/subject";
import { getDb } from "../db/client";
import { getTeacher } from "../lib/guard";
import { listTokensByIssuer } from "../lib/tokens";
import {
	assignmentInputFromForm,
	closeAssignment,
	createAssignment,
	deleteAssignment,
	listAssignmentsByOwner,
} from "../lib/assignments";
import { TeacherShell } from "../components/TeacherShell";
import { AssignmentsManager } from "../components/AssignmentsManager";
import type { TokenOption } from "../components/AnnouncementsManager";
import { seo } from "../lib/seo";

export function meta(_: Route.MetaArgs) {
	return seo({ title: t("assignments.title"), path: "/profesor/teme", noindex: true });
}

export async function loader({ request, context }: Route.LoaderArgs) {
	const env = context.cloudflare.env;
	const teacher = await getTeacher(request, env);
	if (!teacher) throw redirect("/profesor/login");
	const db = getDb(env);
	const teme = await listAssignmentsByOwner(db, teacher.id);
	const now = Date.now();
	const all = await listTokensByIssuer(db, teacher.id);
	const tokensByGrade: Record<string, TokenOption[]> = {};
	const tokenLabels: Record<string, string> = {};
	for (const tk of all) {
		tokenLabels[tk.id] = tk.label;
		if (tk.revokedAt === null && tk.validUntil > now) (tokensByGrade[tk.gradeId] ??= []).push({ id: tk.id, label: tk.label });
	}
	return { assignments: teme, tokensByGrade, tokenLabels, grades: subjectConfig.grades, email: teacher.email };
}

export async function action({ request, context }: Route.ActionArgs) {
	const env = context.cloudflare.env;
	const teacher = await getTeacher(request, env);
	if (!teacher) throw redirect("/profesor/login");
	const db = getDb(env);
	const form = await request.formData();
	const intent = String(form.get("intent"));
	if (intent === "create") {
		const input = assignmentInputFromForm(form);
		if ("error" in input) return { error: input.error };
		if (input.tokenId) {
			const own = await listTokensByIssuer(db, teacher.id);
			if (!own.some((tk) => tk.id === input.tokenId)) return { error: "Clasă necunoscută." };
		}
		const res = await createAssignment(db, teacher.id, input);
		if ("error" in res) return { error: res.error };
	} else if (intent === "close") {
		await closeAssignment(db, String(form.get("id")), teacher.id);
	} else if (intent === "delete") {
		await deleteAssignment(db, String(form.get("id")), teacher.id);
	}
	return { ok: true };
}

export default function ProfesorTeme({ loaderData, actionData }: Route.ComponentProps) {
	const { assignments, tokensByGrade, tokenLabels, grades, email } = loaderData;
	return (
		<TeacherShell title={t("assignments.title")} active="teme" email={email}>
			<AssignmentsManager
				assignments={assignments}
				grades={grades}
				tokensByGrade={tokensByGrade}
				tokenLabels={tokenLabels}
				resultsBasePath="/profesor/rezultate"
				error={actionData && "error" in actionData ? actionData.error : undefined}
			/>
		</TeacherShell>
	);
}
