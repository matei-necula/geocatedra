// Amestecă variantele fiecărei întrebări dintr-un joc `grila` și rescrie
// indexul răspunsului corect. Fără asta, răspunsul corect ar rămâne pe aceeași
// poziție la toate întrebările, iar elevul l-ar ghici din tipar.
// Amestecul e determinist (seed din slug + numărul întrebării), deci rulările
// repetate dau același rezultat și diff-ul rămâne curat.
// Usage: node scripts/shuffle-game-options.mjs <folder-joc...>
import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const hash = (s) => { let h = 2166136261; for (const c of s) { h ^= c.charCodeAt(0); h = Math.imul(h, 16777619); } return h >>> 0; };
const rng = (seed) => () => ((seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296);

for (const folder of process.argv.slice(2)) {
	const p = join(folder, "game.json");
	const g = JSON.parse(readFileSync(p, "utf8"));
	let n = 0;
	const pos = [0, 0, 0, 0];
	g.body.rounds.forEach((r, ri) => {
		r.questions.forEach((q, qi) => {
			const corect = q.options[q.answer];
			const idx = q.options.map((_, i) => i);
			const rand = rng(hash(`${g.slug}|${ri}|${qi}`));
			for (let i = idx.length - 1; i > 0; i--) { const j = Math.floor(rand() * (i + 1)); [idx[i], idx[j]] = [idx[j], idx[i]]; }
			q.options = idx.map((i) => q.options[i]);
			q.answer = q.options.indexOf(corect);
			pos[q.answer]++; n++;
		});
	});
	writeFileSync(p, JSON.stringify(g, null, 2) + "\n", "utf8");
	console.log(`${g.slug}: ${n} întrebări, răspunsul corect pe pozițiile A/B/C/D = ${pos.join("/")}`);
}
