/**
 * Descarcă fonturile din Google Fonts și le pune în `public/fonts/`.
 *
 * De ce local și nu un `<link>` către fonts.googleapis.com: decizia din runbook 4.7 —
 * un `<link>` trimite IP-ul fiecărui vizitator la Google ÎNAINTE de primul paint, pe un
 * sit folosit de minori. Aceleași fișiere, servite de noi.
 *
 * Două capcane, amândouă costă timp dacă le uiți:
 *
 *  1. **User-Agent.** Fără un UA de browser modern, Google întoarce `.ttf` în loc de
 *     `.woff2` — de câteva ori mai mare, pentru exact aceleași litere.
 *  2. **`latin-ext` e obligatoriu.** Diacriticele românești ș ț (U+0219, U+021B) și ă
 *     (U+0103) stau în afara blocului `latin`. Fără subsetul `latin-ext`, fiecare ș și ț
 *     de pe sit cade pe fontul de rezervă și se vede imediat.
 *
 * Rulare:  node scripts/fetch-fonts.mjs
 */
import { mkdir, writeFile } from "node:fs/promises";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT = join(__dirname, "..", "public", "fonts");

// UA de Chrome pe desktop — vezi capcana 1 de mai sus.
const UA =
	"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";

/** Familiile de care are nevoie tema Cobalt (`subject.config.themeLiber.fonts`). */
const FAMILIES = [
	// Instrument Serif publică DOAR 400 și 400 cursiv — nu există bold. De-aia tema are
	// jetonul `headingUi`, ca h3/h4 să plece pe Public Sans.
	{ name: "Instrument Serif", query: "Instrument+Serif:ital@0;1", slug: "instrument-serif" },
	// Public Sans e variabil pe 100–900, deci un singur fișier per subset acoperă tot.
	{ name: "Public Sans", query: "Public+Sans:wght@400..700", slug: "public-sans" },
];

/** Subseturile de care avem nevoie. `vietnamese` etc. se aruncă — nu ne trebuie. */
const WANTED = new Set(["latin", "latin-ext"]);

async function main() {
	await mkdir(OUT, { recursive: true });
	const manifest = [];

	for (const fam of FAMILIES) {
		const url = `https://fonts.googleapis.com/css2?family=${fam.query}&display=swap`;
		const css = await (await fetch(url, { headers: { "User-Agent": UA } })).text();

		// CSS-ul vine ca o serie de `/* subset */ @font-face { ... }`. Tăiem pe comentariu,
		// ca să știm ce subset e fiecare bloc.
		const parts = css.split(/\/\*\s*([a-z-]+)\s*\*\//).slice(1);
		let n = 0;
		for (let i = 0; i < parts.length; i += 2) {
			const subset = parts[i];
			const block = parts[i + 1] ?? "";
			if (!WANTED.has(subset)) continue;

			const src = block.match(/url\((https:[^)]+\.woff2)\)/)?.[1];
			if (!src) continue;
			const style = /font-style:\s*italic/.test(block) ? "italic" : "normal";
			const weight = block.match(/font-weight:\s*([^;]+);/)?.[1].trim() ?? "400";
			const range = block.match(/unicode-range:\s*([^;]+);/)?.[1].trim() ?? "";

			const file = `${fam.slug}-${style}-${weight.replace(/\s+/g, "")}-${subset}.woff2`;
			const bytes = Buffer.from(await (await fetch(src, { headers: { "User-Agent": UA } })).arrayBuffer());
			await writeFile(join(OUT, file), bytes);
			manifest.push({ family: fam.name, file, style, weight, range, bytes: bytes.length });
			n++;
		}
		if (n === 0) throw new Error(`Niciun fișier pentru ${fam.name} — s-a schimbat formatul CSS?`);
	}

	// Plasă de siguranță pentru capcana 2: fără latin-ext, site-ul pierde ș/ț/ă în tăcere.
	for (const fam of FAMILIES) {
		const are = manifest.some((m) => m.family === fam.name && m.range.includes("U+0100"));
		if (!are) throw new Error(`${fam.name} n-a primit subsetul latin-ext — diacriticele ar cădea.`);
	}

	console.log(`\nScris în public/fonts/ (${manifest.length} fișiere):\n`);
	for (const m of manifest) {
		console.log(`  ${String(Math.round(m.bytes / 1024)).padStart(4)} kB  ${m.file}`);
	}
	console.log("\n@font-face de pus în app.css:\n");
	for (const m of manifest) {
		console.log(`@font-face {
	font-family: "${m.family}";
	font-style: ${m.style};
	font-weight: ${m.weight};
	font-display: swap;
	src: url("/fonts/${m.file}") format("woff2");
	unicode-range: ${m.range};
}`);
	}
}

main().catch((e) => {
	console.error(e);
	process.exit(1);
});
