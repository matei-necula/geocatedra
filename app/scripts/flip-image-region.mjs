// Întoarce pe verticală o zonă dintr-o imagine — de exemplu o săgeată desenată
// invers — fără să lase peticul să se vadă: forma se ia cu transparență (după
// cât de „colorat" e pixelul față de fundal), iar fundalul de sub ea se
// reconstruiește pe rânduri, ca o rampă liniară potrivită pe pixelii curați.
// Un simplu decupaj întors ar aduce cu el și fundalul din casetă, care aproape
// niciodată nu e uniform (umbre, vignetare) — și atunci se vede dreptunghiul.
//
// Usage: node scripts/flip-image-region.mjs <sursa> <ieșire.png> <boxes.json>
//
// boxes.json: [{ "box": [x0,y0,x1,y1],
//                "canal": "r-g",   // ce face pixelul „formă": r-g (roșu, implicit),
//                                  //   g-r (verde), b-r (albastru), lum (închis pe deschis)
//                "prag": 60 }]     // pe câte niveluri se face opac
import sharp from "sharp";
import { readFileSync } from "node:fs";

const [SRC, OUT, BOXES] = process.argv.slice(2);
if (!SRC || !OUT || !BOXES) {
	console.error("Usage: node scripts/flip-image-region.mjs <sursa> <ieșire.png> <boxes.json>");
	process.exit(1);
}
const zone = JSON.parse(readFileSync(BOXES, "utf8"));

const { data, info } = await sharp(SRC).removeAlpha().raw().toBuffer({ resolveWithObject: true });
const { width: W, height: H, channels: C } = info;
const out = Buffer.from(data);
const med = (a) => { const b = [...a].sort((x, y) => x - y); return b[Math.floor(b.length / 2)]; };

for (const z of zone) {
	const [x0, y0, x1, y1] = z.box;
	const prag = z.prag || 60;
	const alfa = (x, y) => {
		const i = (y * W + x) * C, r = data[i], g = data[i + 1], b = data[i + 2];
		const v = z.canal === "g-r" ? g - r : z.canal === "b-r" ? b - r : z.canal === "lum" ? 255 - (r * 299 + g * 587 + b * 114) / 1000 : r - g;
		return Math.max(0, Math.min(1, v / prag));
	};
	const w = Math.min(x1, W) - x0, h = Math.min(y1, H) - y0;
	// coloane „curate": fundal neutru pe toată înălțimea casetei (fără desenul de
	// alături, care ar trage rampa după culorile lui)
	const curate = [];
	for (let x = Math.max(0, x0 - 10); x < Math.min(W, x1 + 10); x++) {
		let ok = true;
		for (let y = y0; y < y0 + h && ok; y++) {
			if (alfa(x, y) >= 0.04) continue;
			const i = (y * W + x) * C, mx = Math.max(data[i], data[i + 1], data[i + 2]), mn = Math.min(data[i], data[i + 1], data[i + 2]);
			if (mx - mn > 12 || mn < 110) ok = false;
		}
		if (ok) curate.push(x);
	}
	// fundalul pe fiecare rând: dreaptă prin cei mai mici pătrate, luată la capetele casetei
	const st = [[], [], []], dr = [[], [], []];
	for (let y = y0; y < y0 + h; y++) {
		for (let c = 0; c < 3; c++) {
			let n = 0, sx = 0, sy = 0, sxx = 0, sxy = 0;
			for (const x of curate) {
				if (alfa(x, y) >= 0.04) continue;
				const v = data[(y * W + x) * C + c];
				n++; sx += x; sy += v; sxx += x * x; sxy += x * v;
			}
			const den = n * sxx - sx * sx;
			const m = den && n >= 10 ? (n * sxy - sx * sy) / den : 0;
			const q = n ? (sy - m * sx) / n : 243;
			st[c].push(q + m * x0);
			dr[c].push(q + m * (x0 + w - 1));
		}
	}
	const neted = (a) => a.map((_, k) => med(a.slice(Math.max(0, k - 3), Math.min(a.length, k + 4))));
	const S = st.map(neted), D = dr.map(neted);
	// forma, întoarsă, peste fundalul refăcut
	const sursa = [];
	for (let y = y0; y < y0 + h; y++) {
		const rand = [];
		for (let x = x0; x < x0 + w; x++) { const i = (y * W + x) * C; rand.push([data[i], data[i + 1], data[i + 2], alfa(x, y)]); }
		sursa.push(rand);
	}
	for (let ry = 0; ry < h; ry++) {
		const sy = h - 1 - ry;
		for (let rx = 0; rx < w; rx++) {
			const i = ((y0 + ry) * W + x0 + rx) * C, t = w > 1 ? rx / (w - 1) : 0, p = sursa[sy][rx];
			for (let c = 0; c < 3; c++) {
				const bg = S[c][ry] * (1 - t) + D[c][ry] * t;
				out[i + c] = Math.max(0, Math.min(255, Math.round(bg * (1 - p[3]) + p[c] * p[3])));
			}
		}
	}
	console.log(`[${z.box.join(",")}] întors — ${curate.length} coloane curate pentru fundal`);
}
await sharp(out, { raw: { width: W, height: H, channels: C } }).png().toFile(OUT);
console.log(`-> ${OUT}`);
