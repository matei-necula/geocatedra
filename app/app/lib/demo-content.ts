// Citirile din bază de care are nevoie vitrina. Regulile pure stau în ./demo.ts; aici
// stă doar aducerea datelor, ca modulul pur să rămână testabil fără bază de date.
import { and, eq, sql } from "drizzle-orm";
import type { DB } from "../db/client";
import { materials } from "../db/schema";
import { gradeById, subjectConfig, t } from "../config/subject";
import type { DemoPick } from "../config/types";
import { firstParagraph } from "./demo";
import { getMaterialBySlug } from "./content";
import { listAssets } from "./assets";

export interface DemoCard {
	gradeId: string;
	gradeLabel: string;
	slug: string;
	type: string;
	library: string;
	title: string;
	description: string;
	/** Primul paragraf, doar pentru lecțiile scrise. */
	excerpt: string;
	/** Prima imagine — miniatura cardului. */
	thumbId: string | null;
	/** Primele câteva imagini, pentru banda de pe cardul de galerie. */
	photoIds: string[];
	/** Numărul de pagini al teancului (doar pentru materialele de profesor). */
	pages: number | null;
	/** „Schemă de lecție" / „Ghid metodologic" pentru raft, altfel eticheta temei. */
	shelfLabel: string;
}

function shelfLabelFor(gradeId: string, topicSlug: string): string {
	const collection = subjectConfig.teacherCollections.find((c) => c.slug === topicSlug);
	if (collection) return t(collection.labelKey);
	return subjectConfig.topics[gradeId]?.find((tp) => tp.slug === topicSlug)?.label ?? "";
}

/** Cardurile vitrinei, în ordinea din config. Un slug care nu mai există e sărit tăcut. */
export async function loadDemoCards(db: DB, picks: DemoPick[]): Promise<DemoCard[]> {
	const cards = await Promise.all(
		picks.map(async (pick): Promise<DemoCard | null> => {
			const m = await getMaterialBySlug(db, pick.gradeId, pick.slug, subjectConfig.defaultLocale);
			if (!m || m.status !== "published") return null;
			const images = (await listAssets(db, m.id)).filter((a) => a.role === "image");
			const isTeacher = m.library === "teacher";
			return {
				gradeId: m.gradeId,
				gradeLabel: gradeById(m.gradeId)?.label ?? m.gradeId,
				slug: m.slug,
				type: m.type,
				library: m.library,
				title: m.title,
				description: m.description,
				excerpt: m.type === "scris" ? firstParagraph(m.body) : "",
				thumbId: images[0]?.id ?? null,
				photoIds: images.slice(0, 3).map((a) => a.id),
				pages: isTeacher ? images.length : null,
				shelfLabel: shelfLabelFor(m.gradeId, m.topicSlug),
			} satisfies DemoCard;
		}),
	);
	return cards.filter((c): c is DemoCard => c !== null);
}

/** Câte materiale publicate are fiecare clasă în biblioteca elevilor — pentru banda de clase. */
export async function countStudentMaterialsByGrade(db: DB): Promise<Record<string, number>> {
	const rows = await db
		.select({ gradeId: materials.gradeId, c: sql<number>`count(*)` })
		.from(materials)
		.where(and(eq(materials.library, "student"), eq(materials.status, "published")))
		.groupBy(materials.gradeId);
	return Object.fromEntries(rows.map((r) => [r.gradeId, Number(r.c)]));
}
