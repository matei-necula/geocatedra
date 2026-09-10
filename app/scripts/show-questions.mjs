#!/usr/bin/env node
// Prints a topic's questions with option lengths, flagging the ones that break
// the balance rules (see check-option-balance.mjs).
//   node app/scripts/show-questions.mjs <dump.json> <topic> [--bad]
import { readFileSync } from "node:fs";
const [, , dump, topic] = process.argv;
const onlyBad = process.argv.includes("--bad");
const raw = JSON.parse(readFileSync(dump, "utf8"));
const rows = (Array.isArray(raw) ? raw[0]?.results ?? raw : raw.results).filter((q) => q.topic_slug === topic);
let shown = 0;
for (const q of rows) {
	const opts = JSON.parse(q.options_json);
	const lens = opts.map((o) => o.length);
	const others = lens.filter((_, i) => i !== q.correct_index);
	const adv = lens[q.correct_index] - Math.max(...others);
	const spread = Math.max(...lens) - Math.min(...lens);
	const bad = adv > 5 || spread > 30;
	if (onlyBad && !bad) continue;
	shown++;
	console.log(`--- ${q.id.slice(0, 8)} adv=${adv} spread=${spread}`);
	console.log(`Q: ${q.stem}`);
	opts.forEach((o, i) => console.log(`  ${i === q.correct_index ? "*" : " "}[${String(o.length).padStart(3)}] ${o}`));
}
console.log(`\n${shown} question(s) shown of ${rows.length} in ${topic}`);
