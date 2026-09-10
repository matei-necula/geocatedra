import { useId } from "react";
import {
	artHue,
	artMotif,
	ART_VARIANTS,
	artVariant,
	type ArtHue,
	CATEGORY_BG_CLASS,
	CATEGORY_ICON_CLASS,
	CATEGORY_PHOTO,
	fixedCategory,
	HUE_CLASS,
	type MotifKey,
} from "../lib/card-art";

/**
 * Ilustrația cardurilor fără fotografie proprie.
 *
 * Cele patru categorii cu culoare fixă (`scris`/`foto`/`joc`/`question`, vezi `fixedCategory`)
 * arată o fotografie fixă reprezentativă a categoriei (`CATEGORY_PHOTO`) — fără nicio siglă
 * suprapusă, tipul se citește deja din `TypeChip`, alături de card. Restul tipurilor rămân pe
 * ilustrația vectorială de teren, în trei straturi, toate în `currentColor`: un degrade
 * discret, o textură de curbe de nivel (limbajul „atlas" al sitului) și pictograma tipului de
 * material. Culoarea intră o singură dată, ca text-color pe înveliș — de acolo o moștenesc și
 * degradeul, și textura, și glifa.
 *
 * De ce `currentColor` peste tot și nicio culoare scrisă în SVG: paleta se schimbă în patru
 * feluri (Mediteran / Cobalt × luminos / întunecat), iar jetoanele temei sunt variabile CSS.
 * O culoare literală în SVG ar fi corectă exact într-una din cele patru combinații.
 *
 * De ce `useId`: id-urile de SVG sunt globale pe document. Cu ~35 de carduri pe `/elevi`,
 * un id fix ar face ca toate să trimită la PRIMUL degrade din pagină — iar `currentColor`
 * dintr-un `<stop>` se rezolvă după culoarea moștenită de gradient, nu după cea a
 * dreptunghiului care îl folosește. Toate cardurile ar ieși în nuanța primului capitol.
 */

/** Pictogramele. Grilă 24×24, `currentColor` peste tot (linii + umpluturi punctuale pentru
 * accente solide — soare, scântei, flacără, vârf de pană).
 *
 * `book`, `compass`, `camera` și `question` sunt versiunile „bogate" ale celor patru categorii
 * cu culoare fixă (vezi `fixedCategory` din `lib/card-art.ts`), calchiate după un set de
 * pictograme de referință: carte deschisă + pană + soare, cameră + soare în obiectiv + scântei,
 * busolă cu N/S/E/V + soare + avion de hârtie, tăbliță + semn de întrebare + lampă. Restul
 * motivelor rămân în stilul minimalist de dinainte. */
