/// <reference types="node" />
import { readdirSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { parseGameBody } from "./games";

// Plasa de siguranță pentru jocurile scrise de mână: fiecare `game.json` din
// content/games trebuie să treacă prin parseGameBody, ca o greșeală de structură
// să iasă la teste, nu în fața unui elev.
const root = join(dirname(fileURLToPath(import.meta.url)), "..", "..", "..", "content", "games");

const folders = readdirSync(root, { withFileTypes: true })
	.filter((d) => d.isDirectory())
	.map((d) => d.name)
	.filter((name) => {
		try {
			readFileSync(join(root, name, "game.json"), "utf8");
			return true;
		} catch {
			return false;
		}
	});

describe("game.json din content/games", () => {
	it.each(folders)("%s are un body pe care motorul îl înțelege", (folder) => {
		const raw = JSON.parse(readFileSync(join(root, folder, "game.json"), "utf8"));
		const parsed = parseGameBody(JSON.stringify(raw.body));
		expect(parsed, `body respins de parseGameBody în ${folder}`).not.toBeNull();
	});
});
