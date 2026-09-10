// Generează imaginile jocului „Raliul cartografic: misiune la scară" (scara
// hărții — numerică și grafică). Hărțile cu perechi de orașe reutilizează
// world-base.svg (CC0, echirectangulară 360×180), proiectat într-o fereastră
// proprie lon/lat pe un canvas mare, ca textul să fie lizibil (world-base.svg
// e prea „mic" ca unitate ca să scriem text direct în spațiul lui 360×180,
// spre deosebire de gen/maps.mjs care nu are text pe hartă). Planul de
// cartier, poteca montană și cardurile de scară sunt desen propriu (CC0), ca
// în gen/tectonics.mjs. Rulează:
//   node content/games/gen/scale-maps.mjs
// apoi rasterizează:
//   node app/scripts/rasterize.mjs content/games/harti-scara 1600
//
// IMPORTANT: distanțele reale (folosite ca să verificăm întrebările cu
// scripts/verify-harti-scara.mjs) trebuie citite din orașe, nu inventate —
// vezi acel script pentru referințele folosite. Lungimea segmentului desenat
// pe fiecare hartă e proporțională cu `routeCm` printr-o unitate comună
// (PX_PER_CM), NU cu distanța geografică reală dintre orașe — altfel o rută
// de 7 cm ar putea ieși mai scurtă decât una de 4 cm, doar pentru că orașele
// ei sunt geografic mai apropiate pe glob.
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, "..", "..", ".."); // repo root
const OUT = join(ROOT, "content", "games", "harti-scara");
mkdirSync(OUT, { recursive: true });

