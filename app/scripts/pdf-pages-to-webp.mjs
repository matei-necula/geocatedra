// Un PDF devine teanc de pagini WebP, ca exporturile din PowerPoint: aceeași
// convenție de nume (Slide1.webp, Slide2.webp…), deci intră direct în
// `ingest-pages.mjs`.
// Usage: node scripts/pdf-pages-to-webp.mjs <fisier.pdf> <dir-ieșire> [latime=1600] [quality=82]
import * as mupdf from "mupdf";
import { readFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import sharp from "sharp";

const [src, out, wArg, qArg] = process.argv.slice(2);
if (!src || !out) {
	console.error("Usage: node scripts/pdf-pages-to-webp.mjs <fisier.pdf> <dir-ieșire> [latime] [quality]");
	process.exit(1);
}
const W = Number(wArg) || 1600;
const quality = Number(qArg) || 82;
mkdirSync(out, { recursive: true });

const doc = mupdf.Document.openDocument(readFileSync(src), "application/pdf");
for (let i = 0; i < doc.countPages(); i++) {
	const page = doc.loadPage(i);
	const [x0, , x1] = page.getBounds();
	const scale = W / (x1 - x0);
	const pix = page.toPixmap(mupdf.Matrix.scale(scale, scale), mupdf.ColorSpace.DeviceRGB, false, true);
	const dst = join(out, `Slide${i + 1}.webp`);
	await sharp(Buffer.from(pix.asPNG())).webp({ quality }).toFile(dst);
	console.log(dst);
}
