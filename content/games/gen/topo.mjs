// Generează imaginile jocului „Harta secretă" (semne convenționale, curbe de
// nivel, rețea cartografică) — desen propriu (CC0). Rulează din rădăcina
// depozitului:
//   node content/games/gen/topo.mjs [dir=content/games/harti-topografice]
// apoi rasterizează:
//   node app/scripts/rasterize.mjs content/games/harti-topografice 1600
//
// Trei seturi de imagini:
//  - legenda-*.svg: patru cartonașe, câte un singur semn convențional pe
//    fiecare (fără text care ar dezvălui răspunsul).
//  - relief-contur-*.svg: fragmente cu curbe de nivel imbricate, asimetrice
//    (dese pe versantul abrupt, rare pe cel lin), cu etichete de altitudine
//    și puncte literate A–D.
//  - coord-*.svg: rețea cartografică (paralele/meridiane din 15 în 15 grade)
//    cu puncte literate A–D; exact unul cade la coordonatele cerute.
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const OUT = process.argv[2] || "content/games/harti-topografice";
mkdirSync(OUT, { recursive: true });

const INK = "#22333B", AZURE = "#2A6F97", TERRA = "#E07A5F", SAND = "#F2CC8F", CREAM = "#FDF6EC";

const files = {};

// ---------------------------------------------------------------------
// 1. Legenda — patru cartonașe, un singur semn convențional pe fiecare.
// ---------------------------------------------------------------------
const cardFrame = `<rect width="400" height="400" fill="${CREAM}"/><rect x="8" y="8" width="384" height="384" fill="none" stroke="${INK}" stroke-width="3" rx="10"/>`;
const cardHead = `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="400" viewBox="0 0 400 400">${cardFrame}`;
const cardTail = `</svg>`;

// cotă (vârf cu altitudine): triunghi plin + punct în vârf + număr alăturat
files["legenda-cota"] = `${cardHead}
<polygon points="180,260 220,260 200,150" fill="${INK}"/>
<circle cx="200" cy="150" r="5" fill="${INK}"/>
<text x="235" y="185" font-family="sans-serif" font-size="34" font-weight="700" fill="${INK}">2544</text>
<path d="M150 300 L160 292 L172 300 L185 288 L200 298 L215 288 L228 300 L240 292 L250 300" fill="none" stroke="${INK}" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" opacity="0.55"/>
${cardTail}`;

// depresiune: buclă închisă cu hașuri scurte îndreptate spre interior
{
	const cx = 200, cy = 210, rx = 95, ry = 70;
	let hach = "";
	const N = 14;
	for (let i = 0; i < N; i++) {
		const a = (i / N) * Math.PI * 2;
		const ex = cx + rx * Math.cos(a), ey = cy + ry * Math.sin(a);
		const ix = cx + (rx - 22) * Math.cos(a), iy = cy + (ry - 22) * Math.sin(a);
		hach += `<line x1="${ex.toFixed(1)}" y1="${ey.toFixed(1)}" x2="${ix.toFixed(1)}" y2="${iy.toFixed(1)}" stroke="${INK}" stroke-width="3" stroke-linecap="round"/>`;
	}
	files["legenda-depresiune"] = `${cardHead}
<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="none" stroke="${INK}" stroke-width="3.5"/>
${hach}
${cardTail}`;
}

// peșteră: bloc stâncos + gură de peșteră (arc întunecat) cu linii radiale
files["legenda-pestera"] = `${cardHead}
<path d="M90 300 L100 210 L140 170 L200 150 L270 175 L305 220 L312 300 Z" fill="#c9bfa8" stroke="${INK}" stroke-width="3" stroke-linejoin="round"/>
<path d="M155 300 Q160 230 200 225 Q240 230 245 300 Z" fill="${INK}"/>
<path d="M172 255 L150 235 M186 240 L172 212 M200 235 L200 202 M214 240 L228 212 M228 255 L250 235" stroke="${INK}" stroke-width="2.5" stroke-linecap="round" opacity="0.7"/>
${cardTail}`;

