import { redirect, useActionData } from "react-router";
import type { Route } from "./+types/admin.materiale.nou";
import { subjectConfig, t } from "../config/subject";
import { getDb } from "../db/client";
import { getAdminSession } from "../lib/session";
import { getSecrets } from "../lib/env";
import { createMaterial, getForEdit, inputFromForm, type AdminMaterialRow } from "../lib/admin-content";
import { listAssets, listGameImages, syncGameAssets } from "../lib/assets";
import { parseGameBody } from "../lib/games";
import { validateGame } from "../lib/game-editor";
import { AdminShell } from "../components/AdminShell";
import { MaterialForm } from "../components/MaterialForm";
import { seo } from "../lib/seo";

export function meta(_: Route.MetaArgs) {
	return seo({ title: "Material nou", path: "/admin/materiale/nou", noindex: true });
}

export async function loader({ request, context }: Route.LoaderArgs) {
	const env = context.cloudflare.env;
	const admin = await getAdminSession(request, getSecrets(env).sessionSecret);
	if (!admin) throw redirect("/admin/login");
	const db = getDb(env);

	// „Duplică": pre-load the source game's body + assets so MaterialForm can
	// seed the create form. Mode stays "create" — saving always makes a NEW
	// material, never touches the source.
	const fromId = new URL(request.url).searchParams.get("from");
	let duplicateOf: AdminMaterialRow | undefined;
	let initialAssets: { id: string; idx: number }[] | undefined;
	if (fromId) {
		const source = await getForEdit(db, fromId, subjectConfig.defaultLocale);
		if (source && source.type === "joc") {
			duplicateOf = { ...source, title: `${source.title} (copie)`, status: "draft" };
			initialAssets = (await listAssets(db, fromId)).map((a) => ({ id: a.id, idx: a.idx }));
		}
	}

	const reusable = (await listGameImages(db)).filter((r) => r.materialId !== fromId);
	return { reusable, duplicateOf, initialAssets };
}

export async function action({ request, context }: Route.ActionArgs) {
	const env = context.cloudflare.env;
	const admin = await getAdminSession(request, getSecrets(env).sessionSecret);
	if (!admin) throw redirect("/admin/login");

	const db = getDb(env);
	const form = await request.formData();
	const input = await inputFromForm(db, form);
	if (!input.title) return { error: "Titlul este obligatoriu." };
	if (!input.topicSlug) return { error: "Alege o temă." };

	const isGame = input.type === "joc" && !!form.get("kind");
	if (isGame) {
		const body = parseGameBody(input.body);
		if (!body) return { error: "Jocul nu a putut fi salvat (date invalide)." };
		const errors = validateGame(body);
		if (input.status === "published" && errors.length) {
			return { error: "Nu poți publica încă: " + errors[0] };
		}

		// Security floor: only allow copying images that are already reusable
		// game images (there is no "own" asset yet on create). Runs BEFORE
		// persisting so a rejected submit never leaves a partial/live row.
		const allowed = new Set((await listGameImages(db)).map((r) => r.assetId));
		for (const key of form.keys()) {
			const m = /^src_(\d+)$/.exec(key);
			if (!m) continue;
			const value = form.get(key);
			if (typeof value === "string" && value && !allowed.has(value)) {
				return { error: "Imagine invalidă la salvare." };
			}
		}
	}

	const id = await createMaterial(db, input);

	if (isGame) {
		await syncGameAssets(env, db, id, form);
	}

	// Land on the edit page so files (images/PDF) can be attached right away.
	throw redirect(`/admin/materiale/${id}`);
}

const materialTypes = subjectConfig.materialTypes.map((mt) => ({ ...mt, label: t(mt.labelKey) }));

export default function MaterialNou({ loaderData }: Route.ComponentProps) {
	const actionData = useActionData<typeof action>();
	return (
		<AdminShell title="Material nou">
			<MaterialForm
				grades={subjectConfig.grades}
				topics={subjectConfig.topics}
				materialTypes={materialTypes}
				mode="create"
				error={actionData?.error}
				reusable={loaderData.reusable}
				initial={loaderData.duplicateOf}
				initialAssets={loaderData.initialAssets}
			/>
		</AdminShell>
	);
}
