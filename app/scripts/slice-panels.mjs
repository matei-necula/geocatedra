#!/usr/bin/env node
// Dev tool: taie panourile dintr-o planșă didactică (grilă de casete pe un fundal
// mai deschis) în imagini separate, gata de ingest.
//
//   node app/scripts/slice-panels.mjs detect <plansa> [--thr 0.35]
//       Afișează benzile de rânduri/coloane detectate (procente din imagine),
//       ca să scrii apoi lista de decupaje.
//
//   node app/scripts/slice-panels.mjs cut <plansa> <out-dir> <spec.json>
//       Decupează. `spec.json`:
//         { "inset": 0.012,            // cât se mușcă din ramă, fracție din casetă
//           "width": 900,              // lățimea imaginii rezultate
//           "aspect": 1.42,            // opțional: raport fix pentru toate panourile
//           "trim": "#ffffff",         // opțional: taie marginea de fundal uniform…
//           "pad": "#ffffff",          // …apoi umple până la `aspect` cu culoarea asta
//           "panels": [{ "name": "rot-zi-noapte", "x": [0.026,0.256], "y": [0.146,0.425] }] }
//       `x`/`y` sunt fracții din planșă (stânga/dreapta, sus/jos). Fără `trim`,
//       `aspect` taie centrat; cu `trim` + `pad`, panoul se strânge pe conținut și
//       se completează cu fundal, ca să nu se piardă nimic din desen.
import sharp from "sharp";
import { readFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";

const [cmd, file, ...rest] = process.argv.slice(2);
if (!cmd || !file) {
	console.error("usage: slice-panels.mjs detect <plansa> [--thr N] | boxes <plansa> [--thr N] [--min F] | cut <plansa> <out-dir> <spec.json>");
	process.exit(1);
}

if (cmd === "detect") {
	const thrArg = rest.indexOf("--thr");
	const thr = thrArg >= 0 ? Number(rest[thrArg + 1]) : 0.35;
	const { data, info } = await sharp(file).greyscale().raw().toBuffer({ resolveWithObject: true });
	const { width: W, height: H } = info;
	const rowFrac = [];
	const colFrac = [];
	for (let y = 0; y < H; y++) {
		let s = 0;
		for (let x = 0; x < W; x++) s += data[y * W + x] < 95 ? 1 : 0;
		rowFrac.push(s / W);
	}
	for (let x = 0; x < W; x++) {
		let s = 0;
		for (let y = 0; y < H; y++) s += data[y * W + x] < 95 ? 1 : 0;
		colFrac.push(s / H);
	}
	const bands = (arr) => {
		const out = [];
		let start = -1;
		for (let i = 0; i < arr.length; i++) {
			if (arr[i] >= thr && start < 0) start = i;
			else if (arr[i] < thr && start >= 0) {
				if (i - start > arr.length * 0.03) out.push([start, i]);
				start = -1;
			}
		}
		if (start >= 0) out.push([start, arr.length]);
		return out;
	};
	const fmt = (b, n) => b.map(([a, z]) => `[${(a / n).toFixed(4)}, ${(z / n).toFixed(4)}]`).join("  ");
	console.log(`${file} — ${W}x${H}`);
	console.log("rânduri:", fmt(bands(rowFrac), H));
	console.log("coloane:", fmt(bands(colFrac), W));
	process.exit(0);
}

if (cmd === "boxes") {
	// Planșele cu așezare neregulată nu se lasă tăiate pe benzi de rânduri/coloane:
	// aici căutăm fiecare panou ca bloc distinct de pixeli ne-albi.
	const thrArg = rest.indexOf("--thr");
	const thr = thrArg >= 0 ? Number(rest[thrArg + 1]) : 235; // sub atât = „nu e fundal"
	const minArg = rest.indexOf("--min");
	const minFrac = minArg >= 0 ? Number(rest[minArg + 1]) : 0.004; // din suprafața planșei
	const { data, info } = await sharp(file).greyscale().raw().toBuffer({ resolveWithObject: true });
	const { width: W, height: H } = info;

	// Union-find pe pixeli ne-albi, vecinătate 4.
	const parent = new Int32Array(W * H).fill(-1);
	const find = (a) => {
		let r = a;
		while (parent[r] !== r) r = parent[r];
		while (parent[a] !== r) { const n = parent[a]; parent[a] = r; a = n; }
		return r;
	};
	const union = (a, b) => { const ra = find(a), rb = find(b); if (ra !== rb) parent[ra] = rb; };
	for (let y = 0; y < H; y++) {
		for (let x = 0; x < W; x++) {
			const i = y * W + x;
			if (data[i] >= thr) continue;
			parent[i] = i;
			if (x > 0 && parent[i - 1] >= 0) union(i, i - 1);
			if (y > 0 && parent[i - W] >= 0) union(i, i - W);
		}
	}
	const boxes = new Map();
	for (let y = 0; y < H; y++) {
		for (let x = 0; x < W; x++) {
			const i = y * W + x;
			if (parent[i] < 0) continue;
			const r = find(i);
			const b = boxes.get(r);
			if (!b) boxes.set(r, { x0: x, x1: x, y0: y, y1: y, n: 1 });
			else { if (x < b.x0) b.x0 = x; if (x > b.x1) b.x1 = x; if (y < b.y0) b.y0 = y; if (y > b.y1) b.y1 = y; b.n++; }
		}
	}
	// Dungile de margine și blocurile care înghit un panou vecin nu sunt panouri.
	const arie = (b) => (b.x1 - b.x0 + 1) * (b.y1 - b.y0 + 1);
	const raport = (b) => (b.x1 - b.x0 + 1) / (b.y1 - b.y0 + 1);
	const rminArg = rest.indexOf("--rmin");
	const rmaxArg = rest.indexOf("--rmax");
	const rmin = rminArg >= 0 ? Number(rest[rminArg + 1]) : 0.5;
	const rmax = rmaxArg >= 0 ? Number(rest[rmaxArg + 1]) : 3;
	let cand = [...boxes.values()].filter(
		(b) => b.n >= W * H * minFrac && raport(b) > rmin && raport(b) < rmax && b.n / arie(b) > 0.5,
	);
	const contine = (a, b) => a !== b && a.x0 <= b.x0 && a.x1 >= b.x1 && a.y0 <= b.y0 && a.y1 >= b.y1;
	cand = cand.filter((b) => !cand.some((alt) => contine(b, alt)));
	// Ordine de citire: întâi pe rânduri (panourile dintr-un rând nu încep exact
	// la aceeași înălțime), apoi de la stânga la dreapta în fiecare rând.
	const rows = [];
	for (const b of [...cand].sort((a, z) => a.y0 - z.y0)) {
		const r = rows.find((row) => b.y0 < row.yMax);
		if (r) { r.items.push(b); r.yMax = Math.max(r.yMax, b.y0 + (b.y1 - b.y0) * 0.6); }
		else rows.push({ yMax: b.y0 + (b.y1 - b.y0) * 0.6, items: [b] });
	}
	const keep = rows.flatMap((r) => r.items.sort((a, z) => a.x0 - z.x0));
	console.log(`${file} — ${W}x${H}, ${keep.length} panouri`);
	const panels = keep.map((b, i) => ({
		name: `panou-${i + 1}`,
		x: [Number((b.x0 / W).toFixed(4)), Number(((b.x1 + 1) / W).toFixed(4))],
		y: [Number((b.y0 / H).toFixed(4)), Number(((b.y1 + 1) / H).toFixed(4))],
	}));
	for (const p of panels) console.log(`  ${p.name}: x=[${p.x}] y=[${p.y}]`);
	console.log(JSON.stringify({ inset: 0.004, width: 900, panels }, null, 1));
	process.exit(0);
}

if (cmd !== "cut") {
	console.error(`comandă necunoscută: ${cmd}`);
	process.exit(1);
}

const [outDir, specPath] = rest;
if (!outDir || !specPath) {
	console.error("usage: slice-panels.mjs cut <plansa> <out-dir> <spec.json>");
	process.exit(1);
}
/** Caseta conținutului dintr-un decupaj: aruncă rândurile/coloanele marginale
 *  care sunt (aproape) în întregime culoarea de fundal `hex`. */
async function contentBox(src, rect, hex, tol) {
	const [r0, g0, b0] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));
	const { data, info } = await sharp(src).extract(rect).removeAlpha().raw().toBuffer({ resolveWithObject: true });
	const { width: w, height: h } = info;
	const isBg = (x, y) => {
		const i = (y * w + x) * 3;
		return Math.abs(data[i] - r0) < tol && Math.abs(data[i + 1] - g0) < tol && Math.abs(data[i + 2] - b0) < tol;
	};
	const rowBg = (y) => {
		let n = 0;
		for (let x = 0; x < w; x++) if (isBg(x, y)) n++;
		return n / w > 0.985;
	};
	const colBg = (x) => {
		let n = 0;
		for (let y = 0; y < h; y++) if (isBg(x, y)) n++;
		return n / h > 0.985;
	};
	let top = 0;
	let bottom = h - 1;
	let left = 0;
	let right = w - 1;
	while (top < bottom && rowBg(top)) top++;
	while (bottom > top && rowBg(bottom)) bottom--;
	while (left < right && colBg(left)) left++;
	while (right > left && colBg(right)) right--;
	if (right - left < 8 || bottom - top < 8) return null;
	return { left: rect.left + left, top: rect.top + top, width: right - left + 1, height: bottom - top + 1 };
}

