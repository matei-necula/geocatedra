// Filigran per-sesiune.
//
// Ce NU face: nu împiedică nici captura de ecran, nici fotografia făcută cu telefonul.
// Niciun site din lume nu poate face asta (vezi docs/04-anti-piracy.md).
//
// Ce face: pune pe fiecare pagină livrată codul sesiunii elevului. Dacă un material ajunge
// pe un grup sau pe un site străin, codul din poză spune DIN CE CLASĂ a plecat — iar de acolo
// tokenul acelei clase poate fi regenerat într-un clic.
//
// Două straturi, cu roluri diferite:
//  1. plasa înclinată, repetată peste toată suprafața — ca să nu poți tăia colțul și gata;
//     e discretă, deci supraviețuiește doar la o captură necomprimată.
//  2. ștampila din colț — mică, dar CHIAR lizibilă. Ea e cea care rezistă la o poză de
//     telefon reîncărcată de trei ori pe WhatsApp, adică exact drumul pe care circulă
//     materialele scurse.

import { createContext, useContext, type ReactNode } from "react";
import { subjectConfig } from "../config/subject";

/**
 * Filigranul trebuie să apară și în vizualizarea pe tot ecranul (`Lightbox`), care
 * se randează cu `createPortal` în `document.body` — deci filigranul de pagină,
 * fiind un frate în DOM al conținutului din `<Plate>`, NU o acoperă.
 *
 * Contextul React trece însă prin portaluri, chiar dacă moștenirea CSS nu trece.
 * Așa că pagina anunță o singură dată cine se uită, iar `Lightbox` își pune singur
 * filigranul — fără să pasăm proprietăți prin `MaterialRenderer`/`Attachments`.
 */
export interface WatermarkInfo {
	code: string;
}

const WatermarkContext = createContext<WatermarkInfo | null>(null);

export function WatermarkProvider({ value, children }: { value: WatermarkInfo | null; children: ReactNode }) {
	return <WatermarkContext.Provider value={value}>{children}</WatermarkContext.Provider>;
}

/** Filigranul sesiunii curente, sau `null` pentru admin/previzualizare. */
export function useWatermark(): WatermarkInfo | null {
	return useContext(WatermarkContext);
}

const TILE_ROWS = 14;
const TILE_REPEAT = 10;

export function Watermark({
	code,
	className = "",
}: {
	code: string;
	/** Extra clase pentru containerul filigranului (ex. la vizualizarea pe tot ecranul). */
	className?: string;
}) {
	// Marca vine dintr-o singură sursă — numele site-ului din `subject.config` —
	// ca niciun apelant să nu poată scrie altceva pe filigran. Partea care
	// spune DIN CE sesiune a plecat un material rămâne codul de după punct.
	const text = `${subjectConfig.siteName} · ${code}`;
	const rows = Array.from({ length: TILE_ROWS });
	return (
		<div
			aria-hidden
			data-wm={code}
			className={`cat-wm pointer-events-none absolute inset-0 z-10 overflow-hidden select-none ${className}`}
		>
			{/* Depășește containerul (inset negativ) ca rotația să nu lase colțuri goale. */}
			<div className="absolute inset-[-30%] flex flex-col justify-around opacity-[0.07]">
				{rows.map((_, i) => (
					<div
						key={i}
						className="-rotate-[24deg] text-center font-semibold whitespace-nowrap text-ink"
						style={{ fontSize: 13, letterSpacing: 2, textShadow: "0 1px 0 rgba(255,255,255,0.6)" }}
					>
						{`${text}    `.repeat(TILE_REPEAT)}
					</div>
				))}
			</div>
			<span
				className="cat-wm-stamp absolute right-1.5 bottom-1.5 rounded px-1.5 py-0.5 font-mono tracking-wider"
				style={{ fontSize: 10 }}
			>
				{text}
			</span>
		</div>
	);
}
