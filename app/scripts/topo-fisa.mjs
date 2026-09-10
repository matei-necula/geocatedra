// Decupează exercițiile din fișa de topografie („Din profil pe hartă") și le
// recompune în banda lată folosită de joc: reperul în stânga, o linie
// despărțitoare, apoi cele trei variante una lângă alta.
//
// Usage: node scripts/topo-fisa.mjs <config.json> <dir-ieșire>
//
// config.json: [{ "src": "C:/.../1.jpg", "groups": [
//                  { "name": "R1-1", "box": [x0,y0,x1,y1] }, ... ] }]
//
// În sursă reperul stă deasupra, iar variantele (cu literele a./b./c. sub ele)
// pe un rând, dedesubt. Benzile se găsesc singure, prin proiecția cernelii.
import sharp from "sharp";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const [CFG, OUT] = process.argv.slice(2);
if (!CFG || !OUT) {
	console.error("Usage: node scripts/topo-fisa.mjs <config.json> <dir-ieșire>");
	process.exit(1);
}
const ALB = 205;      // sub pragul ăsta, pixelul e cerneală
const MIN_RAND = 4;   // sub atâția pixeli pe rând/coloană, e zgomot de scanare, nu desen

async function proiectie(buf, axa) {
	const { data, info } = await sharp(buf).removeAlpha().raw().toBuffer({ resolveWithObject: true });
	const { width: W, height: H, channels: C } = info;
	const out = new Array(axa === "y" ? H : W).fill(0);
	for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
		const i = (y * W + x) * C;
		if ((data[i] * 299 + data[i + 1] * 587 + data[i + 2] * 114) / 1000 < ALB) out[axa === "y" ? y : x]++;
	}
	return { p: out, W, H };
}
const bucati = (p, minGol, minRand = MIN_RAND) => {
	const seg = []; let s = -1, gol = 0;
	p.forEach((v0, i) => {
		const v = v0 >= minRand ? v0 : 0;
		if (v > 0) { if (s < 0) s = i; gol = 0; }
		else if (s >= 0) { gol++; if (gol >= minGol) { seg.push([s, i - gol]); s = -1; gol = 0; } }
	});
	if (s >= 0) seg.push([s, p.length - 1]);
	return seg;
};
const taie = (buf, l, t, w, h) => sharp(buf).extract({ left: l, top: t, width: w, height: h }).png().toBuffer();
// Strânge un decupaj pe cerneala din el, cu o marjă. Firimiturile de scanare —
// un punct rătăcit lângă desen — se ignoră: altfel caseta se întinde până la ele,
// desenul pare mult mai lat decât e și, scalat pe lățimea aia, iese minuscul.
async function stringe(buf, marja = 6, prag = 0.004) {
	const { p: py, W, H } = await proiectie(buf, "y");
	const { p: px } = await proiectie(buf, "x");
	const total = px.reduce((a, b) => a + b, 0);
	const reale = (p) => bucati(p, 1, 2).filter(([a, b]) => p.slice(a, b + 1).reduce((x, y) => x + y, 0) > total * prag);
	const yy = reale(py), xx = reale(px);
	if (!yy.length || !xx.length) return buf;
	const t = Math.max(0, yy[0][0] - marja), b = Math.min(H - 1, yy[yy.length - 1][1] + marja);
	const l = Math.max(0, xx[0][0] - marja), r = Math.min(W - 1, xx[xx.length - 1][1] + marja);
	return taie(buf, l, t, r - l + 1, b - t + 1);
}

