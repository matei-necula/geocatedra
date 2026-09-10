import sharp from "sharp";
import { mkdirSync, existsSync } from "node:fs";
import { join } from "node:path";
const SRC = "C:/Users/Liliana/Downloads/imagini pentru site/";
// unele imagini vin direct din Downloads, nu din folderul cu planșe
const src = (f) => (/^[A-Za-z]:/.test(f) ? f : SRC + f);
const OUT = process.argv[2] || "../content/galerii/universul";
mkdirSync(OUT, { recursive: true });

const COLS = [[52,683],[745,1377],[1438,2070],[2132,2763]];
const COMP_ROWS = [[52,486],[543,997],[1050,1483]];
const SAT_ROWS  = [[52,371],[422,745],[793,1117],[1163,1483]];
const INSET = 7;

// bounding box of pixels that are not near-white
async function whiteTrim(buf) {
  const { data, info } = await sharp(buf).removeAlpha().raw().toBuffer({ resolveWithObject: true });
  const { width: W, height: H, channels: C } = info;
  const white = (i) => data[i] >= 244 && data[i+1] >= 244 && data[i+2] >= 244;
  let x0 = W, x1 = -1, y0 = H, y1 = -1;
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    if (!white((y*W+x)*C)) { if (x<x0)x0=x; if (x>x1)x1=x; if (y<y0)y0=y; if (y>y1)y1=y; }
  }
  if (x1 < 0) return buf;
  const w = x1-x0+1, h = y1-y0+1;
  if (w === W && h === H) return buf;
  return sharp(buf).extract({ left: x0, top: y0, width: w, height: h }).png().toBuffer();
}

async function panel(file, cols, rows, name, maxW = 1400) {
  const [cA, cB] = Array.isArray(cols) ? cols : [cols, cols];
  const left = COLS[cA][0] + INSET, right = COLS[cB][1] - INSET;
  const top = rows[0] + INSET, bottom = rows[1] - INSET;
  let buf = await sharp(src(file))
    .extract({ left, top, width: right-left, height: bottom-top })
    .png().toBuffer();
  buf = await whiteTrim(buf);
  const m = await sharp(buf).metadata();
  await sharp(buf).resize({ width: Math.min(maxW, m.width), withoutEnlargement: true })
    .webp({ quality: 86 }).toFile(`${OUT}/${name}.webp`);
  const m2 = await sharp(`${OUT}/${name}.webp`).metadata();
  console.log(name.padEnd(34), `${m.width}x${m.height} -> ${m2.width}x${m2.height}`);
}

async function whole(file, name, maxW = 1800) {
  // unele planșe primite pe chat nu mai sunt pe disc; lăsăm ce e deja generat
  if (!existsSync(src(file))) { console.log(name.padEnd(34), "(sursă lipsă — sar peste)"); return; }
  await sharp(src(file)).resize({ width: maxW, withoutEnlargement: true }).webp({ quality: 88 }).toFile(`${OUT}/${name}.webp`);
  const m = await sharp(`${OUT}/${name}.webp`).metadata();
  console.log(name.padEnd(34), `${m.width}x${m.height}`);
}

// Decupaj după coordonate absolute (planșe care nu sunt grilă 4×N).
async function box(file, name, [x0, y0, x1, y1], maxW = 1600) {
  if (!existsSync(src(file))) { console.log(name.padEnd(34), "(sursă lipsă — sar peste)"); return; }
  const buf = await sharp(src(file)).extract({ left: x0, top: y0, width: x1 - x0, height: y1 - y0 }).png().toBuffer();
  const m = await sharp(buf).metadata();
  await sharp(buf).resize({ width: Math.min(maxW, m.width), withoutEnlargement: true }).webp({ quality: 86 }).toFile(`${OUT}/${name}.webp`);
  console.log(name.padEnd(34), `${m.width}x${m.height}`);
}

