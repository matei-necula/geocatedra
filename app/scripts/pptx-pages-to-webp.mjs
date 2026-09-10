// Paginile exportate din PowerPoint (PNG) devin WebP: aceeași lizibilitate,
// de câteva ori mai puțini octeți pe telefon.
// Usage: node scripts/pptx-pages-to-webp.mjs <dir-cu-subfoldere> [quality=82]
import { readdirSync, statSync, unlinkSync } from "node:fs";
import { join } from "node:path";
import sharp from "sharp";

const root = process.argv[2];
const quality = Number(process.argv[3]) || 82;
if (!root) {
	console.error("Usage: node scripts/pptx-pages-to-webp.mjs <dir> [quality]");
	process.exit(1);
}

let inBytes = 0;
let outBytes = 0;
let n = 0;
for (const folder of readdirSync(root).filter((d) => statSync(join(root, d)).isDirectory())) {
	const dir = join(root, folder);
	for (const file of readdirSync(dir).filter((f) => /\.png$/i.test(f))) {
		const src = join(dir, file);
		const dst = src.replace(/\.png$/i, ".webp");
		inBytes += statSync(src).size;
		await sharp(src).webp({ quality }).toFile(dst);
		outBytes += statSync(dst).size;
		unlinkSync(src);
		n++;
	}
}
const mb = (b) => (b / 1024 / 1024).toFixed(1);
console.log(`${n} pagini: ${mb(inBytes)} MB PNG -> ${mb(outBytes)} MB WebP`);
