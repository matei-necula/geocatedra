/// <reference types="node" />
import { readdirSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { parseGameBody, type GrilaRound } from "./games";

// Safety net for the shipped map-quiz content: each game.json body must
// survive parseGameBody without a running app, so a structural mistake in the
// hand-authored JSON is caught by CI, not by a student.
//
// These games use authored `rounds` (lists of point `n`s) instead of `draw`,
// because the rounds are hand-picked so the dots of one round never sit on top
// of each other. The spacing rule below is the machine-checkable form of that
// requirement — a dot renders ~24 px wide on a map drawn ~900 px wide, i.e.
// ~2.7% of the width, so 5% of separation leaves a clear gap. Most maps do
// much better (6.7–7.9%); the lakes map is the tight one, because Balaton,
// Laguna Veneției, Laguna Razim and Porțile de Fier sit within 1.4–3.5% of
// each other — which is also why that game needs 4 rounds to cover all 29
// lakes without two dots landing on top of each other.
const root = join(dirname(fileURLToPath(import.meta.url)), "..", "..", "..", "content", "games");

const MIN_SEPARATION = 5;

type Spec = {
	folder: string;
	slug: string;
	points: number;
	rounds: number;
	perRound: number;
	/** intrinsic map size, to weight dy by the displayed aspect ratio */
	mapW: number;
	mapH: number;
};

const games: Spec[] = [
	{ folder: "hidro-lacuri", slug: "lacurile-lumii-pe-harta", points: 29, rounds: 4, perRound: 10, mapW: 2000, mapH: 1524 },
	{ folder: "hidro-fluvii", slug: "fluviile-lumii-pe-harta", points: 37, rounds: 4, perRound: 10, mapW: 2000, mapH: 1524 },
	{ folder: "relief-munti", slug: "muntii-lumii-pe-harta", points: 19, rounds: 3, perRound: 10, mapW: 2000, mapH: 1106 },
	{ folder: "relief-podisuri", slug: "podisurile-lumii-pe-harta", points: 15, rounds: 3, perRound: 8, mapW: 2000, mapH: 1106 },
	{ folder: "relief-campii", slug: "campiile-lumii-pe-harta", points: 13, rounds: 3, perRound: 8, mapW: 2000, mapH: 1106 },
];

describe("map-quiz content", () => {
	for (const g of games) {
		const raw = readFileSync(join(root, g.folder, "game.json"), "utf8");
		const doc = JSON.parse(raw);
		const points: { n: number; x: number; y: number; name: string }[] = doc.body.points;
		const rounds: number[][] = doc.body.rounds;

		it(`${g.folder}: parseGameBody accepts the body`, () => {
			const body = parseGameBody(JSON.stringify(doc.body));
			expect(body).not.toBeNull();
			expect(body?.kind).toBe("harta-quiz");
		});

		it(`${g.folder}: slug and point count are as specified`, () => {
			expect(doc.slug).toBe(g.slug);
			expect(doc.gradeId).toBe("9");
			expect(points).toHaveLength(g.points);
			const ns = new Set<number>();
			for (const p of points) {
				expect(p.name.trim().length).toBeGreaterThan(0);
				expect(p.x).toBeGreaterThanOrEqual(0);
				expect(p.x).toBeLessThanOrEqual(100);
				expect(p.y).toBeGreaterThanOrEqual(0);
				expect(p.y).toBeLessThanOrEqual(100);
				ns.add(p.n);
			}
			expect(ns.size).toBe(g.points);
		});

		it(`${g.folder}: has authored rounds instead of draw`, () => {
			expect(doc.body.draw).toBeUndefined();
			expect(rounds).toHaveLength(g.rounds);
			for (const r of rounds) expect(r).toHaveLength(g.perRound);
		});

		it(`${g.folder}: every point appears in at least one round, none twice in a round`, () => {
			for (const r of rounds) expect(new Set(r).size).toBe(r.length);
			const covered = new Set(rounds.flat());
			const missing = points.filter((p) => !covered.has(p.n)).map((p) => p.name);
			expect(missing).toEqual([]);
		});

		it(`${g.folder}: dots within a round stay at least ${MIN_SEPARATION}% apart`, () => {
			const byN = new Map(points.map((p) => [p.n, p]));
			const aspect = g.mapH / g.mapW;
			const tooClose: string[] = [];
			rounds.forEach((r, ri) => {
				for (let i = 0; i < r.length; i++) {
					for (let j = i + 1; j < r.length; j++) {
						const a = byN.get(r[i]);
						const b = byN.get(r[j]);
						expect(a, `runda ${ri + 1}: punctul ${r[i]} nu există`).toBeDefined();
						expect(b, `runda ${ri + 1}: punctul ${r[j]} nu există`).toBeDefined();
						if (!a || !b) continue;
						const d = Math.hypot(a.x - b.x, (a.y - b.y) * aspect);
						if (d < MIN_SEPARATION) tooClose.push(`runda ${ri + 1}: ${a.name} ↔ ${b.name} (${d.toFixed(2)}%)`);
					}
				}
			});
			expect(tooClose).toEqual([]);
		});
	}
});

// Escape room-ul „Evadare din centrul Pământului" e o grilă cu explicație pe
// fiecare variantă (`why`). Dacă lista se desincronizează de variante,
// parseGameBody o aruncă în tăcere — elevul ar juca fără explicații, fără
// niciun semn că lipsesc. De-aia o verificăm aici.
describe("escape room content", () => {
	const doc = JSON.parse(readFileSync(join(root, "pamant-evadare", "game.json"), "utf8"));

	it("parseGameBody accepts the body and keeps every explanation", () => {
		const body = parseGameBody(JSON.stringify(doc.body));
		expect(body).not.toBeNull();
		expect(body?.kind).toBe("grila");
		// O singură rundă cu cele cinci straturi: urcarea curge dintr-un clic pe
		// nivel, ca în aplicația de dinainte, nu cu un „rundă completă" între ele.
		const rounds = (body as { rounds: GrilaRound[] }).rounds;
		expect(rounds).toHaveLength(1);
		const questions = rounds[0].questions;
		expect(questions).toHaveLength(5);
		for (const q of questions) {
			expect(q.hint, "fiecare strat își spune numele și adâncimea").toMatch(/ · \d+ km — /);
			expect(q.why).toHaveLength(q.options.length);
			expect(q.why?.every((w) => w.trim().length > 0)).toBe(true);
		}
	});
});

// Jocul „Activități umane pe harta mediilor" e primul `plaseaza-pe-harta` cu
// runde. Două lucruri se pot strica tăcut într-un JSON scris de mână: o rundă
// care numește un `id` inexistent (ținta dispare pur și simplu din joc) și
// două buline din aceeași rundă suprapuse pe hartă. Le prindem aici.
describe("conținut: activitati-umane-pe-harta-mediilor", () => {
	const doc = JSON.parse(readFileSync(join(root, "medii-activitati-umane", "game.json"), "utf8"));
	const targets: { id: string; x: number; y: number; label: string; img?: number }[] = doc.body.targets;
	const rounds: string[][] = doc.body.rounds;
	// harta-medii.webp este 1600×1200
	const aspect = 1200 / 1600;

	it("parseGameBody acceptă corpul și păstrează rundele", () => {
		const body = parseGameBody(JSON.stringify(doc.body));
		expect(body).not.toBeNull();
		expect(body?.kind).toBe("plaseaza-pe-harta");
		expect(body && "rounds" in body ? body.rounds : null).toHaveLength(2);
	});

	it("are 12 ținte, câte 6 în fiecare rundă, fiecare exact o dată", () => {
		expect(targets).toHaveLength(12);
		expect(rounds).toHaveLength(2);
		for (const r of rounds) expect(r).toHaveLength(6);
		const flat = rounds.flat();
		expect(new Set(flat).size).toBe(12);
		expect([...flat].sort()).toEqual([...targets.map((t) => t.id)].sort());
	});

	it("fiecare țintă are o etichetă, o imagine și coordonate în hartă", () => {
		const imgs = new Set<number>();
		for (const t of targets) {
			expect(t.label.trim().length).toBeGreaterThan(0);
			expect(t.img).toBeTypeOf("number");
			imgs.add(t.img as number);
			expect(t.x).toBeGreaterThanOrEqual(0);
			expect(t.x).toBeLessThanOrEqual(100);
			expect(t.y).toBeGreaterThanOrEqual(0);
			// legenda hărții ocupă banda de jos — nicio bulină nu are ce căuta acolo
			expect(t.y).toBeLessThanOrEqual(75);
		}
		// câte o imagine distinctă per țintă, niciuna nefiind harta (index 0)
		expect(imgs.size).toBe(12);
		expect(imgs.has(0)).toBe(false);
		expect(doc.assets).toHaveLength(13);
	});

	it("bulinele din aceeași rundă stau la cel puțin 5% una de alta", () => {
		const byId = new Map(targets.map((t) => [t.id, t]));
		const tooClose: string[] = [];
		rounds.forEach((r, ri) => {
			for (let i = 0; i < r.length; i++) {
				for (let j = i + 1; j < r.length; j++) {
					const a = byId.get(r[i]);
					const b = byId.get(r[j]);
					if (!a || !b) continue;
					const d = Math.hypot(a.x - b.x, (a.y - b.y) * aspect);
					if (d < MIN_SEPARATION) tooClose.push(`runda ${ri + 1}: ${a.id} ↔ ${b.id} (${d.toFixed(2)}%)`);
				}
			}
		});
		expect(tooClose).toEqual([]);
	});
});

// Matricea mediilor: banca de cuvinte a unei runde e derivată din celulele
// necompletate. Dacă două celule goale ar cere același text, elevul ar putea
// pune piesa „corectă" în locul greșit; iar o celulă goală în plus față de
// document ar strica potrivirea 1:1 cu piesele din fișa doamnei profesoare.
describe("conținut: matricea-mediilor", () => {
	const doc = JSON.parse(readFileSync(join(root, "medii-matrice", "game.json"), "utf8"));
	const variants: { rows: { text: string; given?: boolean }[][] }[] = doc.body.variants;

	it("parseGameBody acceptă corpul, cu două runde", () => {
		const body = parseGameBody(JSON.stringify(doc.body));
		expect(body).not.toBeNull();
		expect(body?.kind).toBe("matrice");
		expect(body && "variants" in body ? body.variants : []).toHaveLength(2);
	});

	it("fiecare rundă e o grilă 5×5 cu exact 16 celule de completat", () => {
		expect(variants).toHaveLength(2);
		for (const v of variants) {
			expect(v.rows).toHaveLength(5);
			for (const row of v.rows) expect(row).toHaveLength(5);
			const blanks = v.rows.flat().filter((c) => !c.given);
			expect(blanks).toHaveLength(16);
		}
	});

	it("nicio rundă nu cere de două ori același cuvânt", () => {
		for (const v of variants) {
			const blanks = v.rows.flat().filter((c) => !c.given).map((c) => c.text);
			expect(new Set(blanks).size).toBe(blanks.length);
		}
	});
});

// Un elev nu trebuie să poată ghici răspunsul fără să citească întrebarea.
// La grile, cel mai ieftin indiciu e LUNGIMEA: dacă varianta corectă e mereu
// cea mai lungă (fiindcă e singura explicată în detaliu), jocul se rezolvă
// numărând cuvinte. Pragurile de mai jos sunt largi față de conținutul actual
// — cel mai „încărcat" joc stă la 50% și +4,4 caractere — dar prind imediat
// tiparul de 100% / +45 de caractere cu care au pornit jocurile de medii.
describe("grile: varianta corectă nu se ghicește după lungime", () => {
	const folders = readdirSync(root, { withFileTypes: true })
		.filter((d) => d.isDirectory())
		.map((d) => d.name)
		.filter((name) => {
			try {
				const raw = JSON.parse(readFileSync(join(root, name, "game.json"), "utf8"));
				return raw?.body?.kind === "grila";
			} catch {
				return false;
			}
		});

	it("există grile de verificat", () => {
		expect(folders.length).toBeGreaterThan(0);
	});

	for (const folder of folders) {
		const doc = JSON.parse(readFileSync(join(root, folder, "game.json"), "utf8"));
		const questions: { options: string[]; answer: number }[] = doc.body.rounds.flatMap(
			(r: { questions: unknown[] }) => r.questions,
		);

		it(`${folder}: răspunsul nu e aproape mereu cel mai lung`, () => {
			const strictlyLongest = questions.filter((q) => {
				const lens = q.options.map((o) => o.length);
				const others = lens.filter((_, i) => i !== q.answer);
				return lens[q.answer] > Math.max(...others);
			}).length;
			// Sub 5 întrebări, proporția e prea zgomotoasă ca să însemne ceva.
			if (questions.length >= 5) {
				expect(strictlyLongest / questions.length).toBeLessThanOrEqual(0.7);
			}
		});

		it(`${folder}: răspunsul nu e sistematic mai lung decât variantele greșite`, () => {
			const excess =
				questions.reduce((sum, q) => {
					const lens = q.options.map((o) => o.length);
					const others = lens.filter((_, i) => i !== q.answer);
					return sum + lens[q.answer] - others.reduce((a, b) => a + b, 0) / others.length;
				}, 0) / questions.length;
			expect(excess).toBeLessThanOrEqual(15);
		});
	}
});
