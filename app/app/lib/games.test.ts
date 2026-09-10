import { describe, expect, it } from "vitest";
import { assetSrc, chunkPoints, derangeAgainst, matrixBank, parseGameBody, pickMatrixVariant, placeRounds, quizRounds, renumberPoints, shuffle, shuffleSeeded } from "./games";
import type { MapPoint, MatrixVariant, OrderRound } from "./games";

describe("parseGameBody", () => {
	it("returnează null pentru quiz legacy (fără kind)", () => {
		expect(parseGameBody(JSON.stringify({ question: "Q?", options: [] }))).toBeNull();
	});
	it("returnează null pentru JSON corupt sau kind necunoscut", () => {
		expect(parseGameBody("{nu e json")).toBeNull();
		expect(parseGameBody(JSON.stringify({ kind: "altceva" }))).toBeNull();
		expect(parseGameBody(JSON.stringify({ kind: "asociere", rounds: [] }))).toBeNull();
		expect(parseGameBody(JSON.stringify({ kind: "harta-quiz", points: [] }))).toBeNull();
	});
	it("acceptă cele 4 kind-uri valide", () => {
		const asociere = { kind: "asociere", rounds: [{ pairs: [{ left: { text: "a" }, right: { text: "b" }, group: "g" }] }] };
		const ordonare = { kind: "ordonare", rounds: [{ title: "R1", cards: [{ label: "c", order: 1 }] }] };
		const plaseaza = { kind: "plaseaza-pe-harta", map: 0, targets: [{ id: "t", x: 10, y: 20, label: "l", img: 1 }] };
		const harta = { kind: "harta-quiz", map: 0, points: [{ n: 1, x: 10, y: 20, name: "Amazon" }] };
		for (const b of [asociere, ordonare, plaseaza, harta]) {
			expect(parseGameBody(JSON.stringify(b))).toEqual(b);
		}
	});
	it("acceptă `maps` (hartă per rundă) și îl aruncă dacă e stricat", () => {
		const pts = [{ n: 1, x: 10, y: 20, name: "Amur" }, { n: 2, x: 30, y: 40, name: "Volga" }];
		const rounds = [[1], [2]];

		// forma bună: o hartă pentru fiecare rundă
		const ok = parseGameBody(JSON.stringify({ kind: "harta-quiz", map: 0, maps: [0, 1], points: pts, rounds }));
		expect(ok).toMatchObject({ kind: "harta-quiz", map: 0, maps: [0, 1] });

		// fără `maps` rămâne valid — toate rundele stau pe `map`
		const fara = parseGameBody(JSON.stringify({ kind: "harta-quiz", map: 0, points: pts, rounds }));
		expect(fara).toMatchObject({ kind: "harta-quiz", map: 0 });
		expect(fara && "maps" in fara).toBe(false);

		// orice formă stricată se aruncă întreagă, jocul rămâne jucabil pe `map`
		for (const rau of [[], [-1], [1.5], ["0"], "0", 0, null, [0, null]]) {
			const out = parseGameBody(JSON.stringify({ kind: "harta-quiz", map: 0, maps: rau, points: pts, rounds }));
			expect(out).not.toBeNull();
			expect(out && "maps" in out).toBe(false);
		}
	});

	it("acceptă harta-quiz cu și fără `draw`", () => {
		const withoutDraw = { kind: "harta-quiz", map: 0, points: [{ n: 1, x: 10, y: 20, name: "Amazon" }, { n: 2, x: 30, y: 40, name: "Nil" }] };
		const withDraw = { ...withoutDraw, draw: 1 };
		expect(parseGameBody(JSON.stringify(withoutDraw))).toEqual(withoutDraw);
		expect(parseGameBody(JSON.stringify(withDraw))).toEqual(withDraw);
	});
	it("ignoră `draw` invalid (non-întreg, ≤0 sau non-număr)", () => {
		const base = { kind: "harta-quiz", map: 0, points: [{ n: 1, x: 10, y: 20, name: "Amazon" }] };
		for (const bad of [0, -3, 2.5, "3"]) {
			const parsed = parseGameBody(JSON.stringify({ ...base, draw: bad }));
			expect(parsed).toEqual(base);
			expect(parsed).not.toHaveProperty("draw");
		}
	});
	it("acceptă `reveal: \"below\"` pe plaseaza-pe-harta și ignoră alte valori", () => {
		const base = { kind: "plaseaza-pe-harta", map: 0, targets: [{ id: "t", x: 1, y: 2, label: "l" }] };
		expect(parseGameBody(JSON.stringify({ ...base, reveal: "below" }))).toEqual({ ...base, reveal: "below" });
		const bad = parseGameBody(JSON.stringify({ ...base, reveal: "sus" }));
		expect(bad).toEqual(base);
		expect(bad).not.toHaveProperty("reveal");
	});
	it("acceptă `rounds` pe harta-quiz și ignoră forme invalide", () => {
		const base = { kind: "harta-quiz", map: 0, points: [{ n: 1, x: 1, y: 2, name: "A" }, { n: 2, x: 3, y: 4, name: "B" }] };
		const good = { ...base, rounds: [[1, 2], [2, 1]] };
		expect(parseGameBody(JSON.stringify(good))).toEqual(good);
		for (const bad of [[], [[]], "1,2", [[1.5]], [["a"]]]) {
			const parsed = parseGameBody(JSON.stringify({ ...base, rounds: bad }));
			expect(parsed).toEqual(base);
			expect(parsed).not.toHaveProperty("rounds");
		}
	});
	it("acceptă `imageFit: \"contain\"` pe asociere și ignoră alte valori", () => {
		const base = { kind: "asociere", rounds: [{ pairs: [{ left: { img: 0 }, right: { text: "b" }, group: "g" }] }] };
		expect(parseGameBody(JSON.stringify({ ...base, imageFit: "contain" }))).toEqual({ ...base, imageFit: "contain" });
		const bad = parseGameBody(JSON.stringify({ ...base, imageFit: "cover" }));
		expect(bad).toEqual(base);
		expect(bad).not.toHaveProperty("imageFit");
	});
	it("acceptă `layout: \"rows\"` pe o rundă și ignoră alte valori", () => {
		const pairs = [{ left: { img: 0 }, right: { text: "b" }, group: "g" }];
		const rows = { kind: "asociere", rounds: [{ pairs, layout: "rows" }, { pairs }] };
		expect(parseGameBody(JSON.stringify(rows))).toEqual(rows);
		const bad = parseGameBody(JSON.stringify({ kind: "asociere", rounds: [{ pairs, layout: "coloane" }] }));
		expect(bad).toEqual({ kind: "asociere", rounds: [{ pairs }] });
		expect(bad?.kind === "asociere" && bad.rounds[0]).not.toHaveProperty("layout");
	});
	it("acceptă un grila valid (imagine + text, cu și fără fiecare)", () => {
		const withBoth = { kind: "grila", rounds: [{ title: "Runda 1", questions: [
			{ img: 0, text: "Ce sol e acesta?", options: ["Cernoziom", "Podzol", "Laterit", "Turbă"], answer: 1 },
		] }] };
		expect(parseGameBody(JSON.stringify(withBoth))).toEqual(withBoth);
		const imgOnly = { kind: "grila", rounds: [{ questions: [{ img: 2, options: ["a", "b"], answer: 0 }] }] };
		expect(parseGameBody(JSON.stringify(imgOnly))).toEqual(imgOnly);
		const textOnly = { kind: "grila", rounds: [{ questions: [{ text: "Care e capitala?", options: ["a", "b", "c"], answer: 2 }] }] };
		expect(parseGameBody(JSON.stringify(textOnly))).toEqual(textOnly);
	});
	it("acceptă un sortare valid (carduri text și cu imagine)", () => {
		const body = { kind: "sortare", buckets: [{ label: "Rotație" }, { label: "Revoluție" }], rounds: [
			{ title: "Runda 1", cards: [{ text: "Alternanța zi-noapte", bucket: 0 }, { img: 3, bucket: 1 }] },
		] };
		expect(parseGameBody(JSON.stringify(body))).toEqual(body);
	});
	it("respinge sortare cu mai puțin de 2 coșuri sau cu o etichetă goală", () => {
		const one = { kind: "sortare", buckets: [{ label: "Rotație" }], rounds: [{ cards: [{ text: "x", bucket: 0 }] }] };
		expect(parseGameBody(JSON.stringify(one))).toBeNull();
		const empty = { kind: "sortare", buckets: [{ label: "Rotație" }, { label: "  " }], rounds: [{ cards: [{ text: "x", bucket: 0 }] }] };
		expect(parseGameBody(JSON.stringify(empty))).toBeNull();
	});
	it("respinge un card sortare fără text și fără imagine, sau cu bucket în afara listei", () => {
		const base = { kind: "sortare", buckets: [{ label: "A" }, { label: "B" }], rounds: [{ cards: [{ bucket: 0 }] }] };
		expect(parseGameBody(JSON.stringify(base))).toBeNull();
		const outside = { kind: "sortare", buckets: [{ label: "A" }, { label: "B" }], rounds: [{ cards: [{ text: "x", bucket: 2 }] }] };
		expect(parseGameBody(JSON.stringify(outside))).toBeNull();
	});
	it("respinge sortare cu rounds gol sau o rundă fără carduri", () => {
		const b = [{ label: "A" }, { label: "B" }];
		expect(parseGameBody(JSON.stringify({ kind: "sortare", buckets: b, rounds: [] }))).toBeNull();
		expect(parseGameBody(JSON.stringify({ kind: "sortare", buckets: b, rounds: [{ cards: [] }] }))).toBeNull();
	});
	it("acceptă `hint` pe o întrebare grila și îl păstrează", () => {
		const withHint = { kind: "grila", rounds: [{ questions: [
			{ img: 0, text: "Ce sol e acesta?", hint: "Se formează sub pădurea de conifere.", options: ["a", "b"], answer: 0 },
		] }] };
		expect(parseGameBody(JSON.stringify(withHint))).toEqual(withHint);
	});
	it("aruncă un `hint` care nu e string, fără să respingă întrebarea", () => {
		const bad = { kind: "grila", rounds: [{ questions: [{ text: "q", hint: 7, options: ["a", "b"], answer: 0 }] }] };
		const parsed = parseGameBody(JSON.stringify(bad));
		expect(parsed).not.toBeNull();
		const q = (parsed as { rounds: { questions: Record<string, unknown>[] }[] }).rounds[0].questions[0];
		expect(q).not.toHaveProperty("hint");
	});
	it("acceptă `why` pe o întrebare grila (explicație pe fiecare variantă) și îl păstrează", () => {
		const withWhy = { kind: "grila", rounds: [{ questions: [
			{ text: "De ce nu se topește nucleul intern?", options: ["Rocă silicatică", "Presiunea uriașă"], answer: 1,
				why: ["Fals. Nucleul e din fier și nichel.", "Corect! Presiunea învinge topirea."] },
		] }] };
		expect(parseGameBody(JSON.stringify(withWhy))).toEqual(withWhy);
	});
	it("aruncă un `why` cu altă lungime decât variantele sau care nu e listă de text", () => {
		for (const why of [["doar una"], "text", ["ok", 7], null]) {
			const body = { kind: "grila", rounds: [{ questions: [{ text: "q", options: ["a", "b"], answer: 0, why }] }] };
			const parsed = parseGameBody(JSON.stringify(body));
			expect(parsed).not.toBeNull();
			const q = (parsed as { rounds: { questions: Record<string, unknown>[] }[] }).rounds[0].questions[0];
			expect(q).not.toHaveProperty("why");
		}
	});
	it("respinge grila cu rounds gol sau o rundă fără întrebări", () => {
		expect(parseGameBody(JSON.stringify({ kind: "grila", rounds: [] }))).toBeNull();
		expect(parseGameBody(JSON.stringify({ kind: "grila", rounds: [{ questions: [] }] }))).toBeNull();
		expect(parseGameBody(JSON.stringify({ kind: "grila", rounds: [{ title: "x" }] }))).toBeNull();
	});
	it("respinge o întrebare grila fără imagine și fără text", () => {
		const bad = { kind: "grila", rounds: [{ questions: [{ options: ["a", "b"], answer: 0 }] }] };
		expect(parseGameBody(JSON.stringify(bad))).toBeNull();
	});
	it("respinge grila cu mai puțin de 2 variante sau o variantă care nu e string", () => {
		const tooFew = { kind: "grila", rounds: [{ questions: [{ text: "q", options: ["a"], answer: 0 }] }] };
		expect(parseGameBody(JSON.stringify(tooFew))).toBeNull();
		const notString = { kind: "grila", rounds: [{ questions: [{ text: "q", options: ["a", 2], answer: 0 }] }] };
		expect(parseGameBody(JSON.stringify(notString))).toBeNull();
	});
	it("respinge grila cu `answer` neîntreg sau în afara intervalului", () => {
		const base = { kind: "grila", rounds: [{ questions: [{ text: "q", options: ["a", "b"] }] }] };
		for (const answer of [-1, 2, 0.5, "0", undefined]) {
			const body = JSON.parse(JSON.stringify(base));
			if (answer !== undefined) body.rounds[0].questions[0].answer = answer;
			expect(parseGameBody(JSON.stringify(body))).toBeNull();
		}
	});
});