// mlaștină: smocuri de iarbă + linii de apă pe fond albăstrui-verzui
{
	let tufts = "";
	const rows = [140, 190, 240, 290];
	for (let r = 0; r < rows.length; r++) {
		const y = rows[r];
		const xOff = r % 2 === 0 ? 90 : 120;
		for (let c = 0; c < 4; c++) {
			const x = xOff + c * 55;
			tufts += `<path d="M${x} ${y} l-7 -16 M${x} ${y} l0 -18 M${x} ${y} l7 -16" stroke="${INK}" stroke-width="2.5" stroke-linecap="round" fill="none"/>`;
			tufts += `<line x1="${x - 22}" y1="${y}" x2="${x + 22}" y2="${y}" stroke="${AZURE}" stroke-width="2.5" opacity="0.6"/>`;
		}
	}
	files["legenda-mlastina"] = `${cardHead}
<rect x="70" y="120" width="260" height="190" rx="14" fill="${AZURE}" opacity="0.12"/>
${tufts}
${cardTail}`;
}

// ---------------------------------------------------------------------
// 2. Curbe de nivel — inele imbricate, cu rază dependentă de unghi:
//    constantă (Rsteep) pe ¾ din cerc (versantul abrupt + nord/sud) și
//    umflată într-un singur lob (Rgentle) pe versantul lin. Asta face ca
//    diferența deasă/rară să se vadă pe majoritatea inelului, nu doar
//    într-un punct — spre deosebire de vechiul model (blob eliptic cu
//    top/bottom identice pe ambele versante, care dilua contrastul).
//    Etichetele de altitudine se prind de inelul lor printr-o linie de
//    indicație (leader) + un punct exact pe curbă, nu prin poziție
//    aproximativă — fiecare literă și fiecare cifră aparțin fără dubiu
//    unei singure curbe.
// ---------------------------------------------------------------------
const BAND = ["#E07A5F", "#EF9B79", "#F2CC8F", "#F7DAA8", "#FDF6EC"]; // i=0 (cel mai înalt) .. i=4
const STEEP_GROW = 24, GENTLE_GROW = 88, BASE_R = 40; // raport ≈ 3.7×

function ringRadius(i, thetaDeg, gentleTheta) {
	// unghiul relativ la centrul lobului lin; înfoiere doar pe versantul lin
	// (max(0,cos) ⇒ 0 pe restul de ¾ din cerc, deci rază constantă = abrupt acolo)
	const rel = ((thetaDeg - gentleTheta) * Math.PI) / 180;
	const bulge = Math.max(0, Math.cos(rel));
	return BASE_R + STEEP_GROW * i + (GENTLE_GROW - STEEP_GROW) * i * bulge;
}
function ringPoint(cx, cy, thetaDeg, r) {
	const rad = (thetaDeg * Math.PI) / 180;
	return [cx + r * Math.cos(rad), cy + r * Math.sin(rad)];
}
function ringPath(cx, cy, i, gentleTheta) {
	const pts = [];
	for (let t = 0; t <= 360; t += 6) {
		const r = ringRadius(i, t, gentleTheta);
		pts.push(ringPoint(cx, cy, t, r));
	}
	return "M " + pts.map(([x, y]) => `${x.toFixed(1)} ${y.toFixed(1)}`).join(" L ") + " Z";
}

function pinMarker(x, y, letter, r = 15) {
	return `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${r}" fill="${INK}" stroke="${CREAM}" stroke-width="3"/>
<text x="${x.toFixed(1)}" y="${y.toFixed(1)}" font-family="sans-serif" font-size="${r >= 14 ? 18 : 14}" font-weight="700" fill="${CREAM}" text-anchor="middle" dy=".35em">${letter}</text>`;
}

