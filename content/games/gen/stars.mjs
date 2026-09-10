// Generează 5 imagini SVG cu stele colorate (glow radial) pentru jocul
// „Sistemul Solar / stelele după temperatură". Desen propriu (CC0).
// Rulează: node content/games/gen/stars.mjs
// apoi: node app/scripts/rasterize.mjs content/games/sistem-solar-ordine 800
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const OUT = "content/games/sistem-solar-ordine";
mkdirSync(OUT, { recursive: true });

const STARS = {
	"stea-rosie": "#d94a3a",
	"stea-portocalie": "#e8843a",
	"stea-galbena": "#f2c14e",
	"stea-alba": "#eef1ff",
	"stea-albastra": "#8fbaff",
};

function svg(color) {
	return `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="400" viewBox="0 0 400 400">` +
		`<defs><radialGradient id="g"><stop offset="0%" stop-color="#ffffff"/><stop offset="35%" stop-color="${color}"/><stop offset="100%" stop-color="${color}" stop-opacity="0"/></radialGradient></defs>` +
		`<rect width="400" height="400" fill="#0b1020"/>` +
		`<circle cx="200" cy="200" r="180" fill="url(#g)"/>` +
		`<circle cx="200" cy="200" r="90" fill="${color}"/>` +
		`<circle cx="200" cy="200" r="90" fill="url(#g)" opacity="0.6"/>` +
		`</svg>\n`;
}

for (const [slug, color] of Object.entries(STARS)) {
	writeFileSync(join(OUT, `${slug}.svg`), svg(color), "utf8");
	console.log(`${slug}.svg`);
}
