/**
 * Caută pe Wikimedia Commons câte o fotografie reprezentativă pentru fiecare din cele patru
 * categorii de materiale cu culoare fixă (`scris` / `foto` / `joc` / `question`, vezi
 * `app/lib/card-art.ts`), VERIFICĂ licența, descarcă și scrie proveniența.
 *
 * De ce un script separat de `fetch-photos.mjs`: acela alimentează cele trei fotografii de
 * decor ale paginii de start (`erou`/`elevi`/`profesori`) și rescrie `content/site/SOURCES.md`
 * la fiecare rulare — a rula unul peste celălalt ar clobber-ui proveniența primului. Aceeași
 * regulă de licență (doar PD/CC0, vezi comentariile din `fetch-photos.mjs`), cerută explicit:
 * subsolul sitului invocă Legea 8/1996 pe materialele autoarei.
 *
 * Fotografiile astea sunt mici (carduri de material, nu banner) — o singură lățime, 640px,
 * refolosită identic pe TOATE cardurile aceleiași categorii (spre deosebire de ilustrația
 * vectorială de dinainte, care varia per material). E un compromis asumat explicit: patru
 * fotografii fixe, nu o fotografie per material.
 *
 * Rulare:  node scripts/fetch-card-photos.mjs
 * Ieșire:  public/img/card-<slug>-640.{avif,webp}  +  ../content/site/SOURCES-carduri.md
 */
import { mkdir, writeFile } from "node:fs/promises";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT = join(__dirname, "..", "public", "img");
const SOURCES = join(__dirname, "..", "..", "content", "site", "SOURCES-carduri.md");

const API = "https://commons.wikimedia.org/w/api.php";
const UA = "Geo-catedra/1.0 (educational site; contact via repo) node-fetch";

const CHART_SAU_SCAN =
	/\b(chart|engraving|illustration|diagram|manuscript|scan|plate|frontispiece|excavation|construction|crane|bulldozer|building site|industrial|painting|portrait|oil on canvas|synagogue|prayer|religious|cyanotype|botanical|specimen|algae|brand|advertising|store|shop|mall|banner|cartoon|caricature|satir|print made|directory|general|hills|survey|bee|insect|moth|butterfly|inventory|monitoring|poster|playbill|theatre|theater|stereograph|stereoscopic|fair|expo|exhibition|convention|plantation|plucking|tea|colonial|labourer|laborer|worker|ceylon|shunga|shunka|ukiyo|woodblock|erotic|amorous|nude|geisha|kabuki)\b/i;

const WANTED = [
	{
		slug: "card-scris",
		search: [
			"antique typewriter museum collection photograph",
			"vintage typewriter photograph object museum",
			"old typewriter photograph museum artifact",
			"portable typewriter photograph object",
		],
		minWidth: 1200,
		avoid: CHART_SAU_SCAN,
		rejectTitles: [
			"Maurycy Gottlieb",
			"South Stack (Hills)",
			"Secondhand Book Dealer",
			"Melitta melittoides",
			"Churchill",
			"Raleigh",
			"refectory",
			"Que Dieu",
			"LOC Main Reading Room",
			"Commercial Press Taiwan",
			"TIBE",
			"Matabele",
			"Thomas Butler Gunn",
			"Shiki no nagame",
		],
	},
	{
		slug: "card-foto",
		search: [
			"box camera museum collection photograph",
			"folding camera museum collection photograph",
			"camera equipment museum collection photograph NPS",
			"antique camera photograph museum artifact",
		],
		minWidth: 1200,
		avoid: CHART_SAU_SCAN,
		rejectTitles: ["Anna Atkins", "Saint Helena Island", "Plucking the Tea"],
	},
	{
		slug: "card-joc",
		search: ["compass navigation instrument photograph", "brass compass photograph object", "orienteering compass photograph"],
		minWidth: 1200,
		avoid: CHART_SAU_SCAN,
	},
	{
		slug: "card-question",
		search: [
			"world globe photograph object isolated",
			"terrestrial globe photograph close up",
			"desk globe photograph antique",
			"globe classroom photograph",
			"spinning globe photograph geography",
		],
		minWidth: 1200,
		avoid: CHART_SAU_SCAN,
		rejectTitles: ["Reinvent Your World", "French Generals retiring"],
	},
];

