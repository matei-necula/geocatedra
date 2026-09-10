/**
 * Caută peisaje pe Wikimedia Commons, VERIFICĂ licența, descarcă și scrie proveniența.
 *
 * De ce nu Unsplash sau Pexels: sunt „gratis de folosit", dar NU sunt domeniu public —
 * licențele lor sunt proprii și revocabile pentru viitor. Subsolul site-ului invocă Legea
 * 8/1996 pe materialele autoarei; n-are cum să stea alături de imagini cu proveniență mai
 * slabă. Aceeași ștachetă ca la jocuri (content/games/SOURCES.md): doar PD sau CC0.
 *
 * Scriptul NU are voie să accepte altceva. Dacă o imagine nu trece filtrul de licență, e
 * sărită și se spune pe ce. Fără listă scrisă de mână de fișiere „știute bune" — licența se
 * citește de fiecare dată din metadate.
 *
 * Rulare:  node scripts/fetch-photos.mjs
 * Ieșire:  public/img/<slug>-{640,1280,1920}.{avif,webp}  +  ../content/site/SOURCES.md
 */
import { mkdir, writeFile } from "node:fs/promises";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT = join(__dirname, "..", "public", "img");
const SOURCES = join(__dirname, "..", "..", "content", "site", "SOURCES.md");

const API = "https://commons.wikimedia.org/w/api.php";
const UA = "Geo-catedra/1.0 (educational site; contact via repo) node-fetch";

/** Ce căutăm. Un peisaj per rol din pagină, ales să acopere relief variat. */
const WANTED = [
	{ slug: "erou", search: ["mountain range landscape panorama", "mountain peaks scenic landscape"], minWidth: 2400 },
	{ slug: "elevi", search: ["river delta aerial landscape", "river valley landscape scenic"], minWidth: 1600 },
	{ slug: "profesori", search: ["lake mountains reflection national park landscape", "canyon river overlook national park landscape", "autumn forest mountains valley landscape"], minWidth: 1600 },
];

/**
 * Filtrul de licență NU spune nimic despre CE e în imagine.
 *
 * Prima rulare a scos, perfect legal (domeniu public), o pictură din Primul Război Mondial cu
 * un aerodrom bombardat — pentru ușa „profesori" a unui sit școlar. De aia titlul se filtrează
 * separat: căutarea după cuvinte de peisaj prinde și hărți militare, fotografii de război,
 * schițe tehnice și diagrame, toate „peisaje" după cuvinte.
 *
 * Lista e conservatoare intenționat: mai bine sărim o imagine bună decât să punem una greșită
 * pe pagina de start a unui sit folosit de copii.
 */
const SUBIECTE_INTERZISE =
	/\b(war|bomb|bombed|military|aerodrome|airfield|battle|troops|army|navy|weapon|tank|soldier|cemetery|grave|ruins|nazi|wwi|wwii|memorial|nuclear|mine|quarry|factory|refinery|protest|riot|accident|crash|fire|flood damage|disaster)\b/i;

/** Doar astea trec. Orice altceva (CC BY, CC BY-SA, „fair use") e refuzat. */
function licenseOk(meta) {
	const short = (meta?.LicenseShortName?.value ?? "").toLowerCase();
	const name = (meta?.License?.value ?? "").toLowerCase();
	const both = `${short} ${name}`;
	// „cc0", „public domain", „pd-…". Atenție: „cc by" NU e acceptat, deci nu putem căuta
	// doar după „cc" — verificăm exact.
	const ok = /\bcc0\b/.test(both) || /public domain/.test(both) || /^pd[-\s]/.test(short);
	// Refuz explicit dacă apare vreo clauză de atribuire obligatorie sau share-alike.
	const nu = /\bby-sa\b|\bcc by\b|\bby\b\s*\d|gfdl|fair use|noncommercial|nc\b/.test(both);
	return ok && !nu;
}

