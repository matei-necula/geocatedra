#!/usr/bin/env node
// Dev tool: lipește imaginile dintr-un folder într-o singură planșă de contact,
// cu numele fișierului scris peste fiecare — ca să poți verifica dintr-o privire
// un lot întreg de panouri decupate sau de imagini generate.
//
//   node app/scripts/contact-sheet.mjs <dir> <out.jpg> [coloane=3] [latime-panou=420]
import sharp from "sharp";
import { readdirSync } from "node:fs";
const [dir, out, colsArg, tileArg] = process.argv.slice(2);
const cols = Number(colsArg) || 3, tw = Number(tileArg) || 420;
const files = readdirSync(dir).filter((f) => /\.(jpg|png|webp)$/i.test(f)).sort();
const tiles = [];
for (const f of files) {
  const buf = await sharp(dir + "/" + f).resize({ width: tw }).toBuffer();
  const m = await sharp(buf).metadata();
  tiles.push({ f, buf, h: m.height });
}
const rows = Math.ceil(tiles.length / cols);
const rowH = [];
for (let r = 0; r < rows; r++) rowH.push(Math.max(...tiles.slice(r * cols, r * cols + cols).map((t) => t.h)));
const H = rowH.reduce((a, b) => a + b + 22, 0);
const comps = [];
let y = 0;
tiles.forEach((t, i) => {
  const r = Math.floor(i / cols), c = i % cols;
  if (c === 0 && i > 0) y += rowH[r - 1] + 22;
  comps.push({ input: t.buf, left: c * tw, top: y + 22 });
});
let svg = `<svg width="${cols * tw}" height="${H}" xmlns="http://www.w3.org/2000/svg">`;
let yy = 0;
tiles.forEach((t, i) => {
  const r = Math.floor(i / cols), c = i % cols;
  if (c === 0 && i > 0) yy += rowH[r - 1] + 22;
  svg += `<text x="${c * tw + 6}" y="${yy + 16}" font-size="15" fill="#fff" font-family="sans-serif">${i}: ${t.f}</text>`;
});
svg += "</svg>";
await sharp({ create: { width: cols * tw, height: H, channels: 3, background: "#222" } })
  .composite([...comps, { input: Buffer.from(svg) }]).jpeg({ quality: 82 }).toFile(out);
console.log(files.map((f, i) => i + ":" + f).join("  "));
