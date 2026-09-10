import { Form, redirect, useActionData } from "react-router";
import type { Route } from "./+types/admin.materiale.$id";
import { subjectConfig, t } from "../config/subject";
import { getDb } from "../db/client";
import { getAdminSession } from "../lib/session";
import { getSecrets } from "../lib/env";
import { getForEdit, inputFromForm, updateMaterial } from "../lib/admin-content";
import { deleteAsset, isAllowedType, listAssets, listGameImages, MAX_ASSET_BYTES, syncGameAssets, uploadAsset } from "../lib/assets";
import { parseGameBody } from "../lib/games";
import { validateGame } from "../lib/game-editor";
import { AdminShell } from "../components/AdminShell";
import { MaterialForm } from "../components/MaterialForm";
import { seo } from "../lib/seo";

export function meta(_: Route.MetaArgs) {
	return seo({ title: "Editează material", path: "/admin/materiale/:id", noindex: true });
}

async function requireAdmin(request: Request, env: Env) {
	const admin = await getAdminSession(request, getSecrets(env).sessionSecret);
	if (!admin) throw redirect("/admin/login");
}

export async function loader({ request, context, params }: Route.LoaderArgs) {
	const env = context.cloudflare.env;
	await requireAdmin(request, env);
	const db = getDb(env);
	const material = await getForEdit(db, params.id, subjectConfig.defaultLocale);
	if (!material) throw new Response("Not found", { status: 404 });
	const allAssets = await listAssets(db, params.id);
	const assets = allAssets.map((a) => ({ id: a.id, role: a.role, bytes: a.bytes }));
	const initialAssets = allAssets.map((a) => ({ id: a.id, idx: a.idx }));
	const reusable = (await listGameImages(db)).filter((r) => r.materialId !== params.id);
	return { material, assets, initialAssets, reusable };
}

export async function action({ request, context, params }: Route.ActionArgs) {
	const env = context.cloudflare.env;
	await requireAdmin(request, env);
	const db = getDb(env);
	const form = await request.formData();
	const intent = String(form.get("intent") ?? "");

	if (intent === "upload") {
		if (!env.MEDIA) return { error: "Stocarea fișierelor (R2) nu este activată încă. Activeaz-o în Cloudflare pentru a încărca fișiere." };
		const file = form.get("file");
		if (file instanceof File && file.size > 0) {
			if (file.size > MAX_ASSET_BYTES) return { error: "Fișier prea mare (max 10 MB)." };
			if (!isAllowedType(file.type)) return { error: "Tip neacceptat. Folosește imagine (PNG/JPG/WEBP) sau PDF." };
			await uploadAsset(env, db, params.id, file);
		}
		return { error: undefined };
	}

	if (intent === "deleteAsset") {
		await deleteAsset(env, db, String(form.get("assetId")));
		return { error: undefined };
	}

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

		// Security floor: only allow copying/keeping images that are already
		// reusable game images or already belong to this material (image role
		// only). Runs BEFORE persisting so a rejected submit never leaves the
		// row updated with a bad/forged src_ reference.
		const allowed = new Set((await listGameImages(db)).map((r) => r.assetId));
		for (const a of await listAssets(db, params.id)) {
			if (a.role === "image") allowed.add(a.id);
		}
		for (const key of form.keys()) {
			const m = /^src_(\d+)$/.exec(key);
			if (!m) continue;
			const value = form.get(key);
			if (typeof value === "string" && value && !allowed.has(value)) {
				return { error: "Imagine invalidă la salvare." };
			}
		}
	}

	await updateMaterial(db, params.id, input);

	if (isGame) {
		await syncGameAssets(env, db, params.id, form);
	}

	throw redirect("/admin/materiale");
}

const materialTypes = subjectConfig.materialTypes.map((mt) => ({ ...mt, label: t(mt.labelKey) }));

export default function MaterialEdit({ loaderData }: Route.ComponentProps) {
	const { material, assets, initialAssets, reusable } = loaderData;
	const actionData = useActionData<typeof action>();
	return (
		<AdminShell title="Editează material">
			<MaterialForm
				grades={subjectConfig.grades}
				topics={subjectConfig.topics}
				materialTypes={materialTypes}
				initial={material}
				mode="edit"
				error={actionData?.error}
				initialAssets={initialAssets}
				reusable={reusable}
			/>

			<section className="mt-10 border-t border-border pt-8">
				<h2 className="mb-1 text-xl font-semibold">Fișiere (imagini, PDF)</h2>
				<p className="mb-4 text-sm text-muted">
					Imagini, PDF, Word, PowerPoint sau video. Pentru tipul „Fișier / document" acesta este
					conținutul principal. Max 25 MB (video mare vine în etapa de streaming).
				</p>

				<Form method="post" encType="multipart/form-data" className="mb-5 flex flex-wrap items-center gap-3">
					<input type="hidden" name="intent" value="upload" />
					<input
						type="file"
						name="file"
						accept="image/*,video/*,application/pdf,.doc,.docx,.ppt,.pptx"
						required
						className="text-sm file:mr-3 file:rounded-lg file:border-0 file:bg-primary file:px-4 file:py-2 file:font-medium file:text-on-primary hover:file:bg-primary-strong"
					/>
					<button className="rounded-lg border border-border px-4 py-2 text-sm font-medium hover:border-primary">
						Încarcă
					</button>
				</Form>

				{assets.length === 0 ? (
					<p className="rounded-lg border border-dashed border-border p-4 text-sm text-muted">
						Niciun fișier încărcat.
					</p>
				) : (
					<div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
						{assets.map((a) => {
							const icon = a.role === "video" ? "🎬" : a.role === "pdf" ? "📄" : "📎";
							const label = a.role === "image" ? "Imagine" : a.role === "video" ? "Video" : a.role === "pdf" ? "PDF" : "Fișier";
							return (
								<div key={a.id} className="overflow-hidden rounded-xl border border-border bg-surface">
									<a href={`/media/${a.id}`} target="_blank" rel="noreferrer" className="block">
										{a.role === "image" ? (
											<img src={`/media/${a.id}`} alt="" className="aspect-[3/2] w-full object-cover" />
										) : (
											<div className="grid aspect-[3/2] place-items-center bg-bg text-3xl">{icon}</div>
										)}
									</a>
									<div className="flex items-center justify-between px-3 py-2">
										<span className="text-xs text-muted">{label}</span>
										<Form method="post" onSubmit={(e) => { if (!confirm("Ștergi fișierul?")) e.preventDefault(); }}>
											<input type="hidden" name="intent" value="deleteAsset" />
											<input type="hidden" name="assetId" value={a.id} />
											<button className="text-xs font-medium text-accent-strong hover:underline">Șterge</button>
										</Form>
									</div>
								</div>
							);
						})}
					</div>
				)}
			</section>
		</AdminShell>
	);
}