describe("chunkPoints", () => {
	const pts = Array.from({ length: 8 }, (_, i) => ({ n: i + 1, x: i, y: i, name: `p${i}` }));
	it("împarte în bucăți consecutive de mărimea dată, ultima cu ce rămâne", () => {
		const chunks = chunkPoints(pts, 3);
		expect(chunks.map((c) => c.length)).toEqual([3, 3, 2]);
		expect(chunks.flat()).toEqual(pts); // ordinea și conținutul păstrate, doar tăiate
	});
	it("bucăți egale când mărimea împarte exact lungimea", () => {
		expect(chunkPoints(pts, 4).map((c) => c.length)).toEqual([4, 4]);
	});
	it("o singură rundă când size lipsește, e invalid sau ≥ lungime", () => {
		expect(chunkPoints(pts, undefined)).toEqual([pts]);
		expect(chunkPoints(pts, 0)).toEqual([pts]);
		expect(chunkPoints(pts, -1)).toEqual([pts]);
		expect(chunkPoints(pts, 2.5)).toEqual([pts]);
		expect(chunkPoints(pts, 8)).toEqual([pts]);
		expect(chunkPoints(pts, 100)).toEqual([pts]);
	});
	it("listă goală ⇒ fără runde", () => {
		expect(chunkPoints([], 3)).toEqual([]);
	});
	it("reproduce împărțirea conținutului real (37 puncte, draw 12 ⇒ 4 runde de 12/12/12/1)", () => {
		const big = Array.from({ length: 37 }, (_, i) => i);
		expect(chunkPoints(big, 12).map((c) => c.length)).toEqual([12, 12, 12, 1]);
	});
});

