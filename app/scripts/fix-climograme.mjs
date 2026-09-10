// Repară două climograme din galeria „Climatele Terrei":
//  • Atena — panourile laterale și antetul erau gri, nu albastru/roz ca la
//    celelalte. Se reconstruiește paleta dintr-o climogramă-etalon (Iquitos):
//    pentru fiecare nivel de luminanță se ia culoarea medie din panoul-etalon
//    și se aplică pixelilor aproape-neutri din panourile Atenei (roșul
//    termometrului și albastrul graficului rămân neatinse).
//  • McMurdo — peste tot trece o grilă de caiet matematic. Liniile sunt
//    subțiri și puțin mai închise decât fundalul plat de dedesubt, deci se
//    umplu cu media vecinilor de la ±3 px, dar numai acolo unde vecinii seamănă
//    între ei (adică pe fundal, nu peste desen sau text).
// Usage: node scripts/fix-climograme.mjs <folder-cu-png-uri>
import sharp from "sharp";
import { join } from "node:path";

const dir = process.argv[2];
if (!dir) { console.error("Usage: node scripts/fix-climograme.mjs <folder>"); process.exit(1); }

const lum = (r, g, b) => (r * 299 + g * 587 + b * 114) / 1000;
const load = async (p) => {
	const { data, info } = await sharp(p).removeAlpha().raw().toBuffer({ resolveWithObject: true });
	return { d: data, W: info.width, H: info.height, C: info.channels };
};

// ---------- Atena: paleta gri -> paleta color ----------
function buildLut({ d, W, C }, [x0, y0, x1, y1]) {
	const sum = Array.from({ length: 256 }, () => [0, 0, 0, 0]);
	for (let y = y0; y < y1; y++) for (let x = x0; x < x1; x++) {
		const i = (y * W + x) * C, r = d[i], g = d[i+1], b = d[i+2];
		const s = sum[Math.round(lum(r, g, b))];
		s[0] += r; s[1] += g; s[2] += b; s[3]++;
	}
	const lut = new Array(256).fill(null);
	for (let l = 0; l < 256; l++) if (sum[l][3] > 20) lut[l] = [sum[l][0]/sum[l][3], sum[l][1]/sum[l][3], sum[l][2]/sum[l][3]];
	// completează golurile prin interpolare liniară între nivelurile cunoscute
	let prev = -1;
	for (let l = 0; l < 256; l++) {
		if (!lut[l]) continue;
		if (prev >= 0 && l - prev > 1) for (let k = prev + 1; k < l; k++) {
			const t = (k - prev) / (l - prev);
			lut[k] = lut[prev].map((v, c) => v + t * (lut[l][c] - v));
		}
		prev = l;
	}
	for (let l = 0; l < 256; l++) if (!lut[l]) lut[l] = [l, l, l];
	return lut;
}

function retint({ d, W, H, C }, lut, [x0, y0, x1, y1], maxChroma = 28) {
	for (let y = Math.max(0, y0); y < Math.min(H, y1); y++) for (let x = Math.max(0, x0); x < Math.min(W, x1); x++) {
		const i = (y * W + x) * C, r = d[i], g = d[i+1], b = d[i+2];
		if (Math.max(r, g, b) - Math.min(r, g, b) > maxChroma) continue; // are deja culoare
		const c = lut[Math.round(lum(r, g, b))];
		d[i] = Math.round(c[0]); d[i+1] = Math.round(c[1]); d[i+2] = Math.round(c[2]);
	}
}

