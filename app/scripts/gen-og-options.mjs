// Trei propuneri pentru imaginea de previzualizare (Open Graph / Twitter card / miniatura
// din Google), ca înlocuitor pentru `public/og-image-liber.png`.
//
// Rulare:   node scripts/gen-og-options.mjs [--tema=liber|clase] [--out=DIRECTOR]
//
// NU scrie peste `public/og-image*.png`. Scrie într-un director de lucru (implicit
// `<temp>/og-optiuni`), fiindcă alegerea o face proprietara, iar cablarea câștigătoarei în
// `lib/seo.ts` e un pas separat.
//
// ============================================================================
// PROBLEMA
// ============================================================================
// Imaginea actuală (`ogImageSvg` din `gen-icons.mjs`) e marca mică plus numele, aliniate la
// stânga pe un card crem. La 1200x630 arată curat. La 92-160 px, adică exact mărimea la care
// o vede cineva în rezultatele Google, se întâmplă trei lucruri, toate rele:
//
//   1. **Miniatura e decupată PĂTRAT, din centru.** Din 1200x630 rămâne banda x∈[285, 915].
//      Marca stă la x∈[100, 300] și numele începe la x=364 — deci decupajul taie marca
//      aproape complet și prinde din nume o bucată de mijloc. Ce rămâne e fundal gol.
//   2. **Fundalul crem se pierde în pagina albă a Google.** Un card deschis pe alb n-are
//      margine; arată a spațiu gol, nu a imagine.
//   3. **Textul de 34 px devine 4 px.** Sloganul nu se citește; e zgomot gri.
//
// De aici cele trei reguli după care sunt construite variantele de mai jos:
//   - tot ce contează stă în pătratul din mijloc, x∈[285, 915];
//   - fundalul e ÎNCHIS (cobalt sau cerneală), ca să se decupeze de pagina albă;
//   - o singură idee vizuală mare, nu trei mici.
//
// ============================================================================
// CE S-A RESPINS
// ============================================================================
//   - **Aceeași machetă în trei culori.** Cerința era trei concepte diferite, nu trei
//     colorații. Diferența dintre ele trebuie să se vadă la 92 px, nu la 1200.
//   - **Fotografie adusă de pe internet.** Regula proiectului e PD/CC0 (vezi
//     `content/site/SOURCES.md`), iar filtrul de licență s-a dovedit insuficient în trecut.
//     Se folosesc DOAR fișierele deja verificate din `public/img/`.
//   - **Text pe degrade.** Un text așezat peste o trecere de la transparent la închis n-are
//     un raport de contrast care se poate calcula — depinde de pixelul de sub el. Aici textul
//     stă întotdeauna pe o suprafață PLINĂ, deci raportul e un număr, nu o impresie.
//   - **Coralul ca text.** `#FF6A4D` dă 2,64:1 pe pergament și nu trece nici pragul de
//     element non-text. Peste tot mai jos e UMPLERE (linie, bară), niciodată literă.
//     Aceeași regulă ca în `subject.ts`.
//   - **Enumerarea tipurilor de material din config** pe varianta a treia: primul tip din
//     `materialTypes` e „Lecție video", iar pe sit nu există niciun material video. O
//     previzualizare care promite ce nu există e o minciună, oricât de „citită din config" ar fi.
//
// ============================================================================
// DE CE SE CITEȘTE CONFIGUL, NU SE COPIAZĂ
// ============================================================================
// `gen-icons.mjs` OGLINDEȘTE manual constantele din `app/app/config/subject.ts` și avertizează
// singur că trebuie ținute în sinc de mână — capcană care a lăsat manifestul luni de zile pe
// numele vechi. Aici nu se repetă: scriptul CITEȘTE `subject.ts` ca text și extrage numele,
// sloganul, paleta și fonturile. Node curat nu poate importa TypeScript, dar un parser mic și
// zgomotos (aruncă excepție dacă nu găsește câmpul) e infinit mai bun decât o copie tăcută.

