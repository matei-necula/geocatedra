#!/usr/bin/env node
// Aceeași pază ca `check-option-balance.mjs`, dar pentru jocurile `grila` din content/games:
// varianta corectă nu are voie să fie cea mai lungă, altfel răspunsul se ghicește din ochi.
//
//   node app/scripts/check-game-balance.mjs [folder...] [--strict]
//
// Fără argumente, verifică toate jocurile din content/games.
// Reguli, identice cu cele de la Exersează:
//   * spread    = cea mai lungă − cea mai scurtă variantă ≤ MAX_SPREAD caractere
//   * advantage = varianta corectă − cel mai lung distractor ≤ MAX_ADVANTAGE caractere
// iar pe ansamblu, varianta corectă ar trebui să fie cea mai lungă cam cât dă hazardul.
import { readdirSync, readFileSync, existsSync } from "node:fs";
import { join } from "node:path";

const MAX_SPREAD = 30;
const MAX_ADVANTAGE = 5;

const args = process.argv.slice(2);
const strict = args.includes("--strict");
let folders = args.filter((a) => !a.startsWith("--"));

if (!folders.length) {
	const root = existsSync("content/games") ? "content/games" : "../content/games";
	folders = readdirSync(root, { withFileTypes: true })
		.filter((d) => d.isDirectory() && existsSync(join(root, d.name, "game.json")))
		.map((d) => join(root, d.name));
}

let total = 0;
let longestCount = 0;
const bad = [];

for (const folder of folders) {
	const path = join(folder, "game.json");
	if (!existsSync(path)) continue;
	const g = JSON.parse(readFileSync(path, "utf8"));
	if (g.body?.kind !== "grila") continue;

	let n = 0;
	let longest = 0;
	(g.body.rounds ?? []).forEach((round, ri) => {
		(round.questions ?? []).forEach((q, qi) => {
			const lens = q.options.map((o) => o.length);
			const ci = q.answer;
			const others = lens.filter((_, i) => i !== ci);
			const spread = Math.max(...lens) - Math.min(...lens);
			const advantage = lens[ci] - Math.max(...others);
			const max = Math.max(...lens);
			const isLongest = lens[ci] === max && lens.filter((l) => l === max).length === 1;
			n++;
			total++;
			if (isLongest) {
				longest++;
				longestCount++;
			}
			if (spread > MAX_SPREAD || advantage > MAX_ADVANTAGE) {
				bad.push({ slug: g.slug, where: `R${ri + 1}Q${qi + 1}`, spread, advantage, lens, ci });
			}
		});
	});
	if (n) {
		const pct = Math.round((longest * 100) / n);
		const warn = pct > 40 ? "  ⚠" : "";
		console.log(`${g.slug.padEnd(34)} ${String(n).padStart(3)} întrebări · corect=cel mai lung în ${longest} (${pct}%)${warn}`);
	}
}

if (total) {
	console.log(`\nTotal: ${total} întrebări — varianta corectă e cea mai lungă în ${longestCount} (${((longestCount * 100) / total).toFixed(1)}%, hazard ≈ 25%)`);
}
console.log(`\n${bad.length} întrebări depășesc spread ≤ ${MAX_SPREAD} sau advantage ≤ ${MAX_ADVANTAGE}:`);
for (const b of bad) {
	console.log(`  ${b.slug.padEnd(30)} ${b.where.padEnd(6)} spread=${String(b.spread).padStart(3)} adv=${String(b.advantage).padStart(4)} lens=${JSON.stringify(b.lens)} corect=#${b.ci}`);
}

if (strict && bad.length) process.exit(1);
