#!/usr/bin/env node
// Guards against the "longest option is always the right one" tell.
//
//   node app/scripts/check-option-balance.mjs <questions.json> [--strict]
//
// Input is the shape produced by `wrangler d1 ... --json` for
//   SELECT q.id, q.topic_slug, q.correct_index, t.stem, t.options_json …
// Rules a question must satisfy:
//   * spread     = longest − shortest option ≤ MAX_SPREAD characters
//   * advantage  = correct − longest distractor ≤ MAX_ADVANTAGE characters
// and, across a whole set, the correct answer should be the single longest
// option no more often than chance (~25%) plus a small margin.
import { readFileSync } from "node:fs";

const MAX_SPREAD = 30;
const MAX_ADVANTAGE = 5;
const strict = process.argv.includes("--strict");
const raw = JSON.parse(readFileSync(process.argv[2], "utf8"));
const rows = Array.isArray(raw) ? (raw[0]?.results ?? raw) : raw.results;

const byTopic = new Map();
let longestCount = 0;
const bad = [];
for (const q of rows) {
	const opts = JSON.parse(q.options_json);
	const lens = opts.map((o) => o.length);
	const ci = q.correct_index;
	const others = lens.filter((_, i) => i !== ci);
	const spread = Math.max(...lens) - Math.min(...lens);
	const advantage = lens[ci] - Math.max(...others);
	const isLongest = lens[ci] === Math.max(...lens) && lens.filter((l) => l === Math.max(...lens)).length === 1;
	if (isLongest) longestCount++;
	const t = byTopic.get(q.topic_slug) ?? { n: 0, longest: 0 };
	t.n++; if (isLongest) t.longest++;
	byTopic.set(q.topic_slug, t);
	if (spread > MAX_SPREAD || advantage > MAX_ADVANTAGE) {
		bad.push({ id: q.id, topic: q.topic_slug, spread, advantage, lens, ci, stem: q.stem.slice(0, 60) });
	}
}
console.log(`${rows.length} questions — correct is the single longest option in ${longestCount} (${((longestCount * 100) / rows.length).toFixed(1)}%, chance ≈ 25%)`);
for (const [topic, t] of [...byTopic.entries()].sort((a, b) => b[1].longest / b[1].n - a[1].longest / a[1].n)) {
	console.log(`  ${topic.padEnd(36)} ${String(t.longest).padStart(3)}/${String(t.n).padEnd(3)} ${((t.longest * 100) / t.n).toFixed(0)}%`);
}
console.log(`\n${bad.length} question(s) break spread ≤ ${MAX_SPREAD} or advantage ≤ ${MAX_ADVANTAGE}:`);
for (const b of bad) console.log(`  ${b.id.slice(0, 8)} ${b.topic.padEnd(30)} spread=${String(b.spread).padStart(3)} adv=${String(b.advantage).padStart(4)} lens=${JSON.stringify(b.lens)} ${b.stem}`);
if (strict && bad.length) process.exit(1);
