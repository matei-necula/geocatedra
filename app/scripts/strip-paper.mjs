// Scoate fundalul de hârtie gălbuie dintr-o planșă: umple cu alb, pornind de la
// marginile decupajului, tot ce e deschis la culoare. Umplerea se oprește
// singură la ramele închise ale casetelor foto, deci pozele rămân neatinse;
// textul etichetelor, fiind închis, rămâne și el. La final taie pe conținut.
// Usage: node scripts/strip-paper.mjs <sursa> <x0,y0,x1,y1> <ieșire.webp> [prag=150]
import sharp from "sharp";
const [SRC, BOX, OUT, PRAG] = process.argv.slice(2);
const [bx0, by0, bx1, by1] = BOX.split(",").map(Number);
const thr = Number(PRAG) || 150;

const cut = await sharp(SRC).extract({ left: bx0, top: by0, width: bx1 - bx0, height: by1 - by0 }).png().toBuffer();
const { data, info } = await sharp(cut).removeAlpha().raw().toBuffer({ resolveWithObject: true });
const { width: W, height: H, channels: C } = info;
const px = Buffer.from(data);
const lum = (i) => (px[i] * 299 + px[i + 1] * 587 + px[i + 2] * 114) / 1000;

const seen = new Uint8Array(W * H);
const st = [];
for (let x = 0; x < W; x++) { st.push([x, 0], [x, H - 1]); }
for (let y = 0; y < H; y++) { st.push([0, y], [W - 1, y]); }
let n = 0;
while (st.length) {
	const [x, y] = st.pop();
	if (x < 0 || y < 0 || x >= W || y >= H) continue;
	const k = y * W + x;
	if (seen[k]) continue;
	const i = k * C;
	if (lum(i) < thr) continue;          // rama casetei sau textul: oprire
	seen[k] = 1; n++;
	px[i] = 255; px[i + 1] = 255; px[i + 2] = 255;
	st.push([x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1]);
}

// a doua trecere: golurile închise din interiorul literelor (ex. „O") n-au fost
// atinse de umplere, fiindcă sunt înconjurate de tuș. Le albim separat: pete
// mici și deschise la culoare. Tușul literelor, fiind închis, rămâne.
{
	const vaz = new Uint8Array(W * H);
	for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
		const k = y * W + x;
		if (vaz[k]) continue;
		const i = k * C;
		const alb = px[i] === 255 && px[i + 1] === 255 && px[i + 2] === 255;
		if (alb || lum(i) < 160) { vaz[k] = 1; continue; }
		const cells = []; const s2 = [[x, y]]; vaz[k] = 1;
		while (s2.length) {
			const [cx, cy] = s2.pop(); cells.push(cy * W + cx);
			for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
				const nx = cx + dx, ny = cy + dy;
				if (nx < 0 || ny < 0 || nx >= W || ny >= H) continue;
				const kk = ny * W + nx;
				if (vaz[kk]) continue;
				const ii = kk * C;
				if (px[ii] === 255 && px[ii + 1] === 255 && px[ii + 2] === 255) continue;
				if (lum(ii) < 160) continue;
				vaz[kk] = 1; s2.push([nx, ny]);
			}
		}
		if (cells.length < 1500) for (const kk of cells) { const ii = kk * C; px[ii] = 255; px[ii + 1] = 255; px[ii + 2] = 255; }
	}
}

// taie pe conținut (ce a rămas nealb)
let x0 = W, x1 = -1, y0 = H, y1 = -1;
for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
	const i = (y * W + x) * C;
	if (!(px[i] === 255 && px[i + 1] === 255 && px[i + 2] === 255)) {
		if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y;
	}
}
const P = 18;
x0 = Math.max(0, x0 - P); y0 = Math.max(0, y0 - P);
x1 = Math.min(W - 1, x1 + P); y1 = Math.min(H - 1, y1 + P);
await sharp(px, { raw: { width: W, height: H, channels: C } })
	.extract({ left: x0, top: y0, width: x1 - x0 + 1, height: y1 - y0 + 1 })
	.resize({ width: 1500, withoutEnlargement: true })
	.webp({ quality: 90 }).toFile(OUT);
console.log(`${OUT}  hârtie ștearsă: ${n} px  →  ${x1 - x0 + 1}x${y1 - y0 + 1}`);