// „Stelele după culoare și mărime": aceleași imagini ca la jocul de ordonare
// „Temperatura stelelor" (content/games/sistem-solar-ordine), puse pe o singură
// planșă, în ordinea rece → fierbinte și cu mărimea crescătoare.
async function starsScale(name) {
  const GAME = "../content/games/sistem-solar-ordine";
  const stars = [
    { file: "stea-rosie.png", tile: 200, nume: "Roșii", marime: "cele mai mici", culoare: "#d94a3a" },
    { file: "stea-portocalie.png", tile: 250, nume: "Portocalii", marime: "mici", culoare: "#e8843a" },
    { file: "stea-galbena.png", tile: 310, nume: "Galbene", marime: "mijlocii (ca Soarele)", culoare: "#f2c14e" },
    { file: "stea-alba.png", tile: 390, nume: "Albe", marime: "mari", culoare: "#eef1ff" },
    { file: "stea-albastra.png", tile: 480, nume: "Albastre", marime: "cele mai mari", culoare: "#8fbaff" },
  ];
  const W = 1760, H = 800, CY = 410, GAP = 10;
  let x = 45;
  const comps = [], marks = [];
  for (const s of stars) {
    const buf = await sharp(join(GAME, s.file)).resize({ width: s.tile, height: s.tile }).png().toBuffer();
    comps.push({ input: buf, left: Math.round(x), top: Math.round(CY - s.tile / 2) });
    marks.push({ ...s, cx: Math.round(x + s.tile / 2) });
    x += s.tile + GAP;
  }
  const SERIF = "Spectral, Georgia, 'Times New Roman', serif";
  const SANS = "Inter, 'Segoe UI', Arial, sans-serif";
  let svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">`;
  svg += `<text x="${W / 2}" y="68" font-family="${SERIF}" font-size="46" fill="#FDF6EC" text-anchor="middle">Stelele — după culoare și mărime</text>`;
  svg += `<text x="${W / 2}" y="112" font-family="${SANS}" font-size="26" fill="#a9b8c9" text-anchor="middle">de la cele mai reci (roșii) la cele mai fierbinți (albastre)</text>`;
  for (const m of marks) {
    svg += `<text x="${m.cx}" y="706" font-family="${SANS}" font-size="30" font-weight="bold" fill="${m.culoare}" text-anchor="middle">${m.nume}</text>`;
    svg += `<text x="${m.cx}" y="744" font-family="${SANS}" font-size="21" fill="#9fb0c4" text-anchor="middle">${m.marime}</text>`;
  }
  svg += `</svg>`;
  await sharp({ create: { width: W, height: H, channels: 3, background: "#0b1020" } })
    .composite([...comps, { input: Buffer.from(svg) }])
    .webp({ quality: 90 })
    .toFile(`${OUT}/${name}.webp`);
  console.log(name.padEnd(34), `${W}x${H}`);
}

const CS = "componenete sistemul solar.png";
const ST = "sateliti, eclipse, meteoriti, cometa.png";

const CL = "calea lactee.jpg";           // 2 panouri: pe boltă (stânga), în plan (dreapta)
const DN = "disc galactic, nebuloasa.jpg"; // 2 panouri: discul galactic (sus), nebuloasa (jos)

await whole("etape big-bang.jpg", "a01-etapele-big-bang");
await box(DN, "a02-calea-lactee-ca-disc", [38, 42, 1418, 648]);
await box(CL, "a03-calea-lactee-in-plan", [1331, 119, 2434, 1111]);
await box(CL, "a04-calea-lactee-pe-bolta-cereasca", [91, 119, 1238, 1111]);
await box(DN, "a05-nebuloasa", [38, 712, 1418, 1349]);
await whole("etape evolutia stelelor.png", "a06-etapele-evolutiei-stelelor");
await starsScale("a07-stelele-dupa-culoare-si-marime");
await whole("constelatii.jfif", "a08-constelatiile");

await whole("sistemul solar-formare.jfif", "b00-formarea-sistemului-solar");
await whole("Sistemul Solar.png", "b01-sistemul-solar");
await panel(CS, 0, COMP_ROWS[0], "b03-soarele");
await whole("SOARELE-structura.jfif", "b03a-structura-interna-a-soarelui");
await panel(CS, 1, COMP_ROWS[0], "b04-mercur");
await panel(CS, 2, COMP_ROWS[0], "b05-venus");
await panel(CS, 3, COMP_ROWS[0], "b06-terra");
await panel(ST, 0, SAT_ROWS[0], "b07-luna");
await panel(ST, 0, SAT_ROWS[1], "b08-eclipsa-de-luna");
await panel(ST, 3, SAT_ROWS[0], "b09-eclipsa-de-soare");
await panel(CS, 0, COMP_ROWS[1], "b10-marte");
await panel(ST, 2, SAT_ROWS[1], "b11-marte-si-satelitii");
await panel(CS, 1, COMP_ROWS[1], "b12-centura-de-asteroizi");
await panel(ST, 3, SAT_ROWS[3], "b13-asteroizii");
await panel(CS, 2, COMP_ROWS[1], "b14-jupiter");
await panel(ST, [1,2], SAT_ROWS[0], "b15-jupiter-si-satelitii");
await panel(CS, 3, COMP_ROWS[1], "b16-saturn");
await panel(ST, [1,2], SAT_ROWS[2], "b17-saturn-si-satelitii");
await panel(CS, 0, COMP_ROWS[2], "b18-uranus");
await panel(ST, 3, SAT_ROWS[2], "b19-uranus-si-satelitii");
await panel(CS, 1, COMP_ROWS[2], "b20-neptun");
await panel(ST, 0, SAT_ROWS[3], "b21-neptun-si-satelitii");
await panel(CS, 2, COMP_ROWS[2], "b22-centura-kuiper");
await panel(CS, 3, COMP_ROWS[2], "b23-norul-lui-oort");
await panel(ST, [1,2], SAT_ROWS[3], "b24-cometa");
