import { t } from "../config/subject";
import { formaPlural } from "./plural";

/**
 * E deschis ACUM dacă utilizatorul l-a deschis manual SAU dacă filtrul/căutarea îl scoate
 * în evidență. Cele două stări sunt independente: `forcedOpen` nu se scrie peste starea
 * proprie, ea doar o depășește temporar — de aceea la ștergerea filtrului capitolul revine
 * exact la ce alesese utilizatorul (vezi `GradeBrowse`, unde `forcedOpen` e pur și simplu
 * `active`, pentru că temele care nu se potrivesc sunt deja scoase din listă mai devreme).
 */
export function isChapterOpen(ownOpen: boolean, forcedOpen: boolean): boolean {
	return forcedOpen || ownOpen;
}

/** „8 materiale”, „8 materiale · 12 întrebări” — pluralul românesc corect din `formaPlural`. */
export function chapterSummary(materialsCount: number, questionsCount: number): string {
	const materials = t(`browse.count.materials.${formaPlural(materialsCount)}`).replace(
		"{n}",
		String(materialsCount),
	);
	if (questionsCount <= 0) return materials;
	const questions = t(`browse.count.questions.${formaPlural(questionsCount)}`).replace(
		"{n}",
		String(questionsCount),
	);
	return `${materials} · ${questions}`;
}

/** Următoarea mulțime de capitole „deschise manual” pentru butonul Deschide tot / Închide tot. */
export function nextOpenChapters(allSlugs: string[], currentlyAllOpen: boolean): Set<string> {
	return currentlyAllOpen ? new Set() : new Set(allSlugs);
}

/** Eticheta butonului: „toate” înseamnă că fiecare capitol e în mulțimea deschisă manual. */
export function allChaptersOpen(allSlugs: string[], openSlugs: Set<string>): boolean {
	return allSlugs.length > 0 && allSlugs.every((slug) => openSlugs.has(slug));
}