const GLYPH: Record<MotifKey, React.ReactNode> = {
	book: (
		<>
			<g opacity=".85" strokeWidth="1.1">
				<circle cx="15.6" cy="4.6" r="1.6" />
				<path d="M15.6 1.3v1M15.6 6.9v1M12.3 4.6h1M17.9 4.6h1M13.2 2.3l.7.7M17.2 2.3l-.7.7M13.2 6.9l.7-.7M17.2 6.9l-.7-.7" />
			</g>
			<path d="M12 11.6c-1.8-1.55-4.3-2.1-6.75-2.1a.8.8 0 0 0-.8.8v9.5c0 .45.35.8.8.8 2.45 0 4.95.55 6.75 2.1 1.8-1.55 4.3-2.1 6.75-2.1.45 0 .8-.35.8-.8v-9.5a.8.8 0 0 0-.8-.8c-2.45 0-4.95.55-6.75 2.1Z" />
			<path d="M12 11.6v11.1" />
			<path
				opacity=".55"
				d="M6.7 13.3h3.5M6.7 15.7h3.5M6.7 18.1h2.7M13.8 13.3h3.5M13.8 15.7h3.5M13.8 18.1h2.7"
			/>
			<path
				d="M10.7 13.9C11.6 12.5 13.3 10.6 15.1 8.8 17 6.9 18.6 5.3 19.6 3.9c.25 1.25-.3 3.15-1.6 5.15-1.4 2.05-3.3 4-5.05 5.35-.85.65-1.7.15-2.25-.5Z"
				strokeWidth="1.3"
			/>
			<path d="M11.3 13.4 19 4.6" strokeWidth="1" opacity=".8" />
		</>
	),
	compass: (
		<>
			<circle cx="12" cy="12" r="7.2" />
			<circle cx="12" cy="12" r=".9" fill="currentColor" stroke="none" />
			<path d="M12 6.3 13.1 10.8 12 12 10.9 10.8Z" fill="currentColor" />
			<path d="M12 17.7 10.9 13.2 12 12 13.1 13.2Z" fill="currentColor" opacity=".55" />
			<path d="M4.8 12 9.3 10.9 12 12 9.3 13.1Z" fill="currentColor" opacity=".55" />
			<path d="M19.2 12 14.7 13.1 12 12 14.7 10.9Z" fill="currentColor" opacity=".55" />
			<g stroke="none" fill="currentColor" fontFamily="ui-sans-serif,system-ui,sans-serif" fontWeight="700" fontSize="2.6" textAnchor="middle">
				<text x="12" y="2.9">N</text>
				<text x="12" y="21.9">S</text>
				<text x="2.5" y="12.9">V</text>
				<text x="21.5" y="12.9">E</text>
			</g>
			<g opacity=".9" strokeWidth="1">
				<circle cx="4.6" cy="4.4" r="1.25" />
				<path d="M4.6 1.8v.9M4.6 6.1v.9M2 4.4h.9M6.3 4.4h.9M2.85 2.65l.65.65M5.7 5.5l.65.65M2.85 6.15l.65-.65M5.7 3.3l.65-.65" />
			</g>
			<path d="M17 17 22.4 19.5 19.6 20.1 19 22.8Z" fill="currentColor" stroke="none" />
			<path d="M17 17 19.7 19.7" strokeWidth="1" />
		</>
	),
	check: (
		<>
			<path d="M9 4.6H7.2a1.7 1.7 0 0 0-1.7 1.7v12.5c0 .94.76 1.7 1.7 1.7h9.6c.94 0 1.7-.76 1.7-1.7V6.3A1.7 1.7 0 0 0 16.8 4.6H15" />
			<path d="M9.7 2.9h4.6a.8.8 0 0 1 .8.8v1.7a.8.8 0 0 1-.8.8H9.7a.8.8 0 0 1-.8-.8V3.7a.8.8 0 0 1 .8-.8Z" />
			<path d="m8.9 12.9 2.2 2.2 4.1-4.6" />
		</>
	),
	camera: (
		<>
			<path d="M4.4 4.6l.3.65.65.3-.65.3-.3.65-.3-.65-.65-.3.65-.3Z" fill="currentColor" stroke="none" />
			<path d="M19.6 4.6l.3.65.65.3-.65.3-.3.65-.3-.65-.65-.3.65-.3Z" fill="currentColor" stroke="none" />
			<path d="M4.2 7.6h2.9l1.5-2.4h6.8l1.5 2.4h2.9c.88 0 1.6.72 1.6 1.6v8.4c0 .88-.72 1.6-1.6 1.6H4.2a1.6 1.6 0 0 1-1.6-1.6V9.2c0-.88.72-1.6 1.6-1.6Z" />
			<circle cx="12" cy="13.4" r="3.8" />
			<g opacity=".95" strokeWidth="1">
				<circle cx="12" cy="13.4" r="1.2" fill="currentColor" stroke="none" />
				<path d="M12 10.3v.9M12 15.6v.9M8.9 13.4h.9M15.2 13.4h.9M9.9 11.3l.65.65M14.45 15.85l.65.65M9.9 15.5l.65-.65M14.45 10.95l.65-.65" />
			</g>
		</>
	),
	film: (
		<>
			<path d="M3.6 4.8h16.8c.66 0 1.2.54 1.2 1.2v12c0 .66-.54 1.2-1.2 1.2H3.6a1.2 1.2 0 0 1-1.2-1.2V6c0-.66.54-1.2 1.2-1.2Z" />
			<path opacity=".55" d="M6.2 4.8v14.4M17.8 4.8v14.4" />
			<path d="m10.4 9.2 4.6 2.8-4.6 2.8Z" />
		</>
	),
	layers: (
		<>
			<path d="m12 3.2 8.8 4.4-8.8 4.4-8.8-4.4Z" />
			<path d="m3.2 12 8.8 4.4 8.8-4.4" />
			<path opacity=".55" d="m3.2 16.4 8.8 4.4 8.8-4.4" />
		</>
	),
	clip: <path d="M17.6 7.4v8.8a5.6 5.6 0 0 1-11.2 0V6.6a3.6 3.6 0 0 1 7.2 0v9.2a1.6 1.6 0 0 1-3.2 0V7.6" />,
	spark: (
		<>
			<path d="M12 3.6c1 4.9 2.5 7.4 8.4 8.4-5.9 1-7.4 3.5-8.4 8.4-1-4.9-2.5-7.4-8.4-8.4 5.9-1 7.4-3.5 8.4-8.4Z" />
		</>
	),
	question: (
		<>
			<g strokeWidth="1">
				<path d="M2 15.4h4.4a1 1 0 0 1 1 1v3.3a1 1 0 0 1-1 1H2Z" />
				<path opacity=".6" d="M2.9 17h2.6M2.9 18.4h2.6" />
				<circle cx="4.2" cy="19.9" r=".55" fill="currentColor" stroke="none" />
			</g>
			<g strokeWidth="2">
				<path d="M9.5 8.6a2.9 2.9 0 1 1 4.35 2.7c-.9.4-1.25 1.05-1.25 1.95v.5" />
				<circle cx="12.55" cy="17.3" r="1.05" fill="currentColor" stroke="none" />
			</g>
			<g strokeWidth="1">
				<path
					d="M17.9 20.4c0-1.75 1.65-2.85 3.55-2.85s3.55 1.1 3.55 2.85c0 1.85-1.75 2.7-3.55 2.7s-3.55-.85-3.55-2.7Z"
					fill="currentColor"
					opacity=".92"
					stroke="none"
				/>
				<path d="M18.1 19.9 14.6 21.1" strokeWidth="1.3" />
				<path d="M14 20.05c.6.4.6 1.05.05 1.45-.55-.4-.55-1.05-.05-1.45Z" fill="currentColor" stroke="none" />
				<path d="M20.7 17.6c-.15-.75.25-1.35.95-1.7.7.35 1.1.95.95 1.7" />
			</g>
		</>
	),
};

