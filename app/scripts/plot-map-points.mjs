#!/usr/bin/env node
// Dev tool: renders a harta-quiz / plaseaza-pe-harta game's map with its numbered
// points drawn on top, so a human (or Claude) can check placement visually.
//
//   node app/scripts/plot-map-points.mjs <game-folder> <out.jpg> [width] [--round N]
//
// `--round N` draws only the points of authored round N (1-based).
import sharp from "sharp";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const args = process.argv.slice(2);
const roundArg = args.indexOf("--round");
const round = roundArg >= 0 ? Number(args.splice(roundArg, 2)[1]) : null;
// --hollow draws a ring with the label beside it, so the line under the dot stays visible
const hollowArg = args.indexOf("--hollow");
const hollow = hollowArg >= 0 ? (args.splice(hollowArg, 1), true) : false;
const [gameDir, out, width = "1700"] = args;
if (!gameDir || !out) {
	console.error("usage: plot-map-points.mjs <game-folder> <out.jpg> [width] [--round N]");
	process.exit(1);
}

const doc = JSON.parse(readFileSync(join(gameDir, "game.json"), "utf8"));
const body = doc.body;
const mapFile = doc.assets[body.map ?? 0];
const list = body.points ?? body.targets ?? [];
const { width: W, height: H } = await sharp(join(gameDir, mapFile)).metadata();

const wanted = round ? new Set(body.rounds[round - 1]) : null;
const shown = list.filter((p) => !wanted || wanted.has(p.n));
const r = W * 0.0105;
const marks = shown
	.map((p) => {
		const cx = (p.x * W) / 100;
		const cy = (p.y * H) / 100;
		const label = p.n ?? p.id ?? "";
		if (hollow) {
			return (
				`<circle cx="${cx}" cy="${cy}" r="${r * 0.75}" fill="none" stroke="#e01b24" stroke-width="${W * 0.0016}"/>` +
				`<text x="${cx + r * 1.1}" y="${cy - r * 0.6}" font-family="sans-serif" font-size="${r * 1.1}" font-weight="bold"` +
				` fill="#e01b24" stroke="#fff" stroke-width="${W * 0.0009}" paint-order="stroke">${label}</text>`
			);
		}
		return (
			`<circle cx="${cx}" cy="${cy}" r="${r}" fill="#e01b24" fill-opacity="0.8" stroke="#fff" stroke-width="${W * 0.0018}"/>` +
			`<text x="${cx}" y="${cy + r * 0.38}" font-family="sans-serif" font-size="${r * 1.15}" font-weight="bold"` +
			` fill="#fff" text-anchor="middle">${label}</text>`
		);
	})
	.join("");

const svg = Buffer.from(`<svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">${marks}</svg>`);
// rasterize the overlay to exactly WxH first — sharp otherwise scales SVGs by DPI
// and refuses to composite something larger than the base image
const overlay = await sharp(svg).resize(W, H, { fit: "fill" }).png().toBuffer();
// sharp resizes before compositing within one pipeline, so do it in two passes
const composited = await sharp(join(gameDir, mapFile)).composite([{ input: overlay }]).png().toBuffer();
await sharp(composited).resize({ width: Number(width) }).jpeg({ quality: 88 }).toFile(out);
console.log(`wrote ${out} — ${shown.length} points on ${mapFile} (${W}x${H})`);
