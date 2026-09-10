import type { MaterialTypeDef } from "../config/types";
import { subjectConfig } from "../config/subject";

/**
 * Ilustrația de pe cardurile fără fotografie.
 *
 * Aproape jumătate din materialele elevilor n-au nicio imagine (toate lecțiile scrise și
 * grilele/matricele din jocuri). Rezerva de până acum era inițiala titlului, mare și palidă —
 * o grilă de litere, în care nimic nu spune ce fel de material e cardul. Aici stau cele două
 * decizii pure din spatele ilustrației care o înlocuiește:
 *
 *   - **motivul** (pictograma) spune TIPUL materialului — carte, busolă, bifă…
 *   - **nuanța** spune CAPITOLUL — toate cardurile unei teme împart o culoare, deci grila
 *     se citește pe secțiuni, ca un atlas.
 *
 * Amândouă sunt funcții pure și deterministe. Determinismul nu e cochetărie: componenta se
 * randează și pe server, și pe client, iar o alegere aleatoare ar da hydration mismatch —
 * aceeași capcană evitată la amestecarea jocurilor.
 */

/** Motivele pe care le desenează motorul. Nume generice, fără nicio urmă de geografie. */
export const MOTIFS = ["book", "compass", "check", "camera", "film", "layers", "clip", "spark", "question"] as const;
export type MotifKey = (typeof MOTIFS)[number];

/** Nuanțele disponibile. Șase, ca să nu se repete în același ecran de capitole. */
export const ART_HUES = ["sky", "violet", "emerald", "amber", "rose", "teal"] as const;
export type ArtHue = (typeof ART_HUES)[number];

/**
 * Clasele Tailwind ale fiecărei nuanțe, scrise ÎNTREGI.
 *
 * Tailwind scanează sursa după șiruri literale, deci `text-${hue}-600` n-ar genera niciodată
 * utilitarul și ilustrațiile ar ieși toate în culoarea textului. Tiparul cu `dark:` e cel din
 * `TopicMindMap` — singura formă din proiect care ține și pe paleta Mediteran, și pe Cobalt,
 * în luminos și în întunecat.
 */
export const HUE_CLASS: Record<ArtHue, string> = {
	sky: "text-sky-600 dark:text-sky-300",
	violet: "text-violet-600 dark:text-violet-300",
	emerald: "text-emerald-600 dark:text-emerald-300",
	amber: "text-amber-600 dark:text-amber-300",
	rose: "text-rose-600 dark:text-rose-300",
	teal: "text-teal-600 dark:text-teal-300",
};

/**
 * Cele patru categorii care nu mai iau nuanța capitolului, ci una FIXĂ — cerință explicită:
 * tipul de conținut trebuie recunoscut instant, de la distanță, prin culoare. Restul tipurilor
 * (video, examen, prezentare, fișier, aplicație interactivă) rămân pe `artHue(seed)`.
 *
 * Fundalul e o tentă pastelată solidă (nu washul translucid peste crem al cardurilor pe
 * nuanță de capitol), iar pictograma stă într-un ton mai închis, mediu-saturat din aceeași
 * familie — nu doar `currentColor` la opacitate mică. Culorile sunt ALESE ca să cadă pe
 * aceleași clase deja folosite de `TypeChip` pentru joc/foto (vezi `COMBOS` din
 * `TypeChip.tsx`), ca eticheta și ilustrația cardului să spună aceeași culoare.
 */
export const CATEGORY_BG_CLASS: Record<string, string> = {
	scris: "bg-primary/12",
	foto: "bg-violet-100 dark:bg-violet-950/60",
	joc: "bg-emerald-100 dark:bg-emerald-950/60",
	question: "bg-rose-100 dark:bg-rose-950/60",
};

export const CATEGORY_ICON_CLASS: Record<string, string> = {
	scris: "text-primary",
	foto: "text-violet-700 dark:text-violet-300",
	joc: "text-emerald-700 dark:text-emerald-300",
	question: "text-red-700 dark:text-red-300",
};