import { readFileSync, readdirSync, mkdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { tmpdir } from "node:os";
import sharp from "sharp";

const __dirname = dirname(fileURLToPath(import.meta.url));
const APP_DIR = join(__dirname, "..");
const PUBLIC_DIR = join(APP_DIR, "public");
const FONTS_DIR = join(PUBLIC_DIR, "fonts");
const IMG_DIR = join(PUBLIC_DIR, "img");
const CONFIG_FILE = join(APP_DIR, "app", "config", "subject.ts");

const W = 1200;
const H = 630;

/**
 * Codarea PNG a variantelor cu fotografie.
 *
 * O fotografie de 1200x630 în PNG pe 24 de biți iese la ~880 kB — sub pragul de 1 MB, dar
 * fără rost: paletizată la 256 de culori scade la ~245 kB, iar diferența nu se vede nici la
 * mărime întreagă, cu atât mai puțin în miniatura de 92 px. Textul stă oricum pe o bară
 * plină, deci nu are ce să sufere de pe urma cuantizării. Formatul rămâne PNG fiindcă
 * `lib/seo.ts` trimite spre `/og-image*.png`; un JPEG ar cere și redenumire.
 */
const PNG_FOTO = { palette: true, quality: 88, effort: 9 };
const PNG_PLAT = { compressionLevel: 9 };
/** Decupajul pătrat pe care îl face Google din mijloc. Tot ce e esențial intră aici. */
const SIGUR = { left: (W - H) / 2, width: H };
/** Lățimea utilă din decupaj, cu o margine de respiro. Toate textele se măsoară contra ei. */
const SIGUR_LAT = H - 70;

// ---------------------------------------------------------------------------
// Citirea configului
// ---------------------------------------------------------------------------

const SRC = readFileSync(CONFIG_FILE, "utf8");

/** Conținutul primului `{ … }` care urmează după `cheie`, cu potrivire de acolade. */
function bloc(src, cheie) {
	const i = src.indexOf(cheie);
	if (i < 0) throw new Error(`subject.ts: nu găsesc „${cheie}"`);
	const start = src.indexOf("{", i);
	let adancime = 0;
	for (let j = start; j < src.length; j++) {
		if (src[j] === "{") adancime++;
		else if (src[j] === "}" && --adancime === 0) return src.slice(start + 1, j);
	}
	throw new Error(`subject.ts: bloc neînchis la „${cheie}"`);
}

/**
 * Un câmp text de prim rang, ex. `siteName: "Geo-catedra"`.
 *
 * Acceptă ambele feluri de ghilimele: stacurile de fonturi din config sunt scrise cu
 * apostrofuri tocmai fiindcă au ghilimele duble înăuntru (`'"Instrument Serif", Georgia'`).
 */
function camp(src, nume) {
	const m = src.match(new RegExp(`\\b${nume}:\\s*(?:"((?:[^"\\\\]|\\\\.)*)"|'((?:[^'\\\\]|\\\\.)*)')`));
	if (!m) throw new Error(`subject.ts: nu găsesc câmpul „${nume}"`);
	return m[1] ?? m[2];
}

/**
 * Un text de interfață din `strings`.
 *
 * Nu se folosește `bloc("strings")`: blocul conține chiar în valorile lui acolade
 * (`{n} materiale`, `© {year}`), deci potrivirea de acolade s-ar dezechilibra. Cheile fiind
 * unice în tot fișierul, o căutare directă e și mai sigură, și mai simplă.
 */
function sir(cheie) {
	const m = SRC.match(new RegExp(`"${cheie.replace(/\./g, "\\.")}":\\s*"((?:[^"\\\\]|\\\\.)*)"`));
	if (!m) throw new Error(`subject.ts: nu găsesc textul „${cheie}"`);
	return m[1];
}

/** Perechile `cheie: "#hex"` dintr-un bloc de culori. */
function culori(blocCulori) {
	const out = {};
	for (const m of blocCulori.matchAll(/"?([a-zA-Z-]+)"?:\s*"(#[0-9A-Fa-f]{6})"/g)) out[m[1]] = m[2];
	if (!out.bg || !out.ink || !out.primary) throw new Error("subject.ts: paletă incompletă");
	return out;
}

/** Prima familie dintr-un stac de fonturi: `'"Instrument Serif", Georgia, serif'` → `Instrument Serif`. */
function familie(stac) {
	const m = stac.match(/"([^"]+)"|'([^']+)'/);
	return (m ? m[1] || m[2] : stac.split(",")[0]).trim();
}

function citesteTema(nume) {
	const b = bloc(SRC, nume === "liber" ? "themeLiber:" : "\ttheme:");
	const c = culori(bloc(b, "colors:"));
	const f = bloc(b, "fonts:");
	return {
		nume,
		c,
		titlu: { familie: familie(camp(f, "heading")), greutate: nume === "liber" ? 400 : 700 },
		corp: { familie: familie(camp(f, "body")), greutate: 500 },
	};
}

const SITE_NAME = camp(SRC, "siteName");
const TAGLINE = camp(SRC, "tagline");

// ---------------------------------------------------------------------------
// Fonturi
// ---------------------------------------------------------------------------

/**
 * Fișierele `.woff2` ale unei familii, deduse din numele fișierului.
 *
 * Tot o legătură prin convenție, dar una care se rupe ZGOMOTOS: dacă familia din config nu
 * are fișiere în `public/fonts/`, scriptul cade cu numele familiei în mesaj. O listă scrisă
 * de mână s-ar fi dezacordat în tăcere, exact ca manifestul.
 */
function fisiereFont(fam, greutate) {
	const slug = fam.toLowerCase().replace(/\s+/g, "-");
	const toate = readdirSync(FONTS_DIR).filter((f) => f.endsWith(".woff2"));
	let c = toate.filter((f) => f.startsWith(slug + "-") && !f.includes("italic"));
	if (!c.length) throw new Error(`fonts: niciun fișier pentru familia „${fam}" (slug ${slug})`);
	const cuGreutate = c.filter((f) => f.includes(String(greutate)));
	// Public Sans e variabil („400700"), deci n-are fișier „-500-": atunci merg toate.
	return cuGreutate.length ? cuGreutate : c;
}

