import { useCallback, useEffect, useState } from "react";
import {
	applyTheme,
	nextThemePref,
	readThemePref,
	writeThemePref,
	type ThemePref,
} from "../lib/theme";

/**
 * Comutatorul de temă: UN singur buton în bara de sus, dar TREI stări.
 *
 * Varianta cu două stări era o ușă cu sens unic — prima apăsare scria „light"/„dark" în
 * localStorage, iar `noFlashScript` nu mai asculta niciodată sistemul. Vizitatorul nu mai
 * avea cum să se întoarcă la „ca telefonul", iar telefonul care trece pe întunecat la apus
 * lăsa fila deschisă pe luminos. Ciclul e acum sistem → luminos → întunecat → sistem, iar
 * cât timp preferința e „sistem" ascultăm schimbarea și o aplicăm pe loc.
 *
 * Logica stă în `lib/theme.ts` (pură, testată); aici rămân doar DOM-ul și eticheta.
 */

const ICON: Record<ThemePref, string> = {
	// „◐" = urmează sistemul, „☀" = luminos fixat, „☾" = întunecat fixat.
	system: "◐",
	light: "☀",
	dark: "☾",
};

// Eticheta spune DOUĂ lucruri: în ce stare e butonul acum și ce face următoarea apăsare.
// Fără prima parte, un cititor de ecran n-are cum să afle pe ce temă e pagina; fără a doua,
// nimeni n-ar bănui că butonul are trei stări, nu două.
const ETICHETA: Record<ThemePref, string> = {
	system: "Tema urmează setarea dispozitivului. Apasă pentru tema luminoasă.",
	light: "Tema este luminoasă. Apasă pentru tema întunecată.",
	dark: "Tema este întunecată. Apasă pentru a urma din nou setarea dispozitivului.",
};

/** Tooltipul de mouse: doar starea, pe scurt. */
const TITLU: Record<ThemePref, string> = {
	system: "Temă: ca dispozitivul",
	light: "Temă: luminoasă",
	dark: "Temă: întunecată",
};

function systemPrefersDark(): boolean {
	return typeof window !== "undefined" && !!window.matchMedia
		? window.matchMedia("(prefers-color-scheme: dark)").matches
		: false;
}

export function ThemeToggle() {
	const [pref, setPref] = useState<ThemePref>("system");
	// Serverul nu știe ce e în localStorage-ul vizitatorului. Prima randare de pe client
	// trebuie să fie identică cu cea de pe server (altfel hidratarea se plânge), deci
	// pictograma reală apare abia după montare. Trucul e vechi — nu-l pierde.
	const [mounted, setMounted] = useState(false);

	useEffect(() => {
		setMounted(true);
		setPref(readThemePref());
	}, []);

	// Sistemul se poate schimba sub noi (apus, buton de economisire a bateriei). Ascultăm
	// mereu, dar reacționăm DOAR pe „sistem": o alegere explicită nu are voie să fie
	// suprascrisă de telefon.
	useEffect(() => {
		if (typeof window === "undefined" || !window.matchMedia) return;
		const mq = window.matchMedia("(prefers-color-scheme: dark)");
		const onChange = (e: MediaQueryListEvent) => {
			if (pref === "system") applyTheme("system", e.matches);
		};
		mq.addEventListener("change", onChange);
		return () => mq.removeEventListener("change", onChange);
	}, [pref]);

	const toggle = useCallback(() => {
		const next = nextThemePref(pref);
		setPref(next);
		writeThemePref(next);
		applyTheme(next, systemPrefersDark());
	}, [pref]);

	// Înainte de montare arătăm starea implicită („ca sistemul"), aceeași pe server și pe
	// client. Eticheta o însoțește, ca să nu difere niciun atribut la hidratare.
	const afisat: ThemePref = mounted ? pref : "system";

	return (
		<button
			type="button"
			onClick={toggle}
			aria-label={ETICHETA[afisat]}
			title={TITLU[afisat]}
			className="grid h-9 w-9 place-items-center rounded-lg border border-border text-muted transition hover:text-ink"
		>
			{/* Starea curentă e în `aria-label`; pictograma e decor, deci ascunsă de cititorul
			    de ecran. `aria-pressed` ar minți: butonul nu e o bifă cu două stări. */}
			<span aria-hidden>{ICON[afisat]}</span>
		</button>
	);
}
