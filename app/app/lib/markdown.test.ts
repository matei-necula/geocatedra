import { describe, expect, it } from "vitest";
import { classifyBlock, normalizeNewlines, parseInline, parseList, splitBlocks } from "./markdown";

describe("normalizeNewlines", () => {
	it("convertește CRLF și CR izolat în LF", () => {
		expect(normalizeNewlines("a\r\nb\rc\nd")).toBe("a\nb\nc\nd");
	});
});

describe("splitBlocks", () => {
	it("desparte pe linie goală (\\n{2,}), ca înainte", () => {
		expect(splitBlocks("Paragraf unu.\n\nParagraf doi.")).toEqual(["Paragraf unu.", "Paragraf doi."]);
	});

	it("regresie: body CRLF cu heading-uri lipite de paragraf nu se prăbușește într-un singur bloc", () => {
		// Exact tiparul din body-ul real al lecției „Alcătuirea litosferei":
		// linii \r\n\r\n\r\n\r\n (patru \r\n) — niciodată doi \n consecutivi —
		// care făcea ca /\n{2,}/ să nu taie NICIODATĂ. Cu \r\n\r\n simplu (un
		// singur rând gol) rezultatul trebuie să fie identic.
		const body =
			"# Alcătuirea litosferei – minerale și roci\r\n\r\n\r\n\r\n" +
			"Litosfera este alcătuită din **roci**.\r\n\r\n\r\n\r\n" +
			"# Minerale și roci\r\n\r\n\r\n\r\n" +
			"Un **mineral** este o substanță naturală.";
		const blocks = splitBlocks(body);
		expect(blocks).toEqual([
			"# Alcătuirea litosferei – minerale și roci",
			"Litosfera este alcătuită din **roci**.",
			"# Minerale și roci",
			"Un **mineral** este o substanță naturală.",
		]);
		// Fiecare heading e propriul bloc, deci classifyBlock îl recunoaște ca
		// heading, nu ca text cu "#" literal în el.
		expect(classifyBlock(blocks[0])).toEqual({
			kind: "heading",
			level: 2,
			text: "Alcătuirea litosferei – minerale și roci",
		});
		expect(classifyBlock(blocks[2])).toEqual({ kind: "heading", level: 2, text: "Minerale și roci" });
	});

	it("un heading fără linie goală înainte tot își începe propriul bloc", () => {
		const blocks = splitBlocks("Text introductiv.\n# Un titlu\nText după titlu.");
		expect(blocks).toEqual(["Text introductiv.", "# Un titlu", "Text după titlu."]);
	});

	it("un '---' fără linie goală tot devine bloc separat", () => {
		expect(splitBlocks("Paragraf.\n---\nAltul.")).toEqual(["Paragraf.", "---", "Altul."]);
	});

	it("ignoră o linie făcută doar din diez (fără text după)", () => {
		expect(splitBlocks("Text.\n#\nAltceva.")).toEqual(["Text.", "Altceva."]);
		expect(splitBlocks("Text.\n##  \nAltceva.")).toEqual(["Text.", "Altceva."]);
	});

	it("liniile de listă rămân grupate separat de textul din jur", () => {
		const blocks = splitBlocks("Introducere.\n- unu\n- doi\nConcluzie.");
		expect(blocks).toEqual(["Introducere.", "- unu\n- doi\nConcluzie."]);
		// linia de continuare se atașează celui mai recent item din listă
		expect(classifyBlock(blocks[1])).toMatchObject({
			kind: "list",
			items: [{ text: "unu" }, { text: "doi Concluzie." }],
		});
	});

	it("liniile de tabel rămân grupate separat", () => {
		const blocks = splitBlocks("Text.\n| a | b |\n| - | - |\n| 1 | 2 |\nDupă.");
		expect(blocks).toEqual(["Text.", "| a | b |\n| - | - |\n| 1 | 2 |", "După."]);
	});
});

describe("classifyBlock", () => {
	it("recunoaște headinguri # până la ####, plafonate la h4", () => {
		expect(classifyBlock("# Titlu")).toEqual({ kind: "heading", level: 2, text: "Titlu" });
		expect(classifyBlock("## Titlu")).toEqual({ kind: "heading", level: 3, text: "Titlu" });
		expect(classifyBlock("### Titlu")).toEqual({ kind: "heading", level: 4, text: "Titlu" });
		expect(classifyBlock("#### Titlu")).toEqual({ kind: "heading", level: 4, text: "Titlu" });
		expect(classifyBlock("##### Titlu")).toEqual({ kind: "heading", level: 4, text: "Titlu" });
	});

	it("tolerează '#Titlu' fără spațiu după diez", () => {
		expect(classifyBlock("#Titlu fără spațiu")).toEqual({
			kind: "heading",
			level: 2,
			text: "Titlu fără spațiu",
		});
	});

	it("recunoaște rigla ---", () => {
		expect(classifyBlock("---")).toEqual({ kind: "hr" });
		expect(classifyBlock("-----")).toEqual({ kind: "hr" });
	});

	it("recunoaște un tabel pipe cu antet și separator", () => {
		const block = "| Tip | Exemplu |\n| --- | --- |\n| magmatică | granit |\n| sedimentară | gresie |";
		expect(classifyBlock(block)).toEqual({
			kind: "table",
			header: ["Tip", "Exemplu"],
			rows: [
				["magmatică", "granit"],
				["sedimentară", "gresie"],
			],
		});
	});

	it("cade pe paragraf când liniile încep cu | dar nu au rând separator", () => {
		expect(classifyBlock("| nu e tabel\n| a doua linie")).toEqual({
			kind: "paragraph",
			text: "| nu e tabel | a doua linie",
		});
	});

	it("un paragraf normal își unește liniile cu spațiu", () => {
		expect(classifyBlock("Linia unu\nlinia doi")).toEqual({ kind: "paragraph", text: "Linia unu linia doi" });
	});
});

