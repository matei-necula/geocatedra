// Generează 9 climograme SVG (bare albastre = precipitații mm, linie
// teracotă = temperaturi °C). Date proprii (CC0). Rulează:
//   node content/games/gen/climograms.mjs [dir=content/games/clima-harta]
// apoi rasterizează: node app/scripts/rasterize.mjs <dir> 1000
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const OUT = process.argv[2] || "content/games/clima-harta";
mkdirSync(OUT, { recursive: true });

// Datele stau în climate-data.mjs (sursă unică, folosită și de galeria
// „Zonele biogeografice"). Jocul folosește doar aceste 9 zone.
import { ZONES as ALL } from "./climate-data.mjs";
const KEYS = ["ecuatorial","subecuatorial","tropical-uscat","musonic","mediteranean","temperat-oceanic","temperat-continental","subpolar","polar"];
const ZONES = Object.fromEntries(KEYS.map((k) => [k, ALL[k]]));

const MONTHS = ["I", "F", "M", "A", "M", "I", "I", "A", "S", "O", "N", "D"];
const W = 500, H = 400;
const L = 48, R = 52, TOP = 46, BOT = 42; // margini
const PW = W - L - R, PH = H - TOP - BOT; // zona de plot
const TMIN = -40, TMAX = 40;
const AZURE = "#2a6f97", TERRA = "#e07a5f", INK = "#22333b", GRID = "#d8d2c4";

const tempY = (v) => TOP + PH * (1 - (v - TMIN) / (TMAX - TMIN));
const precY = (v, pmax) => TOP + PH * (1 - v / pmax);
const monthX = (i) => L + PW * ((i + 0.5) / 12);

function svg(z) {
	const pmax = z.p.some((v) => v > 320) ? 750 : 320;
	const bw = (PW / 12) * 0.6;
	let s = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" font-family="Arial, sans-serif">`;
	s += `<rect width="${W}" height="${H}" fill="#ffffff"/>`;
	s += `<text x="${W / 2}" y="28" font-size="20" font-weight="bold" fill="${INK}" text-anchor="middle">${z.title}</text>`;

	// linii de grilă + etichete temperatură (stânga) la fiecare 10°
	for (let v = TMIN; v <= TMAX; v += 10) {
		const y = tempY(v);
		s += `<line x1="${L}" y1="${y.toFixed(1)}" x2="${L + PW}" y2="${y.toFixed(1)}" stroke="${GRID}" stroke-width="1"/>`;
		s += `<text x="${L - 6}" y="${(y + 4).toFixed(1)}" font-size="11" fill="${TERRA}" text-anchor="end">${v}</text>`;
	}
	// etichete precipitații (dreapta)
	const step = pmax / 4;
	for (let v = 0; v <= pmax; v += step) {
		const y = precY(v, pmax);
		s += `<text x="${L + PW + 6}" y="${(y + 4).toFixed(1)}" font-size="11" fill="${AZURE}" text-anchor="start">${v}</text>`;
	}

	// bare precipitații
	for (let i = 0; i < 12; i++) {
		const x = monthX(i) - bw / 2;
		const y = precY(z.p[i], pmax);
		const h = TOP + PH - y;
		s += `<rect x="${x.toFixed(1)}" y="${y.toFixed(1)}" width="${bw.toFixed(1)}" height="${Math.max(0, h).toFixed(1)}" fill="${AZURE}" opacity="0.85"/>`;
	}
	// linie temperatură
	const pts = z.t.map((v, i) => `${monthX(i).toFixed(1)},${tempY(v).toFixed(1)}`).join(" ");
	s += `<polyline points="${pts}" fill="none" stroke="${TERRA}" stroke-width="3" stroke-linejoin="round" stroke-linecap="round"/>`;
	for (let i = 0; i < 12; i++) {
		s += `<circle cx="${monthX(i).toFixed(1)}" cy="${tempY(z.t[i]).toFixed(1)}" r="3" fill="${TERRA}"/>`;
	}

	// axa lunilor
	s += `<line x1="${L}" y1="${TOP + PH}" x2="${L + PW}" y2="${TOP + PH}" stroke="${INK}" stroke-width="1.5"/>`;
	for (let i = 0; i < 12; i++) {
		s += `<text x="${monthX(i).toFixed(1)}" y="${TOP + PH + 18}" font-size="12" fill="${INK}" text-anchor="middle">${MONTHS[i]}</text>`;
	}
	// legende mici
	s += `<text x="${L}" y="${H - 6}" font-size="11" fill="${TERRA}">— temperatura (°C)</text>`;
	s += `<text x="${L + PW}" y="${H - 6}" font-size="11" fill="${AZURE}" text-anchor="end">▮ precipitații (mm)</text>`;
	s += `</svg>`;
	return s;
}

for (const [slug, z] of Object.entries(ZONES)) {
	const file = join(OUT, `climograma-${slug}.svg`);
	writeFileSync(file, svg(z), "utf8");
	console.log(`climograma-${slug}.svg`);
}
console.log(`\n${Object.keys(ZONES).length} climograme în ${OUT}`);
