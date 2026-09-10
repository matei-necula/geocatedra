// Rescrie etichete de text dintr-o imagine raster: șterge vechiul rând
// (interpolând fundalul pe orizontală) și redesenează textul corect, la aceeași
// mărime și pe aceeași linie de bază.
// Usage: node scripts/patch-image-labels.mjs <sursa> <ieșire.png> <edits.json>
//
// edits.json: [{ "name": "...",
//                "box": [x0,y0,x1,y1],   // caseta rândului vechi (ink bbox)
//                "anchor": "crusta",     // cuvânt nemodificat din aceeași etichetă
//                "anchorW": 144,         // lățimea lui în pixeli -> dă mărimea fontului
//                "text": "continentală", // textul nou (lipsește = doar se șterge)
//                "cx": 2672,             // opțional: centru orizontal (implicit centrul casetei)
//                "pad": 8, "thr": 130,   // marja și pragul de ștergere
//                "ink": "dark",          // „light" (implicit) = text alb pe fundal închis;
//                                        // „dark" = text închis pe fundal deschis
//                "fitBy": "h",           // potrivește ancora pe înălțime (implicit: pe lățime)
//                "anchorH": 15,          // înălțimea ancorei, când fitBy = "h"
//                "weight": "auto",       // 400/700, sau „auto" = o alege după ancoră
//                "font": "Georgia, serif",   // familia de font (implicit: Arial)
//                "copyDx": -300 }]           // în loc să interpoleze fundalul,
//   copiază zona de la deplasarea dată (utile pe fundaluri cu textură: hârtie,
//   hașuri — interpolarea le-ar netezi și peticul s-ar vedea).
import sharp from "sharp";

const SRC = process.argv[2];
const OUT = process.argv[3];

const base = sharp(SRC).removeAlpha();
const { data, info } = await base.raw().toBuffer({ resolveWithObject: true });
const { width: W, height: H, channels: C } = info;
const px = Buffer.from(data);
let THR = 200, DARK = false;
// „cerneala" de șters: fie pixeli aproape-albi, fie pixeli mai închiși decât pragul
const isWhite = (x, y) => {
	const i = (y * W + x) * C;
	return DARK
		? (px[i] * 299 + px[i + 1] * 587 + px[i + 2] * 114) / 1000 < THR
		: px[i] >= THR && px[i + 1] >= THR && px[i + 2] >= THR;
};
const lumAt = (i) => (px[i] * 299 + px[i + 1] * 587 + px[i + 2] * 114) / 1000;
// culoarea reală a glifei: pixelul cel mai închis din casetă
function inkColor(x0, y0, x1, y1) {
	let best = 1e9, c = "#000000";
	for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) {
		const i = (y * W + x) * C, l = lumAt(i);
		if (l < best) { best = l; c = "#" + [px[i], px[i + 1], px[i + 2]].map((v) => v.toString(16).padStart(2, "0")).join(""); }
	}
	return c;
}

// ---- ink bbox of an SVG-rendered string, and font fitting -------------------
let FONT = "Arial, Helvetica, Liberation Sans, sans-serif";
const svgText = (text, size, w, h, x, y, weight, fill = "#ffffff") =>
	Buffer.from(`<svg width="${w}" height="${h}" xmlns="http://www.w3.org/2000/svg"><text x="${x}" y="${y}" font-family="${FONT}" font-weight="${weight}" font-size="${size}" fill="${fill}">${text}</text></svg>`);

// renders the string on a transparent canvas and returns a TIGHT RGBA crop plus
// where the pen (baseline origin) sits inside that crop
async function inkBox(text, size, weight, fill = "#ffffff") {
	const w = Math.ceil(size * text.length * 1.4) + 400, h = Math.ceil(size * 3);
	const penX = 200, penY = Math.round(size * 2);
	const r = await sharp(svgText(text, size, w, h, penX, penY, weight, fill)).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
	const d = r.data, ch = r.info.channels;
	let x0 = w, x1 = -1, y0 = h, y1 = -1;
	for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
		if (d[(y * w + x) * ch + 3] > 40) { if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; }
	}
	if (x1 < 0) throw new Error(`nimic randat pentru „${text}"`);
	const tight = await sharp(svgText(text, size, w, h, penX, penY, weight, fill))
		.extract({ left: x0, top: y0, width: x1 - x0 + 1, height: y1 - y0 + 1 }).png().toBuffer();
	return { w: x1 - x0 + 1, h: y1 - y0 + 1, dx: x0 - penX, dy: y0 - penY, tight };
}

// alege font-size astfel încât `anchor` să se randeze la `target` px pe axa cerută
async function fitSize(anchor, target, weight, by = "w") {
	let lo = 4, hi = 200;
	for (let i = 0; i < 24; i++) {
		const mid = (lo + hi) / 2;
		const b = await inkBox(anchor, mid, weight);
		if ((by === "h" ? b.h : b.w) > target) hi = mid; else lo = mid;
	}
	return (lo + hi) / 2;
}