function fete(tema) {
	const parti = [];
	for (const spec of [tema.titlu, tema.corp]) {
		for (const f of fisiereFont(spec.familie, spec.greutate)) {
			const b64 = readFileSync(join(FONTS_DIR, f)).toString("base64");
			parti.push(
				`@font-face { font-family: '${spec.familie}'; font-weight: ${spec.greutate}; ` +
					`src: url(data:font/woff2;base64,${b64}) format('woff2'); }`,
			);
		}
	}
	return parti.join("\n");
}

// ---------------------------------------------------------------------------
// Contrast (WCAG 2.1) — oglindește `app/app/lib/contrast.test.ts`
// ---------------------------------------------------------------------------

function luminanta(hex) {
	const c = [1, 3, 5]
		.map((i) => parseInt(hex.slice(i, i + 2), 16) / 255)
		.map((v) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));
	return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
}

function raport(a, b) {
	const x = luminanta(a);
	const y = luminanta(b);
	return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05);
}

/** Culoarea reală a unui text desenat cu `opacity` peste o suprafață plină. */
function amesteca(fg, bg, alfa) {
	const mix = (i) => {
		const a = parseInt(fg.slice(i, i + 2), 16);
		const b = parseInt(bg.slice(i, i + 2), 16);
		return Math.round(a * alfa + b * (1 - alfa))
			.toString(16)
			.padStart(2, "0");
	};
	return "#" + mix(1) + mix(3) + mix(5);
}

const RAPOARTE = [];
/**
 * Textul se declară o dată, aici, ca raportul lui să apară în consolă — nu în comentarii.
 *
 * `prag: null` = pereche pur decorativă, raportată dar neverificată. WCAG 1.4.11 cere 3:1
 * pentru elementele non-text NECESARE înțelegerii; o bandă colorată în spatele unui text
 * care se citește oricum nu e una dintre ele. Se tipărește totuși, ca decizia să fie a
 * cuiva care a văzut numărul.
 */
function textPe(eticheta, culoare, fundal, prag = 4.5) {
	const r = raport(culoare, fundal);
	RAPOARTE.push({ eticheta, culoare, fundal, r, prag, trece: prag === null || r >= prag });
	return culoare;
}

// ---------------------------------------------------------------------------
// Măsurarea textului
// ---------------------------------------------------------------------------

const esc = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

/**
 * Lățimea reală a unui text, în pixeli.
 *
 * librsvg nu întoarce metrici, deci se randează textul singur pe fundal transparent și se
 * taie marginile goale cu `trim()`. E singurul fel în care „scrie sloganul cât toată rama"
 * devine o instrucțiune, nu o nimereală: fără măsurare, orice text mai lung cu un cuvânt ar
 * ieși din pânză, iar propunerea tipografică n-ar avea niciun sens.
 */
async function latimeText(txt, fam, greutate, marime, fetele) {
	const svg =
		`<svg xmlns="http://www.w3.org/2000/svg" width="8000" height="${Math.ceil(marime * 2.5)}">` +
		`<style>${fetele}</style>` +
		`<text x="20" y="${Math.round(marime * 1.5)}" font-family="${fam}, Georgia, serif" ` +
		`font-weight="${greutate}" font-size="${marime}" fill="#000">${esc(txt)}</text></svg>`;
	const { info } = await sharp(Buffer.from(svg)).trim({ threshold: 1 }).png().toBuffer({ resolveWithObject: true });
	return info.width;
}

/** Cea mai mare mărime la care toate liniile încap în `latime`. Textul scalează liniar. */
async function potriveste(linii, fam, greutate, latime, fetele, max = 300) {
	const sonda = 160;
	const w = await Promise.all(linii.map((l) => latimeText(l, fam, greutate, sonda, fetele)));
	return Math.min(max, Math.floor((sonda * latime) / Math.max(...w)));
}

/** Toate felurile de a rupe un șir de cuvinte în `k` rânduri; câștigă cel cu rândul cel mai scurt. */
function imparte(cuvinte, k) {
	if (k === 1) return [cuvinte.join(" ")];
	let cel = null;
	const rec = (i, ramase, acum) => {
		if (ramase === 1) {
			const linii = [...acum, cuvinte.slice(i).join(" ")];
			const maxim = Math.max(...linii.map((l) => l.length));
			if (!cel || maxim < cel.maxim) cel = { linii, maxim };
			return;
		}
		for (let j = i + 1; j <= cuvinte.length - ramase + 1; j++) {
			rec(j, ramase - 1, [...acum, cuvinte.slice(i, j).join(" ")]);
		}
	};
	rec(0, k, []);
	return cel.linii;
}

/**
 * Rupe un titlu în rândurile care ies CEL MAI MARI într-o casetă dată.
 *
 * Aici se vede de ce contează măsurarea. Titlul instanței libere are trei cuvinte: pe două
 * rânduri, cel mai lung e „pentru oricine" (14 semne); pe trei, cel mai lung e „Geografie,"
 * (10). Ruperea în trei permite deci litere cu ~40% mai mari în aceeași lățime — exact
 * lățimea decupajului pătrat. Fără măsurare, alegerea „două rânduri arată mai bine" ar fi
 * costat tocmai mărimea de care depinde varianta tipografică.
 */
