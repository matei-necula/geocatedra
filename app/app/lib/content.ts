import { and, asc, eq } from "drizzle-orm";
import type { DB } from "../db/client";
import { materials, materialTranslations } from "../db/schema";

export interface MaterialView {
	id: string;
	gradeId: string;
	topicSlug: string;
	type: string;
	library: string;
	slug: string;
	status: string;
	isTeaser: boolean;
	title: string;
	description: string;
	body: string;
	createdAt: number;
}

function rowToView(m: typeof materials.$inferSelect, t: { title: string | null; description: string | null; body: string | null } | null): MaterialView {
	return {
		id: m.id,
		gradeId: m.gradeId,
		topicSlug: m.topicSlug,
		type: m.type,
		library: m.library,
		slug: m.slug,
		status: m.status,
		isTeaser: m.isTeaser === 1,
		title: t?.title ?? "(fără titlu)",
		description: t?.description ?? "",
		body: t?.body ?? "",
		createdAt: m.createdAt,
	};
}

export async function listMaterialsForGrade(
	db: DB,
	gradeId: string,
	locale: string,
	library = "student",
	includeUnpublished = false,
): Promise<MaterialView[]> {
	const conds = [eq(materials.gradeId, gradeId), eq(materials.library, library)];
	if (!includeUnpublished) conds.push(eq(materials.status, "published"));
	const rows = await db
		.select()
		.from(materials)
		.leftJoin(
			materialTranslations,
			and(eq(materialTranslations.materialId, materials.id), eq(materialTranslations.locale, locale)),
		)
		.where(and(...conds))
		.orderBy(asc(materials.topicSlug), asc(materials.position));

	return rows.map((r) => rowToView(r.materials, r.material_translations));
}

/**
 * One shelf of the teacher library, across every grade.
 *
 * Pedagogy materials are filed by collection rather than by grade — a teacher
 * looking for lesson plans wants the shelf, not a grade picker — so the grade
 * becomes a grouping key for the caller instead of a filter.
 */
export async function listTeacherCollection(
	db: DB,
	collectionSlug: string,
	locale: string,
	includeUnpublished = false,
): Promise<MaterialView[]> {
	const conds = [
		eq(materials.library, "teacher"),
		eq(materials.topicSlug, collectionSlug),
	];
	if (!includeUnpublished) conds.push(eq(materials.status, "published"));
	const rows = await db
		.select()
		.from(materials)
		.leftJoin(
			materialTranslations,
			and(eq(materialTranslations.materialId, materials.id), eq(materialTranslations.locale, locale)),
		)
		.where(and(...conds))
		.orderBy(asc(materials.gradeId), asc(materials.position));

	return rows.map((r) => rowToView(r.materials, r.material_translations));
}

export interface MaterialCore {
	id: string;
	status: string;
	library: string;
	gradeId: string;
	isTeaser: boolean;
	slug: string;
}

/** Minimal fetch for access checks (e.g. when streaming an asset). */
export async function getMaterialCore(db: DB, id: string): Promise<MaterialCore | null> {
	const rows = await db
		.select({
			id: materials.id,
			status: materials.status,
			library: materials.library,
			gradeId: materials.gradeId,
			isTeaser: materials.isTeaser,
			slug: materials.slug,
		})
		.from(materials)
		.where(eq(materials.id, id))
		.limit(1);
	const r = rows[0];
	if (!r) return null;
	return { id: r.id, status: r.status, library: r.library, gradeId: r.gradeId, isTeaser: r.isTeaser === 1, slug: r.slug };
}

export async function getMaterialBySlug(
	db: DB,
	gradeId: string,
	slug: string,
	locale: string,
): Promise<MaterialView | null> {
	const rows = await db
		.select()
		.from(materials)
		.leftJoin(
			materialTranslations,
			and(eq(materialTranslations.materialId, materials.id), eq(materialTranslations.locale, locale)),
		)
		.where(and(eq(materials.gradeId, gradeId), eq(materials.slug, slug)))
		.limit(1);

	const r = rows[0];
	return r ? rowToView(r.materials, r.material_translations) : null;
}
