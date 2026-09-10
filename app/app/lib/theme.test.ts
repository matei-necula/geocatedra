import { describe, expect, it } from "vitest";
import {
	isDarkTheme,
	nextThemePref,
	noFlashScript,
	parseThemePref,
	themeColorMedia,
	themeCss,
	themeFor,
	type ThemePref,
} from "./theme";
import { subjectConfig } from "../config/subject";

describe("themeFor", () => {
	it("dă tema de bază pentru instanța cu clase", () => {
		expect(themeFor(subjectConfig, "clase")).toBe(subjectConfig.theme);
	});

	// Cade pe tema de bază cât timp instanța liberă n-are încă una proprie — redesignul
	// vizual e o etapă separată, iar lipsa lui nu are voie să strice site-ul.
	it("cade pe tema de bază dacă instanța liberă n-are temă proprie", () => {
		const fara = { ...subjectConfig, themeLiber: undefined };
		expect(themeFor(fara, "liber")).toBe(subjectConfig.theme);
	});

	it("folosește tema liberă când există", () => {
		const proprie = { ...subjectConfig.theme, colors: { ...subjectConfig.theme.colors, bg: "#000000" } };
		const cu = { ...subjectConfig, themeLiber: proprie };
		expect(themeFor(cu, "liber")).toBe(proprie);
	});

	// Redesignul „Cobalt": instanța liberă are de acum temă proprie, iar cea cu clase
	// trebuie să rămână EXACT pe tema de bază. Testul ăsta e paznicul acelei separări.
	it("instanța liberă are temă proprie, cea cu clase rămâne pe tema de bază", () => {
		expect(subjectConfig.themeLiber).toBeDefined();
		expect(themeFor(subjectConfig, "liber")).toBe(subjectConfig.themeLiber);
		expect(themeFor(subjectConfig, "clase")).toBe(subjectConfig.theme);
	});
});

describe("themeCss", () => {
	// Instrument Serif nu are decât greutatea 400, deci h3/h4 trebuie să poată pleca pe alt
	// font decât h1/h2. Jetonul e opțional: temele care nu-l definesc nu trebuie să-l emită,
	// altfel `var(--font-heading-ui, var(--font-heading))` din app.css n-ar mai cădea corect.
	it("emite jetonul de font pentru titlurile mici doar când e definit", () => {
		const cu = {
			...subjectConfig,
			theme: { ...subjectConfig.theme, fonts: { ...subjectConfig.theme.fonts, headingUi: "X" } },
		};
		expect(themeCss(cu)).toContain("--font-heading-ui:X");

		const fara = {
			...subjectConfig,
			theme: { ...subjectConfig.theme, fonts: { heading: "H", body: "B" } },
		};
		expect(themeCss(fara)).not.toContain("--font-heading-ui");
	});

	// Cele două meta-uri `theme-color` din root.tsx există doar dacă tema are `colorsDark`.
	// Testul ăsta ține de fapt de root, dar valorile vin de aici.
	it("ambele teme au fundal și pentru modul întunecat, ca bara browserului să-l poată urma", () => {
		expect(subjectConfig.theme.colorsDark?.bg).toBeTruthy();
		expect(subjectConfig.themeLiber!.colorsDark?.bg).toBeTruthy();
	});

	// Coralul Cobalt pică pe hârtie (2,64:1), deci textul de pe umpluturile de temă nu poate
	// fi `text-white` scris de mână — vine din jeton. Fiecare temă trebuie să-l definească,
	// în ambele moduri, altfel un buton rămâne fără culoare de text.
	it("fiecare temă definește textul pentru umpluturile de temă", () => {
		const teme = [subjectConfig.theme, subjectConfig.themeLiber!];
		for (const tema of teme) {
			for (const cheie of ["on-primary", "on-accent", "accent-strong"]) {
				expect(tema.colors[cheie], `light: ${cheie}`).toBeDefined();
				if (tema.colorsDark) expect(tema.colorsDark[cheie], `dark: ${cheie}`).toBeDefined();
			}
		}
	});
});

