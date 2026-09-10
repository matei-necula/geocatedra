import { and, asc, eq, inArray } from "drizzle-orm";
import type { DB } from "../db/client";
import { materialAssets, materials, materialTranslations, type MaterialAsset } from "../db/schema";
import { randomId } from "./crypto";

export const MAX_ASSET_BYTES = 25 * 1024 * 1024; // 25 MB (big video belongs to the Stream phase)

// Documents/office files (images & video are matched by prefix below).
const ALLOWED_DOCS = new Set([
	"application/pdf",
	"application/msword",
	"application/vnd.openxmlformats-officedocument.wordprocessingml.document",
	"application/vnd.ms-powerpoint",
	"application/vnd.openxmlformats-officedocument.presentationml.presentation",
]);

export function isAllowedType(mime: string): boolean {
	if (mime.startsWith("image/") || mime.startsWith("video/")) return true;
	return ALLOWED_DOCS.has(mime);
}

export function roleForMime(mime: string): "image" | "video" | "pdf" | "file" {
	if (mime.startsWith("image/")) return "image";
	if (mime.startsWith("video/")) return "video";
	if (mime === "application/pdf") return "pdf";
	return "file";
}

/**
 * Din rânduri deja ORDONATE (materialId, idx, createdAt), reține prima imagine a fiecărui
 * material și câte are în total.
 *
 * E despărțită de interogare ca să fie testabilă fără bază de date — la fel ca restul logicii
 * pure din repo. Se bazează pe ordonarea făcută în SQL: primul rând văzut pentru un material
 * e cel cu `idx` minim.
 */
export function reduPrimaImagine(
	rows: { materialId: string; id: string }[],
): { first: Record<string, string>; count: Record<string, number> } {
	const first: Record<string, string> = {};
	const count: Record<string, number> = {};
	for (const r of rows) {
		if (!(r.materialId in first)) first[r.materialId] = r.id;
		count[r.materialId] = (count[r.materialId] ?? 0) + 1;
	}
	return { first, count };
}

/**
 * Miniatura și numărul de imagini pentru un set de materiale, într-o SINGURĂ interogare.
 *
 * Motivul e de performanță, și e concret: pagina `/elevi` arată ~60 de materiale. Un
 * `listAssets` per material ar fi 60 de hopuri D1 în serie pe fiecare cerere — pagina ar
 * deveni de câteva ori mai lentă exact pentru vizitatorul venit de pe Google, pe telefon.
 *
 * Id-urile se taie în loturi de 100 pentru limita de parametri a SQLite. Azi n-avem atâtea,
 * dar biblioteca crește și un `IN` cu o mie de id-uri ar pica tăcut, în producție.
 */
export async function thumbsForMaterials(
	db: DB,
	ids: string[],
): Promise<{ first: Record<string, string>; count: Record<string, number> }> {
	const out = { first: {} as Record<string, string>, count: {} as Record<string, number> };
	for (let i = 0; i < ids.length; i += 100) {
		const lot = ids.slice(i, i + 100);
		if (lot.length === 0) continue;
		const rows = await db
			.select({ materialId: materialAssets.materialId, id: materialAssets.id })
			.from(materialAssets)
			.where(and(inArray(materialAssets.materialId, lot), eq(materialAssets.role, "image")))
			.orderBy(asc(materialAssets.materialId), asc(materialAssets.idx), asc(materialAssets.createdAt));
		const part = reduPrimaImagine(rows);
		Object.assign(out.first, part.first);
		Object.assign(out.count, part.count);
	}
	return out;
}

export async function listAssets(db: DB, materialId: string): Promise<MaterialAsset[]> {
	return db
		.select()
		.from(materialAssets)
		.where(eq(materialAssets.materialId, materialId))
		.orderBy(asc(materialAssets.idx), asc(materialAssets.createdAt));
}

export async function getAsset(db: DB, id: string): Promise<MaterialAsset | null> {
	const rows = await db.select().from(materialAssets).where(eq(materialAssets.id, id)).limit(1);
	return rows[0] ?? null;
}

export async function uploadAsset(env: Env, db: DB, materialId: string, file: File, idx = 0): Promise<void> {
	if (!env.MEDIA) throw new Error("R2 (MEDIA) indisponibil");
	const mime = file.type || "application/octet-stream";
	const id = randomId();
	const key = `materials/${materialId}/${id}`;
	await env.MEDIA.put(key, await file.arrayBuffer(), { httpMetadata: { contentType: mime } });
	await db.insert(materialAssets).values({
		id,
		materialId,
		role: roleForMime(mime),
		idx,
		r2Key: key,
		mime,
		bytes: file.size,
		createdAt: Date.now(),
	});
}

