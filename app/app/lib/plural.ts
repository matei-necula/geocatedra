import { t } from "../config/subject";

/**
 * Pluralul românesc are TREI forme, nu două, iar a treia e cea pe care o greșesc toate
 * traducerile făcute după tiparul englezesc:
 *
 *     1 planșă        · forma de singular
 *     2–19 planșe     · forma de plural
 *     20 de planșe    · plural cu „de"
 *     101 planșe      · fără „de" (ultimele două cifre: 01)
 *     120 de planșe   · cu „de"  (ultimele două cifre: 20)
 *
 * Regula reală: se uită la ULTIMELE DOUĂ cifre. „de" apare când sunt 00 sau între 20 și 99.
 * De aia nu e destul `n > 19` — 101 ar ieși „101 de planșe", care sună greșit oricui.
 */
export function formaPlural(n: number): "one" | "few" | "many" {
	if (n === 1) return "one";
	const ultimele = Math.abs(n) % 100;
	return ultimele === 0 || ultimele >= 20 ? "many" : "few";
}

/** „12 planșe", „171 de planșe", „1 planșă" — textele vin din locale, forma din regula de mai sus. */
export function plansePlural(n: number): string {
	return t(`liber.pedagogie.pages.${formaPlural(n)}`).replace("{n}", String(n));
}

/** „12 jocuri", „52 de jocuri", „1 joc" — aceeași regulă, alt set de texte. */
export function jocuriPlural(n: number): string {
	return t(`liber.jocuri.count.${formaPlural(n)}`).replace("{n}", String(n));
}

/** „12 întrebări", „320 de întrebări", „o întrebare" — pentru descrierea paginii de exersare. */
export function intrebariPlural(n: number): string {
	return t(`practice.seo.questions.${formaPlural(n)}`).replace("{n}", String(n));
}

/** „12 materiale", „20 de materiale", „un material" — pentru descrierea unui raft. */
export function materialePlural(n: number): string {
	return t(`teacher.shelf.seo.count.${formaPlural(n)}`).replace("{n}", String(n));
}