const spec = JSON.parse(readFileSync(specPath, "utf8"));
const inset = spec.inset ?? 0.012;
const outW = spec.width ?? 900;
mkdirSync(outDir, { recursive: true });
const { width: W, height: H } = await sharp(file).metadata();

for (const p of spec.panels) {
	const x0 = p.x[0] * W;
	const x1 = p.x[1] * W;
	const y0 = p.y[0] * H;
	const y1 = p.y[1] * H;
	const dx = (x1 - x0) * inset;
	const dy = (y1 - y0) * inset;
	let left = Math.round(x0 + dx);
	let top = Math.round(y0 + dy);
	let width = Math.round(x1 - x0 - 2 * dx);
	let height = Math.round(y1 - y0 - 2 * dy);
	// `trim` strânge decupajul pe conținut (aruncă marginea de fundal uniform),
	// ca panourile desenate pe alb/crem să nu vină cu chenare inegale.
	if (spec.trim) {
		const box = await contentBox(file, { left, top, width, height }, spec.trim, spec.trimTol ?? 26);
		if (box) ({ left, top, width, height } = box);
	}
	// `aspect` (opțional) taie centrat la un raport fix, ca toate panourile să
	// aibă exact aceeași formă — altfel casetele de pe un rând ies inegale.
	if (spec.aspect && spec.pad) {
		// Cu `pad` nu se taie nimic: se adaugă fundal până la raportul cerut.
		const want = spec.aspect;
		let padX = 0;
		let padY = 0;
		if (width / height > want) padY = Math.round((width / want - height) / 2);
		else padX = Math.round((height * want - width) / 2);
		const out = join(outDir, `${p.name}.jpg`);
		await sharp(file)
			.extract({ left, top, width, height })
			.extend({ top: padY, bottom: padY, left: padX, right: padX, background: spec.pad })
			.resize({ width: outW })
			.jpeg({ quality: 84 })
			.toFile(out);
		console.log(`${p.name}.jpg  ${width}x${height} +pad → ${outW}px`);
		continue;
	}
	if (spec.aspect) {
		const want = spec.aspect;
		if (width / height > want) {
			const nw = Math.round(height * want);
			left += Math.round((width - nw) / 2);
			width = nw;
		} else {
			const nh = Math.round(width / want);
			top += Math.round((height - nh) / 2);
			height = nh;
		}
	}
	const out = join(outDir, `${p.name}.jpg`);
	await sharp(file)
		.extract({ left, top, width, height })
		.resize({ width: outW })
		.jpeg({ quality: 84 })
		.toFile(out);
	console.log(`${p.name}.jpg  ${width}x${height} → ${outW}px`);
}