describe("renumberPoints", () => {
	it("renumerotează 1..N păstrând ordinea și celelalte câmpuri", () => {
		const pts: MapPoint[] = [
			{ n: 4, x: 1, y: 2, name: "a" },
			{ n: 19, x: 3, y: 4, name: "b" },
			{ n: 31, x: 5, y: 6, name: "c" },
		];
		expect(renumberPoints(pts)).toEqual([
			{ n: 1, x: 1, y: 2, name: "a" },
			{ n: 2, x: 3, y: 4, name: "b" },
			{ n: 3, x: 5, y: 6, name: "c" },
		]);
	});
	it("nu mută inputul", () => {
		const pts: MapPoint[] = [{ n: 9, x: 0, y: 0, name: "x" }];
		const copy = JSON.parse(JSON.stringify(pts));
		renumberPoints(pts);
		expect(pts).toEqual(copy);
	});
});

describe("shuffle", () => {
	it("păstrează elementele și nu mută inputul", () => {
		const input = [1, 2, 3, 4, 5, 6, 7, 8];
		const copy = [...input];
		const out = shuffle(input);
		expect(input).toEqual(copy);
		expect([...out].sort((a, b) => a - b)).toEqual(copy);
	});
});

describe("shuffleSeeded", () => {
	it("e determinist pentru același seed și păstrează elementele fără a muta inputul", () => {
		const input = [1, 2, 3, 4, 5, 6, 7, 8];
		const copy = [...input];
		expect(shuffleSeeded(input, 42)).toEqual(shuffleSeeded(input, 42));
		expect([...shuffleSeeded(input, 42)].sort((a, b) => a - b)).toEqual(copy);
		expect(input).toEqual(copy);
	});
	it("dă ordini diferite pentru seed-uri diferite", () => {
		const input = [1, 2, 3, 4, 5, 6, 7, 8];
		expect(shuffleSeeded(input, 1)).not.toEqual(shuffleSeeded(input, 2));
	});
});