/**
 * Cele patru „terenuri". Diferă prin unde cade lumina (diagonala degradeului) și prin cum
 * urcă curbele de nivel — cât să nu iasă două carduri identice în același capitol, dar nu
 * atât cât să nu se mai vadă că sunt din aceeași familie.
 */
const TERRAIN: { grad: [string, string, string, string]; shift: string }[] = [
	{ grad: ["0", "0", "1", "1"], shift: "" },
	{ grad: ["1", "0", "0", "1"], shift: "translate(400 0) scale(-1 1)" },
	{ grad: ["0", "1", "1", "0"], shift: "translate(-24 -34) scale(1.1 .86)" },
	{ grad: ["1", "1", "0", "0"], shift: "translate(430 22) scale(-1.08 1.05)" },
];

export function CardArt({
	type,
	motif,
	seed,
	hue,
	variant,
	className = "",
}: {
	/** tipul materialului — alege pictograma prin `subject.config` */
	type?: string;
	/** pictogramă impusă, când cardul nu e un material (ex. cardul „Exersează") */
	motif?: MotifKey;
	/** sămânța nuanței: slug-ul temei, ca tot capitolul să iasă în aceeași culoare */
	seed: string;
	/** nuanță impusă, când cardul are deja o identitate cromatică proprie („Exersează" e roz) */
	hue?: ArtHue;
	/** sămânța variantei de teren: slug-ul materialului, ca două carduri din același capitol
	 *  să nu iasă identice. Lipsă → cade pe `seed`. */
	variant?: string;
	className?: string;
}) {
	const uid = useId();
	const wash = `w${uid.replace(/[^a-zA-Z0-9]/g, "")}`;
	const key = motif ?? artMotif(type ?? "");
	const terrain = TERRAIN[artVariant(variant ?? seed) % ART_VARIANTS];

	// Lecție scrisă / fotografii / joc / exersează: culoare FIXĂ pe categorie, nu pe capitol —
	// recunoaștere instantă de la distanță. Restul tipurilor rămân pe nuanța de capitol
	// (`artHue(seed)`), cu fundalul crem translucid de dinainte.
	const category = fixedCategory(type, motif);
	const iconClass = category ? CATEGORY_ICON_CLASS[category] : HUE_CLASS[hue ?? artHue(seed)];
	const bgClass = category ? CATEGORY_BG_CLASS[category] : "bg-bg";
	const photo = category ? CATEGORY_PHOTO[category] : undefined;

	// Cele patru categorii cu culoare fixă arată o fotografie reprezentativă, nu pictograma
	// vectorială — fără nicio siglă suprapusă în colț; tipul se citește deja din `TypeChip`,
	// alături de card. Restul tipurilor rămân pe ilustrația vectorială de teren.
	if (photo) {
		return (
			<div aria-hidden className={`overflow-hidden ${bgClass} ${className}`}>
				<picture>
					<source type="image/avif" srcSet={`/img/${photo}-640.avif`} />
					<img
						src={`/img/${photo}-640.webp`}
						alt=""
						loading="lazy"
						decoding="async"
						className="h-full w-full object-cover"
					/>
				</picture>
			</div>
		);
	}

	return (
		<div aria-hidden className={`overflow-hidden ${iconClass} ${bgClass} ${className}`}>
			<svg viewBox="0 0 400 225" className="h-full w-full" preserveAspectRatio="xMidYMid slice">
				<defs>
					<linearGradient
						id={wash}
						x1={terrain.grad[0]}
						y1={terrain.grad[1]}
						x2={terrain.grad[2]}
						y2={terrain.grad[3]}
					>
						<stop offset="0%" stopColor="currentColor" stopOpacity=".22" />
						<stop offset="55%" stopColor="currentColor" stopOpacity=".10" />
						<stop offset="100%" stopColor="currentColor" stopOpacity=".04" />
					</linearGradient>
				</defs>
				<rect width="400" height="225" fill={`url(#${wash})`} />
				{/* Curbe de nivel — aceeași figură ca fundalul sitului, la o opacitate la care
				    nu concurează cu pictograma. */}
				<g fill="none" stroke="currentColor" strokeWidth="1.5" opacity=".16" transform={terrain.shift}>
					<path d="M-20 168c60-34 108-10 168-40s112-58 176-34" />
					<path d="M-20 196c60-34 108-10 168-40s112-58 176-34" />
					<path d="M-20 224c60-34 108-10 168-40s112-58 176-34" />
					<path d="M-20 84c48-26 92-6 140-30s96-42 152-22" />
				</g>
				<g
					transform="translate(159.2 71.7) scale(3.4)"
					fill="none"
					stroke="currentColor"
					strokeWidth="1.5"
					strokeLinecap="round"
					strokeLinejoin="round"
					opacity=".78"
				>
					{GLYPH[key]}
				</g>
			</svg>
		</div>
	);
}