// ---------- McMurdo: scoate grila ----------
function dropGrid({ d, W, H, C }, gap = 3, maxDark = 200, maxNeighbourDiff = 26, skip = null) {
	const out = Uint8Array.from(d);
	const at = (src, x, y) => { const i = (y * W + x) * C; return [src[i], src[i+1], src[i+2]]; };
	// Unde stă grila? O linie de caiet e mai închisă decât vecinii de la ±gap,
	// iar vecinii seamănă între ei — și asta se repetă pe aproape toată lungimea.
	const lattice = (horizontal) => {
		const n = horizontal ? W : H, m = horizontal ? H : W;
		const hit = new Set();
		for (let i = gap; i < n - gap; i++) {
			let c = 0;
			for (let j = 0; j < m; j++) {
				const [x, y] = horizontal ? [i, j] : [j, i];
				const [ax, ay] = horizontal ? [i - gap, j] : [j, i - gap];
				const [bx, by] = horizontal ? [i + gap, j] : [j, i + gap];
				const A = at(out, ax, ay), B = at(out, bx, by), P = at(out, x, y);
				let nd = 0, ok = true, dark = 0;
				for (let k = 0; k < 3; k++) {
					nd += Math.abs(A[k] - B[k]);
					if (P[k] > Math.min(A[k], B[k]) + 1) ok = false;
					dark += (A[k] + B[k]) / 2 - P[k];
				}
				if (ok && nd <= maxNeighbourDiff && dark > 6) c++;
			}
			if (c / m > 0.3) { hit.add(i); hit.add(i - 1); hit.add(i + 1); }
		}
		return hit;
	};
	const pass = (horizontal, hit) => {
		const src = Uint8Array.from(out);
		const n = horizontal ? W : H, m = horizontal ? H : W;
		for (const i of hit) {
			if (i < gap || i >= n - gap) continue;
			for (let j = 0; j < m; j++) {
				const [x, y] = horizontal ? [i, j] : [j, i];
				if (skip && skip(x, y)) continue;
				const [ax, ay] = horizontal ? [i - gap, j] : [j, i - gap];
				const [bx, by] = horizontal ? [i + gap, j] : [j, i + gap];
				const A = at(src, ax, ay), B = at(src, bx, by), P = at(src, x, y);
				let nd = 0, dark = 0, ok = true;
				for (let k = 0; k < 3; k++) {
					nd += Math.abs(A[k] - B[k]);
					if (P[k] > Math.min(A[k], B[k]) + 1) ok = false;
					dark += (A[k] + B[k]) / 2 - P[k];
				}
				if (!ok || nd > maxNeighbourDiff || dark < 6 || dark > maxDark * 3) continue;
				const i0 = (y * W + x) * C;
				for (let k = 0; k < 3; k++) out[i0 + k] = Math.round((A[k] + B[k]) / 2);
			}
		}
	};
	pass(true, lattice(true));
	pass(false, lattice(false));
	return out;
}

const save = (buf, W, H, C, p) =>
	sharp(Buffer.from(buf), { raw: { width: W, height: H, channels: C } }).png().toFile(p);

// --- Atena ---
const etalon = await load(join(dir, "02-climograma-iquitos.png"));
const atena = await load(join(dir, "10-climograma-atena.png"));
const HEADER = 190, LEFT = 349, RIGHT = 1025;
const lutBlue = buildLut(etalon, [16, 200, LEFT, etalon.H - 20]);
const lutPink = buildLut(etalon, [RIGHT, 200, etalon.W - 16, etalon.H - 20]);
retint(atena, lutBlue, [0, 0, atena.W, HEADER]);                 // antet
retint(atena, lutBlue, [0, HEADER, LEFT, atena.H]);              // panourile din stânga
retint(atena, lutPink, [RIGHT, HEADER, atena.W, atena.H]);       // panourile din dreapta
await save(atena.d, atena.W, atena.H, atena.C, join(dir, "10-climograma-atena-fix.png"));
console.log("Atena: panouri recolorate -> 10-climograma-atena-fix.png");

// --- McMurdo ---
const mc = await load(join(dir, "21-climograma-mcmurdo.png"));
// Graficul din mijloc are grila lui, legitimă — nu se atinge la trecerea tare.
const CHART = [345, 155, 1040, mc.H];
const inChart = (x, y) => x >= CHART[0] && x <= CHART[2] && y >= CHART[1] && y <= CHART[3];
let cleaned = dropGrid(mc, 3, 80);                                              // blând, peste tot
const step = (g) => { cleaned = dropGrid({ d: cleaned, W: mc.W, H: mc.H, C: mc.C }, g, 200, 26, inChart); };
step(3); step(5);                                                               // tare, în afara graficului
await save(cleaned, mc.W, mc.H, mc.C, join(dir, "21-climograma-mcmurdo-fix.png"));
console.log("McMurdo: grilă ștearsă -> 21-climograma-mcmurdo-fix.png");
