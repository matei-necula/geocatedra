// Generează setul de icoane (runbook 4.1) din ACELAȘI desen ca marca din pagină
// (`app/app/components/site.tsx`, componenta `Logo`): un glob văzut din profil — disc plin,
// tăiat de un meridian și de linia ecuatorului.
//
// Rulare: node scripts/gen-icons.mjs
//
// DOUĂ SETURI, aceeași marcă. `public/` e servit de amândouă desfășurările, deci un singur
// fișier `icon.svg` ar fi însemnat un favicon albastru-azuriu pe site-ul liber (care e cobalt)
// sau invers. Marca rămâne identică ca desen — se schimbă doar culoarea, fiecare instanță în
// paleta ei — iar `root.tsx` alege setul din `BUILD_SITE_MODE`.
//
//   icon.svg / icon-liber.svg                 marca scalabilă
//   favicon.ico / favicon-liber.ico           32x32 + 16x16, asamblat de mână (sharp nu scrie .ico)
//   apple-touch-icon[-liber].png              180x180, fără rotunjire (iOS pune masca lui)
//   icon-192[-liber].png                      192x192, manifest "any"
//   icon-512[-liber].png                      512x512, maskable — marca în zona sigură de 80%
//   og-image[-liber].png                      1200x630, previzualizarea din rețelele sociale
//
// Valorile de mai jos OGLINDESC app/app/config/subject.ts. Scriptul e Node curat (nu există
// ts-node în repo), deci sunt copiate ca niște constante, nu importate — dacă se schimbă
// configul, se schimbă și aici. Capcana e documentată și în CLAUDE.md. Nimic aici nu e
// specific geografiei.