// etichetă de altitudine, prinsă de inelul `i` prin linie de indicație:
// punct exact pe curbă la (theta, r(theta,i)) + segment radial spre exterior
// până în zonă liberă, unde stă cifra într-o pastilă.
function ringLabel(cx, cy, i, thetaDeg, gentleTheta, alt, leaderLen = 34) {
	const r = ringRadius(i, thetaDeg, gentleTheta);
	const [bx, by] = ringPoint(cx, cy, thetaDeg, r);
	const [tx, ty] = ringPoint(cx, cy, thetaDeg, r + leaderLen);
	return `<line x1="${bx.toFixed(1)}" y1="${by.toFixed(1)}" x2="${tx.toFixed(1)}" y2="${ty.toFixed(1)}" stroke="${INK}" stroke-width="1.5"/>
<circle cx="${bx.toFixed(1)}" cy="${by.toFixed(1)}" r="3.2" fill="${INK}"/>
<rect x="${(tx - 23).toFixed(1)}" y="${(ty - 13).toFixed(1)}" width="46" height="24" fill="${CREAM}" stroke="${INK}" stroke-width="1" opacity="0.96" rx="5"/>
<text x="${tx.toFixed(1)}" y="${ty.toFixed(1)}" font-family="sans-serif" font-size="16" font-weight="700" fill="${INK}" text-anchor="middle" dy=".35em">${alt}</text>`;
}

// Cutia de încadrare a întregului desen (inele + vârfurile etichetelor +
// marcajele), calculată din geometrie — nu ghicită. Canvas-ul se dimensionează
// din asta, deci nimic nu poate ieși din cadru, oricât de departe ajunge o
// linie de indicație.
function computeBounds(gentleTheta, labels, points) {
	let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
	const upd = (x, y) => {
		if (x < minX) minX = x;
		if (x > maxX) maxX = x;
		if (y < minY) minY = y;
		if (y > maxY) maxY = y;
	};
	for (let i = 0; i < 5; i++) {
		for (let t = 0; t <= 360; t += 6) {
			const [x, y] = ringPoint(0, 0, t, ringRadius(i, t, gentleTheta));
			upd(x, y);
		}
	}
	for (const l of labels) {
		const r = ringRadius(l.i, l.theta, gentleTheta) + l.leaderLen;
		const [tx, ty] = ringPoint(0, 0, l.theta, r);
		upd(tx - 24, ty - 14);
		upd(tx + 24, ty + 14);
	}
	for (const p of points) {
		const r = ringRadius(p.i, p.theta, gentleTheta) * (p.rScale ?? 1);
		const [x, y] = ringPoint(0, 0, p.theta, r);
		upd(x - p.r - 4, y - p.r - 4);
		upd(x + p.r + 4, y + p.r + 4);
	}
	return { minX, maxX, minY, maxY };
}

function contourMap({ gentleTheta, altTop, labels, points }) {
	const PAD = 26;
	const b = computeBounds(gentleTheta, labels, points);
	const cx = PAD - b.minX, cy = PAD - b.minY;
	const W = Math.ceil(b.maxX - b.minX + 2 * PAD), H = Math.ceil(b.maxY - b.minY + 2 * PAD);
	let body = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}"><rect width="${W}" height="${H}" fill="${CREAM}"/>`;
	for (let i = 4; i >= 0; i--) {
		body += `<path d="${ringPath(cx, cy, i, gentleTheta)}" fill="${BAND[i]}" stroke="${INK}" stroke-width="2.5"/>`;
	}
	for (const l of labels) body += ringLabel(cx, cy, l.i, l.theta, gentleTheta, altTop - l.i * 20, l.leaderLen);
	for (const p of points) {
		const r = ringRadius(p.i, p.theta, gentleTheta) * (p.rScale ?? 1);
		const [x, y] = ringPoint(cx, cy, p.theta, r);
		body += pinMarker(x, y, p.letter, p.r);
	}
	body += `</svg>`;
	return body;
}