describe("parseGameBody matrice", () => {
	const valid = {
		kind: "matrice",
		variants: [
			{
				rows: [
					[{ text: "Continente" }, { text: "AMERICA", given: true }],
					[{ text: "Fluvii" }, { text: "Paraná", given: true }],
				],
			},
		],
	};
	it("acceptă o matrice validă dreptunghiulară", () => {
		expect(parseGameBody(JSON.stringify(valid))).toEqual(valid);
	});
	it("respinge variants gol", () => {
		expect(parseGameBody(JSON.stringify({ kind: "matrice", variants: [] }))).toBeNull();
	});
	it("respinge rânduri lipsă", () => {
		expect(parseGameBody(JSON.stringify({ kind: "matrice", variants: [{ rows: [] }] }))).toBeNull();
	});
	it("respinge grilă nedreptunghiulară", () => {
		const bad = { kind: "matrice", variants: [{ rows: [[{ text: "a" }, { text: "b" }], [{ text: "c" }]] }] };
		expect(parseGameBody(JSON.stringify(bad))).toBeNull();
	});
	it("respinge celulă cu text gol", () => {
		const bad = { kind: "matrice", variants: [{ rows: [[{ text: "" }]] }] };
		expect(parseGameBody(JSON.stringify(bad))).toBeNull();
	});
});

