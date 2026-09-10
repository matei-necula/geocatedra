import { redirect } from "react-router";
import type { Route } from "./+types/admin.anunturi";
import { subjectConfig, t } from "../config/subject";
import { getDb } from "../db/client";
import { getAdminSession } from "../lib/session";
import { getSecrets } from "../lib/env";
import { listTokens } from "../lib/tokens";
import {
	announcementInputFromForm,
	createAnnouncement,
	deleteAnnouncement,
	listAnnouncementsByOwner,
	updateAnnouncement,
} from "../lib/announcements";
import { AdminShell } from "../components/AdminShell";
import { AnnouncementsManager, type TokenOption } from "../components/AnnouncementsManager";
import { seo } from "../lib/seo";

export function meta(_: Route.MetaArgs) {
	return seo({ title: t("announcements.title"), path: "/admin/anunturi", noindex: true });
}

async function requireAdmin(request: Request, env: Env) {
	const admin = await getAdminSession(request, getSecrets(env).sessionSecret);
	if (!admin) throw redirect("/admin/login");
}

async function loadData(env: Env) {
	const db = getDb(env);
	const anns = await listAnnouncementsByOwner(db, null);
	// Admin-issued (issued_by NULL), unrevoked tokens, grouped per grade for the target select.
	const now = Date.now();
	const all = await listTokens(db);
	const tokens = all.filter((tk) => tk.issuedBy === null && tk.revokedAt === null && tk.validUntil > now);
	const tokensByGrade: Record<string, TokenOption[]> = {};
	const tokenLabels: Record<string, string> = {};
	for (const tk of tokens) {
		(tokensByGrade[tk.gradeId] ??= []).push({ id: tk.id, label: tk.label });
	}
	for (const tk of all) tokenLabels[tk.id] = tk.label;
	return { announcements: anns, tokensByGrade, tokenLabels, grades: subjectConfig.grades };
}

export async function loader({ request, context }: Route.LoaderArgs) {
	const env = context.cloudflare.env;
	await requireAdmin(request, env);
	return loadData(env);
}

export async function action({ request, context }: Route.ActionArgs) {
	const env = context.cloudflare.env;
	await requireAdmin(request, env);
	const db = getDb(env);
	const form = await request.formData();
	const intent = String(form.get("intent"));
	if (intent === "create") {
		const input = announcementInputFromForm(form);
		if ("error" in input) return { error: input.error };
		// An admin may only target admin-issued tokens.
		if (input.tokenId) {
			const admins = (await listTokens(db)).filter((tk) => tk.issuedBy === null);
			if (!admins.some((tk) => tk.id === input.tokenId)) return { error: "Clasă necunoscută." };
		}
		await createAnnouncement(db, null, input);
	} else if (intent === "update") {
		// Grade/class targeting is immutable on edit — only body/pin/expiry change.
		const expiresRaw = String(form.get("expiresAt") ?? "").trim();
		await updateAnnouncement(db, String(form.get("id")), null, {
			body: String(form.get("body") ?? ""),
			pinned: form.get("pinned") === "on",
			expiresAt: expiresRaw ? new Date(`${expiresRaw}T23:59:59`).getTime() : null,
		});
	} else if (intent === "delete") {
		await deleteAnnouncement(db, String(form.get("id")), null);
	}
	return { ok: true };
}

export default function AdminAnunturi({ loaderData, actionData }: Route.ComponentProps) {
	const { announcements, tokensByGrade, tokenLabels, grades } = loaderData;
	return (
		<AdminShell title={t("announcements.title")}>
			<AnnouncementsManager
				announcements={announcements}
				grades={grades}
				tokensByGrade={tokensByGrade}
				tokenLabels={tokenLabels}
				error={actionData && "error" in actionData ? actionData.error : undefined}
			/>
		</AdminShell>
	);
}
