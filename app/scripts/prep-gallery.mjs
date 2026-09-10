// Pregătește imaginile unei galerii: taie marginile albe, redimensionează și
// scrie WebP-uri gata de `replace-gallery.mjs`.
// Usage: node scripts/prep-gallery.mjs <folder-galerie>
//
// Folderul trebuie să conțină `prep.json`:
//   { "src": "C:/.../imagini pentru site/",   // prefix pentru căile relative
//     "maxWidth": 1800,
//     "images": [ { "file": "x.jpg", "name": "01-ceva",
//                   "trim": false,            // implicit: taie marginile albe
//                   "box": [x0,y0,x1,y1],      // opțional: decupaj fix
//                   "quality": 92 } ]          // opțional: calitate WebP (implicit 88)
//   }
// Sursele lipsă sunt sărite (fișierul deja generat rămâne pe loc).
import sharp from "sharp";
import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";

const dir = process.argv[2];
if (!dir) {
	console.error("Usage: node scripts/prep-gallery.mjs <folder-galerie>");
	process.exit(1);
}
const cfg = JSON.parse(readFileSync(join(dir, "prep.json"), "utf8"));
const SRC = cfg.src || "";
const MAXW = cfg.maxWidth || 1800;
const abs = (f) => (/^[A-Za-z]:/.test(f) ? f : SRC + f);

// bounding box al pixelilor care NU sunt aproape-albi
async function whiteTrim(buf) {
	const { data, info } = await sharp(buf).removeAlpha().raw().toBuffer({ resolveWithObject: true });
	const { width: W, height: H, channels: C } = info;
	const white = (i) => data[i] >= 244 && data[i + 1] >= 244 && data[i + 2] >= 244;
	let x0 = W, x1 = -1, y0 = H, y1 = -1;
	for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
		if (!white((y * W + x) * C)) { if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; }
	}
	if (x1 < 0 || (x1 - x0 + 1 === W && y1 - y0 + 1 === H)) return buf;
	return sharp(buf).extract({ left: x0, top: y0, width: x1 - x0 + 1, height: y1 - y0 + 1 }).png().toBuffer();
}

for (const im of cfg.images) {
	const path = abs(im.file);
	if (!existsSync(path)) { console.log(im.name.padEnd(36), "(sursă lipsă — sar peste)"); continue; }
	let pipe = sharp(path);
	if (im.box) {
		const [x0, y0, x1, y1] = im.box;
		pipe = pipe.extract({ left: x0, top: y0, width: x1 - x0, height: y1 - y0 });
	}
	let buf = await pipe.png().toBuffer();
	if (im.trim !== false) buf = await whiteTrim(buf);
	const m = await sharp(buf).metadata();
	const out = join(dir, `${im.name}.webp`);
	await sharp(buf).resize({ width: Math.min(MAXW, m.width), withoutEnlargement: true }).webp({ quality: im.quality || cfg.quality || 88 }).toFile(out);
	const m2 = await sharp(out).metadata();
	console.log(im.name.padEnd(36), `${m.width}x${m.height} -> ${m2.width}x${m2.height}`);
}