describe("pickMatrixVariant / matrixBank", () => {
	const variants: MatrixVariant[] = [
		{ rows: [[{ text: "a" }, { text: "b", given: true }], [{ text: "c" }, { text: "a" }]] },
		{ rows: [[{ text: "x" }]] },
	];
	it("alege determinist și ciclic după seed", () => {
		expect(pickMatrixVariant(variants, 0)).toBe(0);
		expect(pickMatrixVariant(variants, 1)).toBe(1);
		expect(pickMatrixVariant(variants, 2)).toBe(0);
	});
	it("banca = textele celulelor nefixate, cu duplicate păstrate", () => {
		const bank = matrixBank(variants[0], 7);
		expect([...bank].sort()).toEqual(["a", "a", "c"]); // „b" e fixată, „a" apare de 2 ori
	});
	it("banca e determinist-seedată", () => {
		expect(matrixBank(variants[0], 3)).toEqual(matrixBank(variants[0], 3));
	});
});

describe("conținut: matricea-lacurilor", () => {
	const mods = import.meta.glob("../../../content/games/hidro-lacuri-matrice/game.json", {
		eager: true,
		import: "default",
	});
	const game = Object.values(mods)[0] as { body: unknown };
	it("body-ul se parsează și are 4 variante", () => {
		const body = parseGameBody(JSON.stringify(game.body));
		expect(body).not.toBeNull();
		expect(body?.kind).toBe("matrice");
		if (body?.kind !== "matrice") throw new Error("unreachable");
		expect(body.variants.length).toBe(5);
		for (const v of body.variants) {
			expect(v.rows.length).toBe(5);
			for (const row of v.rows) expect(row.length).toBe(5);
			const blanks = v.rows.flat().filter((c) => !c.given).length;
			expect(blanks).toBe(16);
		}
	});
});

describe("assetSrc", () => {
	const assets = [{ id: "aaa", idx: 0 }, { id: "bbb", idx: 3 }];
	it("mapează idx la URL-ul /media", () => {
		expect(assetSrc(assets, 3)).toBe("/media/bbb");
	});
	it("returnează null pentru idx lipsă sau undefined", () => {
		expect(assetSrc(assets, 7)).toBeNull();
		expect(assetSrc(assets, undefined)).toBeNull();
	});
});

