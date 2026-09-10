// Hartă pentru jocul „Detectivul anotimpurilor”: world-base.svg (CC0,
// echirectangulară 360×180) + paralelele care contează pentru anotimpuri
// (Ecuator, tropice, cercuri polare). Lucrare derivată, CC0.
//
//   node content/games/gen/seasons-map.mjs [dir=content/games/pamant-anotimpuri]
//   node app/scripts/rasterize.mjs <dir> 2000
//
// Proiecție plate carrée: (lon, lat) → x = lon + 180, y = 90 − lat.
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const OUT = process.argv[2] || join(HERE, "..", "pamant-anotimpuri");
mkdirSync(OUT, { recursive: true });

const base = readFileSync(join(HERE, "world-base.svg"), "utf8")
	.replace(/<\?xml[^>]*\?>/, "")
	.replace(/<!DOCTYPE[^>]*>/, "")
	.replace(/#444444/g, "#cdbfa3");

const y = (lat) => (90 - lat).toFixed(1);
const INK = "#22333b";

/** paralelă punctată + etichetă discretă la marginea stângă */
const parallel = (lat, label, dash = "4 3") =>
	`<line x1="0" y1="${y(lat)}" x2="360" y2="${y(lat)}" stroke="${INK}" stroke-width="0.6" stroke-dasharray="${dash}" opacity="0.75"/>` +
	`<text x="3" y="${(Number(y(lat)) - 1.6).toFixed(1)}" font-family="sans-serif" font-size="4.2" fill="${INK}" opacity="0.85">${label}</text>`;

const overlay =
	parallel(66.5, "Cercul polar de nord") +
	parallel(23.5, "Tropicul Racului") +
	`<line x1="0" y1="${y(0)}" x2="360" y2="${y(0)}" stroke="${INK}" stroke-width="0.9" opacity="0.9"/>` +
	`<text x="3" y="${(Number(y(0)) - 1.6).toFixed(1)}" font-family="sans-serif" font-size="4.2" fill="${INK}" opacity="0.85">Ecuator</text>` +
	parallel(-23.5, "Tropicul Capricornului") +
	parallel(-66.5, "Cercul polar de sud");

const svg =
	`<svg xmlns="http://www.w3.org/2000/svg" width="360" height="180" viewBox="0 0 360 180">` +
	`<rect width="360" height="180" fill="#eaf1f5"/>` +
	base +
	overlay +
	`</svg>\n`;

const dst = join(OUT, "harta-anotimpuri.svg");
writeFileSync(dst, svg, "utf8");
console.log("wrote", dst, "\nRasterizează cu: node app/scripts/rasterize.mjs", OUT, "2000");