// contur 1: versant abrupt înconjoară ¾ din deal, lobul lin iese spre EST
// (gentleTheta=0°); 1240 (interior) .. 1160 (exterior).
{
	const gentleTheta = 0;
	// A=1200 pe lobul lin (est, lângă raza de citire), B=1200 pe versantul
	// abrupt (vest — rază constantă tot ocolul, deci orice unghi 90–270° e ok),
	// C=1180 pe lobul lin (mai spre exterior decât A), D=lângă vârf.
	const points = [
		{ i: 2, theta: 14, letter: "A", r: 15 }, // 1200, lin
		{ i: 2, theta: 180, letter: "B", r: 12 }, // 1200, abrupt
		{ i: 3, theta: -16, letter: "C", r: 15 }, // 1180, lin
		{ i: 0, theta: 90, letter: "D", r: 14, rScale: 0.35 }, // în interiorul inelului 0, la vârf
	];
	// etichete: câte una per inel pe lobul lin (evantai, spațiate radial și
	// unghiular — la aceste raze diferența dintre inele e mare, deci nu se
	// suprapun), plus o etichetă suplimentară lângă B, pe versantul abrupt.
	const labels = [
		{ i: 0, theta: 0, leaderLen: 30 },
		{ i: 1, theta: 22, leaderLen: 32 },
		{ i: 2, theta: -22, leaderLen: 34 },
		{ i: 3, theta: 40, leaderLen: 36 },
		{ i: 4, theta: -40, leaderLen: 38 },
		{ i: 2, theta: 165, leaderLen: 46 }, // etichetă suplimentară lângă B (abrupt)
	];
	files["relief-contur-1"] = contourMap({ gentleTheta, altTop: 1240, labels, points });
}

// contur 2: versant abrupt înconjoară ¾ din deal, lobul lin iese spre VEST
// (gentleTheta=180°); 1180 (interior) .. 1100 (exterior).
{
	const gentleTheta = 180;
	// A=1140 pe versantul abrupt (est), B=1140 pe lobul lin (vest, corect
	// pentru Camera 2 Q3), C=1100 pe lobul lin (mai spre exterior), D=vârf.
	const points = [
		{ i: 2, theta: 0, letter: "A", r: 12 }, // 1140, abrupt
		{ i: 2, theta: 166, letter: "B", r: 15 }, // 1140, lin
		{ i: 4, theta: 196, letter: "C", r: 15 }, // 1100, lin
		{ i: 0, theta: 90, letter: "D", r: 14, rScale: 0.35 }, // în interiorul inelului 0, la vârf
	];
	const labels = [
		{ i: 0, theta: 180, leaderLen: 30 },
		{ i: 1, theta: 158, leaderLen: 32 },
		{ i: 2, theta: 202, leaderLen: 34 },
		{ i: 3, theta: 140, leaderLen: 36 },
		{ i: 4, theta: 220, leaderLen: 38 },
		{ i: 2, theta: -15, leaderLen: 46 }, // etichetă suplimentară lângă A (abrupt)
	];
	files["relief-contur-2"] = contourMap({ gentleTheta, altTop: 1180, labels, points });
}

// ---------------------------------------------------------------------
// 3. Rețea cartografică — paralele/meridiane din 15° în 15°, puncte A–D.
// ---------------------------------------------------------------------
function lonLabel(v) {
	if (v === 0) return "0°";
	return v > 0 ? `${v}°E` : `${-v}°V`;
}
function latLabel(v) {
	if (v === 0) return "0°";
	return v > 0 ? `${v}°N` : `${-v}°S`;
}