export async function copyAsset(env: Env, db: DB, materialId: string, sourceAssetId: string, idx: number): Promise<void> {
	if (!env.MEDIA) throw new Error("R2 (MEDIA) indisponibil");
	const src = await getAsset(db, sourceAssetId);
	if (!src) return;
	const obj = await env.MEDIA.get(src.r2Key);
	if (!obj) return;
	const id = randomId();
	const key = `materials/${materialId}/${id}`;
	await env.MEDIA.put(key, await obj.arrayBuffer(), { httpMetadata: { contentType: src.mime } });
	await db.insert(materialAssets).values({
		id,
		materialId,
		role: src.role,
		idx,
		r2Key: key,
		mime: src.mime,
		bytes: src.bytes,
		createdAt: Date.now(),
	});
}

export async function deleteAsset(env: Env, db: DB, id: string): Promise<void> {
	const asset = await getAsset(db, id);
	if (!asset) return;
	if (env.MEDIA) await env.MEDIA.delete(asset.r2Key);
	await db.delete(materialAssets).where(eq(materialAssets.id, id));
}

// Reconciles a joc material's images from a multipart form.
// Form fields: img_<idx> = File (new/replaced), src_<idx> = assetId (keep-or-copy).
export async function syncGameAssets(env: Env, db: DB, materialId: string, form: FormData): Promise<void> {
	const current = await listAssets(db, materialId);
	const currentIds = new Set(current.map((a) => a.id));
	const kept = new Set<string>();

	// Collect idx set from field names.
	const idxs = new Set<number>();
	for (const key of form.keys()) {
		const m = /^(?:img|src)_(\d+)$/.exec(key);
		if (m) idxs.add(Number(m[1]));
	}

	for (const idx of idxs) {
		const file = form.get(`img_${idx}`);
		if (file instanceof File && file.size > 0) {
			// Games only accept images; skip disallowed types or oversize files defensively
			// (the client already restricts this — this is the server-side floor).
			if (!file.type.startsWith("image/") || file.size > MAX_ASSET_BYTES) continue;
			await uploadAsset(env, db, materialId, file, idx);
			continue;
		}
		const srcId = form.get(`src_${idx}`);
		if (typeof srcId === "string" && srcId) {
			if (currentIds.has(srcId)) {
				// keep in place; fix idx if it changed
				const cur = current.find((a) => a.id === srcId)!;
				if (cur.idx !== idx) await db.update(materialAssets).set({ idx }).where(eq(materialAssets.id, srcId));
				kept.add(srcId);
			} else {
				await copyAsset(env, db, materialId, srcId, idx);
			}
		}
	}

	// Prune assets not kept and not freshly uploaded/copied (uploads/copies are new ids, never in `current`).
	for (const a of current) {
		if (!kept.has(a.id)) await deleteAsset(env, db, a.id);
	}
}

// Images of any joc-type material, for the reuse picker.
export async function listGameImages(db: DB): Promise<{ assetId: string; materialId: string; title: string }[]> {
	const rows = await db
		.select({ assetId: materialAssets.id, materialId: materials.id, title: materialTranslations.title })
		.from(materialAssets)
		.innerJoin(materials, eq(materials.id, materialAssets.materialId))
		.leftJoin(materialTranslations, and(eq(materialTranslations.materialId, materials.id), eq(materialTranslations.locale, "ro")))
		.where(and(eq(materials.type, "joc"), eq(materialAssets.role, "image")))
		.orderBy(asc(materialTranslations.title));
	return rows.map((r) => ({ assetId: r.assetId, materialId: r.materialId, title: r.title ?? "(joc)" }));
}

/**
 * Cheia R2 a miniaturii unui obiect. Vecină cu originalul, niciodată în locul lui.
 *
 * Miniaturile se generează cu `scripts/gen-thumbs.mjs` și sunt OPȚIONALE: `routes/media.tsx`
 * cade pe original dacă lipsesc, deci un material adăugat azi se vede corect chiar dacă
 * nimeni n-a rulat scriptul încă.
 */
export function thumbKey(r2Key: string): string {
	return `${r2Key}-t400`;
}