async function aseaza(titlu, fam, greutate, latime, inaltime, fetele) {
	const cuvinte = titlu.split(/\s+/);
	let cel = null;
	for (let k = 1; k <= Math.min(3, cuvinte.length); k++) {
		const linii = imparte(cuvinte, k);
		let s = await potriveste(linii, fam, greutate, latime, fetele, 220);
		const h = k * s * 1.12;
		if (h > inaltime) s = Math.floor((s * inaltime) / h);
		if (!cel || s > cel.marime) cel = { linii, marime: s };
	}
	return cel;
}

// ---------------------------------------------------------------------------
// Marca („glob"): DESENUL din `app/app/components/site.tsx`, la fel ca în gen-icons.mjs
// ---------------------------------------------------------------------------

function glob(size, x, y, tema, { disc = tema.c.primary, linii = tema.c["on-primary"] } = {}) {
	const cx = x + size / 2;
	const cy = y + size / 2;
	const r = size / 2 - Math.max(1, size * 0.03);
	const sw = Math.max(1, size * 0.05);
	return `
<circle cx="${cx}" cy="${cy}" r="${r}" fill="${disc}"/>
<ellipse cx="${cx}" cy="${cy}" rx="${r * 0.45}" ry="${r}" fill="none" stroke="${linii}" stroke-width="${sw}" opacity="0.85"/>
<line x1="${cx - r}" y1="${cy}" x2="${cx + r}" y2="${cy}" stroke="${linii}" stroke-width="${sw}" opacity="0.85"/>
<circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="${linii}" stroke-width="${sw}" opacity="0.85"/>`;
}

// ---------------------------------------------------------------------------
// Fotografiile deja verificate din public/img (proveniență: content/site/SOURCES.md)
// ---------------------------------------------------------------------------

/** Cea mai mare variantă existentă a unei fotografii. Nu se aduce nimic de pe internet. */
function foto(baza) {
	const lista = readdirSync(IMG_DIR).filter((f) => f.startsWith(baza + "-") && f.endsWith(".webp"));
	if (!lista.length) throw new Error(`img: nu găsesc „${baza}-*.webp" în public/img`);
	lista.sort((a, b) => parseInt(b.match(/-(\d+)\./)[1], 10) - parseInt(a.match(/-(\d+)\./)[1], 10));
	return join(IMG_DIR, lista[0]);
}

