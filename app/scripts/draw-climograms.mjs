// Redesenează graficul din panourile de vegetație ale galeriei „Zonele
// biogeografice". Panourile vin generate cu AI: fotografia din stânga e bună,
// dar graficul din dreapta e doar un desen — coloanele și curba nu vin din
// date, iar cele două axe verticale n-au valori. Scriptul păstrează rama,
// iconițele și inițialele lunilor, șterge interiorul graficului și îl
// redesenează din seriile reale (content/games/gen/climate-data.mjs), cu
// temperatura (°C) etichetată la stânga și precipitațiile (mm) la dreapta.
//
// Usage: node scripts/draw-climograms.mjs <dir-surse> <dir-ieșire> <harta.json>
//   harta.json: { "nume-fișier-sursă": "cheie-zonă", ... }
import sharp from "sharp";
import { readFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import { ZONES } from "../../content/games/gen/climate-data.mjs";

const [SRC, OUT, MAPF] = process.argv.slice(2);
if (!SRC || !OUT || !MAPF) { console.error("Usage: node scripts/draw-climograms.mjs <src> <out> <map.json>"); process.exit(1); }
mkdirSync(OUT, { recursive: true });
const MAP = JSON.parse(readFileSync(MAPF, "utf8"));

// caseta graficului, identică în toate panourile (2816x1536)
// Caseta veche a grilei e y 324..1281; o ștergem de la 318 și desenăm graficul
// nou puțin mai jos (368), ca eticheta de sus a axei mm să nu cadă peste
// norișorul din colțul din dreapta-sus (x 2565..2662, y 243..344).
const PX0 = 1700, PX1 = 2551, PY0 = 368, PY1 = 1281, ERASE_Y0 = 300;
const TMIN = -40, TMAX = 40, BANDS = 8;
const MONTHS = ["I", "F", "M", "A", "M", "I", "I", "A", "S", "O", "N", "D"];
const AZURE = "#4a86c8", TERRA = "#c0392b", GRID = "#ded7c9", INK = "#8a8071";
const PMAX = [40, 80, 160, 240, 320, 480, 800];

const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;");

for (const [file, key] of Object.entries(MAP)) {
	const z = ZONES[key];
	if (!z) throw new Error(`Zonă necunoscută: ${key}`);
	const src = join(SRC, file);
	const meta = await sharp(src).metadata();
	const { width: W, height: H } = meta;

	// fundalul cardului: culoarea dominantă din interiorul graficului
	// eșantionul se ia din imaginea reală, deci coordonatele se scalează
	const k = W / 2816, sc = (v) => Math.round(v * k);
	const { data, info } = await sharp(src).extract({ left: sc(PX0 + 4), top: sc(ERASE_Y0 + 6), width: sc(PX1 - PX0 - 8), height: sc(PY1 - ERASE_Y0 - 12) }).removeAlpha().raw().toBuffer({ resolveWithObject: true });
	const cnt = new Map();
	for (let i = 0; i < data.length; i += info.channels * 7) {
		const k = `${data[i] >> 2},${data[i + 1] >> 2},${data[i + 2] >> 2}`;
		cnt.set(k, (cnt.get(k) || 0) + 1);
	}
	const [rk] = [...cnt.entries()].sort((a, b) => b[1] - a[1])[0];
	const bg = rk.split(",").map((v) => (Number(v) << 2) + 2);
	const BG = `rgb(${bg.join(",")})`;

	const pmax = PMAX.find((v) => v >= Math.max(...z.p)) ?? 800;
	const pStep = pmax / BANDS, tStep = (TMAX - TMIN) / BANDS;
	const PW = PX1 - PX0, PH = PY1 - PY0;
	const colX = (i) => PX0 + (PW * (i + 0.5)) / 12;
	const tY = (v) => PY1 - PH * ((v - TMIN) / (TMAX - TMIN));
	const pY = (v) => PY1 - PH * (v / pmax);

	// Coordonatele de mai sus sunt în spațiul panourilor originale (2816x1536).
	// `viewBox` lasă randorul să le scaleze singur, deci scriptul merge la fel
	// și pe panourile deja publicate în galerie (1600x873, același raport).
	let s = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 2816 1536" font-family="Arial, Helvetica, sans-serif">`;
	// ștergem puțin în afara casetei: vechea curbă roșie și barele depășeau ușor
	// marginile. La stânga ne oprim înainte de termometru (x≤1583), la dreapta
	// înainte de norișor (x≥2565).
	s += `<rect x="${PX0 - 22}" y="${ERASE_Y0}" width="${PW + 30}" height="${PY1 - ERASE_Y0 + 2}" fill="${BG}"/>`;
	// a doua ștergere: etichetele mm din dreapta. Sunt în afara casetei, iar
	// dacă panoul a mai fost desenat o dată (alt pmax), cifrele vechi rămân
	// dedesubt. Începem sub norișor (y≥348, el se termină la 344).
	s += `<rect x="${PX1 + 8}" y="${PY0 - 20}" width="110" height="${PY1 - PY0 + 80}" fill="${BG}"/>`;
	// grilă
	for (let b = 0; b <= BANDS; b++) {
		const y = PY0 + (PH * b) / BANDS;
		s += `<line x1="${PX0}" y1="${y.toFixed(1)}" x2="${PX1}" y2="${y.toFixed(1)}" stroke="${GRID}" stroke-width="2"/>`;
	}
	for (let i = 0; i <= 12; i++) {
		const x = PX0 + (PW * i) / 12;
		s += `<line x1="${x.toFixed(1)}" y1="${PY0}" x2="${x.toFixed(1)}" y2="${PY1}" stroke="${GRID}" stroke-width="2"/>`;
	}
	// bare precipitații
	const bw = (PW / 12) * 0.62;
	for (let i = 0; i < 12; i++) {
		const y = pY(z.p[i]);
		s += `<rect x="${(colX(i) - bw / 2).toFixed(1)}" y="${y.toFixed(1)}" width="${bw.toFixed(1)}" height="${Math.max(0, PY1 - y).toFixed(1)}" fill="${AZURE}" opacity="0.9"/>`;
	}
	// linia temperaturii
	s += `<polyline points="${z.t.map((v, i) => `${colX(i).toFixed(1)},${tY(v).toFixed(1)}`).join(" ")}" fill="none" stroke="${TERRA}" stroke-width="6" stroke-linejoin="round" stroke-linecap="round"/>`;
	for (let i = 0; i < 12; i++) s += `<circle cx="${colX(i).toFixed(1)}" cy="${tY(z.t[i]).toFixed(1)}" r="7" fill="${TERRA}"/>`;
	// axa stângă: °C   |   axa dreaptă: mm
	for (let b = 0; b <= BANDS; b++) {
		const y = PY0 + (PH * b) / BANDS;
		const tv = Math.round(TMAX - b * tStep), pv = Math.round(pmax - b * pStep);
		s += `<text x="${PX0 - 16}" y="${(y + 13).toFixed(1)}" font-size="36" fill="${TERRA}" text-anchor="end">${tv}</text>`;
		s += `<text x="${PX1 + 16}" y="${(y + 13).toFixed(1)}" font-size="36" fill="${AZURE}" text-anchor="start">${pv}</text>`;
	}
	s += `<text x="${PX0 - 16}" y="${(PY1 + 46).toFixed(1)}" font-size="34" font-weight="bold" fill="${TERRA}" text-anchor="end">°C</text>`;
	s += `<text x="${PX1 + 16}" y="${(PY1 + 46).toFixed(1)}" font-size="34" font-weight="bold" fill="${AZURE}" text-anchor="start">mm</text>`;
	s += `<text x="${((PX0 + PX1) / 2).toFixed(1)}" y="${(PY0 - 28).toFixed(1)}" font-size="34" fill="${INK}" text-anchor="middle">${esc(z.title)} (${esc(z.ref)})</text>`;
	s += `</svg>`;

	const out = join(OUT, file.replace(/\.[^.]+$/, "") + ".png");
	await sharp(src).composite([{ input: Buffer.from(s), top: 0, left: 0 }]).png().toFile(out);
	console.log(`${file.padEnd(36)} ${key.padEnd(20)} pmax=${pmax}mm  ${z.ref}`);
}