function graticule({ lonMin, lonMax, latMin, latMax, pins }) {
	const W = 520, H = 520, M = 60, S = 400;
	const px = (lon) => M + ((lon - lonMin) / (lonMax - lonMin)) * S;
	const py = (lat) => M + (1 - (lat - latMin) / (latMax - latMin)) * S;
	let body = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}"><rect width="${W}" height="${H}" fill="${CREAM}"/>`;
	body += `<rect x="${M}" y="${M}" width="${S}" height="${S}" fill="${SAND}" opacity="0.35" stroke="${INK}" stroke-width="3"/>`;
	const lons = [];
	for (let v = lonMin; v <= lonMax; v += 15) lons.push(v);
	const lats = [];
	for (let v = latMin; v <= latMax; v += 15) lats.push(v);
	for (const v of lons) {
		const x = px(v);
		const bold = v === 0;
		body += `<line x1="${x.toFixed(1)}" y1="${M}" x2="${x.toFixed(1)}" y2="${M + S}" stroke="${bold ? TERRA : INK}" stroke-width="${bold ? 3 : 1.3}" opacity="${bold ? 0.9 : 0.5}"/>`;
		body += `<text x="${x.toFixed(1)}" y="${M - 14}" font-family="sans-serif" font-size="16" font-weight="700" fill="${INK}" text-anchor="middle">${lonLabel(v)}</text>`;
	}
	for (const v of lats) {
		const y = py(v);
		const bold = v === 0;
		body += `<line x1="${M}" y1="${y.toFixed(1)}" x2="${M + S}" y2="${y.toFixed(1)}" stroke="${bold ? TERRA : INK}" stroke-width="${bold ? 3 : 1.3}" opacity="${bold ? 0.9 : 0.5}"/>`;
		body += `<text x="${M - 12}" y="${(y + 5).toFixed(1)}" font-family="sans-serif" font-size="16" font-weight="700" fill="${INK}" text-anchor="end">${latLabel(v)}</text>`;
	}
	for (const p of pins) body += pinMarker(px(p.lon), py(p.lat), p.letter);
	body += `</svg>`;
	return body;
}

files["coord-1"] = graticule({
	lonMin: 0,
	lonMax: 60,
	latMin: 15,
	latMax: 75,
	pins: [
		{ letter: "A", lon: 10, lat: 30 },
		{ letter: "B", lon: 25, lat: 45 }, // 45°N 25°E
		{ letter: "C", lon: 25, lat: 60 },
		{ letter: "D", lon: 40, lat: 45 },
	],
});
files["coord-2"] = graticule({
	lonMin: -60,
	lonMax: 0,
	latMin: 0,
	latMax: 60,
	pins: [
		{ letter: "A", lon: -20, lat: 30 }, // 30°N 20°V
		{ letter: "B", lon: -20, lat: 45 },
		{ letter: "C", lon: -5, lat: 30 },
		{ letter: "D", lon: -50, lat: 15 },
	],
});
files["coord-3"] = graticule({
	lonMin: 15,
	lonMax: 75,
	latMin: -60,
	latMax: 0,
	pins: [
		{ letter: "A", lon: 45, lat: -15 }, // 15°S 45°E
		{ letter: "B", lon: 60, lat: -15 },
		{ letter: "C", lon: 45, lat: -30 },
		{ letter: "D", lon: 30, lat: -45 },
	],
});
files["coord-4"] = graticule({
	lonMin: -75,
	lonMax: -15,
	latMin: -60,
	latMax: 0,
	pins: [
		{ letter: "A", lon: -45, lat: -30 },
		{ letter: "B", lon: -60, lat: -15 },
		{ letter: "C", lon: -60, lat: -30 }, // 30°S 60°V
		{ letter: "D", lon: -30, lat: -45 },
	],
});

for (const [name, svg] of Object.entries(files)) {
	const p = join(OUT, `${name}.svg`);
	writeFileSync(p, svg, "utf8");
	console.log("wrote", p);
}
console.log("\nRasterizează cu: node app/scripts/rasterize.mjs " + OUT + " 1600");