/**
 * Respinge fotografiile alb-negru.
 *
 * A doua rulare a scos, tot perfect legal, o fotografie Lewis Hine din anii '30 — alb-negru.
 * Corectă ca licență și ca subiect, dar ar fi arătat ruptă lângă două imagini color pe aceeași
 * pagină. Domeniul public e plin de fotografie istorică, deci filtrul ăsta nu e un moft:
 * e principalul fel în care o căutare „peisaj + PD" o ia razna.
 *
 * Măsurăm cât de mult diferă canalele între ele. Într-o imagine alb-negru R≈G≈B peste tot,
 * deci mediile pe canale sunt aproape egale; într-una color se depărtează.
 */
async function eColor(buf) {
	const { channels } = await sharp(buf).stats();
	if (!channels || channels.length < 3) return false;
	const [r, g, b] = channels.map((c) => c.mean);
	const spread = Math.max(r, g, b) - Math.min(r, g, b);
	return spread > 8;
}

/**
 * Bugetul de octeți per lățime. Pragul din spec e „sub 180 kB la 1280px" — el guvernează
 * eroul. Lățimile mai mici primesc proporțional mai puțin, iar 1920 (doar pentru ecrane mari,
 * niciodată pe telefon) are voie la ceva mai mult.
 */
function bugetPentru(lat) {
	if (lat <= 640) return 70 * 1024;
	if (lat <= 1280) return 180 * 1024;
	return 320 * 1024;
}

async function api(params) {
	const url = `${API}?${new URLSearchParams({ format: "json", origin: "*", ...params })}`;
	const r = await fetch(url, { headers: { "User-Agent": UA } });
	if (!r.ok) throw new Error(`Commons ${r.status} pentru ${url}`);
	return r.json();
}

/**
 * Prima imagine care trece AMBELE filtre (licență și subiect) și e destul de mare.
 *
 * `search` e o listă de formulări, încercate pe rând: pe Commons, o mare parte din peisajele
 * bune sunt CC BY-SA, iar o singură formulare poate să n-aibă niciun rezultat PD/CC0 în
 * primele o sută. A doua formulare ajunge de obicei în alt colț al colecției.
 */
async function findFree(searches, minWidth) {
	const toateSarite = [];
	for (const search of [searches].flat()) {
		const hit = await cautaUna(search, minWidth, toateSarite);
		if (hit) return hit;
	}
	throw new Error(
		`Nicio imagine PD/CC0 potrivită pentru ${JSON.stringify([searches].flat())}. ` +
			`Refuzate: ${toateSarite.slice(0, 6).join("; ")}`,
	);
}

