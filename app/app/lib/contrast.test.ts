import { describe, expect, it } from "vitest";
import { subjectConfig } from "../config/subject";
import type { ThemeTokens } from "../config/types";

/**
 * Contrastul temelor, verificat de teste — nu de ochi și nu de un script rulat o dată.
 *
 * Motivul e concret: paleta „Cobalt" a instanței libere are un coral care arată perfect
 * într-o machetă și pică pragul WCAG (2,64:1 pe hârtie). Fără testul ăsta, prima persoană
 * care schimbă o culoare „ca să arate mai bine" poate face butoane ilizibile fără să afle
 * niciodată — și n-ar afla nici la revizuire, pentru că diferența nu se vede cu ochiul liber
 * la 4,3:1 față de 4,5:1.
 */

/** Luminanța relativă, WCAG 2.1. */
function luminanta(hex: string): number {
	const c = [1, 3, 5]
		.map((i) => parseInt(hex.slice(i, i + 2), 16) / 255)
		.map((v) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));
	return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
}

export function raport(a: string, b: string): number {
	const x = luminanta(a);
	const y = luminanta(b);
	return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05);
}

/** Perechile care apar efectiv în interfață, cu pragul care li se aplică. */
function perechi(c: Record<string, string>): [string, string, string, number][] {
	return [
		["text pe fundal", c.ink, c.bg, 4.5],
		["text secundar pe fundal", c.muted, c.bg, 4.5],
		["text primar pe fundal", c.primary, c.bg, 4.5],
		["text pe suprafață", c.ink, c.surface, 4.5],
		["text secundar pe suprafață", c.muted, c.surface, 4.5],
		["accent ca text pe fundal", c["accent-strong"], c.bg, 4.5],
		["text pe buton primar", c["on-primary"], c.primary, 4.5],
		["text pe buton accent", c["on-accent"], c.accent, 4.5],
		// Elementele non-text (chenare, indicatoare) au pragul de 3:1.
		["primar ca element non-text", c.primary, c.bg, 3],
	];
}

/**
 * Datorie de accesibilitate știută. **Goală** — și trebuie să rămână așa.
 *
 * A existat: tema instanței cu clase avea patru perechi sub prag, moștenite de dinaintea
 * temei Cobalt și live în producție luni de zile — alb pe butonul teracotă (2,95:1),
 * `accent-strong` ca text (3,92:1), iar în mod întunecat alb pe butonul primar (3,07:1) și
 * pe cel accent (2,40:1). Le-a găsit testul ăsta, nu un om, și au fost reparate pe
 * 2026-09-05 prin jetoanele `on-primary`/`on-accent`.
 *
 * Mecanismul rămâne pentru cazul în care o schimbare viitoare are nevoie de o excepție
 * temporară, documentată. O intrare pusă aici trebuie să vină cu motivul ei; una care nu mai
 * pică face testul roșu, ca să fie scoasă.
 */
const DATORIE_STIUTA = new Set<string>();

function verifica(nume: string, tema: ThemeTokens) {
	describe(nume, () => {
		for (const mod of ["light", "dark"] as const) {
			const culori = mod === "light" ? tema.colors : tema.colorsDark;
			if (!culori) continue;
			// Modul întunecat suprascrie doar o parte din jetoane; restul cad pe cele deschise,
			// exact ca în CSS. Testul trebuie să vadă aceeași combinație pe care o vede browserul.
			const efective = mod === "light" ? tema.colors : { ...tema.colors, ...culori };

			describe(mod, () => {
				for (const [eticheta, fg, bg, prag] of perechi(efective)) {
					const cheie = `${nume}/${mod}/${eticheta}`;
					const stiuta = DATORIE_STIUTA.has(cheie);

					it(`${eticheta} ≥ ${prag}:1${stiuta ? " (datorie știută)" : ""}`, () => {
						expect(fg, `jeton lipsă în ${cheie}`).toBeDefined();
						expect(bg).toBeDefined();
						const r = Number(raport(fg, bg).toFixed(2));

						if (stiuta) {
							// Perechile din datorie au voie să pice — dar nu au voie să se
							// înrăutățească, și nici să rămână pe listă după ce au fost reparate.
							expect(r, `${cheie} a fost reparată: scoate-o din DATORIE_STIUTA`).toBeLessThan(prag);
							return;
						}
						expect(r).toBeGreaterThanOrEqual(prag);
					});
				}
			});
		}
	});
}

verifica("tema cu clase (Mediteran)", subjectConfig.theme);
verifica("tema liberă (Cobalt)", subjectConfig.themeLiber!);

describe("santinelă", () => {
	// Dacă cele două teme ajung vreodată identice, testul de mai sus ar trece degeaba pe una
	// din ele. S-a întâmplat exact asta într-o verificare ad-hoc: un parser greșit a citit de
	// două ori aceleași culori și a raportat „toate trec" pentru o paletă neverificată.
	it("cele două teme chiar sunt diferite", () => {
		expect(subjectConfig.themeLiber!.colors.primary).not.toBe(subjectConfig.theme.colors.primary);
		expect(subjectConfig.themeLiber!.colors.bg).not.toBe(subjectConfig.theme.colors.bg);
	});

	it("coralul Cobalt e umplere, nu text pe hârtie", () => {
		const c = subjectConfig.themeLiber!.colors;
		// Documentează de ce există `accent-strong`: accentul brut NU trece pragul de text.
		expect(raport(c.accent, c.bg)).toBeLessThan(4.5);
		expect(raport(c["accent-strong"], c.bg)).toBeGreaterThanOrEqual(4.5);
	});
});
