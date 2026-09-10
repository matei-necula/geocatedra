// Hidrograful fluviului Congo pentru testul sumativ de Hidrosferă.
//
// Graficul primit avea debitul maxim ~25 000 m³/s în aprilie — sub jumătate din
// realitate — și un singur maxim. Congo are însă un **regim bimodal**: bazinul
// lui e tăiat de Ecuator, așa că primește ploi din două sezoane ploioase
// decalate. De aici două maxime (decembrie, principal; aprilie–mai, secundar)
// și două minime (august, principal; februarie–martie, secundar), cu un debit
// mediu anual de ~41 000 m³/s care nu coboară niciodată sub 30 000 — exact
// argumentul pe care îl cere subiectul.
//
// Valorile sunt mediile lunare multianuale la Kinshasa/Brazzaville, rotunjite
// la mia de m³/s. Stilul (ramă cu colțuri tăiate, bare gri, titlu + subtitlu)
// îl păstrează pe cel al graficului înlocuit, ca pagina să arate la fel.
//
// Usage: node scripts/draw-congo-hidrograf.mjs <out.png> [latime=1660]
import sharp from "sharp";

const [out, wArg] = process.argv.slice(2);
if (!out) {
	console.error("Usage: node scripts/draw-congo-hidrograf.mjs <out.png> [latime]");
	process.exit(1);
}
const OUT_W = Number(wArg) || 1660;

// mii m³/s, debit mediu lunar multianual
const DEBITE = [44, 39, 38, 40, 42, 37, 32, 30, 33, 40, 52, 58];
const LUNI = ["I", "F", "M", "A", "M", "I", "I", "A", "S", "O", "N", "D"];
const YMAX = 60, PAS_ETICHETA = 10, PAS_GRILA = 5;

// pânza de bază: aceleași proporții ca imaginea înlocuită (830x549), ca rama
// din PowerPoint să încadreze graficul la fel
const W = 830, H = 549;
const PX0 = 96, PX1 = 806;      // caseta grilei, pe orizontală
const PY0 = 100, PY1 = 452;     // sus (YMAX) și linia de zero
const FONT = "'Segoe UI', 'Trebuchet MS', Arial, sans-serif";

const x = (i) => PX0 + ((i + 0.5) * (PX1 - PX0)) / DEBITE.length;
const y = (v) => PY1 - (v / YMAX) * (PY1 - PY0);
const LATIME_BARA = ((PX1 - PX0) / DEBITE.length) * 0.62;

const grila = [];
for (let v = PAS_GRILA; v <= YMAX; v += PAS_GRILA) {
	const eticheta = v % PAS_ETICHETA === 0;
	grila.push(
		`<line x1="${PX0}" y1="${y(v)}" x2="${PX1}" y2="${y(v)}" stroke="${eticheta ? "#d0d0d0" : "#e8e8e8"}" stroke-width="1"/>`,
	);
	if (eticheta) {
		grila.push(`<text x="${PX0 - 12}" y="${y(v) + 6}" text-anchor="end" font-size="17" fill="#333">${v}</text>`);
	}
}

const bare = DEBITE.map((v, i) => {
	const bx = x(i) - LATIME_BARA / 2;
	return `<rect x="${bx.toFixed(1)}" y="${y(v).toFixed(1)}" width="${LATIME_BARA.toFixed(1)}" height="${(PY1 - y(v)).toFixed(1)}" fill="#8f8f8f" stroke="#4a4a4a" stroke-width="1.4"/>`;
}).join("");

const luni = LUNI.map((l, i) => `<text x="${x(i).toFixed(1)}" y="${PY1 + 32}" text-anchor="middle" font-size="23" fill="#222">${l}</text>`).join("");

// rama decorativă: dreptunghi cu cele patru colțuri tăiate
const M = 8, C = 30;
const rama = `M ${M + C} ${M} H ${W - M - C} L ${W - M} ${M + C} V ${H - M - C} L ${W - M - C} ${H - M} H ${M + C} L ${M} ${H - M - C} V ${M + C} Z`;

const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" font-family="${FONT}">
  <rect width="${W}" height="${H}" fill="#ffffff"/>
  <path d="${rama}" fill="none" stroke="#9a9a9a" stroke-width="1.6"/>
  <text x="${W / 2}" y="46" text-anchor="middle" font-size="27" font-weight="700" fill="#111">FLUVIUL CONGO</text>
  <text x="${W / 2}" y="76" text-anchor="middle" font-size="18" fill="#222">Hidrograf: Evoluția debitului mediu lunar</text>
  <text x="${PX0 - 12}" y="82" text-anchor="end" font-size="16" fill="#333">mii m³/s</text>
  ${grila.join("")}
  <line x1="${PX0}" y1="${PY0}" x2="${PX0}" y2="${PY1}" stroke="#222" stroke-width="1.6"/>
  <line x1="${PX0}" y1="${PY1}" x2="${PX1}" y2="${PY1}" stroke="#222" stroke-width="1.6"/>
  <text x="${PX0 - 12}" y="${PY1 + 6}" text-anchor="end" font-size="17" fill="#333">0</text>
  ${bare}
  ${luni}
  <text x="${(PX0 + PX1) / 2}" y="${H - 26}" text-anchor="middle" font-size="18" fill="#222">Lunile anului</text>
</svg>`;

await sharp(Buffer.from(svg), { density: 150 }).resize({ width: OUT_W }).png().toFile(out);
const medie = DEBITE.reduce((a, b) => a + b, 0) / DEBITE.length;
console.log(
	`${out} — max ${Math.max(...DEBITE)} mii m³/s (${LUNI[DEBITE.indexOf(Math.max(...DEBITE))]}, luna ${DEBITE.indexOf(Math.max(...DEBITE)) + 1}), ` +
	`min ${Math.min(...DEBITE)} mii m³/s (luna ${DEBITE.indexOf(Math.min(...DEBITE)) + 1}), medie ${medie.toFixed(1)} mii m³/s`,
);
