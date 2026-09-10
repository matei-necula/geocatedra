import { redirect } from "react-router";
import type { Route } from "./+types/profesor.anunturi";
import { subjectConfig, t } from "../config/subject";
import { getDb } from "../db/client";
import { getTeacher } from "../lib/guard";
import { listTokensByIssuer } from "../lib/tokens";
import {
	announcementInputFromForm,
	createAnnouncement,
	deleteAnnouncement,
	listAnnouncementsByOwner,
	updateAnnouncement,
} from "../lib/announcements";
import { TeacherShell } from "../components/TeacherShell";
import { AnnouncementsManager, type TokenOption } from "../components/AnnouncementsManager";
import { seo } from "../lib/seo";

export function meta(_: Route.MetaArgs) {
	return seo({ title: t("announcements.title"), path: "/profesor/anunturi", noindex: true });
}

export async function loader({ request, context }: Route.LoaderArgs) {
	const env = context.cloudflare.env;
	const teacher = await getTeacher(request, env);
	if (!teacher) throw redirect("/profesor/login");
	const db = getDb(env);
	const anns = await listAnnouncementsByOwner(db, teacher.id);
	const now = Date.now();
	const all = await listTokensByIssuer(db, teacher.id);
	const tokensByGrade: Record<string, TokenOption[]> = {};
	const tokenLabels: Record<string, string> = {};
	for (const tk of all) {
		tokenLabels[tk.id] = tk.label;
		if (tk.revokedAt === null && tk.validUntil > now) (tokensByGrade[tk.gradeId] ??= []).push({ id: tk.id, label: tk.label });
	}
	return { announcements: anns, tokensByGrade, tokenLabels, grades: subjectConfig.grades, email: teacher.email };
}

export async function action({ request, context }: Route.ActionArgs) {
	const env = context.cloudflare.env;
	const teacher = await getTeacher(request, env);
	if (!teacher) throw redirect("/profesor/login");
	const db = getDb(env);
	const form = await request.formData();
	const intent = String(form.get("intent"));
	if (intent === "create") {
		const input = announcementInputFromForm(form);
		if ("error" in input) return { error: input.error };
		// A teacher may only target her own tokens.
		if (input.tokenId) {
			const own = await listTokensByIssuer(db, teacher.id);
			if (!own.some((tk) => tk.id === input.tokenId)) return { error: "Clasă necunoscută." };
		}
		await createAnnouncement(db, teacher.id, input);
	} else if (intent === "update") {
		const expiresRaw = String(form.get("expiresAt") ?? "").trim();
		await updateAnnouncement(db, String(form.get("id")), teacher.id, {
			body: String(form.get("body") ?? ""),
			pinned: form.get("pinned") === "on",
			expiresAt: expiresRaw ? new Date(`${expiresRaw}T23:59:59`).getTime() : null,
		});
	} else if (intent === "delete") {
		await deleteAnnouncement(db, String(form.get("id")), teacher.id);
	}
	return { ok: true };
}

export default function ProfesorAnunturi({ loaderData, actionData }: Route.ComponentProps) {
	const { announcements, tokensByGrade, tokenLabels, grades, email } = loaderData;
	return (
		<TeacherShell title={t("announcements.title")} active="anunturi" email={email}>
			<AnnouncementsManager
				announcements={announcements}
				grades={grades}
				tokensByGrade={tokensByGrade}
				tokenLabels={tokenLabels}
				error={actionData && "error" in actionData ? actionData.error : undefined}
			/>
		</TeacherShell>
	);
}
