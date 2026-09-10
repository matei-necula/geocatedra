// Generează 4 diagrame-bloc SVG cu tipurile de margini tectonice (desen propriu,
// CC0). Rulează:
//   node content/games/gen/tectonics.mjs [dir=content/games/tectonica-arhitect]
// apoi rasterizează: node app/scripts/rasterize.mjs <dir> 1000
//
// Fără text pe desen: denumirile sunt tocmai răspunsul din joc.
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const OUT = process.argv[2] || "content/games/tectonica-arhitect";
mkdirSync(OUT, { recursive: true });

const W = 520, H = 340;
const SEA = "#bcd7e6", MANTLE = "#e8b08a", CONT = "#d8cba8", OCEAN_CRUST = "#8fa3ad";
const INK = "#22333b", MAGMA = "#e07a5f", HOT = "#c2410c";

const head = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
<rect width="${W}" height="${H}" fill="#fdf6ec"/>
<rect x="0" y="120" width="${W}" height="${H - 120}" fill="${MANTLE}"/>`;
const tail = `</svg>`;

/** săgeată groasă, orizontală */
const arrow = (x, y, dir, len = 54, color = INK) => {
	const x2 = x + dir * len;
	const head = 13 * dir;
	return `<g stroke="${color}" stroke-width="7" fill="${color}" stroke-linecap="round">
	<line x1="${x}" y1="${y}" x2="${x2 - head}" y2="${y}"/>
	<polygon points="${x2},${y} ${x2 - head},${y - 9} ${x2 - head},${y + 9}" stroke="none"/></g>`;
};

const files = {
	// 1. convergentă continent–continent: două blocuri groase se ciocnesc, munți la mijloc
	"marg-coliziune": `${head}
<path d="M0 120 H180 L250 60 L270 60 L340 120 H520 V120 H0 Z" fill="none"/>
<path d="M0 130 H150 L200 128 L215 122 L245 74 L262 74 L292 122 L310 128 L370 130 H520 V220 H0 Z" fill="${CONT}" stroke="${INK}" stroke-width="3"/>
<path d="M215 122 L245 74 L262 74 L292 122" fill="${CONT}" stroke="${INK}" stroke-width="3"/>
<path d="M150 150 L215 150" stroke="${INK}" stroke-width="2" stroke-dasharray="7 6" opacity="0.6"/>
<path d="M300 150 L370 150" stroke="${INK}" stroke-width="2" stroke-dasharray="7 6" opacity="0.6"/>
${arrow(60, 175, 1)}${arrow(460, 175, -1)}
<path d="M235 200 q20 26 40 0" stroke="${HOT}" stroke-width="4" fill="none" opacity="0.7"/>
${tail}`,

	// 2. convergentă ocean–continent: placa subțire coboară, fosă + vulcan
	"marg-subductie": `${head}
<rect x="0" y="96" width="250" height="26" fill="${SEA}"/>
<path d="M0 122 H210 L246 150 L300 250 L330 300" fill="none" stroke="${INK}" stroke-width="3"/>
<path d="M0 122 H210 L246 150 L300 250 L330 300 L360 292 L306 236 L262 138 L228 112 H0 Z" fill="${OCEAN_CRUST}" stroke="${INK}" stroke-width="3"/>
<path d="M250 118 L286 128 L300 118 L330 126 L360 100 L400 108 L440 96 L520 104 V220 H250 Z" fill="${CONT}" stroke="${INK}" stroke-width="3"/>
<path d="M352 100 L372 58 L392 100" fill="${CONT}" stroke="${INK}" stroke-width="3"/>
<path d="M372 58 q-6 -22 -18 -34 M372 58 q8 -20 20 -30" stroke="${HOT}" stroke-width="5" fill="none" stroke-linecap="round"/>
<path d="M330 210 q22 -60 42 -110" stroke="${MAGMA}" stroke-width="6" fill="none" stroke-dasharray="10 8" opacity="0.85"/>
${arrow(70, 180, 1)}${arrow(470, 170, -1)}
${tail}`,

	// 3. divergentă ocean–ocean: dorsală cu rift și magmă care urcă
	"marg-dorsala": `${head}
<rect x="0" y="86" width="${W}" height="36" fill="${SEA}"/>
<path d="M0 122 H190 L228 96 L246 112 L260 96 L274 112 L292 96 L330 122 H520 V220 H0 Z" fill="${OCEAN_CRUST}" stroke="${INK}" stroke-width="3"/>
<path d="M246 112 L260 96 L274 112" fill="${SEA}" stroke="${INK}" stroke-width="3"/>
<path d="M260 240 V140" stroke="${MAGMA}" stroke-width="9" stroke-linecap="round"/>
<path d="M232 250 q28 -40 28 -80 M288 250 q-28 -40 -28 -80" stroke="${MAGMA}" stroke-width="5" fill="none" opacity="0.8"/>
${arrow(120, 180, -1)}${arrow(400, 180, 1)}
${tail}`,

	// 4. transformantă: două blocuri alunecă orizontal, fără magmă (vedere de sus)
	"marg-falie": `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
<rect width="${W}" height="${H}" fill="#fdf6ec"/>
<path d="M0 0 H250 L262 60 L246 130 L268 200 L252 280 L262 340 H0 Z" fill="${CONT}" stroke="${INK}" stroke-width="3"/>
<path d="M250 0 H520 V340 H262 L252 280 L268 200 L246 130 L262 60 Z" fill="#cbbf9c" stroke="${INK}" stroke-width="3"/>
<path d="M250 0 L262 60 L246 130 L268 200 L252 280 L262 340" fill="none" stroke="${INK}" stroke-width="6"/>
${arrow(150, 100, -1, 70)}${arrow(370, 240, 1, 70)}
<path d="M170 190 q26 10 52 0 M300 120 q26 -10 52 0" stroke="${HOT}" stroke-width="4" fill="none" opacity="0.75"/>
${tail}`,
};

for (const [name, svg] of Object.entries(files)) {
	const p = join(OUT, `${name}.svg`);
	writeFileSync(p, svg, "utf8");
	console.log("wrote", p);
}
console.log("\nRasterizează cu: node app/scripts/rasterize.mjs " + OUT + " 1000");