// ===========================================================================
// OPȚIUNEA 1 — „Delta": fotografie + bară plină de cerneală
// ===========================================================================
// Ce arată: delta văzută de sus (`elevi-*`), adică o imagine care CHIAR seamănă cu o hartă —
// verde/maro la stânga, mare albastră la dreapta, linia țărmului pe diagonală. La 92 px nu
// se mai văd detaliile, dar structura albastru-lângă-verde rămâne și spune „pământ", ceea ce
// un cerc albastru nu spune.
//
// De ce bară PLINĂ, nu degrade peste fotografie: contrastul textului trebuie să fie un număr.
// Peste bara de cerneală, pergamentul dă un raport calculat, nu unul „probabil bun".
// Degradeul rămâne doar deasupra barei, unde nu stă niciun text.
async function optiunea1(tema, fetele) {
	const c = tema.c;
	const bara = 236; // înălțimea barei pline de jos
	const yBara = H - bara;

	// Grupul marcă+nume trebuie să încapă ÎNTREG în decupajul pătrat, altfel Google taie „G"
	// și „a" din nume — exact ce pățea macheta veche. Sigla are latura 0,72·mărime și un
	// spațiu de 0,28·mărime, deci lockup-ul e (lățimea numelui + mărimea): se strânge până
	// intră, în loc să fie ghicit.
	let marimeNume = await potriveste([SITE_NAME], tema.titlu.familie, tema.titlu.greutate, SIGUR_LAT * 0.78, fetele, 104);
	let latNume = await latimeText(SITE_NAME, tema.titlu.familie, tema.titlu.greutate, marimeNume, fetele);
	while (latNume + marimeNume > SIGUR_LAT && marimeNume > 40) {
		marimeNume = Math.floor((marimeNume * SIGUR_LAT) / (latNume + marimeNume));
		latNume = await latimeText(SITE_NAME, tema.titlu.familie, tema.titlu.greutate, marimeNume, fetele);
	}
	const marimeSlogan = await potriveste([TAGLINE], tema.corp.familie, tema.corp.greutate, SIGUR_LAT, fetele, 30);
	const sloganAlfa = 0.88; // ierarhie fără o culoare literală nouă: același jeton, mai stins

	const culoareNume = textPe("1 · numele sitului (pergament pe cerneală)", c.bg, c.ink);
	const culoareSlogan = textPe(
		"1 · sloganul (pergament 88% pe cerneală)",
		amesteca(c.bg, c.ink, sloganAlfa),
		c.ink,
	);

	// Sigla stă ÎN RÂND cu numele, nu deasupra: pe bara de 236 px, trei etaje (marcă, nume,
	// slogan) se înghesuie, iar la miniatură devin trei dungi nedeslușite. Ca să fie centrat
	// grupul, lățimea numelui se MĂSOARĂ — `text-anchor="middle"` centrează textul singur,
	// nu ansamblul marcă+text.
	const dSigla = Math.round(marimeNume * 0.72);
	const spatiu = Math.round(marimeNume * 0.28);
	const xSigla = Math.round((W - (dSigla + spatiu + latNume)) / 2);
	const xNume = xSigla + dSigla + spatiu;
	const yNume = yBara + 132;

	const overlay = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">
<style>${fetele}</style>
<defs>
  <linearGradient id="voal" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0" stop-color="${c.ink}" stop-opacity="0"/>
    <stop offset="1" stop-color="${c.ink}" stop-opacity="1"/>
  </linearGradient>
</defs>
<!-- Tentă de marcă peste fotografie: o leagă de paletă fără să o înece. -->
<rect width="${W}" height="${H}" fill="${c.primary}" opacity="0.18"/>
<rect x="0" y="${yBara - 170}" width="${W}" height="170" fill="url(#voal)"/>
<rect x="0" y="${yBara}" width="${W}" height="${bara}" fill="${c.ink}"/>
<!-- Coralul e UMPLERE: o linie, nu o literă. Marchează muchia barei. -->
<rect x="0" y="${yBara - 6}" width="${W}" height="6" fill="${c.accent}"/>
<!-- Marca INVERSATĂ pe bară: discul cobalt pe cerneală dă 1,5:1 și dispare. Disc de
     pergament, linii cobalt — aceeași marcă, singura variantă care se vede pe închis. -->
<g>${glob(dSigla, xSigla, yNume - Math.round(dSigla * 0.78), tema, { disc: c.bg, linii: c.primary })}</g>
<text x="${xNume}" y="${yNume}" font-family="${tema.titlu.familie}, Georgia, serif"
  font-weight="${tema.titlu.greutate}" font-size="${marimeNume}" fill="${culoareNume}">${esc(SITE_NAME)}</text>
<text x="${W / 2}" y="${yBara + 190}" text-anchor="middle" font-family="${tema.corp.familie}, sans-serif"
  font-weight="${tema.corp.greutate}" font-size="${marimeSlogan}" fill="${culoareSlogan}">${esc(TAGLINE)}</text>
</svg>`;

	// `cover` pe 1200x630 dintr-o sursă de 1259x764: se taie pe verticală. `position: top`
	// păstrează gura de vărsare și linia țărmului, care sunt partea care „se citește" mic;
	// centrul sursei e apă și uscat nediferențiat.
	return sharp(foto("elevi"))
		.resize(W, H, { fit: "cover", position: "top" })
		.composite([{ input: Buffer.from(overlay) }])
		.png(PNG_FOTO)
		.toBuffer();
}

// ===========================================================================
// OPȚIUNEA 2 — „Cuvintele": propunerea de valoare, cât toată rama
// ===========================================================================
// Ce arată: NIMIC în afară de text. Titlul paginii de start a instanței libere
// (`liber.hero.title`) pe două rânduri, măsurate ca să umple lățimea, plus rândul de sub el
// (`liber.hero.lead`), care e chiar argumentul: „gratuit, fără cont".
//
// De ce merită încercat: textul mare supraviețuiește micșorării mai bine decât orice desen —
// literele sunt forme simple, cu muchii lungi. De ce e totuși un pariu: la 92 px NICIUN text
// nu se mai citește, oricât de mare; ce rămâne e un dreptunghi cobalt cu dungi deschise.
// Câștigă la 300-600 px (WhatsApp, Facebook, Slack), nu în lista Google.
//
// Textul vine din config, deci dacă se schimbă propunerea de valoare pe pagina de start, se
// schimbă și imaginea la următoarea rulare.
async function optiunea2(tema, fetele) {
	const c = tema.c;
	const titlu = sir("liber.hero.title"); // „Geografie, pentru oricine"
	const lead = sir("liber.hero.lead");

	// Textul se așază în DECUPAJUL PĂTRAT, nu în toată rama.
	//
	// Prima variantă umplea 1000 px din 1200 și arăta spectaculos… până la proba miniaturii,
	// unde Google tăia „Geografie" fără G și fără e, iar „pentru oricine" devenea „ntru
	// orici". O imagine tipografică ruptă în două arată a eroare, nu a design. Marginile
	// generoase de la 1200x630 sunt prețul plătit ca decupajul să conțină fraza întreagă.
	// Rândul de sub titlu se rupe la punct — cezura naturală a frazei — și se măsoară tot
	// contra decupajului, ca să nu iasă din el o propoziție tăiată la jumătate.
	const liniiLead = lead.split(/(?<=\.)\s+/).filter(Boolean);
	const marimeLead = await potriveste(liniiLead, tema.corp.familie, tema.corp.greutate, SIGUR_LAT, fetele, 30);

	// Pagina se împarte DE JOS ÎN SUS: semnătura are un loc fix, rândul-argument stă
	// deasupra ei, iar titlul primește exact ce rămâne. Invers — titlu întâi, restul „unde
	// încape" — prima randare a împins argumentul sub marginea de jos, unde nu se vedea
	// deloc: singura urmă era un rând tăiat pe muchie.
	const pasLead = Math.round(marimeLead * 1.35);
	const yLeadUltim = H - 110;
	const yLeadPrim = yLeadUltim - (liniiLead.length - 1) * pasLead;
	const susTitlu = 70;
	const josTitlu = yLeadPrim - marimeLead - 46;

	const asezare = await aseaza(titlu, tema.titlu.familie, tema.titlu.greutate, SIGUR_LAT, josTitlu - susTitlu, fetele);
	const linii = asezare.linii;
	const marime = asezare.marime;

	const culoareTitlu = textPe("2 · rândul 1 (pergament pe cobalt)", c.bg, c.primary);
	const culoareLead = textPe("2 · rândul de sub titlu (pergament 90% pe cobalt)", amesteca(c.bg, c.primary, 0.9), c.primary);
	const culoareNume = textPe("2 · numele sitului (pergament 78% pe cobalt)", amesteca(c.bg, c.primary, 0.78), c.primary);

	// A DOUA CULOARE, și de ce e chiar aici.
	//
	// Prima variantă avea o bară corală lată în capul imaginii. A picat la verificare:
	// coral pe cobalt dă 2,96:1 — sub pragul de 3:1 al elementelor non-text, fiindcă
	// cele două culori au aproape aceeași luminanță. Nu se repară închizând coralul
	// (`accent-strong` pe cobalt e și mai rău: ambele sunt închise).
	//
	// Coralul rămâne, dar în singura poziție în care e corect prin construcție: ca
	// UMPLERE sub un rând de text scris cu cerneală — exact jetonul `on-accent` din
	// `subject.ts`. Ce se măsoară atunci e cerneala pe coral, nu coralul pe cobalt, iar
	// aceea trece lejer. În plus, la miniatură banda corală e a doua formă mare a imaginii,
	// deci face exact treaba pe care bara de sus n-o făcea.
	const culoareTitlu2 = textPe("2 · rândul 2 (cerneală pe coral)", c["on-accent"], c.accent);
	textPe("2 · muchia benzii corale pe cobalt (decor)", c.accent, c.primary, null);

	// Blocul de titlu se centrează pe verticală în jumătatea de sus, iar banda corală cade
	// pe ULTIMUL rând: acolo e cuvântul care duce promisiunea („oricine"), și tot acolo e
	// util să fie a doua formă mare a imaginii, cât mai aproape de centrul decupajului.
	// Interlinie 1,12, nu 1,02: Instrument Serif are cozi lungi, iar „p" din „pentru" atingea
	// muchia benzii corale de dedesubt — arăta a suprapunere din greșeală, nu a intenție.
	const pas = Math.round(marime * 1.12);
	const capH = Math.round(marime * 0.72); // înălțimea majusculei la Instrument Serif
	const inaltimeBloc = (linii.length - 1) * pas + capH;
	const y1 = Math.round(susTitlu + (josTitlu - susTitlu - inaltimeBloc) / 2 + capH);
	const iBanda = linii.length - 1;
	const yBanda = y1 + iBanda * pas;
	const latBanda = await latimeText(linii[iBanda], tema.titlu.familie, tema.titlu.greutate, marime, fetele);
	const padX = Math.round(marime * 0.2);
	// Coada literelor („p" din „pentru") coboară ~0,22·mărime sub linia de bază. O bandă de
	// 1,06·mărime le-ar tăia exact la muchie — se vedea în prima randare.
	const banda = {
		x: Math.round((W - latBanda) / 2) - padX,
		y: yBanda - Math.round(marime * 0.86),
		w: latBanda + padX * 2,
		h: Math.round(marime * 1.16),
	};
	// Semnătura: și aici grupul marcă+nume se centrează pe lățimea MĂSURATĂ, nu pe niște
	// deplasări ghicite — numele vine din config și se poate schimba oricând.
	const marimeSemn = 32;
	const latSemn = await latimeText(SITE_NAME, tema.corp.familie, tema.corp.greutate, marimeSemn, fetele);
	const dSemn = 40;
	const xSemn = Math.round((W - (dSemn + 16 + latSemn)) / 2);

	const randuri = linii
		.map(
			(l, i) =>
				`<text x="${W / 2}" y="${y1 + i * pas}" text-anchor="middle" font-family="${tema.titlu.familie}, Georgia, serif" ` +
				`font-weight="${tema.titlu.greutate}" font-size="${marime}" ` +
				`fill="${i === iBanda ? culoareTitlu2 : culoareTitlu}">${esc(l)}</text>`,
		)
		.join("\n");

	const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">
<style>${fetele}</style>
<rect width="${W}" height="${H}" fill="${c.primary}"/>
<rect x="${banda.x}" y="${banda.y}" width="${banda.w}" height="${banda.h}" fill="${c.accent}"/>
${randuri}
${liniiLead
		.map(
			(l, i) =>
				`<text x="${W / 2}" y="${yLeadPrim + i * pasLead}" text-anchor="middle" ` +
				`font-family="${tema.corp.familie}, sans-serif" font-weight="${tema.corp.greutate}" ` +
				`font-size="${marimeLead}" fill="${culoareLead}">${esc(l)}</text>`,
		)
		.join("\n")}
<g>${glob(dSemn, xSemn, H - 46 - Math.round(dSemn * 0.78), tema, { disc: c.bg, linii: c.primary })}</g>
<text x="${xSemn + dSemn + 16}" y="${H - 46}" font-family="${tema.corp.familie}, sans-serif"
  font-weight="${tema.corp.greutate}" font-size="${marimeSemn}" fill="${culoareNume}">${esc(SITE_NAME)}</text>
</svg>`;

	return sharp(Buffer.from(svg)).png(PNG_PLAT).toBuffer();
}