/** Vezi comentariul din `fetch-photos.mjs` — aceeași listă, aceeași grijă. */
const SUBIECTE_INTERZISE =
	/\b(war|bomb|bombed|military|aerodrome|airfield|battle|troops|army|navy|weapon|tank|soldier|cemetery|grave|ruins|nazi|wwi|wwii|memorial|nuclear|mine|quarry|factory|refinery|protest|riot|accident|crash|fire|flood damage|disaster|festival|burning man|crowd|concert|parade)\b/i;

function licenseOk(meta) {
	const short = (meta?.LicenseShortName?.value ?? "").toLowerCase();
	const name = (meta?.License?.value ?? "").toLowerCase();
	const both = `${short} ${name}`;
	const ok = /\bcc0\b/.test(both) || /public domain/.test(both) || /^pd[-\s]/.test(short) || /no known copyright restrictions?/.test(both) || short === "no restrictions";
	const nu = /\bby-sa\b|\bcc by\b|\bby\b\s*\d|gfdl|fair use|noncommercial|nc\b/.test(both);
	return ok && !nu;
}

async function eColor(buf) {
	const { channels } = await sharp(buf).stats();
	if (!channels || channels.length < 3) return false;
	const [r, g, b] = channels.map((c) => c.mean);
	const spread = Math.max(r, g, b) - Math.min(r, g, b);
	return spread > 8;
}

/** Carduri mici — un singur buget, mult sub cel al fotografiilor de decor. */
const BUGET = 70 * 1024;

async function api(params) {
	const url = `${API}?${new URLSearchParams({ format: "json", origin: "*", ...params })}`;
	for (let attempt = 0; ; attempt++) {
		const r = await fetch(url, { headers: { "User-Agent": UA } });
		if (r.ok) return r.json();
		if (r.status === 429 && attempt < 5) {
			const wait = 5000 * (attempt + 1);
			process.stderr.write(`  (429, aștept ${wait / 1000}s)… `);
			await new Promise((res) => setTimeout(res, wait));
			continue;
		}
		throw new Error(`Commons ${r.status} pentru ${url}`);
	}
}

async function findFree(searches, minWidth, opts) {
	const toateSarite = [];
	for (const search of [searches].flat()) {
		const hit = await cautaUna(search, minWidth, toateSarite, opts);
		if (hit) return hit;
	}
	throw new Error(
		`Nicio imagine PD/CC0 potrivită pentru ${JSON.stringify([searches].flat())}. ` +
			`Refuzate: ${toateSarite.slice(0, 6).join("; ")}`,
	);
}

