// Regulile vitrinei publice — modul pur, fără bază de date, ca să poată fi testat singur.
// Ce e în vitrină se decide în subject.config (o singură sursă de adevăr); aici stă doar
// aritmetica: cine e înăuntru, câte pagini se văd dintr-un teanc, ce text se arată pe card.
import { subjectConfig } from "../config/subject";

export type { DemoPick } from "../config/types";

/**
 * Plafonul de pagini arătate dintr-un material de profesor. „Jumătate" dintr-un teanc
 * de 40 de pagini ar fi 20 — adică produsul, nu o mostră.
 */
export const MAX_PREVIEW_PAGES = 6;

function key(gradeId: string, slug: string): string {
	return `${gradeId}/${slug}`;
}

const demoKeys: ReadonlySet<string> = new Set([
	...subjectConfig.demo.student.map((p) => key(p.gradeId, p.slug)),
	...subjectConfig.demo.teacher.map((p) => key(p.gradeId, p.slug)),
]);

/** Materialul e unul dintre cele alese manual pentru vitrină? */
export function inDemoSet(gradeId: string, slug: string): boolean {
	return demoKeys.has(key(gradeId, slug));
}

/** Câte pagini se văd dintr-un teanc de `total` pagini: jumătate, dar cel mult plafonul. */
export function pageBudget(total: number): number {
	if (!Number.isFinite(total) || total <= 0) return 0;
	return Math.min(Math.ceil(total / 2), MAX_PREVIEW_PAGES);
}

/** Podeaua pentru /media/:id: pagina cerută intră în bugetul teancului? */
export function assetAllowed(idx: number, total: number): boolean {
	return Number.isInteger(idx) && idx >= 0 && idx < pageBudget(total);
}

/**
 * Primul paragraf adevărat dintr-o lecție scrisă, pentru gustarea de pe card.
 * Formatul body-ului e cel din WrittenBlock: blocuri separate de linii goale.
 */
export function firstParagraph(body: string, maxChars = 240): string {
	const blocks = body.split(/\n{2,}/).map((b) => b.trim()).filter(Boolean);
	const prose = blocks.find(
		(b) =>
			!/^#{1,3}\s/.test(b) &&
			!/^-{3,}$/.test(b) &&
			!/^\s*(?:[-*]|\d+[.)])\s/.test(b) &&
			!b.includes("|"),
	);
	if (!prose) return "";
	const flat = prose
		.replace(/\n/g, " ")
		.replace(/\*\*(.+?)\*\*/g, "$1")
		.replace(/\*(.+?)\*/g, "$1")
		.trim();
	if (flat.length <= maxChars) return flat;
	const cut = flat.slice(0, maxChars);
	// Only drop the trailing word if the cut actually landed inside it; a cut that
	// lands exactly on a word boundary should keep the last whole word.
	const trimmed = /\s/.test(flat[maxChars] ?? "") ? cut : cut.replace(/\s+\S*$/, "");
	return `${trimmed}…`;
}