// ===========================================================================
// OPȚIUNEA 3 — „Mozaic": marca mare peste chiar arta sitului
// ===========================================================================
// Ce arată: cele PATRU fotografii de card care sunt deja pe sit, câte una pentru fiecare
// categorie reală de material (lecție scrisă, joc, fotografii, întrebări) — `card-*` din
// `public/img/`, aceleași pe care le alege `CATEGORY_PHOTO` din `lib/card-art.ts`. Deasupra
// lor, marca la scară mare și numele pe o bară plină.
//
// De ce ele și nu o ilustrație nouă: cerința era să se refolosească limbajul vizual al
// sitului. Astea SUNT limbajul vizual al sitului, și fiecare corespunde unei categorii care
// chiar există în bază (spre deosebire de „Lecție video", vezi nota de sus).
//
// Marca stă pe un halou de pergament, nu direct pe fotografii: peste un mozaic voalat,
// discul cobalt s-ar fi înecat exact la mărimea la care contează.
async function optiunea3(tema, fetele) {
	const c = tema.c;
	const cel = { w: W / 2, h: Math.ceil((H - 190) / 2) }; // mozaicul ocupă tot ce e deasupra barei
	const bara = 190;
	const yBara = H - bara;

	const placi = ["card-scris", "card-joc", "card-foto", "card-question"];
	const bucati = await Promise.all(
		placi.map((p) => sharp(foto(p)).resize(cel.w, cel.h, { fit: "cover" }).toBuffer()),
	);

	const marimeNume = await potriveste([SITE_NAME], tema.titlu.familie, tema.titlu.greutate, 560, fetele, 84);
	const culoareNume = textPe("3 · numele sitului (pergament pe cerneală)", c.bg, c.ink);
	const culoareSlogan = textPe("3 · sloganul (pergament 88% pe cerneală)", amesteca(c.bg, c.ink, 0.88), c.ink);

	const dGlob = 250;
	const overlay = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">
<style>${fetele}</style>
<!-- Voal de cerneală: mozaicul rămâne textură, nu conținut. Fără el marca se pierde. -->
<rect width="${W}" height="${H}" fill="${c.ink}" opacity="0.46"/>
<rect width="${W}" height="${H}" fill="${c.primary}" opacity="0.16"/>
<!-- Halou RADIAL, nu disc plat: la 22% opacitate, un cerc plin lasă o muchie vizibilă —
     se citea ca o pată gri în jurul mărcii, nu ca lumină. -->
<defs>
  <radialGradient id="halou">
    <stop offset="0.62" stop-color="${c.bg}" stop-opacity="0.26"/>
    <stop offset="1" stop-color="${c.bg}" stop-opacity="0"/>
  </radialGradient>
</defs>
<circle cx="${W / 2}" cy="${(H - bara) / 2}" r="${dGlob / 2 + 70}" fill="url(#halou)"/>
<g>${glob(dGlob, W / 2 - dGlob / 2, (H - bara) / 2 - dGlob / 2, tema)}</g>
<rect x="0" y="${yBara}" width="${W}" height="${bara}" fill="${c.ink}"/>
<rect x="0" y="${yBara - 6}" width="${W}" height="6" fill="${c.accent}"/>
<text x="${W / 2}" y="${yBara + 92}" text-anchor="middle" font-family="${tema.titlu.familie}, Georgia, serif"
  font-weight="${tema.titlu.greutate}" font-size="${marimeNume}" fill="${culoareNume}">${esc(SITE_NAME)}</text>
<text x="${W / 2}" y="${yBara + 140}" text-anchor="middle" font-family="${tema.corp.familie}, sans-serif"
  font-weight="${tema.corp.greutate}" font-size="29" fill="${culoareSlogan}">${esc(TAGLINE)}</text>
</svg>`;

	return sharp({ create: { width: W, height: H, channels: 3, background: c.ink } })
		.composite([
			{ input: bucati[0], left: 0, top: 0 },
			{ input: bucati[1], left: cel.w, top: 0 },
			{ input: bucati[2], left: 0, top: cel.h },
			{ input: bucati[3], left: cel.w, top: cel.h },
			{ input: Buffer.from(overlay), left: 0, top: 0 },
		])
		.png(PNG_FOTO)
		.toBuffer();
}

// ---------------------------------------------------------------------------
// Miniatura: exact ce face Google
// ---------------------------------------------------------------------------
// Decupaj PĂTRAT din mijloc, apoi micșorare la 150 px. Nu e o previzualizare cosmetică — e
// testul propriu-zis. O machetă care arată bine la 1200x630 și moare aici a picat proba.
async function miniatura(png) {
	return sharp(png)
		.extract({ left: SIGUR.left, top: 0, width: SIGUR.width, height: SIGUR.width })
		.resize(150, 150)
		.png(PNG_PLAT)
		.toBuffer();
}

// ---------------------------------------------------------------------------

async function main() {
	const arg = (n, impl) => {
		const a = process.argv.find((x) => x.startsWith(`--${n}=`));
		return a ? a.slice(n.length + 3) : impl;
	};
	const numeTema = arg("tema", "liber");
	if (!["liber", "clase"].includes(numeTema)) throw new Error("--tema= liber | clase");
	const OUT = arg("out", join(tmpdir(), "og-optiuni"));
	mkdirSync(OUT, { recursive: true });

	const tema = citesteTema(numeTema);
	const fetele = fete(tema);

	console.log(`Config: „${SITE_NAME}" · „${TAGLINE}"`);
	console.log(`Temă „${numeTema}": ${tema.titlu.familie} + ${tema.corp.familie} · ${tema.c.primary} / ${tema.c.bg} / ${tema.c.accent}`);
	console.log(`Ieșire: ${OUT}\n`);

	const variante = [
		["optiunea-1", "Delta — fotografie + bară de cerneală", optiunea1],
		["optiunea-2", "Cuvintele — propunerea de valoare, tipografic", optiunea2],
		["optiunea-3", "Mozaic — arta sitului + marca mare", optiunea3],
	];

	const { writeFileSync } = await import("node:fs");
	const miniaturi = [];
	for (const [nume, titlu, fn] of variante) {
		const png = await fn(tema, fetele);
		const meta = await sharp(png).metadata();
		const thumb = await miniatura(png);
		miniaturi.push(thumb);
		writeFileSync(join(OUT, `${nume}.png`), png);
		writeFileSync(join(OUT, `${nume}-thumb.png`), thumb);
		console.log(`${nume}.png  ${meta.width}x${meta.height}  ${(png.length / 1024).toFixed(0)} kB  — ${titlu}`);
		if (meta.width !== W || meta.height !== H) throw new Error(`${nume}: dimensiune greșită`);
		if (png.length > 1024 * 1024) throw new Error(`${nume}: peste 1 MB`);
	}

	// Foaia de comparație: cele trei miniaturi una lângă alta pe ALB, adică pe fundalul
	// listei de rezultate Google. Pe fond alb se vede imediat care variantă are margine și
	// care se topește în pagină — lucru care nu se observă privind PNG-urile separat.
	await sharp({ create: { width: 600, height: 210, channels: 3, background: "#FFFFFF" } })
		.composite(miniaturi.map((b, i) => ({ input: b, left: 30 + i * 190, top: 30 })))
		.png()
		.toFile(join(OUT, "previzualizare-miniaturi.png"));
	console.log("previzualizare-miniaturi.png  600x210  — cele trei miniaturi pe fundal alb");

	console.log("\nContrast (WCAG 2.1) — calculat, nu apreciat:");
	for (const r of RAPOARTE) {
		console.log(
			`  ${r.trece ? "OK  " : "PICĂ"} ${r.r.toFixed(2)}:1 (prag ${r.prag}) ${r.culoare} pe ${r.fundal} — ${r.eticheta}`,
		);
	}
	const picate = RAPOARTE.filter((r) => !r.trece);
	if (picate.length) throw new Error(`${picate.length} perechi sub prag — vezi lista de mai sus`);

	// ─── Adoptarea variantei alese ───────────────────────────────────────────
	//
	// `--adopta=2` scrie varianta direct în `app/public/og-image-liber.png`, adică fix fișierul
	// pe care îl servește `DEFAULT_IMAGE` din `app/app/lib/seo.ts`. Se face DE AICI, nu cu un
	// copy-paste de PNG, ca imaginea publicată să rămână reproductibilă: cine vrea s-o schimbe
	// rulează scriptul, nu caută un fișier binar prin istoricul git.
	//
	// **Doar tema `liber`.** Varianta 2 e construită din `liber.hero.title` și `liber.hero.lead`
	// („Toate materialele, gratuit. Fără cont, fără cod, fără plată.") — afirmații adevărate
	// numai pe instanța gratuită. Pe cea cu clase ar fi o minciună tipărită pe cardul de
	// previzualizare, deci scriptul refuză.
	const adopta = arg("adopta", null);
	if (adopta) {
		if (numeTema !== "liber") {
			throw new Error(
				"--adopta merge doar cu --tema=liber: textul variantelor vine din șirurile instanței " +
					"libere, iar „gratuit” nu e adevărat pe instanța cu clase.",
			);
		}
		const idx = Number(adopta);
		if (!Number.isInteger(idx) || idx < 1 || idx > variante.length) {
			throw new Error(`--adopta= 1..${variante.length}`);
		}
		const [nume, titlu] = variante[idx - 1];
		const tinta = join(PUBLIC_DIR, "og-image-liber.png");
		const png = readFileSync(join(OUT, `${nume}.png`));
		writeFileSync(tinta, png);
		console.log(`
Adoptat: ${nume} („${titlu}") → app/public/og-image-liber.png (${(png.length / 1024).toFixed(0)} kB)`);
	}
}

main().catch((err) => {
	console.error(err);
	process.exit(1);
});