describe("parseList", () => {
	it("citește o listă neordonată simplă", () => {
		expect(parseList("- unu\n- doi\n- trei")).toEqual({
			ordered: false,
			items: [
				{ text: "unu", ordered: false, children: [] },
				{ text: "doi", ordered: false, children: [] },
				{ text: "trei", ordered: false, children: [] },
			],
		});
	});

	it("citește o listă ordonată și subliste indentate cu >=2 spații", () => {
		const { ordered, items } = parseList("1. primul\n  - a\n  - b\n2. al doilea");
		expect(ordered).toBe(true);
		expect(items).toHaveLength(2);
		expect(items[0].children).toEqual([
			{ text: "a", ordered: false, children: [] },
			{ text: "b", ordered: false, children: [] },
		]);
		expect(items[1].text).toBe("al doilea");
	});
});

describe("parseInline", () => {
	it("recunoaște **bold** și *italic*, restul rămâne text simplu", () => {
		expect(parseInline("un **bold** și un *italic* aici")).toEqual([
			{ kind: "text", text: "un " },
			{ kind: "bold", text: "bold" },
			{ kind: "text", text: " și un " },
			{ kind: "em", text: "italic" },
			{ kind: "text", text: " aici" },
		]);
	});

	it("text fără markup rămâne un singur token", () => {
		expect(parseInline("text simplu")).toEqual([{ kind: "text", text: "text simplu" }]);
	});
});

describe("regresie pe body-ul real al lecției «Alcătuirea litosferei – minerale și roci»", () => {
	// Fragment extras din remote D1 (material_translations, material_id
	// 10ec4392-60cb-46f6-9b0d-1c7e2e4294a5), cu liniile \r\n\r\n\r\n\r\n reale
	// dintre paragrafe — exact ce a produs simptomul raportat de profesoară:
	// "#" literal pe ecran și tot textul pe un singur rând.
	const body =
		"# Alcătuirea litosferei – minerale și roci\r\n\r\n\r\n\r\n" +
		"Litosfera, învelișul rigid de la exteriorul Pământului, este alcătuită din **roci**. " +
		"Ca să înțelegem scoarța terestră, trebuie să știm din ce este făcută și cum s-au format materialele ei.\r\n\r\n\r\n\r\n" +
		"# Minerale și roci\r\n\r\n\r\n\r\n" +
		"Un **mineral** este o substanță naturală, cu o compoziție chimică bine definită.\r\n\r\n\r\n\r\n" +
		"- **granit** — cea mai răspândită rocă intruzivă;\r\n\r\n" +
		"- **gabrou**;\r\n\r\n" +
		"- **diorit**.\r\n\r\n\r\n\r\n" +
		"# De reținut\r\n\r\n" +
		"- Prima idee.\r\n- A doua idee.";

	it("fiecare heading devine propriul bloc «heading», nu text cu # literal", () => {
		const blocks = splitBlocks(body).map(classifyBlock);
		const headings = blocks.filter((b) => b.kind === "heading");
		expect(headings).toEqual([
			{ kind: "heading", level: 2, text: "Alcătuirea litosferei – minerale și roci" },
			{ kind: "heading", level: 2, text: "Minerale și roci" },
			{ kind: "heading", level: 2, text: "De reținut" },
		]);
		// Niciun bloc paragraf nu mai conține un "#" — asta era simptomul.
		for (const b of blocks) {
			if (b.kind === "paragraph") expect(b.text).not.toContain("#");
		}
	});

	it("liniile de listă separate de \\r\\n\\r\\n între ele se citesc tot ca o singură listă", () => {
		const blocks = splitBlocks(body).map(classifyBlock);
		const lists = blocks.filter((b) => b.kind === "list");
		expect(lists).toHaveLength(2); // lista de roci + lista "De reținut"
		const rociList = lists.find((l) => l.kind === "list" && l.items.some((it) => it.text.includes("granit")));
		expect(rociList).toBeDefined();
		if (rociList?.kind === "list") {
			expect(rociList.items.map((it) => it.text)).toEqual([
				"**granit** — cea mai răspândită rocă intruzivă;",
				"**gabrou**;",
				"**diorit**.",
			]);
		}
	});
});