async function cautaUna(search, minWidth, sarite) {
	const data = await api({
		action: "query",
		generator: "search",
		gsrsearch: `filetype:bitmap ${search}`,
		gsrnamespace: "6",
		gsrlimit: "100",
		prop: "imageinfo",
		iiprop: "url|size|extmetadata|mime",
		iiurlwidth: "1920",
	});
	const pages = Object.values(data?.query?.pages ?? {});
		for (const p of pages) {
		const info = p.imageinfo?.[0];
		if (!info) continue;
		if (!/^image\/(jpeg|png)$/.test(info.mime ?? "")) continue;
		if ((info.width ?? 0) < minWidth) continue;
		const meta = info.extmetadata ?? {};
		if (!licenseOk(meta)) {
			sarite.push(`${p.title} (${meta?.LicenseShortName?.value ?? "licență necunoscută"})`);
			continue;
		}
		// Vezi comentariul de la SUBIECTE_INTERZISE: licența liberă nu garantează un subiect
		// potrivit. Verificăm titlul ȘI descrierea, pentru că titlul e adesea doar un cod.
		const text = `${p.title} ${(meta?.ImageDescription?.value ?? "").replace(/<[^>]+>/g, " ")}`;
		if (SUBIECTE_INTERZISE.test(text)) {
			sarite.push(`${p.title} (subiect nepotrivit)`);
			continue;
		}

		// Verificarea de culoare cere octeții, deci vine ULTIMA — după filtrele ieftine (mime,
		// mărime, licență, subiect). Descărcăm o singură dată și dăm bufferul mai departe.
		// Orice eșec aici sare candidatul, nu oprește scriptul: Commons mai întoarce pagini de
		// eroare, iar unele fișiere nu se decodează.
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
		const hit = await findFree(w.search, w.minWidth);
		const orig = hit.bytes;

		const sizes = [];
		for (const lat of [640, 1280, 1920]) {
			for (const fmt of ["avif", "webp"]) {
				// Calitatea NU e fixă. O fotografie cu mult detaliu fin (valuri, frunziș) iese
				// de câteva ori mai mare decât una cu cer și câmp la aceeași calitate — o
				// constantă ar fi trecut pragul la unele imagini și ar fi irosit octeți la
				// altele. Coborâm până intrăm în buget, și abia dacă nici la minim nu intrăm
				// ne oprim cu eroare.
				const buget = bugetPentru(lat);
				let buf = null;
				let q = fmt === "avif" ? 55 : 78;
				for (; q >= 28; q -= 7) {
					const img = sharp(orig).resize({ width: lat, withoutEnlargement: true });
					buf = await (fmt === "avif" ? img.avif({ quality: q }) : img.webp({ quality: q })).toBuffer();
					if (buf.length <= buget) break;
				}
				if (!buf || buf.length > buget) {
					throw new Error(
						`${w.slug}-${lat}.${fmt} = ${Math.round(buf.length / 1024)} kB chiar și la calitate minimă, ` +
							`peste bugetul de ${Math.round(buget / 1024)} kB. Alege altă fotografie.`,
					);
				}
				const file = `${w.slug}-${lat}.${fmt}`;
				await writeFile(join(OUT, file), buf);
				sizes.push({ file, bytes: buf.length, lat, fmt, q });
			}
		}
		const k1280 = sizes.filter((s) => s.lat === 1280);
		console.log(
			`${hit.license} — ${k1280.map((s) => `${s.fmt} ${Math.round(s.bytes / 1024)}kB (q${s.q})`).join(", ")}`,
		);
		rows.push({ ...w, ...hit, sizes });
	}

	const md = `# Fotografiile site-ului — proveniență

Generat de \`app/scripts/fetch-photos.mjs\`. **Nu edita de mână** — rulează scriptul.

Regula, aceeași ca la jocuri (\`content/games/SOURCES.md\`): **doar domeniu public sau CC0**.
Unsplash și Pexels sunt „gratis de folosit", dar nu sunt domeniu public, iar subsolul site-ului
invocă Legea 8/1996 pe materialele autoarei — n-au ce căuta aici. Scriptul citește licența
din metadatele Commons la fiecare rulare și refuză orice altceva; nu există listă de fișiere
„știute bune".

Fișierele stau în \`app/public/img/\`, **nu** în R2: R2 se servește prin \`/media/:id\`, care
trece prin \`resolveVisibility\`. O fotografie decorativă n-are ce căuta pe traseul cu control
de acces.

| rol în pagină | fișier Commons | licență | autor |
|---|---|---|---|
${rows.map((r) => `| \`${r.slug}\` | [${r.title}](${r.descUrl}) | ${r.license} | ${r.author || "—"} |`).join("\n")}

## Mărimi generate

Fiecare imagine în AVIF și WebP, la 640 / 1280 / 1920 px. Pragul din spec — sub 180 kB la
1280 px — e verificat de script, care se oprește cu eroare dacă e depășit.

${rows
	.map(
		(r) =>
			`### \`${r.slug}\`\n\n${r.sizes
				.map((s) => `- \`${s.file}\` — ${Math.round(s.bytes / 1024)} kB`)
				.join("\n")}`,
	)
	.join("\n\n")}
`;
	await writeFile(SOURCES, md);
	console.log(`\nProveniența scrisă în content/site/SOURCES.md`);
}

main().catch((e) => {
	console.error("\n" + e.message);
	process.exit(1);
});