// Desparte o variantă în desenul de sus și litera („a." / „b." / „c.") de jos.
// Întoarce null dacă nu se vede clar o literă mică sub desen.
async function imparteVarianta(buf) {
	const { p: py, W, H } = await proiectie(buf, "y");
	const seg = bucati(py, 4, 2);
	if (seg.length < 2) return null;
	const [lt, lb] = seg[seg.length - 1];
	const total = py.reduce((a, b) => a + b, 0);
	const cerneala = py.slice(lt, lb + 1).reduce((a, b) => a + b, 0);
	if (lb - lt + 1 > H * 0.4 || cerneala > total * 0.25) return null;   // aia nu e literă
	const [, db] = seg[seg.length - 2];
	return {
		forma: await stringe(await taie(buf, 0, 0, W, db + 1), 4),
		litera: await stringe(await taie(buf, 0, lt, W, lb - lt + 1), 4),
		gol: lt - db - 1,
	};
}
// Pune desenul deasupra, litera centrată sub el, la distanța dată.
async function lipesteVarianta(forma, litera, gol) {
	const mf = await sharp(forma).metadata(), ml = await sharp(litera).metadata();
	const W = Math.max(mf.width, ml.width), H = mf.height + gol + ml.height;
	return sharp({ create: { width: W, height: H, channels: 3, background: "#ffffff" } })
		.composite([
			{ input: forma, left: Math.round((W - mf.width) / 2), top: 0 },
			{ input: litera, left: Math.round((W - ml.width) / 2), top: mf.height + gol },
		])
		.png()
		.toBuffer();
}

const H_BANDA = 460;          // înălțimea de lucru a benzii compuse
const PAD = 26, GAP_VAR = 30, LATIME_LINIE = 56, LATIME_FINALA = 1800;