// Mirrors content/games/sistem-solar-ordine/game.json's `body` after adding the
// "Evoluția Universului" round (assets univers-1..6.jpg at idx 20..25). Kept as a
// literal here (not read from disk) since app/app/** is type-checked without node
// types (Cloudflare Workers runtime has no fs). If game.json's body changes, update
// this literal too.
describe("content/games/sistem-solar-ordine — rundă nouă „Evoluția Universului”", () => {
	const body = {
		kind: "ordonare",
		rounds: [
			{
				title: "Evoluția Universului, de la Big Bang până azi",
				startLabel: "Big Bang",
				endLabel: "azi",
				cards: [
					{ label: "", img: 20, order: 1 },
					{ label: "", img: 21, order: 2 },
					{ label: "", img: 22, order: 3 },
					{ label: "", img: 23, order: 4 },
					{ label: "", img: 24, order: 5 },
					{ label: "", img: 25, order: 6 },
				],
			},
			{ title: "Sistemul Solar, de la Soare spre exterior", cards: [{ label: "Soarele", img: 0, order: 1 }] },
			{ title: "Stelele, de la cele mai reci la cele mai fierbinți", cards: [{ label: "stele roșii", img: 10, order: 1 }] },
			{ title: "Etapele formării unei stele", cards: [{ label: "nebuloasă", img: 15, order: 1 }] },
		],
	};

	it("parsează cu parseGameBody (non-null)", () => {
		const parsed = parseGameBody(JSON.stringify(body));
		expect(parsed).not.toBeNull();
		expect(parsed?.kind).toBe("ordonare");
	});

	it("prima rundă are 6 carduri doar-imagine (label gol), img 20..25, order 1..6", () => {
		const parsed = parseGameBody(JSON.stringify(body));
		const rounds = (parsed as { rounds: OrderRound[] }).rounds;
		const first = rounds[0];
		expect(first.title).toBe("Evoluția Universului, de la Big Bang până azi");
		expect(first.cards).toHaveLength(6);
		first.cards.forEach((c, i) => {
			expect(c.label).toBe("");
			expect(c.img).toBe(20 + i);
			expect(c.order).toBe(i + 1);
		});
	});

	it("celelalte 3 runde existente rămân în urma noii runde, neatinse", () => {
		const parsed = parseGameBody(JSON.stringify(body));
		const rounds = (parsed as { rounds: OrderRound[] }).rounds;
		expect(rounds).toHaveLength(4);
		expect(rounds[1].title).toBe("Sistemul Solar, de la Soare spre exterior");
		expect(rounds[2].title).toBe("Stelele, de la cele mai reci la cele mai fierbinți");
		expect(rounds[3].title).toBe("Etapele formării unei stele");
	});
});

describe("quizRounds", () => {
	const pts = Array.from({ length: 6 }, (_, i) => ({ n: i + 1, x: i, y: i, name: `p${i + 1}` }));
	it("folosește rundele autorate, cu tot cu repetări", () => {
		const rounds = quizRounds(pts, [[1, 2, 3], [3, 4, 5], [5, 6, 1]], undefined, 7);
		expect(rounds).toHaveLength(3);
		for (const r of rounds) expect(r).toHaveLength(3);
		expect(rounds.map((r) => r.map((p) => p.n).sort((a, b) => a - b))).toEqual([[1, 2, 3], [3, 4, 5], [1, 5, 6]]);
	});
	it("acoperă fiecare punct cel puțin o dată dacă rundele o cer", () => {
		const seen = new Set(quizRounds(pts, [[1, 2, 3], [4, 5, 6]], undefined, 1).flat().map((p) => p.n));
		expect([...seen].sort((a, b) => a - b)).toEqual([1, 2, 3, 4, 5, 6]);
	});
	it("e determinist pentru același seed și reamestecă la seed nou", () => {
		const a = quizRounds(pts, [[1, 2, 3, 4, 5, 6]], undefined, 42);
		expect(a).toEqual(quizRounds(pts, [[1, 2, 3, 4, 5, 6]], undefined, 42));
		expect(a).not.toEqual(quizRounds(pts, [[1, 2, 3, 4, 5, 6]], undefined, 43));
	});
	it("ignoră `n`-urile care nu există și rundele rămase goale", () => {
		expect(quizRounds(pts, [[1, 99], [98]], undefined, 3).map((r) => r.map((p) => p.n))).toEqual([[1]]);
	});
	it("cade pe împărțirea după `draw` când nu există runde autorate", () => {
		expect(quizRounds(pts, undefined, 2, 5).map((r) => r.length)).toEqual([2, 2, 2]);
		expect(quizRounds(pts, [], 2, 5).map((r) => r.length)).toEqual([2, 2, 2]);
	});
});

