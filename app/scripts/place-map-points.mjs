#!/usr/bin/env node
// Dev tool: turns lat/long into harta-quiz `points` for a *scanned* school map.
//
//   node app/scripts/place-map-points.mjs <config.json> <out.json>
//
// Scanned maps are not mathematically exact, so the config carries the map's own
// graticule, read off the scan:
//   lonTicks: [[degrees, x_px], …]   meridian ticks, left→right
//   latNodes: [[degrees, y_px], …]   drawn parallels, north→south
// Longitude interpolates piecewise-linearly between ticks; latitude interpolates
// piecewise-linearly in Mercator space, which is what these maps use. Both
// extrapolate along the outermost segment.
//
// Each computed point is then snapped to the nearest line pixel within `rad`,
// preferring pixels surrounded by land so a river does not snap onto a coastline.
// Snapping is a suggestion, not proof: always render the result with
// plot-map-points.mjs and check it against a labelled reference map.
import sharp from "sharp";
import { readFileSync, writeFileSync } from "node:fs";

const [, , configPath, outPath] = process.argv;
if (!configPath || !outPath) {
	console.error("usage: place-map-points.mjs <config.json> <out.json>");
	process.exit(1);
}
const cfg = JSON.parse(readFileSync(configPath, "utf8"));
const merc = (deg) => Math.log(Math.tan(Math.PI / 4 + (deg * Math.PI) / 360));

function interp(nodes, v) {
	// nodes: [[key, px], …] sorted by key ascending
	if (v <= nodes[0][0]) {
		const s = (nodes[1][1] - nodes[0][1]) / (nodes[1][0] - nodes[0][0]);
		return nodes[0][1] + (v - nodes[0][0]) * s;
	}
	for (let i = 1; i < nodes.length; i++) {
		if (v <= nodes[i][0]) {
			const f = (v - nodes[i - 1][0]) / (nodes[i][0] - nodes[i - 1][0]);
			return nodes[i - 1][1] + f * (nodes[i][1] - nodes[i - 1][1]);
		}
	}
	const n = nodes.length;
	const s = (nodes[n - 1][1] - nodes[n - 2][1]) / (nodes[n - 1][0] - nodes[n - 2][0]);
	return nodes[n - 1][1] + (v - nodes[n - 1][0]) * s;
}
const lonNodes = [...cfg.lonTicks].sort((a, b) => a[0] - b[0]);
const latNodes = [...cfg.latNodes].map(([d, y]) => [merc(d), y]).sort((a, b) => a[0] - b[0]);
const lonToX = (lon) => interp(lonNodes, lon);
const latToY = (lat) => interp(latNodes, merc(lat));

const { data, info } = await sharp(cfg.map).raw().toBuffer({ resolveWithObject: true });
const { width: W, height: H, channels: ch } = info;
const ink = new Uint8Array(W * H);
const land = new Uint8Array(W * H);
for (let i = 0; i < W * H; i++) {
	const r = data[i * ch], g = data[i * ch + 1], b = data[i * ch + 2];
	if (r < 130 && g < 145 && b < 170 && b >= r) ink[i] = 1;
	if (r > 225 && g > 225 && b > 220) land[i] = 1;
}
// Connected components of the ink mask. A dot must land on a real line, not on a
// speck of scan noise, so anything smaller than `minComp` pixels is not snappable.
const MIN_COMP = cfg.minComp ?? 150;
const comp = new Int32Array(W * H).fill(-1);
const compSize = [];
{
	const stack = [];
	for (let i = 0; i < W * H; i++) {
		if (!ink[i] || comp[i] >= 0) continue;
		const id = compSize.length;
		let n = 0;
		stack.push(i); comp[i] = id;
		while (stack.length) {
			const p = stack.pop();
			const x = p % W, y = (p - x) / W;
			n++;
			for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
				const nx = x + dx, ny = y + dy;
				if (nx < 0 || ny < 0 || nx >= W || ny >= H) continue;
				const q = ny * W + nx;
				if (ink[q] && comp[q] < 0) { comp[q] = id; stack.push(q); }
			}
		}
		compSize.push(n);
	}
}

const landFrac = (x, y, rad = 9) => {
	let n = 0, tot = 0;
	for (let dy = -rad; dy <= rad; dy += 2) for (let dx = -rad; dx <= rad; dx += 2) {
		const nx = x + dx, ny = y + dy;
		if (nx < 0 || ny < 0 || nx >= W || ny >= H) continue;
		tot++; if (land[ny * W + nx]) n++;
	}
	return tot ? n / tot : 0;
};

const out = [];
for (const p of cfg.points) {
	const x0 = lonToX(p.lon), y0 = latToY(p.lat);
	const RAD = p.rad ?? cfg.rad ?? 26;
	let best = null;
	for (let dy = -RAD; dy <= RAD; dy++) for (let dx = -RAD; dx <= RAD; dx++) {
		const x = Math.round(x0 + dx), y = Math.round(y0 + dy);
		if (x < 0 || y < 0 || x >= W || y >= H || !ink[y * W + x]) continue;
		if (compSize[comp[y * W + x]] < MIN_COMP) continue; // scan speck, not a river
		const d = Math.hypot(dx, dy);
		if (d > RAD) continue;
		const score = d + (landFrac(x, y) < (cfg.minLand ?? 0.35) ? 40 : 0);
		if (!best || score < best.score) best = { x, y, d, score, lf: landFrac(x, y), comp: comp[y * W + x] };
	}
	const q = best ?? { x: Math.round(x0), y: Math.round(y0), d: -1, lf: -1, comp: -1 };
	out.push({
		n: p.n, name: p.name,
		x: +((q.x * 100) / W).toFixed(2), y: +((q.y * 100) / H).toFixed(2),
		snap: q.d, land: +q.lf.toFixed(2), comp: q.comp, compPx: q.comp >= 0 ? compSize[q.comp] : 0,
	});
}
writeFileSync(outPath, JSON.stringify(out, null, "\t") + "\n", "utf8");
for (const o of out) {
	console.log(
		`${String(o.n).padStart(2)} ${o.name.padEnd(16)} x=${String(o.x).padStart(6)} y=${String(o.y).padStart(6)}` +
			` snap=${o.snap === -1 ? " MISS" : o.snap.toFixed(1).padStart(5)} land=${o.land} comp=${o.comp}(${o.compPx}px)`,
	);
}
