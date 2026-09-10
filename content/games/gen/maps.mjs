// Compune hărțile jocurilor din world-base.svg (CC0, echirectangulară 360×180).
// Lucrare derivată (CC0). Rulează: node content/games/gen/maps.mjs
// apoi rasterizează fiecare folder-joc cu app/scripts/rasterize.mjs.
//
// Proiecție plate carrée: un punct (lon, lat) → (x=lon+180, y=90-lat) în
// spațiul 360×180. Elipsele/benzile de mai jos sunt în lon/lat (grade).
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, "..", "..", ".."); // repo root
const base = readFileSync(join(HERE, "world-base.svg"), "utf8")
	.replace(/<\?xml[^>]*\?>/, "")
	.replace(/<!DOCTYPE[^>]*>/, "")
	.replace(/#444444/g, "#cdbfa3"); // teren mai deschis, ca bulinele/benzile să iasă în evidență

const g = (dst) => join(ROOT, dst);
const px = (lon) => (lon + 180).toFixed(1);
const py = (lat) => (90 - lat).toFixed(1);

/** Înfășoară baza + straturi de suprapunere într-un SVG 360×180. */
function compose(overlay) {
	return `<svg xmlns="http://www.w3.org/2000/svg" width="360" height="180" viewBox="0 0 360 180">` +
		`<rect width="360" height="180" fill="#eaf1f5"/>` + // ocean
		base +
		overlay +
		`</svg>\n`;
}

// benzi latitudinale translucide (zone climatice)
function band(lat0, lat1, color) {
	const y = 90 - lat1;
	const h = lat1 - lat0;
	return `<rect x="0" y="${y}" width="360" height="${h}" fill="${color}" fill-opacity="0.16"/>`;
}
const zoneClimatice =
	band(-10, 10, "#e07a5f") + // ecuatorial
	band(10, 30, "#f2cc8f") + band(-30, -10, "#f2cc8f") + // tropical
	band(30, 60, "#6a994e") + band(-60, -30, "#6a994e") + // temperat
	band(60, 90, "#2a6f97") + band(-90, -60, "#2a6f97");   // polar

// elipse areal (lon, lat, rx°, ry°) — teracotă translucidă
function ell(list) {
	return list
		.map(([lon, lat, rx, ry]) => `<ellipse cx="${px(lon)}" cy="${py(lat)}" rx="${rx}" ry="${ry}" fill="#e07a5f" fill-opacity="0.5" stroke="#c85a3f" stroke-width="0.6"/>`)
		.join("");
}
const AREALE = {
	ecuatorial: [[-60, -3, 18, 10], [22, -1, 12, 8], [118, 0, 15, 8]],
	savana: [[15, 12, 22, 6], [28, -15, 12, 8], [-50, -12, 12, 8], [133, -17, 12, 6]],
	desert: [[15, 22, 25, 8], [48, 22, 8, 8], [128, -25, 14, 8], [22, -23, 8, 6]],
	mediteranean: [[18, 38, 18, 5], [-120, 36, 4, 6], [-71, -34, 3, 6], [118, -33, 5, 4], [20, -33, 4, 3]],
	stepa: [[60, 48, 25, 6], [-100, 42, 8, 8], [-62, -35, 6, 6]],
	foioase: [[15, 50, 18, 6], [-82, 38, 8, 7], [118, 33, 8, 7]],
	taiga: [[90, 62, 40, 7], [-100, 58, 30, 6], [18, 63, 8, 5]],
	tundra: [[100, 72, 40, 5], [-95, 70, 30, 5], [40, 70, 15, 4]],
};

// Toate arealele pe o singură hartă, fiecare zonă cu culoarea ei — fundal
// pentru jocul „Așază solurile pe hartă" (solurile urmează zonele de vegetație).
const CULORI_ZONE = {
	ecuatorial: "#1b7a3f",
	savana: "#c9a227",
	desert: "#e0a458",
	mediteranean: "#9d5c8f",
	stepa: "#b5c327",
	foioase: "#4f9d4f",
	taiga: "#1f6f6f",
	tundra: "#7f9db9",
};
const zoneVegetatie = Object.entries(AREALE)
	.map(([zona, list]) =>
		list
			.map(([lon, lat, rx, ry]) =>
				`<ellipse cx="${px(lon)}" cy="${py(lat)}" rx="${rx}" ry="${ry}" fill="${CULORI_ZONE[zona]}" fill-opacity="0.55" stroke="${CULORI_ZONE[zona]}" stroke-width="0.6"/>`,
			)
			.join(""),
	)
	.join("");

// scrie fișierele
function write(dst, svg) {
	mkdirSync(dirname(g(dst)), { recursive: true });
	writeFileSync(g(dst), svg, "utf8");
	console.log(dst);
}

write("content/games/clima-harta/harta-zone-climatice.svg", compose(zoneClimatice));
write("content/games/hidro-fluvii/harta-contur-fluvii.svg", compose(""));
write("content/games/hidro-lacuri/harta-contur-lacuri.svg", compose(""));
write("content/games/soluri-harta/harta-zone-vegetatie.svg", compose(zoneVegetatie));
for (const [zona, list] of Object.entries(AREALE)) {
	write(`content/games/bio-vegetatie-areale/areal-${zona}.svg`, compose(ell(list)));
}
console.log("\nHărți generate. Rasterizează folderele cu app/scripts/rasterize.mjs.");
