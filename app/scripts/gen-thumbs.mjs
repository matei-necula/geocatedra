/**
 * Generează miniaturi de 400px în R2, lângă imaginile originale.
 *
 * DE CE: `/media/:id` servește obiectul din R2 la mărime naturală. Sunt 1074 de imagini în
 * bază, cu o medie de 85 kB și un maxim de 915 kB. Cardurile din `/elevi` arată vreo 60 de
 * miniaturi — adică ~5 MB trași pe o pagină pe care elevii o deschid de pe telefon, ca să
 * vadă niște imagini de 400px. Redimensionarea nu se poate face în Worker (sharp nu rulează
 * acolo, iar Image Resizing de la Cloudflare e plătit, și proiectul e pe „gratuit întâi"),
 * deci se face aici, o dată, offline.
 *
 * CE ATINGE: scrie obiecte NOI în R2, cu sufixul `-t400`. Nu modifică și nu șterge niciun
 * original, nu atinge baza de date, nu atinge controlul de acces. `routes/media.tsx` cade pe
 * original dacă miniatura lipsește, deci scriptul poate fi rulat oricând, sau deloc.
 *
 * DOAR PRIMA IMAGINE a fiecărui material: alea sunt singurele folosite ca miniatură. Restul
 * (paginile din teancuri, planșele din galerii) se văd la mărime naturală, unde asta e corect.
 * Diferența e ~120 de obiecte în loc de 1074.
 *
 * Rulare:  node scripts/gen-thumbs.mjs [--target local|remote]   (implicit: remote)
 * Idempotent: sare peste miniaturile deja existente.
 */
import { execFileSync } from "node:child_process";
import { mkdtempSync, readFileSync, statSync, writeFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import sharp from "sharp";

const TARGET = process.argv.includes("--target")
	? process.argv[process.argv.indexOf("--target") + 1]
	: "remote";
const REMOTE = TARGET === "remote";
const BUCKET = "catedra-media";
const WIDTH = 400;

const tmp = mkdtempSync(join(tmpdir(), "thumbs-"));

/**
 * `shell: true` e obligatoriu pe Windows: Node refuză din motive de securitate să pornească
 * direct un `.cmd`, iar `npx` fără shell dă EINVAL. Consecința e că argumentele trec prin
 * cmd.exe, deci tot ce conține spații sau ghilimele trebuie ghilimelat de noi (vezi `d1`).
 */
function wrangler(args, opts = {}) {
	return execFileSync("npx", ["wrangler", ...args], {
		encoding: "utf-8",
		maxBuffer: 64 * 1024 * 1024,
		shell: true,
		stdio: opts.quiet ? ["ignore", "pipe", "pipe"] : ["ignore", "pipe", "inherit"],
	});
}

/**
 * `--command`, NU `--file`.
 *
 * Cu `--file`, wrangler tratează fișierul ca pe un script și întoarce un REZUMAT („Rows read:
 * 40"), nu rândurile. Arată ca un succes, dar rezultatul are exact un rând, care nu e datele
 * tale — greșeala costă cel mai mult tocmai pentru că nu seamănă cu o eroare.
 */
function d1(sql) {
	const out = wrangler([
		"d1", "execute", "catedra", REMOTE ? "--remote" : "--local",
		// Ghilimelat de noi, pe un singur rând: cmd.exe sparge argumentele pe spații, iar SQL-ul
		// e plin de ele. SQL-ul folosește doar apostrofuri ('image'), deci ghilimelele duble
		// din jur nu se ciocnesc cu nimic dinăuntru.
		"--json", "--command", `"${sql.replace(/\s+/g, " ").trim()}"`,
	], { quiet: true });
	return JSON.parse(out.slice(out.indexOf("[")))[0].results;
}

async function main() {
	// Prima imagine a fiecărui material — exact ce randează cardurile.
	const rows = d1(`
		SELECT a.id, a.r2_key AS key
		FROM material_assets a
		WHERE a.role = 'image'
		  AND a.idx = (
		    SELECT MIN(b.idx) FROM material_assets b
		    WHERE b.material_id = a.material_id AND b.role = 'image'
		  )
		GROUP BY a.material_id
	`);
	console.log(`${rows.length} miniaturi de făcut (prima imagine a fiecărui material).`);

	let facute = 0;
	let sarite = 0;
	let esuate = 0;

	for (const [i, r] of rows.entries()) {
		const dest = `${r.key}-t400`;
		const src = join(tmp, "in.bin");
		const out = join(tmp, "out.webp");

		// Există deja?
		//
		// ATENȚIE: `wrangler r2 object get` pe o cheie inexistentă **iese cu codul 0** și scrie
		// un fișier de ZERO octeți. Nu aruncă, nu se plânge. Un `try/catch` în jurul lui — care
		// pare verificarea evidentă — raportează „există deja" pentru tot, și scriptul sare
		// tăcut peste toată munca, raportând succes. Verificarea reală e MĂRIMEA fișierului.
		try {
			rmSync(src, { force: true });
			wrangler(["r2", "object", "get", `${BUCKET}/${dest}`, "--file", src, ...(REMOTE ? ["--remote"] : [])], { quiet: true });
			if (statSync(src, { throwIfNoEntry: false })?.size > 0) {
				sarite++;
				continue;
			}
		} catch {
			// nu există — îl facem
		}

		try {
			wrangler(["r2", "object", "get", `${BUCKET}/${r.key}`, "--file", src, ...(REMOTE ? ["--remote"] : [])], { quiet: true });
			const buf = await sharp(readFileSync(src))
				.resize({ width: WIDTH, withoutEnlargement: true })
				.webp({ quality: 72 })
				.toBuffer();
			writeFileSync(out, buf);
			wrangler([
				"r2", "object", "put", `${BUCKET}/${dest}`,
				"--file", out, "--content-type", "image/webp",
				...(REMOTE ? ["--remote"] : []),
			], { quiet: true });
			facute++;
			process.stdout.write(`\r  ${i + 1}/${rows.length} — ${facute} făcute, ${sarite} sărite, ${esuate} eșuate   `);
		} catch (e) {
			// Un obiect lipsă din R2 (rând orfan în bază) nu are voie să oprească tot.
			esuate++;
		}
	}

	rmSync(tmp, { recursive: true, force: true });
	console.log(`\n\nGata: ${facute} făcute, ${sarite} existau deja, ${esuate} eșuate.`);
}

main().catch((e) => {
	console.error(e);
	process.exit(1);
});