// „auto": potrivește înălțimea ancorei pentru fiecare greutate și o alege pe cea
// a cărei lățime randată se apropie cel mai mult de lățimea reală din imagine
async function pickWeight(anchor, targetW, targetH, weight) {
	if (weight !== "auto") return { weight: weight || 400, size: await fitSize(anchor, targetH ?? targetW, weight || 400, targetH ? "h" : "w") };
	let best = null;
	for (const w of [400, 700]) {
		const size = await fitSize(anchor, targetH, w, "h");
		const b = await inkBox(anchor, size, w);
		const err = Math.abs(b.w - targetW);
		if (!best || err < best.err) best = { weight: w, size, err, w: b.w };
	}
	console.log(`   ancora „${anchor}": greutate ${best.weight}, lățime randată ${best.w} vs ${targetW} în imagine`);
	return best;
}

// ---- inpaint: erase text by interpolating background across each row --------
function inpaint(bx0, by0, bx1, by1, pad = 6) {
	const x0 = Math.max(0, bx0 - pad), x1 = Math.min(W - 1, bx1 + pad);
	const y0 = Math.max(0, by0 - pad), y1 = Math.min(H - 1, by1 + pad);
	// dilated mask of near-white pixels inside the box
	const mw = x1 - x0 + 1, mh = y1 - y0 + 1;
	const m = new Uint8Array(mw * mh);
	for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) if (isWhite(x, y)) {
		for (let dy = -3; dy <= 3; dy++) for (let dx = -3; dx <= 3; dx++) {
			const nx = x + dx, ny = y + dy;
			if (nx >= x0 && nx <= x1 && ny >= y0 && ny <= y1) m[(ny - y0) * mw + (nx - x0)] = 1;
		}
	}
	for (let y = y0; y <= y1; y++) {
		let x = x0;
		while (x <= x1) {
			if (!m[(y - y0) * mw + (x - x0)]) { x++; continue; }
			let e = x; while (e <= x1 && m[(y - y0) * mw + (e - x0)]) e++;
			// nearest clean pixels on either side (search beyond the box if needed)
			let L = x - 1; while (L >= 0 && isWhite(L, y)) L--;
			let R = e; while (R < W && isWhite(R, y)) R++;
			const li = L >= 0 ? (y * W + L) * C : -1, ri = R < W ? (y * W + R) * C : -1;
			for (let k = x; k < e; k++) {
				const t = ri < 0 ? 0 : li < 0 ? 1 : (k - L) / (R - L);
				const i = (y * W + k) * C;
				for (let c = 0; c < 3; c++) {
					const a = li < 0 ? px[ri + c] : px[li + c], b = ri < 0 ? px[li + c] : px[ri + c];
					px[i + c] = Math.round(a + (b - a) * t);
				}
			}
			x = e;
		}
	}
}

// ștergere prin copiere: aduce peste casetă o zonă curată de la (dx, dy), ca
// textura fundalului să rămână neatinsă
function copyOver([bx0, by0, bx1, by1], pad, dx, dy) {
	const x0 = Math.max(0, bx0 - pad), x1 = Math.min(W - 1, bx1 + pad);
	const y0 = Math.max(0, by0 - pad), y1 = Math.min(H - 1, by1 + pad);
	const src = [];
	for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) {
		const sx = Math.min(W - 1, Math.max(0, x + dx)), sy = Math.min(H - 1, Math.max(0, y + dy));
		const j = (sy * W + sx) * C;
		src.push(px[j], px[j + 1], px[j + 2]);
	}
	let k = 0;
	for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) {
		const i = (y * W + x) * C;
		px[i] = src[k++]; px[i + 1] = src[k++]; px[i + 2] = src[k++];
	}
}

// ---- the edits -------------------------------------------------------------
const EDITS = JSON.parse(process.argv[4]);
const overlays = [];
for (const e of EDITS) {
	FONT = e.font || "Arial, Helvetica, Liberation Sans, sans-serif";
	DARK = e.ink === "dark";
	THR = e.thr ?? (DARK ? 110 : 200);
	const fill = DARK ? inkColor(e.box[0], e.box[1], e.box[2], e.box[3]) : "#ffffff";
	if (e.copyDx || e.copyDy) copyOver(e.box, e.pad ?? 6, e.copyDx || 0, e.copyDy || 0);
	else inpaint(e.box[0], e.box[1], e.box[2], e.box[3], e.pad ?? 6);
	DARK = false; THR = 200;
	if (!e.text) { console.log(`${e.name}: șters`); continue; }
	const fit = await pickWeight(e.anchor, e.anchorW, e.fitBy === "h" ? e.anchorH : null, e.weight ?? 400);
	const { weight, size } = fit;
	const b = await inkBox(e.text, size, weight, fill);
	const cx = e.cx ?? Math.round((e.box[0] + e.box[2]) / 2);
	let left = cx - Math.round(b.w / 2);
	const top = e.box[3] + b.dy + 1;           // baseline of the new line == bottom of the old one
	left = Math.max(0, Math.min(W - b.w, left));
	overlays.push({ input: b.tight, left, top });
	console.log(`${e.name}: „${e.text}" size=${size.toFixed(1)} ink=${b.w}x${b.h} la (${left},${top})`);
}

let out = sharp(px, { raw: { width: W, height: H, channels: C } });
if (overlays.length) out = out.composite(overlays);
await out.png().toFile(OUT);
console.log("\n->", OUT);
