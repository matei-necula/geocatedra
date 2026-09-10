// SVG -> PNG pentru asseturile jocurilor. SVG nu se servește niciodată
// (media.tsx îl forțează la download, din motive de securitate), deci
// jocurile folosesc PNG-uri rasterizate la lățime fixă.
// Usage: node scripts/rasterize.mjs <dir> [width=1600]
import { readdirSync } from "node:fs";
import { join } from "node:path";
import sharp from "sharp";

const dir = process.argv[2];
const width = Number(process.argv[3]) || 1600;
if (!dir) {
	console.error("Usage: node scripts/rasterize.mjs <dir> [width]");
	process.exit(1);
}
for (const f of readdirSync(dir)) {
	if (!f.endsWith(".svg")) continue;
	const out = join(dir, f.replace(/\.svg$/, ".png"));
	await sharp(join(dir, f), { density: 150 }).resize({ width }).png().toFile(out);
	console.log(`${f} -> ${out}`);
}