import { writeFileSync, readFileSync, mkdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import sharp from "sharp";

const __dirname = dirname(fileURLToPath(import.meta.url));
const PUBLIC_DIR = join(__dirname, "..", "public");
const FONTS_DIR = join(PUBLIC_DIR, "fonts");

// --- oglindește app/app/config/subject.ts ---
const SITE_NAME = "Geo-catedra";
const TAGLINE = "Geografia, toată într-un singur loc.";

/** Instanța cu clase: tema de bază („Mediteran"). */
const CLASE = {
	suffix: "",
	bg: "#FDF6EC",
	ink: "#22333B",
	muted: "#5C6B73",
	primary: "#2A6F97",
	onPrimary: "#FFFFFF",
	accent: "#E07A5F",
	heading: { family: "Spectral", weight: 700, files: ["spectral-normal-700-latin-ext.woff2", "spectral-normal-700-latin.woff2"] },
	body: { family: "Inter", weight: 500, files: ["inter-latin-ext.woff2", "inter-latin.woff2"] },
};

/** Instanța liberă: tema „Cobalt". */
const LIBER = {
	suffix: "-liber",
	bg: "#F0EDE6",
	ink: "#10162B",
	muted: "#4A5573",
	primary: "#1B3FBF",
	onPrimary: "#FFFFFF",
	accent: "#FF6A4D",
	heading: { family: "Instrument Serif", weight: 400, files: ["instrument-serif-normal-400-latin-ext.woff2", "instrument-serif-normal-400-latin.woff2"] },
	body: { family: "Public Sans", weight: 500, files: ["public-sans-normal-400700-latin-ext.woff2", "public-sans-normal-400700-latin.woff2"] },
};
// --- sfârșitul părții oglindite ---

function b64Font(name) {
	return readFileSync(join(FONTS_DIR, name)).toString("base64");
}

/**
 * Globul, la orice dimensiune. `inset` e cât se retrage marca de la margine: 0 pentru
 * maskable (fundal până în colț, sistemul taie el), ~0 și pentru card, unde discul umple
 * pătratul. Grosimile sunt proporționale, ca desenul să rămână citibil și la 16px.
 */
function globe(size, t, { bleed = false } = {}) {
	// Pe varianta maskable marca stă în mijlocul a 80% din pânză, ca masca sistemului
	// (cerc, squircle, ce alege fiecare Android) să nu taie din ea.
	const d = bleed ? size * 0.8 : size;
	const cx = size / 2;
	const cy = size / 2;
	const r = d / 2 - Math.max(1, d * 0.03);
	const sw = Math.max(1, d * 0.05);
	const rx = r * 0.45;
	return `
<circle cx="${cx}" cy="${cy}" r="${r}" fill="${t.primary}"/>
<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${r}" fill="none" stroke="${t.onPrimary}" stroke-width="${sw}" opacity="0.85"/>
<line x1="${cx - r}" y1="${cy}" x2="${cx + r}" y2="${cy}" stroke="${t.onPrimary}" stroke-width="${sw}" opacity="0.85"/>
<circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="${t.onPrimary}" stroke-width="${sw}" opacity="0.85"/>`;
}

/** Marca pe card: discul umple pătratul, fără fundal în spate. */
function cardMarkSvg(size, t) {
	return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">${globe(size, t)}
</svg>`;
}

/** Varianta maskable: fundal plin până în colț, marca în zona sigură de 80%. */
function maskableMarkSvg(size, t) {
	return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
<rect width="${size}" height="${size}" fill="${t.bg}"/>${globe(size, t, { bleed: true })}
</svg>`;
}

function ogImageSvg(t) {
	const faces = [...t.heading.files, ...t.body.files]
		.map((f, i) => {
			const isHeading = i < t.heading.files.length;
			const spec = isHeading ? t.heading : t.body;
			return `@font-face { font-family: '${spec.family}'; font-weight: ${spec.weight}; src: url(data:font/woff2;base64,${b64Font(f)}) format('woff2'); }`;
		})
		.join("\n");

	const W = 1200;
	const H = 630;
	const markSize = 200;
	const markX = 100;
	const markY = (H - markSize) / 2;
	const textX = markX + markSize + 64;

	return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
<style>
${faces}
</style>
<rect width="${W}" height="${H}" fill="${t.bg}"/>
<rect x="0" y="${H - 14}" width="${W}" height="14" fill="${t.accent}"/>
<g transform="translate(${markX}, ${markY})">${globe(markSize, t)}</g>
<text x="${textX}" y="300" font-family="${t.heading.family}, Georgia, serif" font-weight="${t.heading.weight}" font-size="96" fill="${t.ink}">${SITE_NAME}</text>
<text x="${textX}" y="360" font-family="${t.body.family}, sans-serif" font-weight="${t.body.weight}" font-size="34" fill="${t.muted}">${TAGLINE}</text>
</svg>`;
}

/** Asamblează un .ico multi-rezoluție: antet + intrări + PNG-uri brute.
 *  Windows și browserele moderne acceptă PNG înăuntrul containerului ICO, deci ce scoate
 *  sharp intră direct, fără reconversie în BMP. */
function buildIco(images) {
	const count = images.length;
	const header = Buffer.alloc(6);
	header.writeUInt16LE(0, 0); // rezervat
	header.writeUInt16LE(1, 2); // tip: 1 = icoană
	header.writeUInt16LE(count, 4);

	let offset = 6 + 16 * count;
	const entries = [];
	const payloads = [];
	for (const { size, png } of images) {
		const entry = Buffer.alloc(16);
		entry.writeUInt8(size >= 256 ? 0 : size, 0); // lățime (0 = 256)
		entry.writeUInt8(size >= 256 ? 0 : size, 1); // înălțime
		entry.writeUInt8(0, 2); // număr de culori (0 = fără paletă)
		entry.writeUInt8(0, 3); // rezervat
		entry.writeUInt16LE(1, 4); // planuri de culoare
		entry.writeUInt16LE(32, 6); // biți per pixel
		entry.writeUInt32LE(png.length, 8);
		entry.writeUInt32LE(offset, 12);
		entries.push(entry);
		payloads.push(png);
		offset += png.length;
	}
	return Buffer.concat([header, ...entries, ...payloads]);
}

async function genSet(t) {
	const s = t.suffix;

	writeFileSync(join(PUBLIC_DIR, `icon${s}.svg`), cardMarkSvg(200, t));

	const png32 = await sharp(Buffer.from(cardMarkSvg(32, t))).png().toBuffer();
	const png16 = await sharp(Buffer.from(cardMarkSvg(16, t))).png().toBuffer();
	writeFileSync(join(PUBLIC_DIR, `favicon${s}.ico`), buildIco([
		{ size: 32, png: png32 },
		{ size: 16, png: png16 },
	]));

	await sharp(Buffer.from(maskableMarkSvg(180, t))).resize(180, 180).png()
		.toFile(join(PUBLIC_DIR, `apple-touch-icon${s}.png`));
	await sharp(Buffer.from(cardMarkSvg(192, t))).resize(192, 192).png()
		.toFile(join(PUBLIC_DIR, `icon-192${s}.png`));
	await sharp(Buffer.from(maskableMarkSvg(512, t))).resize(512, 512).png()
		.toFile(join(PUBLIC_DIR, `icon-512${s}.png`));
	// Cardul de previzualizare al instanței LIBERE nu se mai generează aici (2026-09-08).
	//
	// Vechiul `ogImageSvg` punea marca la stânga și numele lângă ea. În rezultatele Google
	// imaginea e tăiată la un PĂTRAT central — supraviețuiește doar x ∈ [285, 915] — iar globul
	// stătea la x ∈ [100, 300], deci exact marca era ce se tăia, iar tăietura cădea la mijlocul
	// cuvântului. Pe rezultate albe, cremul nu avea nici măcar margine.
	//
	// Varianta publicată acum e „Cuvintele" din `scripts/gen-og-options.mjs`, construită să fie
	// citibilă la 92px. Se regenerează cu:
	//     node scripts/gen-og-options.mjs --tema=liber --adopta=2
	//
	// Scriptul ăsta NU mai scrie fișierul, altfel prima rulare de `gen-icons.mjs` l-ar fi
	// înlocuit tăcut la loc cu desenul vechi — exact felul de divergență pe care comentariul de
	// mai jos, despre manifestul rămas luni de zile pe numele vechi, o descrie deja o dată.
	//
	// Instanța cu clase îl păstrează: textul variantei noi („gratuit, fără cont") e adevărat
	// numai pe instanța liberă.
	if (s === "-liber") {
		console.log("og-image-liber.png: sărit — vezi scripts/gen-og-options.mjs --adopta=2");
	} else {
		await sharp(Buffer.from(ogImageSvg(t))).resize(1200, 630).png()
			.toFile(join(PUBLIC_DIR, `og-image${s}.png`));
	}

	// Manifestul se generează, nu se scrie de mână: era rămas pe numele vechi („Catedra")
	// și pe culoarea veche luni de zile, fără ca nimeni să observe — exact felul de
	// divergență tăcută pe care oglindirea manuală a configului o produce.
	writeFileSync(
		join(PUBLIC_DIR, `site${s}.webmanifest`),
		JSON.stringify(
			{
				lang: "ro",
				name: SITE_NAME,
				short_name: SITE_NAME,
				start_url: "/",
				display: "standalone",
				// `theme_color` = fundalul LUMINOS al paginii, nu culoarea primară.
					//
					// Manifestul și `<meta name="theme-color">` din root.tsx răspund la aceeași
					// întrebare — cu ce culoare se vopsește bara de sus — deci n-au voie să dea
					// două răspunsuri. Pe instanța liberă chiar dădeau: manifestul spunea cobalt
					// `#1B3FBF`, meta-ul spunea pergament, iar în aplicația instalată bara ieșea
					// albastră peste o pagină de hârtie.
					//
					// De ce varianta luminoasă: manifestul acceptă o singură valoare, iar modul
					// întunecat e acoperit de al doilea meta din pagină (root.tsx).
					theme_color: t.bg,
				background_color: t.bg,
				icons: [
					{ src: `/icon-192${s}.png`, sizes: "192x192", type: "image/png" },
					{ src: `/icon-512${s}.png`, sizes: "512x512", type: "image/png", purpose: "maskable" },
				],
			},
			null,
			"\t",
		) + "\n",
	);

	console.log(`  set „${s || "clase"}" scris`);
}

async function main() {
	mkdirSync(PUBLIC_DIR, { recursive: true });
	console.log("Icoane în", PUBLIC_DIR);
	await genSet(CLASE);
	await genSet(LIBER);
}

main().catch((err) => {
	console.error(err);
	process.exit(1);
});