const BASE = readFileSync(join(HERE, "world-base.svg"), "utf8")
	.replace(/<\?xml[^>]*\?>/, "")
	.replace(/<!DOCTYPE[^>]*>/, "")
	.replace(/#444444/g, "#cdbfa3"); // teren deschis, ca linia rutei să iasă în evidență

const AZURE = "#2a6f97", TERRA = "#e07a5f", SAND = "#f2cc8f", CREAM = "#fdf6ec", INK = "#22333b";
const FONT = `font-family="Arial, sans-serif"`;

function write(name, svg) {
	writeFileSync(join(OUT, name), svg, "utf8");
	console.log(name);
}

/** Text cu halou crem, ca să iasă în evidență pe orice fundal (hartă sau desen). */
function label(x, y, text, opts = {}) {
	const { size = 15, weight = "600", fill = INK, anchor = "middle" } = opts;
	return `<text x="${x.toFixed(1)}" y="${y.toFixed(1)}" ${FONT} font-size="${size}" font-weight="${weight}" fill="${fill}" text-anchor="${anchor}" paint-order="stroke" stroke="${CREAM}" stroke-width="4">${text}</text>`;
}

/** Proiecție echirectangulară liniară dintr-o fereastră lon/lat într-un canvas W×H propriu
 *  (world-base.svg e definit în spațiul absolut 0..360 / 0..180 = lon+180 / 90-lat; aici
 *  doar recadrăm și mărim acea fereastră pe un canvas cu unități convenabile pentru text). */
function projection(lon0, lon1, lat0, lat1, W, H) {
	const x0 = lon0 + 180, x1 = lon1 + 180;
	const y0 = 90 - lat1, y1 = 90 - lat0;
	const sx = W / (x1 - x0), sy = H / (y1 - y0);
	return {
		proj: (lon, lat) => [(lon + 180 - x0) * sx, (90 - lat - y0) * sy],
		transform: `scale(${sx.toFixed(4)} ${sy.toFixed(4)}) translate(${(-x0).toFixed(2)} ${(-y0).toFixed(2)})`,
	};
}

/** Bară de scară grafică duală: sus repere în cm, jos echivalentul lor real (km sau m).
 *  `segCount` control câte repere are bara — intenționat mai puține decât lungimea rutei
 *  măsurate, ca elevul să afle rata pe cm și s-o înmulțească, nu doar să citească un reper
 *  care se potrivește exact cu ruta. */
function scaleBar(x, y, segPx, segCount, segValue, unit) {
	let s = "";
	for (let i = 0; i < segCount; i++) {
		s += `<rect x="${(x + i * segPx).toFixed(1)}" y="${y}" width="${segPx}" height="12" fill="${i % 2 === 0 ? INK : CREAM}" stroke="${INK}" stroke-width="1.5"/>`;
	}
	for (let i = 0; i <= segCount; i++) {
		const tx = x + i * segPx;
		s += `<line x1="${tx}" y1="${y - 5}" x2="${tx}" y2="${y + 17}" stroke="${INK}" stroke-width="1.3"/>`;
		s += label(tx, y - 11, `${i} cm`, { size: 13, weight: "500" });
		s += label(tx, y + 34, `${i * segValue} ${unit}`, { size: 13, fill: AZURE, weight: "700" });
	}
	return s;
}

// Unitate comună de desen: N cm pe orice hartă din joc = N × PX_PER_CM pixeli
// între cele două orașe, indiferent de cât de departe sunt ele pe glob —
// altfel o hartă cu rută de 7 cm ar putea ieși vizual mai scurtă decât una cu
// 4 cm, doar din cauza geografiei reale a perechii alese.
const PX_PER_CM = 70;
const MARGIN = 150; // spațiu pentru etichetele oraș + eticheta rutei, în jurul segmentului

/** Hartă cu doi orași, o rută evidențiată (etichetată în cm — sau cu `routeLabelOverride`,
 *  ca la ruta „necunoscută" din runda 3) și fie o scară numerică, fie o bară de scară
 *  grafică duală, dedesubt. Fereastra lon/lat e calculată invers, din `routeCm`, ca
 *  segmentul desenat să aibă mereu exact `routeCm × PX_PER_CM` pixeli. */
function worldMapImage({ cities, routeCm, routeLabelOverride, dashed = false, scale }) {
	const [a, b] = cities;
	const dx = b.lon - a.lon, dy = b.lat - a.lat; // grade
	const degDist = Math.sqrt(dx * dx + dy * dy);
	const s = (routeCm * PX_PER_CM) / degDist; // px per grad, ales ca segmentul să iasă exact routeCm×PX_PER_CM
	const pxDx = dx * s, pxDy = -dy * s; // y crește în jos ⇒ lat mai mare = y mai mic
	const W = Math.round(Math.max(560, Math.abs(pxDx) + 2 * MARGIN));
	const H = Math.round(Math.max(320, Math.abs(pxDy) + 2 * MARGIN));
	const midLon = (a.lon + b.lon) / 2, midLat = (a.lat + b.lat) / 2;
	const lonSpan = W / s, latSpan = H / s;
	const lon0 = midLon - lonSpan / 2, lon1 = midLon + lonSpan / 2;
	const lat0 = midLat - latSpan / 2, lat1 = midLat + latSpan / 2;

	const SCALE_H = scale.type === "bar" ? 100 : 80;
	const totalH = H + SCALE_H;
	const { proj, transform } = projection(lon0, lon1, lat0, lat1, W, H);
	const dashAttr = dashed ? `stroke-dasharray="12 9"` : "";
	let svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${totalH}" viewBox="0 0 ${W} ${totalH}">`;
	svg += `<rect width="${W}" height="${totalH}" fill="${CREAM}"/>`;
	svg += `<rect width="${W}" height="${H}" fill="#eaf1f5"/>`; // ocean
	svg += `<g transform="${transform}">${BASE}</g>`;

	const [ax, ay] = proj(a.lon, a.lat);
	const [bx, by] = proj(b.lon, b.lat);
	svg += `<line x1="${ax.toFixed(1)}" y1="${ay.toFixed(1)}" x2="${bx.toFixed(1)}" y2="${by.toFixed(1)}" stroke="${TERRA}" stroke-width="4" ${dashAttr}/>`;
	for (const [x, y] of [[ax, ay], [bx, by]]) {
		svg += `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="7" fill="${AZURE}" stroke="${CREAM}" stroke-width="2.5"/>`;
	}
	svg += label(ax, ay - 15, a.name, { size: 18 });
	svg += label(bx, by - 15, b.name, { size: 18 });

	const routeLabel = routeLabelOverride ?? `${routeCm} cm`;
	const mx = (ax + bx) / 2, my = (ay + by) / 2;
	const chipW = Math.max(78, routeLabel.length * 10.5);
	svg += `<rect x="${(mx - chipW / 2).toFixed(1)}" y="${(my - 17).toFixed(1)}" width="${chipW.toFixed(1)}" height="28" rx="7" fill="${SAND}" stroke="${INK}" stroke-width="1.4"/>`;
	svg += label(mx, my + 2, routeLabel, { size: 16 });

	if (scale.type === "numeric") {
		svg += `<rect x="${W / 2 - 150}" y="${H + 22}" width="300" height="46" rx="9" fill="${SAND}" stroke="${INK}" stroke-width="1.6"/>`;
		svg += label(W / 2, H + 52, `Scara 1 : ${scale.denomLabel}`, { size: 20, weight: "700" });
	} else if (scale.type === "bar") {
		const segPx = PX_PER_CM;
		const barX = W / 2 - (segPx * scale.segCount) / 2;
		svg += scaleBar(barX, H + 36, segPx, scale.segCount, scale.segValue, scale.unit);
	}
	svg += `</svg>\n`;
	return svg;
}

// ---------------------------------------------------------------- Runda 1 --
// Distanțe reale (linie dreaptă) folosite ca referință, verificate și în
// scripts/verify-harti-scara.mjs: București–Londra ≈2100 km, Cairo–Roma
// ≈2130 km, Paris–Madrid ≈1050 km.

write(
	"bucuresti-londra.svg",
	worldMapImage({
		cities: [{ lon: 26.1, lat: 44.4, name: "București" }, { lon: -0.1, lat: 51.5, name: "Londra" }],
		routeCm: 7, scale: { type: "numeric", denomLabel: "30.000.000" },
	}),
);

write(
	"cairo-roma.svg",
	worldMapImage({
		cities: [{ lon: 31.2, lat: 30.0, name: "Cairo" }, { lon: 12.5, lat: 41.9, name: "Roma" }],
		routeCm: 11, scale: { type: "numeric", denomLabel: "20.000.000" },
	}),
);

write(
	"paris-madrid.svg",
	worldMapImage({
		cities: [{ lon: 2.35, lat: 48.85, name: "Paris" }, { lon: -3.7, lat: 40.4, name: "Madrid" }],
		routeCm: 7, scale: { type: "numeric", denomLabel: "15.000.000" },
	}),
);

// plan de cartier — scară numerică mare, fără hartă de fond; scenă locală
// inventată, fără pretenție de exactitate geografică reală (neschimbată).
write("plan-cartier.svg", (() => {
	const W = 760, H = 560;
	let s = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">`;
	s += `<rect width="${W}" height="${H}" fill="${CREAM}"/>`;
	const blocks = [
		[40, 40, 150, 100], [230, 40, 150, 100], [420, 40, 150, 100], [610, 40, 110, 100],
		[40, 220, 150, 100], [230, 220, 150, 100], [420, 220, 150, 100], [610, 220, 110, 100],
		[40, 400, 150, 90], [230, 400, 150, 90], [420, 400, 150, 90], [610, 400, 110, 90],
	];
	for (const [x, y, w, h] of blocks) {
		s += `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="5" fill="#e4d9bd" stroke="${INK}" stroke-width="1.6"/>`;
	}
	for (const y of [20, 200, 380, 508]) s += `<line x1="10" y1="${y}" x2="${W - 10}" y2="${y}" stroke="#c9bfa0" stroke-width="12"/>`;
	for (const x of [22, 208, 398, 588, 738]) s += `<line x1="${x}" y1="10" x2="${x}" y2="${H - 20}" stroke="#c9bfa0" stroke-width="12"/>`;
	// ruta evidențiată, de-a lungul bulevardului orizontal
	const ax = 110, bx = 660, ry = 200;
	s += `<line x1="${ax}" y1="${ry}" x2="${bx}" y2="${ry}" stroke="${TERRA}" stroke-width="6"/>`;
	s += `<circle cx="${ax}" cy="${ry}" r="8" fill="${AZURE}" stroke="${CREAM}" stroke-width="2.5"/>`;
	s += `<circle cx="${bx}" cy="${ry}" r="8" fill="${AZURE}" stroke="${CREAM}" stroke-width="2.5"/>`;
	s += `<rect x="${(ax + bx) / 2 - 44}" y="${ry - 46}" width="88" height="28" rx="7" fill="${SAND}" stroke="${INK}" stroke-width="1.4"/>`;
	s += label((ax + bx) / 2, ry - 26, "10 cm", { size: 16 });
	s += `<rect x="${W / 2 - 150}" y="${H - 60}" width="300" height="46" rx="9" fill="${SAND}" stroke="${INK}" stroke-width="1.6"/>`;
	s += label(W / 2, H - 30, "Scara 1 : 25.000", { size: 20, weight: "700" });
	s += `</svg>\n`;
	return s;
})());

// ---------------------------------------------------------------- Runda 2 --
// Distanțe reale de referință: Berlin–Viena ≈525 km, Lisabona–Varșovia
// ≈2750 km, Roma–Atena ≈1050 km.

write(
	"berlin-viena.svg",
	worldMapImage({
		cities: [{ lon: 13.4, lat: 52.5, name: "Berlin" }, { lon: 16.37, lat: 48.2, name: "Viena" }],
		routeCm: 7, scale: { type: "bar", segCount: 4, segValue: 75, unit: "km" },
	}),
);

write(
	"lisabona-varsovia.svg",
	worldMapImage({
		cities: [{ lon: -9.14, lat: 38.7, name: "Lisabona" }, { lon: 21.0, lat: 52.2, name: "Varșovia" }],
		routeCm: 11, scale: { type: "bar", segCount: 4, segValue: 250, unit: "km" },
	}),
);

write(
	"roma-atena.svg",
	worldMapImage({
		cities: [{ lon: 12.5, lat: 41.9, name: "Roma" }, { lon: 23.7, lat: 37.98, name: "Atena" }],
		routeCm: 7, scale: { type: "bar", segCount: 4, segValue: 150, unit: "km" },
	}),
);

// potecă montană — scară grafică în metri, fără hartă de fond; scenă locală
// inventată (neschimbată).
write("poteca-munte.svg", (() => {
	const W = 760, H = 560;
	let s = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">`;
	s += `<rect width="${W}" height="${H}" fill="#eaf1e6"/>`;
	// pete de „pădure”
	const trees = [[90, 90], [140, 130], [640, 100], [690, 150], [110, 430], [660, 420], [600, 480], [160, 470]];
	for (const [x, y] of trees) {
		for (let i = 0; i < 5; i++) {
			s += `<circle cx="${x + (i % 3) * 22 - 22}" cy="${y + Math.floor(i / 3) * 20}" r="16" fill="#6a994e" opacity="0.55"/>`;
		}
	}
	// poteca — traseu unduitor
	const path = `M 70 460 C 180 420, 220 340, 300 320 S 430 260, 470 200 S 620 120, 690 90`;
	s += `<path d="${path}" fill="none" stroke="${TERRA}" stroke-width="7" stroke-linecap="round"/>`;
	s += `<circle cx="70" cy="460" r="8" fill="${AZURE}" stroke="${CREAM}" stroke-width="2.5"/>`;
	s += `<circle cx="690" cy="90" r="8" fill="${AZURE}" stroke="${CREAM}" stroke-width="2.5"/>`;
	// puncte de belvedere (fără text — nu trebuie să dea vreun indiciu)
	for (const [x, y] of [[300, 320], [470, 200]]) s += `<circle cx="${x}" cy="${y}" r="6" fill="${SAND}" stroke="${INK}" stroke-width="1.6"/>`;
	s += `<rect x="330" y="270" width="90" height="28" rx="7" fill="${SAND}" stroke="${INK}" stroke-width="1.4"/>`;
	s += label(375, 290, "12 cm", { size: 16 });
	// bară de scară grafică (metri)
	const segPx = PX_PER_CM, segCount = 4, barX = W / 2 - (segPx * segCount) / 2, barY = H - 74;
	s += scaleBar(barX, barY, segPx, segCount, 250, "m");
	s += `</svg>\n`;
	return s;
})());

// ---------------------------------------------------------------- Runda 3 --

write(
	"madrid-berlin-necunoscut.svg",
	worldMapImage({
		cities: [{ lon: -3.7, lat: 40.4, name: "Madrid" }, { lon: 13.4, lat: 52.5, name: "Berlin" }],
		routeCm: 10, // doar pentru desen — cm-ul nu apare în întrebare, elevul îl calculează
		routeLabelOverride: "1.800 km real", dashed: true,
		scale: { type: "numeric", denomLabel: "9.000.000" },
	}),
);

// Harta A / Harta B — două cadre cu densitate de detaliu diferită
write("harta-a-harta-b.svg", (() => {
	const W = 820, H = 460;
	let s = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">`;
	s += `<rect width="${W}" height="${H}" fill="${CREAM}"/>`;
	function frame(x, title, denomLabel, dense) {
		const fw = 340, fy = 40, fh = 300;
		let f = `<rect x="${x}" y="${fy}" width="${fw}" height="${fh}" rx="10" fill="#eef2f0" stroke="${INK}" stroke-width="2"/>`;
		if (dense) {
			for (let gx = x + 20; gx < x + fw - 10; gx += 26) f += `<line x1="${gx}" y1="${fy + 10}" x2="${gx}" y2="${fy + fh - 10}" stroke="${AZURE}" stroke-width="1.4" opacity="0.55"/>`;
			for (let gy = fy + 20; gy < fy + fh - 10; gy += 26) f += `<line x1="${x + 10}" y1="${gy}" x2="${x + fw - 10}" y2="${gy}" stroke="${AZURE}" stroke-width="1.4" opacity="0.55"/>`;
			for (const [dx, dy] of [[60, 60], [150, 110], [250, 70], [90, 200], [220, 220], [280, 160]]) {
				f += `<rect x="${x + dx}" y="${fy + dy}" width="18" height="14" fill="${TERRA}" opacity="0.7" rx="2"/>`;
			}
		} else {
			f += `<ellipse cx="${x + fw / 2 - 40}" cy="${fy + fh / 2}" rx="90" ry="70" fill="${SAND}" opacity="0.8"/>`;
			f += `<ellipse cx="${x + fw / 2 + 70}" cy="${fy + fh / 2 + 40}" rx="60" ry="45" fill="${TERRA}" opacity="0.55"/>`;
		}
		f += label(x + fw / 2, fy + fh + 34, title, { size: 19, weight: "700" });
		f += label(x + fw / 2, fy + fh + 60, `Scara 1 : ${denomLabel}`, { size: 16, fill: AZURE, weight: "600" });
		return f;
	}
	s += frame(40, "Harta A", "50.000", true);
	s += frame(440, "Harta B", "500.000", false);
	s += `</svg>\n`;
	return s;
})());

// Card de scară — conversie 1:200.000
write("scara-200000.svg", (() => {
	const W = 640, H = 320;
	let s = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">`;
	s += `<rect width="${W}" height="${H}" fill="${CREAM}"/>`;
	s += `<rect x="60" y="70" width="520" height="120" rx="14" fill="${SAND}" stroke="${INK}" stroke-width="2"/>`;
	s += label(W / 2, 145, "Scara 1 : 200.000", { size: 30, weight: "700" });
	// riglă decorativă, fără cifre
	const rx = 120, ry = 230, rw = 400;
	s += `<line x1="${rx}" y1="${ry}" x2="${rx + rw}" y2="${ry}" stroke="${INK}" stroke-width="3"/>`;
	for (let i = 0; i <= 20; i++) {
		const x = rx + (rw / 20) * i;
		const h = i % 5 === 0 ? 18 : 10;
		s += `<line x1="${x.toFixed(1)}" y1="${ry}" x2="${x.toFixed(1)}" y2="${ry - h}" stroke="${AZURE}" stroke-width="2"/>`;
	}
	s += `</svg>\n`;
	return s;
})());

// Patru scări — de la foarte mică la foarte mare, doar cifre + densitate abstractă
write("patru-scari.svg", (() => {
	const W = 1080, H = 360;
	const denoms = ["5.000.000", "1.000.000", "500.000", "25.000"];
	const density = [1, 2, 4, 8]; // linii pe cadru — sugerează nivelul de detaliu, fără text de conținut
	let s = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">`;
	s += `<rect width="${W}" height="${H}" fill="${CREAM}"/>`;
	const fw = 220, fh = 220, gap = 26, x0 = 40, fy = 30;
	denoms.forEach((d, i) => {
		const x = x0 + i * (fw + gap);
		s += `<rect x="${x}" y="${fy}" width="${fw}" height="${fh}" rx="10" fill="#eef2f0" stroke="${INK}" stroke-width="2"/>`;
		const n = density[i];
		for (let r = 0; r < n; r++) {
			for (let c = 0; c < n; c++) {
				const cx = x + ((r + 0.5) * fw) / n;
				const cy = fy + ((c + 0.5) * fh) / n;
				s += `<circle cx="${cx.toFixed(1)}" cy="${cy.toFixed(1)}" r="${Math.max(3, 14 - n)}" fill="${AZURE}" opacity="0.5"/>`;
			}
		}
		s += label(x + fw / 2, fy + fh + 34, `1 : ${d}`, { size: 18, weight: "700" });
	});
	s += `</svg>\n`;
	return s;
})());

console.log("\n12 imagini generate în content/games/harti-scara/.");
console.log("Rasterizează cu: node app/scripts/rasterize.mjs content/games/harti-scara 1600");