describe("preferința de temă (trei stări)", () => {
	// Compatibilitate: vizitatorii au deja „light"/„dark" scrise în localStorage de varianta
	// cu două stări. Trebuie să însemne exact ce însemnau, altfel se trezesc cu altă temă.
	it("păstrează valorile vechi din localStorage", () => {
		expect(parseThemePref("light")).toBe("light");
		expect(parseThemePref("dark")).toBe("dark");
	});

	it("orice altceva înseamnă ca sistemul", () => {
		for (const raw of [null, undefined, "", "system", "Dark", "auto", "{}"]) {
			expect(parseThemePref(raw)).toBe("system");
		}
	});

	it("pe modul sistem urmează sistemul, pe alegere explicită îl ignoră", () => {
		expect(isDarkTheme("system", true)).toBe(true);
		expect(isDarkTheme("system", false)).toBe(false);
		expect(isDarkTheme("light", true)).toBe(false);
		expect(isDarkTheme("dark", false)).toBe(true);
	});

	// Miezul problemei rezolvate: butonul nu mai e o ușă cu sens unic. Trei apăsări readuc
	// vizitatorul la „ca sistemul", din orice stare ar fi pornit.
	it("ciclul se închide: trei apăsări te aduc de unde ai plecat", () => {
		expect(nextThemePref("system")).toBe("light");
		expect(nextThemePref("light")).toBe("dark");
		expect(nextThemePref("dark")).toBe("system");
		for (const start of ["system", "light", "dark"] as ThemePref[]) {
			expect(nextThemePref(nextThemePref(nextThemePref(start)))).toBe(start);
		}
	});

	it("pe modul sistem ambele meta-uri rămân pe interogarea lor de mediu", () => {
		expect(themeColorMedia("system")).toEqual({
			light: "(prefers-color-scheme: light)",
			dark: "(prefers-color-scheme: dark)",
		});
	});

	// O alegere explicită trebuie să coloreze ȘI bara browserului, care altfel s-ar lua după
	// sistem. Exact un meta rămâne activ — „not all" nu se potrivește niciodată.
	it("o alegere explicită lasă activ exact un meta", () => {
		expect(themeColorMedia("light")).toEqual({ light: "all", dark: "not all" });
		expect(themeColorMedia("dark")).toEqual({ light: "not all", dark: "all" });
	});
});

describe("noFlashScript", () => {
	// Rulează inline, înainte de pictare. Dacă aruncă, pagina rămâne fără temă — de aia
	// totul stă într-un try/catch, iar localStorage poate arunca la simpla citire (modul privat).
	it("e învelit în try/catch și nu se bazează pe existența lui matchMedia", () => {
		expect(noFlashScript).toContain("try{");
		expect(noFlashScript).toContain("catch(e){}");
		expect(noFlashScript).toContain("window.matchMedia&&");
	});

	it("nu forțează nimic când nu e nimic stocat", () => {
		expect(noFlashScript).toContain("t!=='light'&&m");
	});

	// Rulează într-un DOM fals, ca să prindem o greșeală de sintaxă sau de logică — un script
	// inline stricat nu dă niciun semn, doar lasă pagina pe tema greșită.
	function ruleaza(stocat: string | null, sistemIntunecat: boolean) {
		const clase = new Set<string>();
		const metas = [
			{ media: "(prefers-color-scheme: light)" },
			{ media: "(prefers-color-scheme: dark)" },
		];
		const fals = {
			localStorage: { getItem: () => stocat },
			window: { matchMedia: () => ({ matches: sistemIntunecat }) },
			document: {
				documentElement: { classList: { add: (c: string) => clase.add(c) } },
				head: { querySelectorAll: () => metas },
			},
		};
		new Function("localStorage", "window", "document", noFlashScript)(
			fals.localStorage,
			fals.window,
			fals.document,
		);
		return { intunecat: clase.has("dark"), metas };
	}

	it("fără nimic stocat urmează sistemul și nu atinge meta-urile", () => {
		const a = ruleaza(null, true);
		expect(a.intunecat).toBe(true);
		expect(a.metas[0].media).toBe("(prefers-color-scheme: light)");
		expect(ruleaza(null, false).intunecat).toBe(false);
	});

	it("alegerea explicită bate sistemul, inclusiv pentru bara browserului", () => {
		const luminos = ruleaza("light", true);
		expect(luminos.intunecat).toBe(false);
		expect(luminos.metas[0].media).toBe("all");
		expect(luminos.metas[1].media).toBe("not all");

		const intunecat = ruleaza("dark", false);
		expect(intunecat.intunecat).toBe(true);
		expect(intunecat.metas[0].media).toBe("not all");
		expect(intunecat.metas[1].media).toBe("all");
	});

	it("nu cade dacă localStorage aruncă (mod privat)", () => {
		expect(() =>
			new Function("localStorage", noFlashScript)({
				getItem() {
					throw new Error("blocat");
				},
			}),
		).not.toThrow();
	});
});
