#!/usr/bin/env node
// Formats content/games/**/game.json in the house style: tabs, and any object or
// array that has no nested containers stays on one line (points, rounds, pairs).
// Usage: node content/games/gen/fmt.mjs <file.json> [...]
import { readFileSync, writeFileSync } from "node:fs";

const isLeaf = (v) =>
	v !== null &&
	typeof v === "object" &&
	Object.values(v).every((x) => x === null || typeof x !== "object" || isLeafPair(x));
// one level of nesting is still inlineable when the inner object is itself all scalars
const isLeafPair = (v) =>
	v !== null && typeof v === "object" && !Array.isArray(v) && Object.values(v).every((x) => typeof x !== "object");

function fmt(v, depth) {
	const pad = "\t".repeat(depth);
	const padIn = "\t".repeat(depth + 1);
	if (v === null || typeof v !== "object") return JSON.stringify(v);
	const inline = JSON.stringify(v).replace(/([,:])(?=[^\s])/g, "$1 ").replace(/\{ ?/g, "{ ").replace(/ ?\}/g, " }");
	if (isLeaf(v) && inline.length + depth * 2 <= 118) return inline;
	if (Array.isArray(v)) {
		if (!v.length) return "[]";
		return `[\n${v.map((x) => padIn + fmt(x, depth + 1)).join(",\n")}\n${pad}]`;
	}
	const keys = Object.keys(v);
	if (!keys.length) return "{}";
	return `{\n${keys.map((k) => `${padIn}${JSON.stringify(k)}: ${fmt(v[k], depth + 1)}`).join(",\n")}\n${pad}}`;
}

for (const f of process.argv.slice(2)) {
	const doc = JSON.parse(readFileSync(f, "utf8"));
	writeFileSync(f, fmt(doc, 0) + "\n", "utf8");
	console.log("fmt", f);
}