/**
 * Fotografia fixă a fiecărei categorii cu culoare fixă — cerință explicită: cardurile celor
 * patru categorii arată o fotografie reprezentativă (nu pictograma vectorială), fără nicio
 * siglă suprapusă în colț. O singură fotografie per categorie, aceeași pe toate cardurile ei
 * (spre deosebire de `artVariant`, care variază terenul vectorial per material) — vezi
 * proveniența în `content/site/SOURCES-carduri.md`. Numele sunt baza de fișier din
 * `public/img/`, fără lățime și fără extensie (le rezolvă `CardArt` la fel ca `Photo`).
 */
export const CATEGORY_PHOTO: Record<string, string> = {
	scris: "card-scris",
	foto: "card-foto",
	joc: "card-joc",
	question: "card-question",
};

/** Cheia categoriei cu culoare fixă, sau `null` dacă tipul/motivul rămâne pe nuanța capitolului. */
export function fixedCategory(type?: string, motif?: MotifKey): keyof typeof CATEGORY_BG_CLASS | null {
	if (motif === "question") return "question";
	if (type === "scris" || type === "foto" || type === "joc") return type;
	return null;
}

function isMotif(v: unknown): v is MotifKey {
	return typeof v === "string" && (MOTIFS as readonly string[]).includes(v);
}

/**
 * Motivul unui tip de material.
 *
 * Maparea tip → motiv stă în `subject.config` (câmpul `art`), nu aici: motorul cunoaște
 * forme generice, iar instanța decide că „lecția scrisă" e o carte. Fără `art`, cade pe
 * poziția tipului în config — exact regula după care `TypeChip` alege culorile, deci un
 * subiect nou capătă ilustrații coerente fără să configureze nimic.
 */
export function artMotif(type: string, types: MaterialTypeDef[] = subjectConfig.materialTypes): MotifKey {
	const idx = types.findIndex((m) => m.key === type);
	const declared = idx >= 0 ? types[idx].art : undefined;
	if (isMotif(declared)) return declared;
	return MOTIFS[(idx < 0 ? 0 : idx) % MOTIFS.length];
}

/**
 * FNV-1a pe 32 de biți. Ales pentru că împrăștie bine șiruri scurte și asemănătoare între ele
 * (`relieful-terrei` / `relieful-romaniei`), ceea ce o sumă de coduri de caractere nu face —
 * aia ar aduna slug-urile aceluiași capitol pe aceeași nuanță.
 */
export function hueIndex(seed: string): number {
	let h = 0x811c9dc5;
	for (let i = 0; i < seed.length; i++) {
		h ^= seed.charCodeAt(i);
		h = Math.imul(h, 0x01000193);
	}
	return (h >>> 0) % ART_HUES.length;
}

/** Nuanța unei teme (sau a oricărei alte semințe stabile). */
export function artHue(seed: string): ArtHue {
	return ART_HUES[hueIndex(seed)];
}

/** Câte variante de teren desenează componenta. */
export const ART_VARIANTS = 4;

/**
 * Varianta de teren a unui card — care curbe de nivel și pe ce diagonală cade degradeul.
 *
 * Fără ea, două jocuri din același capitol ieșeau identice pixel cu pixel: aceeași nuanță
 * (capitolul), aceeași pictogramă (tipul), același desen. Trei carduri gemene la rând
 * arătau mai degrabă a eroare de randare decât a ilustrație. Sămânța e slug-ul
 * materialului, deci varianta nu se schimbă între randări și nici între SSR și client.
 *
 * Sarea („v:") separă distribuția de cea a nuanței: cu aceeași sămânță neschimbată, FNV-1a
 * ar lega varianta de nuanță, iar capitolele ar primi sistematic aceleași perechi.
 */
export function artVariant(seed: string): number {
	let h = 0x811c9dc5;
	const salted = `v:${seed}`;
	for (let i = 0; i < salted.length; i++) {
		h ^= salted.charCodeAt(i);
		h = Math.imul(h, 0x01000193);
	}
	return (h >>> 0) % ART_VARIANTS;
}
