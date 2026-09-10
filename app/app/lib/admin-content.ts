import { and, asc, eq, sql } from "drizzle-orm";
import type { DB } from "../db/client";
import { materials, materialTranslations } from "../db/schema";
import { randomId } from "./crypto";
import { slugify } from "./slug";

export interface MaterialInput {
	gradeId: string;
	topicSlug: string;
	type: string;
	library: string; // 'student' | 'teacher'
	title: string;
	description: string;
	body: string;
	status: string; // 'draft' | 'published'
	isTeaser: boolean;
	position: number;
}

export interface AdminMaterialRow {
	id: string;
	gradeId: string;
	topicSlug: string;
	type: string;
	library: string;
	slug: string;
	status: string;
	isTeaser: boolean;
	position: number;
	title: string;
	description: string;
	body: string;
}

async function ensureUniqueSlug(
	db: DB,
	gradeId: string,
	base: string,
	excludeId?: string,
): Promise<string> {
	let slug = base;
	let n = 1;
	// Loop until no other material in this grade uses the slug.
	// (Small datasets — a simple lookup loop is fine.)
	while (true) {
		const rows = await db
			.select({ id: materials.id })
			.from(materials)
			.where(and(eq(materials.gradeId, gradeId), eq(materials.slug, slug)))
			.limit(1);
		const clash = rows[0];
		if (!clash || clash.id === excludeId) return slug;
		n += 1;
		slug = `${base}-${n}`;
	}
}

export async function nextPosition(db: DB, gradeId: string, topicSlug: string): Promise<number> {
	const rows = await db
		.select({ max: sql<number>`COALESCE(MAX(${materials.position}), 0)` })
		.from(materials)
		.where(and(eq(materials.gradeId, gradeId), eq(materials.topicSlug, topicSlug)));
	return (rows[0]?.max ?? 0) + 1;
}

export async function getStats(db: DB): Promise<{ total: number; published: number; drafts: number }> {
	const rows = await db
		.select({ status: materials.status, c: sql<number>`count(*)` })
		.from(materials)
		.groupBy(materials.status);
	let total = 0;
	let published = 0;
	for (const r of rows) {
		const n = Number(r.c);
		total += n;
		if (r.status === "published") published += n;
	}
	return { total, published, drafts: total - published };
}

export async function createMaterial(db: DB, input: MaterialInput): Promise<string> {
	const id = randomId();
	const now = Date.now();
	const slug = await ensureUniqueSlug(db, input.gradeId, slugify(input.title));
	await db.insert(materials).values({
		id,
		gradeId: input.gradeId,
		topicSlug: input.topicSlug,
		type: input.type,
		library: input.library,
		slug,
		position: input.position,
		status: input.status,
		isTeaser: input.isTeaser ? 1 : 0,
		createdAt: now,
		updatedAt: now,
	});
	await db.insert(materialTranslations).values({
		materialId: id,
		locale: "ro",
		title: input.title,
		description: input.description,
		body: input.body,
	});
	return id;
}

export async function updateMaterial(db: DB, id: string, input: MaterialInput): Promise<void> {
	const now = Date.now();
	const slug = await ensureUniqueSlug(db, input.gradeId, slugify(input.title), id);
	await db
		.update(materials)
		.set({
			gradeId: input.gradeId,
			topicSlug: input.topicSlug,
			type: input.type,
			library: input.library,
			slug,
			position: input.position,
			status: input.status,
			isTeaser: input.isTeaser ? 1 : 0,
			updatedAt: now,
		})
		.where(eq(materials.id, id));
	await db
		.insert(materialTranslations)
		.values({
			materialId: id,
			locale: "ro",
			title: input.title,
			description: input.description,
			body: input.body,
		})
		.onConflictDoUpdate({
			target: [materialTranslations.materialId, materialTranslations.locale],
			set: { title: input.title, description: input.description, body: input.body },
		});
}

export async function deleteMaterial(db: DB, id: string): Promise<void> {
	await db.delete(materialTranslations).where(eq(materialTranslations.materialId, id));
	await db.delete(materials).where(eq(materials.id, id));
}

export async function listAllForAdmin(db: DB, locale: string): Promise<AdminMaterialRow[]> {
	const rows = await db
		.select()
		.from(materials)
		.leftJoin(
			materialTranslations,
			and(eq(materialTranslations.materialId, materials.id), eq(materialTranslations.locale, locale)),
		)
		.orderBy(asc(materials.gradeId), asc(materials.topicSlug), asc(materials.position));
	return rows.map((r) => ({
		id: r.materials.id,
		gradeId: r.materials.gradeId,
		topicSlug: r.materials.topicSlug,
		type: r.materials.type,
		library: r.materials.library,
		slug: r.materials.slug,
		status: r.materials.status,
		isTeaser: r.materials.isTeaser === 1,
		position: r.materials.position,
		title: r.material_translations?.title ?? "(fără titlu)",
		description: r.material_translations?.description ?? "",
		body: r.material_translations?.body ?? "",
	}));
}

/** Parse an admin material form into a validated MaterialInput. */
export async function inputFromForm(db: DB, form: FormData): Promise<MaterialInput> {
	const gradeId = String(form.get("gradeId") ?? "");
	const topicSlug = String(form.get("topicSlug") ?? "");
	const posRaw = String(form.get("position") ?? "").trim();
	const position =
		posRaw && !Number.isNaN(Number(posRaw))
			? Number(posRaw)
			: await nextPosition(db, gradeId, topicSlug);
	return {
		gradeId,
		topicSlug,
		type: String(form.get("type") ?? ""),
		library: String(form.get("library") || "student"),
		title: String(form.get("title") ?? "").trim(),
		description: String(form.get("description") ?? "").trim(),
		body: String(form.get("body") ?? ""),
		status: String(form.get("status") || "draft"),
		isTeaser: form.get("isTeaser") != null,
		position,
	};
}

export async function getForEdit(db: DB, id: string, locale: string): Promise<AdminMaterialRow | null> {
	const rows = await db
		.select()
		.from(materials)
		.leftJoin(
			materialTranslations,
			and(eq(materialTranslations.materialId, materials.id), eq(materialTranslations.locale, locale)),
		)
		.where(eq(materials.id, id))
		.limit(1);
	const r = rows[0];
	if (!r) return null;
	return {
		id: r.materials.id,
		gradeId: r.materials.gradeId,
		topicSlug: r.materials.topicSlug,
		type: r.materials.type,
		library: r.materials.library,
		slug: r.materials.slug,
		status: r.materials.status,
		isTeaser: r.materials.isTeaser === 1,
		position: r.materials.position,
		title: r.material_translations?.title ?? "",
		description: r.material_translations?.description ?? "",
		body: r.material_translations?.body ?? "",
	};
}
