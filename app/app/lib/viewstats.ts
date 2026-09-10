import { and, desc, eq, gte, inArray, lt, sql } from "drizzle-orm";
import type { DB } from "../db/client";
import { accessTokens, materials, materialTranslations, materialViewStats } from "../db/schema";

/** Local calendar day for stats bucketing. sv-SE locale formats as YYYY-MM-DD. */
export function bucharestDay(d: Date = new Date()): string {
	return d.toLocaleDateString("sv-SE", { timeZone: "Europe/Bucharest" });
}

export async function recordMaterialView(db: DB, materialId: string, tokenId: string): Promise<void> {
	await db
		.insert(materialViewStats)
		.values({ materialId, tokenId, day: bucharestDay(), views: 1 })
		.onConflictDoUpdate({
			target: [materialViewStats.materialId, materialViewStats.tokenId, materialViewStats.day],
			set: { views: sql`${materialViewStats.views} + 1` },
		});
}

function scopeCond(tokenIds?: string[]) {
	return tokenIds === undefined ? undefined : inArray(materialViewStats.tokenId, tokenIds);
}

export async function viewsPerDay(db: DB, sinceDay: string, tokenIds?: string[]): Promise<{ day: string; views: number }[]> {
	const rows = await db
		.select({ day: materialViewStats.day, views: sql<number>`SUM(${materialViewStats.views})` })
		.from(materialViewStats)
		.where(and(gte(materialViewStats.day, sinceDay), scopeCond(tokenIds)))
		.groupBy(materialViewStats.day)
		.orderBy(materialViewStats.day);
	return rows.map((r) => ({ day: r.day, views: Number(r.views) }));
}

export async function topMaterials(
	db: DB,
	tokenIds?: string[],
	limit = 10,
): Promise<{ materialId: string; title: string; gradeId: string; views: number }[]> {
	const rows = await db
		.select({
			materialId: materialViewStats.materialId,
			title: materialTranslations.title,
			gradeId: materials.gradeId,
			views: sql<number>`SUM(${materialViewStats.views})`,
		})
		.from(materialViewStats)
		.innerJoin(materials, eq(materials.id, materialViewStats.materialId))
		.leftJoin(
			materialTranslations,
			and(eq(materialTranslations.materialId, materials.id), eq(materialTranslations.locale, "ro")),
		)
		.where(scopeCond(tokenIds))
		.groupBy(materialViewStats.materialId)
		.orderBy(desc(sql`SUM(${materialViewStats.views})`))
		.limit(limit);
	return rows.map((r) => ({ materialId: r.materialId, title: r.title ?? "(fără titlu)", gradeId: r.gradeId, views: Number(r.views) }));
}

export async function viewsPerClass(
	db: DB,
	sinceDay: string,
	tokenIds?: string[],
): Promise<{ tokenId: string; label: string; gradeId: string; views: number }[]> {
	const rows = await db
		.select({
			tokenId: materialViewStats.tokenId,
			label: accessTokens.label,
			gradeId: accessTokens.gradeId,
			views: sql<number>`SUM(${materialViewStats.views})`,
		})
		.from(materialViewStats)
		.innerJoin(accessTokens, eq(accessTokens.id, materialViewStats.tokenId))
		.where(and(gte(materialViewStats.day, sinceDay), scopeCond(tokenIds)))
		.groupBy(materialViewStats.tokenId)
		.orderBy(desc(sql`SUM(${materialViewStats.views})`));
	return rows.map((r) => ({ tokenId: r.tokenId, label: r.label ?? "(clasă ștearsă)", gradeId: r.gradeId ?? "", views: Number(r.views) }));
}

/** Published student-library materials never opened (in scope) — „nevizitate". */
export async function unviewedMaterials(db: DB, tokenIds?: string[]): Promise<{ title: string; gradeId: string }[]> {
	const viewed = db
		.select({ id: materialViewStats.materialId })
		.from(materialViewStats)
		.where(scopeCond(tokenIds));
	const rows = await db
		.select({ id: materials.id, title: materialTranslations.title, gradeId: materials.gradeId })
		.from(materials)
		.leftJoin(
			materialTranslations,
			and(eq(materialTranslations.materialId, materials.id), eq(materialTranslations.locale, "ro")),
		)
		.where(
			and(
				eq(materials.status, "published"),
				eq(materials.library, "student"),
				sql`${materials.id} NOT IN ${viewed}`,
			),
		)
		.orderBy(materials.gradeId, materials.topicSlug, materials.position);
	return rows.map((r) => ({ title: r.title ?? "(fără titlu)", gradeId: r.gradeId }));
}

/** Opportunistic retention cleanup (~400 days), called when the stats page loads. */
export async function pruneViewStats(db: DB, beforeDay: string): Promise<void> {
	await db.delete(materialViewStats).where(lt(materialViewStats.day, beforeDay));
}