for (const plansa of JSON.parse(readFileSync(CFG, "utf8"))) {
	for (const g of plansa.groups) {
		const [x0, y0, x1, y1] = g.box;
		const celula = await taie(plansa.src, x0, y0, x1 - x0, y1 - y0);
		const { p: py, W: cw, H: ch } = await proiectie(celula, "y");
		const total = py.reduce((a, b) => a + b, 0);
		// desparte reperul (sus) de rândul variantelor (jos). Distanța dintre ele
		// diferă mult de la un exercițiu la altul, așa că slăbim pragul până când
		// ies exact formele așteptate: un singur desen sus, trei variante jos.
		let reper = null, rand = null, cols = null;
		for (const golRand of [26, 22, 18, 14, 12, 10, 8, 6, 5, 4, 3]) {
			const benzi = bucati(py, golRand).filter(([a, b]) => py.slice(a, b + 1).reduce((x, y) => x + y, 0) > total * 0.02);
			if (benzi.length < 2) continue;
			const sus = await taie(celula, 0, benzi[0][0], cw, benzi[0][1] - benzi[0][0] + 1);
			const { p: sx } = await proiectie(sus, "x");
			if (bucati(sx, 24).length !== 1) continue;   // sus trebuie să fie un singur desen
			// jos intră tot ce urmează după reper — inclusiv literele a./b./c.,
			// prea mici ca să treacă de filtrul de bandă
			const t2 = benzi[1][0];
			const toate = bucati(py, 1, 3);
			const b2 = Math.max(benzi[benzi.length - 1][1], toate.length ? toate[toate.length - 1][1] : 0);
			const jos = await taie(celula, 0, t2, cw, b2 - t2 + 1);
			const { p: jx } = await proiectie(jos, "x");
			let c = null;
			for (const prag of [80, 60, 50, 40, 34, 28, 24, 20, 16, 12, 10, 8]) {
				const cc = bucati(jx, prag);
				while (cc.length > 3) { // lipește bucata cea mai îngustă de vecina ei
					let k = 0; for (let i = 1; i < cc.length; i++) if (cc[i][1] - cc[i][0] < cc[k][1] - cc[k][0]) k = i;
					const j = k === 0 ? 1 : k - 1;
					cc[Math.min(k, j)] = [Math.min(cc[k][0], cc[j][0]), Math.max(cc[k][1], cc[j][1])];
					cc.splice(Math.max(k, j), 1);
				}
				if (cc.length === 3) { c = cc; break; }
			}
			if (!c) continue;
			reper = await stringe(sus);
			rand = jos; cols = c;
			if (process.env.TOPO_DEBUG) console.log(g.name, "gol=" + golRand, "benzi:", JSON.stringify(benzi));
			break;
		}
		if (!cols) { console.log(`${g.name}: nu pot separa reperul de cele trei variante, sar peste`); continue; }
		const { width: rw, height: rh } = await sharp(rand).metadata();
		let variante = [];
		for (const [a, b] of cols) {
			const l = Math.max(0, a - 10), w = Math.min(rw, b + 10) - l;
			variante.push(await stringe(await taie(rand, l, 0, w, rh), 8));
		}

		// `ordine` schimbă locul desenelor, ca răspunsul corect să nu cadă mereu pe
		// aceeași literă. Literele NU se mută cu desenele: rămân a., b., c. de la
		// stânga la dreapta, altfel banda ar scrie „b. a. c.". Cheia din game.json
		// trebuie permutată la fel (answer și why).
		if (g.ordine) {
			const parti = [];
			for (const v of variante) parti.push(await imparteVarianta(v));
			if (parti.some((x) => !x)) {
				console.log(`${g.name}: nu pot despărți litera de desen, las ordinea din fișă`);
			} else {
				const noi = [];
				for (let i = 0; i < 3; i++) noi.push(await lipesteVarianta(parti[g.ordine[i]].forma, parti[i].litera, parti[i].gol));
				variante = noi;
				console.log(`${g.name}: desene reordonate ${g.ordine.join("")} (literele rămân a b c)`);
			}
		}

		// un singur factor de scară pentru variante, ca să-și păstreze mărimile
		// relative; reperul se scalează separat, pe toată înălțimea benzii
		const metaV = [];
		for (const v of variante) metaV.push(await sharp(v).metadata());
		const k = H_BANDA / Math.max(...metaV.map((m) => m.height));
		const varScalate = [];
		for (let i = 0; i < variante.length; i++)
			varScalate.push(await sharp(variante[i]).resize({ width: Math.round(metaV[i].width * k), height: Math.round(metaV[i].height * k) }).toBuffer());
		const mv = [];
		for (const v of varScalate) mv.push(await sharp(v).metadata());

		const mr0 = await sharp(reper).metadata();
		const kr = Math.min(H_BANDA / mr0.height, (H_BANDA * 2.4) / mr0.width);
		const reperS = await sharp(reper).resize({ width: Math.round(mr0.width * kr), height: Math.round(mr0.height * kr) }).toBuffer();
		const mr = await sharp(reperS).metadata();

		const latVar = mv.reduce((a, m) => a + m.width, 0) + GAP_VAR * 2;
		const Wt = PAD + mr.width + LATIME_LINIE + latVar + PAD;
		const Ht = PAD + H_BANDA + PAD;
		const comp = [{ input: reperS, left: PAD, top: PAD + Math.round((H_BANDA - mr.height) / 2) }];
		comp.push({
			input: Buffer.from(`<svg width="${LATIME_LINIE}" height="${Ht}" xmlns="http://www.w3.org/2000/svg"><line x1="${LATIME_LINIE / 2}" y1="${PAD}" x2="${LATIME_LINIE / 2}" y2="${Ht - PAD}" stroke="#c9c2b4" stroke-width="3"/></svg>`),
			left: PAD + mr.width, top: 0,
		});
		let x = PAD + mr.width + LATIME_LINIE;
		for (let i = 0; i < varScalate.length; i++) {
			comp.push({ input: varScalate[i], left: x, top: PAD + H_BANDA - mv[i].height });
			x += mv[i].width + GAP_VAR;
		}
		const banda = await sharp({ create: { width: Wt, height: Ht, channels: 3, background: "#ffffff" } })
			.composite(comp)
			.png()
			.toBuffer();
		await sharp(banda).resize({ width: LATIME_FINALA }).webp({ quality: 92 }).toFile(join(OUT, `${g.name}.webp`));
		console.log(`${g.name}: ${Wt}x${Ht} -> ${LATIME_FINALA}x${Math.round((Ht * LATIME_FINALA) / Wt)} (${(Wt / Ht).toFixed(2)}:1)`);
	}
}
