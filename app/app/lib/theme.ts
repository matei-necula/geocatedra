import type { SubjectConfig, ThemeTokens } from "../config/types";
import type { SiteMode } from "./site-mode";

/** Build the runtime CSS that overrides the Tailwind token values from config,
 *  making the whole theme driven by subject.config (and swappable per subject). */
export function themeCss(config: SubjectConfig): string {
	const light = Object.entries(config.theme.colors)
		.map(([k, v]) => `--color-${k}:${v};`)
		.join("");
	// `--font-heading-ui` se emite DOAR când tema îl definește: `app.css` îl citește ca
	// `var(--font-heading-ui, var(--font-heading))`, iar rezerva aia funcționează numai dacă
	// variabila chiar lipsește. Emis gol, ar anula rezerva și ar lăsa h3/h4 fără font.
	const fonts =
		`--font-sans:${config.theme.fonts.body};--font-heading:${config.theme.fonts.heading};` +
		(config.theme.fonts.headingUi ? `--font-heading-ui:${config.theme.fonts.headingUi};` : "");
	let css = `:root{color-scheme:light;${light}${fonts}}`;
	if (config.theme.colorsDark) {
		const dark = Object.entries(config.theme.colorsDark)
			.map(([k, v]) => `--color-${k}:${v};`)
			.join("");
		css += `.dark{color-scheme:dark;${dark}}`;
	}
	return css;
}

/** Tema instanței cerute. Instanța liberă cade pe tema de bază până primește una proprie. */
export function themeFor(config: SubjectConfig, mode: SiteMode): ThemeTokens {
	return mode === "liber" && config.themeLiber ? config.themeLiber : config.theme;
}

// ---------------------------------------------------------------------------
// Preferința de temă: TREI stări, nu două.
//
// Comutatorul avea doar „luminos"/„întunecat", iar `noFlashScript` respecta setarea
// sistemului DOAR cât timp nu era nimic în localStorage. Adică prima apăsare pe buton era o
// ușă cu sens unic: vizitatorul rămânea blocat pe alegerea aia pentru totdeauna, fără nicio
// cale înapoi la „ca sistemul". Iar un telefon care trece pe întunecat la apus lăsa fila
// deschisă pe luminos, pentru că nimeni nu asculta schimbarea.
//
// Cheia din localStorage rămâne `theme`, iar valorile vechi („light"/„dark") rămân valide
// exact cu înțelesul lor de acum — vizitatorii care le au deja nu simt nimic.
// ---------------------------------------------------------------------------

export type ThemePref = "system" | "light" | "dark";

export const THEME_STORAGE_KEY = "theme";

/** Orice nu e o alegere explicită înseamnă „ca sistemul" — inclusiv o cheie lipsă sau
 *  o valoare rămasă de la o versiune viitoare/anterioară a comutatorului. */
export function parseThemePref(raw: string | null | undefined): ThemePref {
	return raw === "light" || raw === "dark" ? raw : "system";
}

/** Tema efectivă: alegerea explicită bate sistemul, altfel urmează sistemul. */
export function isDarkTheme(pref: ThemePref, systemDark: boolean): boolean {
	return pref === "system" ? systemDark : pref === "dark";
}

/** Ciclul butonului: sistem → luminos → întunecat → sistem. Un singur buton în bara de sus,
 *  dar niciun sens unic — a treia apăsare readuce vizitatorul la „ca sistemul". */
export function nextThemePref(pref: ThemePref): ThemePref {
	return pref === "system" ? "light" : pref === "light" ? "dark" : "system";
}

// `media` pentru cele două `<meta name="theme-color">` din root.tsx, în funcție de preferință.
// Bara browserului de pe telefon nu citește clasa `.dark`, ci meta-ul — iar meta-urile se aleg
// după `prefers-color-scheme`, care e SISTEMUL, nu alegerea din pagină. Când vizitatorul alege
// explicit, dezactivăm meta-ul care nu trebuie („not all" nu se potrivește niciodată), în loc
// să-i rescriem conținutul: așa revenirea la „ca sistemul" e doar punerea la loc a două
// constante, fără să ținem minte culorile pe undeva.
export const THEME_COLOR_MEDIA = {
	light: "(prefers-color-scheme: light)",
	dark: "(prefers-color-scheme: dark)",
} as const;

export function themeColorMedia(pref: ThemePref): { light: string; dark: string } {
	if (pref === "light") return { light: "all", dark: "not all" };
	if (pref === "dark") return { light: "not all", dark: "all" };
	return { light: THEME_COLOR_MEDIA.light, dark: THEME_COLOR_MEDIA.dark };
}

/** Citește preferința. Modul privat poate arunca la simpla citire — de aia try/catch. */
export function readThemePref(): ThemePref {
	try {
		return parseThemePref(localStorage.getItem(THEME_STORAGE_KEY));
	} catch {
		return "system";
	}
}

export function writeThemePref(pref: ThemePref): void {
	try {
		localStorage.setItem(THEME_STORAGE_KEY, pref);
	} catch {
		/* modul privat: preferința nu se ține minte, dar pagina funcționează */
	}
}

/** Aplică tema în DOM: clasa pentru pagină + `media` pentru bara browserului. */
export function applyTheme(pref: ThemePref, systemDark: boolean): void {
	document.documentElement.classList.toggle("dark", isDarkTheme(pref, systemDark));
	const metas = document.head.querySelectorAll<HTMLMetaElement>('meta[name="theme-color"]');
	if (metas.length < 2) return; // temă fără `colorsDark`: un singur meta, nimic de comutat
	const media = themeColorMedia(pref);
	metas[0].media = media.light;
	metas[1].media = media.dark;
}

/**
 * Rulează înainte de prima pictare, inline, în try/catch — de-aia e scris de mână și îndesat.
 * Face două lucruri: pune clasa `.dark` (ca să nu clipească pagina) și dezactivează meta-ul
 * de culoare care nu se potrivește cu alegerea explicită (ca să nu clipească bara browserului).
 * Fără nicio valoare stocată, ambele rămân pe sistem.
 */
export const noFlashScript = `(function(){try{var t=localStorage.getItem('theme');var m=window.matchMedia&&window.matchMedia('(prefers-color-scheme: dark)').matches;var d=t==='dark'||(t!=='light'&&m);if(d){document.documentElement.classList.add('dark');}if(t==='light'||t==='dark'){var s=document.head.querySelectorAll('meta[name="theme-color"]');if(s.length>1){s[0].media=d?'not all':'all';s[1].media=d?'all':'not all';}}}catch(e){}})();`;