async function cautaUna(search, minWidth, sarite, opts = {}) {
	const { rejectTitles = [], avoid } = opts;
	const data = await api({
		action: "query",
		generator: "search",
		gsrsearch: `filetype:bitmap ${search}`,
		gsrnamespace: "6",
		gsrlimit: "100",
		prop: "imageinfo",
		iiprop: "url|size|extmetadata|mime",
		iiurlwidth: "1280",
	});
	const pages = Object.values(data?.query?.pages ?? {});
	for (const p of pages) {
		const info = p.imageinfo?.[0];
		if (!info) continue;
		if (!/^image\/(jpeg|png)$/.test(info.mime ?? "")) continue;
		if ((info.width ?? 0) < minWidth) continue;
		if (rejectTitles.some((t) => p.title.includes(t))) continue;
		// Aproape toate rateurile de până acum pentru „scris" au fost gravuri/caricaturi digitizate
		// din colecția British Museum (accession numere „(BM 1981,...)"), nu fotografii. Comons le
		// clasează ca „imagine", deci trec de filtrul de mime — le scoatem după tipar în titlu.
		if (/\(BM [\dA-Z]/.test(p.title)) continue;
		const meta = info.extmetadata ?? {};
		if (!licenseOk(meta)) {
			sarite.push(`${p.title} (${meta?.LicenseShortName?.value ?? "licență necunoscută"})`);
			continue;
		}
		const text = `${p.title} ${(meta?.ImageDescription?.value ?? "").replace(/<[^>]+>/g, " ")}`;
		if (SUBIECTE_INTERZISE.test(text)) {
			sarite.push(`${p.title} (subiect nepotrivit)`);
			continue;
		}
		if (avoid && avoid.test(text)) {
			sarite.push(`${p.title} (exclus explicit)`);
			continue;
		}

		let bytes;
		try {
			const r = await fetch(info.thumburl ?? info.url, { headers: { "User-Agent": UA } });
			if (!r.ok) throw new Error(`HTTP ${r.status}`);
			bytes = Buffer.from(await r.arrayBuffer());
			if (!(await eColor(bytes))) {
				sarite.push(`${p.title} (alb-negru)`);
				continue;
			}
		} catch (e) {
			sarite.push(`${p.title} (nedescărcabil: ${e.message})`);
			continue;
		}

		return {
			title: p.title,
			bytes,
			descUrl: info.descriptionurl,
			width: info.width,
			license: meta?.LicenseShortName?.value ?? meta?.License?.value ?? "?",
			author: (meta?.Artist?.value ?? "necunoscut").replace(/<[^>]+>/g, "").trim(),
			sarite,
		};
	}
	return null;
}

async function main() {
	await mkdir(OUT, { recursive: true });
	await mkdir(dirname(SOURCES), { recursive: true });

	const rows = [];
	for (const w of WANTED) {
		process.stdout.write(`  caut „${w.search}"… `);
		const hit = await findFree(w.search, w.minWidth, w);
		const orig = hit.bytes;

		// Cadru 16:9 (aceeași proporție ca `aspect-video` din `CardThumb`), decupat din centru,
		// ca fotografia să umple cardul fără bare goale.
		const sizes = [];
		for (const fmt of ["avif", "webp"]) {
			let buf = null;
			let q = fmt === "avif" ? 55 : 78;
			for (; q >= 20; q -= 7) {
				const img = sharp(orig).resize({ width: 640, height: 360, fit: "cover" });
				buf = await (fmt === "avif" ? img.avif({ quality: q }) : img.webp({ quality: q })).toBuffer();
				if (buf.length <= BUGET) break;
			}
			if (!buf || buf.length > BUGET) {
				throw new Error(
					`${w.slug}-640.${fmt} = ${Math.round(buf.length / 1024)} kB chiar și la calitate minimă, ` +
						`peste bugetul de ${Math.round(BUGET / 1024)} kB. Alege altă fotografie.`,
				);
			}
			const file = `${w.slug}-640.${fmt}`;
			await writeFile(join(OUT, file), buf);
			sizes.push({ file, bytes: buf.length, fmt, q });
		}
		console.log(`${hit.license} — ${sizes.map((s) => `${s.fmt} ${Math.round(s.bytes / 1024)}kB (q${s.q})`).join(", ")}`);
		rows.push({ ...w, ...hit, sizes });
	}

	const md = `# Fotografiile cardurilor de material — proveniență

Generat de \`app/scripts/fetch-card-photos.mjs\`. **Nu edita de mână** — rulează scriptul.

Aceeași regulă ca la \`content/site/SOURCES.md\`: **doar domeniu public sau CC0**. Fișierele
stau în \`app/public/img/\`, nu în R2 — sunt decor, nu conținut cu control de acces.

O singură fotografie per categorie (\`scris\`/\`foto\`/\`joc\`/\`question\`), refolosită pe toate
cardurile acelei categorii — vezi \`CATEGORY_PHOTO\` din \`app/lib/card-art.ts\`.

| categorie | fișier Commons | licență | autor |
|---|---|---|---|
${rows.map((r) => `| \`${r.slug}\` | [${r.title}](${r.descUrl}) | ${r.license} | ${r.author || "—"} |`).join("\n")}

## Mărimi generate

O singură lățime, 640×360 (16:9), decupată din centru — cardurile sunt miniaturi, nu banner.

${rows
	.map((r) => `### \`${r.slug}\`\n\n${r.sizes.map((s) => `- \`${s.file}\` — ${Math.round(s.bytes / 1024)} kB`).join("\n")}`)
	.join("\n\n")}
`;
	await writeFile(SOURCES, md);
	console.log(`\nProveniența scrisă în content/site/SOURCES-carduri.md`);
}

main().catch((e) => {
	console.error("\n" + e.message);
	process.exit(1);
});
