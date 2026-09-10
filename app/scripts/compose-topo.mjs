// Recompune exercițiile din fișa de topografie pentru jocul „Din profil pe hartă".
// În sursă reperul stă deasupra, iar cele trei variante una lângă alta — o bandă
// de ~7:1, care în card ajunge pe jumătate de lățime și se vede minusculă.
// Aici: reperul în stânga, variantele stivuite în coloană la dreapta, ca imaginea
// să fie aproape pătrată și să umple pe înălțime.
// Usage: node scripts/compose-topo.mjs <dir-celule> <dir-ieșire>
import sharp from "sharp";
import { readdirSync } from "node:fs";
import { join } from "node:path";
const [DIR, OUT] = process.argv.slice(2);

const ALB = 190;
async function profil(buf, axa) {
	const { data, info } = await sharp(buf).removeAlpha().raw().toBuffer({ resolveWithObject: true });
	const { width: W, height: H, channels: C } = info;
	const n = axa === "y" ? H : W;
	const out = new Array(n).fill(0);
	for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
		const i = (y * W + x) * C;
		if ((data[i] * 299 + data[i + 1] * 587 + data[i + 2] * 114) / 1000 < ALB) out[axa === "y" ? y : x]++;
	}
	return { p: out, W, H };
}
const bucati = (p, minGol) => {
	const seg = []; let s = -1, gol = 0;
	p.forEach((v, i) => {
		if (v > 0) { if (s < 0) s = i; gol = 0; }
		else if (s >= 0) { gol++; if (gol >= minGol) { seg.push([s, i - gol]); s = -1; gol = 0; } }
	});
	if (s >= 0) seg.push([s, p.length - 1]);
	return seg;
};
const taie = (buf, l, t, w, h) => sharp(buf).extract({ left: l, top: t, width: w, height: h }).png().toBuffer();

for (const f of readdirSync(DIR).filter((n) => n.endsWith(".png")).sort()) {
	const src = join(DIR, f);
	const { p: py, W, H } = await profil(src, "y");
	const benzi = bucati(py, 10);
	if (benzi.length < 2) { console.log(`${f}: nu pot separa reperul de variante`); continue; }
	let rep = await taie(src, 0, benzi[0][0], W, benzi[0][1] - benzi[0][0] + 1);
	{	// reperul ocupă doar o parte din lățimea celulei; fără strângerea asta
		// ar fi scalat împreună cu tot albul din jur și ar ieși minuscul
		const { p: rx, W: rw, H: rh } = await profil(rep, "x");
		const seg = bucati(rx, 12);
		if (seg.length) {
			const l = Math.max(0, seg[0][0] - 10), r = Math.min(rw - 1, seg[seg.length - 1][1] + 10);
			rep = await taie(rep, l, 0, r - l + 1, rh);
		}
	}
	const jos = benzi[benzi.length - 1];
	const strip = await taie(src, 0, jos[0], W, jos[1] - jos[0] + 1);

	// variantele: pe orizontală, despărțite de spații albe late
	const { p: px, W: sw, H: sh } = await profil(strip, "x");
	// lățimea spațiului dintre variante diferă de la o fișă la alta: coborâm
	// pragul până ies exact trei bucăți
	let cols = null;
	for (const prag of [40, 34, 28, 24, 20, 17, 14, 12, 10, 8]) {
		let c = bucati(px, prag);
		while (c.length > 3) { // lipește bucata cea mai îngustă de vecina ei
			let k = 0; for (let i = 1; i < c.length; i++) if (c[i][1] - c[i][0] < c[k][1] - c[k][0]) k = i;
			const j = k === 0 ? 1 : k - 1;
			c[Math.min(k, j)] = [Math.min(c[k][0], c[j][0]), Math.max(c[k][1], c[j][1])];
			c.splice(Math.max(k, j), 1);
		}
		if (c.length === 3) { cols = c; break; }
	}
	if (!cols) { console.log(`${f}: nu ies trei variante, sar peste`); continue; }
	const optiuni = [];
	for (const [a, b] of cols) {
		const l = Math.max(0, a - 8), w = Math.min(sw, b + 8) - l;
		const col = await taie(strip, l, 0, w, sh);
		const { p: cy } = await profil(col, "y");      // strânge pe conținut, altfel
		const seg = bucati(cy, 4);                      // rămâne mult alb și iese prea înalt
		const t = seg.length ? seg[0][0] : 0, bb = seg.length ? seg[seg.length - 1][1] : sh - 1;
		optiuni.push(await taie(col, 0, Math.max(0, t - 6), w, Math.min(sh, bb + 7) - Math.max(0, t - 6)));
	}

	// aceeași lățime pentru toate variantele, stivuite
	const OW = 760, GAP = 22, PAD = 20;
	const scalate = [];
	for (const o of optiuni) scalate.push(await sharp(o).resize({ width: OW, fit: "contain", background: "#ffffff" }).toBuffer());
	const hs = [];
	for (const s of scalate) hs.push((await sharp(s).metadata()).height);
	const dreaptaH = hs.reduce((a, b) => a + b, 0) + GAP * 2;

	const RW = 620;
	const repS = await sharp(rep).resize({ width: RW, height: dreaptaH, fit: "inside", background: "#ffffff" }).toBuffer();
	const rm = await sharp(repS).metadata();

	const Wt = PAD + RW + 44 + OW + PAD, Ht = PAD + dreaptaH + PAD;
	const comp = [{ input: repS, top: PAD + Math.round((dreaptaH - rm.height) / 2), left: PAD + Math.round((RW - rm.width) / 2) }];
	comp.push({ input: Buffer.from(`<svg width="44" height="${Ht}" xmlns="http://www.w3.org/2000/svg"><line x1="22" y1="${PAD + 10}" x2="22" y2="${Ht - PAD - 10}" stroke="#c9c2b4" stroke-width="3"/></svg>`), top: 0, left: PAD + RW });
	let y = PAD;
	for (let i = 0; i < scalate.length; i++) { comp.push({ input: scalate[i], top: y, left: PAD + RW + 44 }); y += hs[i] + GAP; }

	const plansa = await sharp({ create: { width: Wt, height: Ht, channels: 3, background: "#ffffff" } })
		.composite(comp.map((c) => ({ ...c, top: Math.max(0, c.top), left: Math.max(0, c.left) })))
		.png().toBuffer();
	await sharp(plansa).resize({ width: 1100 }).webp({ quality: 90 }).toFile(join(OUT, f.replace(".png", ".webp")));
	console.log(`${f}: ${Wt}x${Ht} (raport ${(Wt / Ht).toFixed(2)}:1)`);
}