describe("derangeAgainst", () => {
	const ident = (n: number) => Array.from({ length: n }, (_, i) => i);
	it("nu lasă niciun element pe aceeași poziție ca în bază", () => {
		for (let n = 2; n <= 12; n++) {
			const base = ident(n);
			for (let seed = 0; seed < 40; seed++) {
				const out = derangeAgainst(base, shuffleSeeded(base, seed));
				expect([...out].sort((a, b) => a - b)).toEqual(base); // aceeași mulțime
				for (let i = 0; i < n; i++) expect(out[i]).not.toBe(base[i]);
			}
		}
	});
	it("merge și când baza nu e identitatea", () => {
		const base = [3, 0, 2, 1];
		const out = derangeAgainst(base, [3, 0, 2, 1]);
		for (let i = 0; i < base.length; i++) expect(out[i]).not.toBe(base[i]);
		expect([...out].sort()).toEqual([...base].sort());
	});
	it("nu mută inputul", () => {
		const base = ident(5);
		const other = shuffleSeeded(base, 9);
		const copy = [...other];
		derangeAgainst(base, other);
		expect(other).toEqual(copy);
	});
	it("cu un singur element întoarce lista neschimbată (derajament imposibil)", () => {
		expect(derangeAgainst([0], [0])).toEqual([0]);
	});
});

describe("placeRounds", () => {
	const targets = ["a", "b", "c", "d"].map((id, i) => ({ id, x: i, y: i, label: id.toUpperCase() }));
	it("joacă toate țintele într-o rundă când nu există runde autorate", () => {
		expect(placeRounds(targets, undefined).map((r) => r.map((t) => t.id))).toEqual([["a", "b", "c", "d"]]);
		expect(placeRounds(targets, []).map((r) => r.map((t) => t.id))).toEqual([["a", "b", "c", "d"]]);
	});
	it("respectă rundele autorate, în ordinea scrisă", () => {
		expect(placeRounds(targets, [["c", "a"], ["b", "d"]]).map((r) => r.map((t) => t.id))).toEqual([
			["c", "a"],
			["b", "d"],
		]);
	});
	it("ignoră id-urile care nu există și rundele rămase goale", () => {
		expect(placeRounds(targets, [["a", "zzz"], ["nope"]]).map((r) => r.map((t) => t.id))).toEqual([["a"]]);
	});
	it("cade pe o singură rundă dacă nicio rundă autorată nu supraviețuiește", () => {
		expect(placeRounds(targets, [["nope"], ["nici-asta"]]).map((r) => r.map((t) => t.id))).toEqual([
			["a", "b", "c", "d"],
		]);
	});
});

describe("parseGameBody plaseaza-pe-harta cu runde", () => {
	const base = {
		kind: "plaseaza-pe-harta",
		map: 0,
		targets: [
			{ id: "a", x: 1, y: 1, label: "A" },
			{ id: "b", x: 2, y: 2, label: "B" },
		],
	};
	it("păstrează `rounds` bine format", () => {
		const b = parseGameBody(JSON.stringify({ ...base, rounds: [["a"], ["b"]] }));
		expect(b && "rounds" in b ? b.rounds : null).toEqual([["a"], ["b"]]);
	});
	it("aruncă `rounds` care nu e listă de liste de șiruri nevide", () => {
		for (const bad of [[], [[]], "x", [["a"], 3], [[1, 2]]]) {
			const b = parseGameBody(JSON.stringify({ ...base, rounds: bad }));
			expect(b).not.toBeNull();
			expect(b && "rounds" in b).toBe(false);
		}
	});
});
