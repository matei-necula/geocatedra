import { describe, expect, it } from "vitest";
import { clampPage, parsePageBook, pageForBook } from "./pagebook";

describe("parsePageBook", () => {
	it("citește o carte cu numărul de pagini declarat", () => {
		expect(parsePageBook('{"kind":"pagini","count":12}', 12)).toEqual({ count: 12 });
	});

	it("nu promite mai multe pagini decât imagini încărcate", () => {
		expect(parsePageBook('{"kind":"pagini","count":12}', 5)).toEqual({ count: 5 });
	});

	it("cade pe numărul de assets când count lipsește sau e absurd", () => {
		expect(parsePageBook('{"kind":"pagini"}', 7)).toEqual({ count: 7 });
		expect(parsePageBook('{"kind":"pagini","count":-3}', 7)).toEqual({ count: 7 });
	});

	it("întoarce null pentru alt kind, body stricat sau zero pagini", () => {
		expect(parsePageBook('{"kind":"slides","count":3}', 3)).toBeNull();
		expect(parsePageBook("nu e json", 3)).toBeNull();
		expect(parsePageBook('{"slides":[{"title":"a","text":"b"}]}', 3)).toBeNull();
		expect(parsePageBook('{"kind":"pagini","count":12}', 0)).toBeNull();
	});
});

describe("clampPage", () => {
	it("se oprește la coperți, nu se întoarce circular", () => {
		expect(clampPage(-1, 5)).toBe(0);
		expect(clampPage(5, 5)).toBe(4);
		expect(clampPage(2, 5)).toBe(2);
	});

	it("rezistă la valori fără sens", () => {
		expect(clampPage(1, 0)).toBe(0);
		expect(clampPage(Number.NaN, 5)).toBe(0);
		expect(clampPage(2.7, 5)).toBe(2);
	});
});

describe("parsePageBook — zone de clic", () => {
	const body = (links: unknown) => JSON.stringify({ kind: "pagini", count: 10, links });
	const link = { page: 9, x: 41, y: 7, w: 18, h: 6, slug: "alt-material" };

	it("păstrează zonele bine formate", () => {
		const b = parsePageBook(body([link]), 10);
		expect(b?.links).toHaveLength(1);
		expect(b?.links?.[0].slug).toBe("alt-material");
	});

	it("nu are zone când body-ul nu declară niciuna", () => {
		expect(parsePageBook(JSON.stringify({ kind: "pagini", count: 10 }), 10)?.links).toBeUndefined();
	});

	it("aruncă lista întreagă dacă vreo zonă e stricată", () => {
		for (const bad of [{ ...link, slug: "" }, { ...link, x: "3" }, { ...link, page: undefined }, "x"]) {
			const b = parsePageBook(body([link, bad]), 10);
			expect(b).not.toBeNull();
			expect(b?.links).toBeUndefined();
		}
	});

	it("ignoră zonele care arată spre pagini inexistente sau au dimensiuni nule", () => {
		expect(parsePageBook(body([{ ...link, page: 99 }]), 10)?.links).toBeUndefined();
		expect(parsePageBook(body([{ ...link, w: 0 }]), 10)?.links).toBeUndefined();
		// paginile se limitează la câte imagini există
		expect(parsePageBook(body([link]), 5)?.links).toBeUndefined();
	});
});

describe("pageForBook", () => {
	it("pornește de la prima pagină când teancul s-a schimbat", () => {
		// Zona de clic din „Relieful Dobrogei" (pagina 9 din 10) ducea la suportul
		// de lectură, care are 2 pagini: indicele vechi ieșea din tablou și pagina
		// crăpa cu „Cannot read properties of undefined".
		expect(pageForBook(8, 2, false)).toBe(0);
	});

	it("păstrează pagina cât timp teancul e același", () => {
		expect(pageForBook(8, 10, true)).toBe(8);
	});

	it("mărginește indicele când același teanc se scurtează", () => {
		// Vitrina taie teancul la paginile permise, cu același material dedesubt.
		expect(pageForBook(8, 3, true)).toBe(2);
	});

	it("întoarce 0 pentru un teanc gol", () => {
		expect(pageForBook(4, 0, true)).toBe(0);
	});
});
