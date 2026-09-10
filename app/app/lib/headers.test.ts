import { describe, expect, it } from "vitest";
import { isInlineMime, mediaHeaders, withSecurityHeaders } from "./headers";

describe("isInlineMime", () => {
	it("randează în pagină imaginile, filmele și PDF-ul", () => {
		expect(isInlineMime("image/webp")).toBe(true);
		expect(isInlineMime("image/png")).toBe(true);
		expect(isInlineMime("video/mp4")).toBe(true);
		expect(isInlineMime("application/pdf")).toBe(true);
	});

	it("forțează SVG la attachment — poate purta script în originea noastră", () => {
		expect(isInlineMime("image/svg+xml")).toBe(false);
	});

	it("forțează la attachment orice altceva (docx, pptx, necunoscut)", () => {
		expect(isInlineMime("application/vnd.openxmlformats-officedocument.wordprocessingml.document")).toBe(false);
		expect(isInlineMime("application/octet-stream")).toBe(false);
	});
});

describe("mediaHeaders", () => {
	// Implicit NEINDEXABIL: fiecare apel de mai jos păstrează astfel exact înțelesul dinainte,
	// iar testele care chiar verifică indexarea trec `indexable: true` explicit.
	const img = { mime: "image/webp", bytes: 1234, indexable: false };

	it("nu oferă niciodată un download din partea serverului pentru tipurile randabile", () => {
		expect(mediaHeaders({ ...img, publicDemo: false })["Content-Disposition"]).toBe("inline");
		expect(mediaHeaders({ ...img, publicDemo: true })["Content-Disposition"]).toBe("inline");
	});

	// Politica NU mai e „nimic în căutare" (2026-09-08). Se decide per obiect — motivarea
	// completă e la `indexable` în headers.ts. Cele două teste de mai jos țin ambele capete.
	it("ține în afara motoarelor de căutare tot ce nu e marcat explicit ca indexabil", () => {
		for (const publicDemo of [false, true]) {
			const h = mediaHeaders({ ...img, publicDemo, indexable: false });
			expect(h["X-Robots-Tag"]).toContain("noindex");
			expect(h["X-Robots-Tag"]).toContain("noimageindex");
			expect(h["X-Robots-Tag"]).toContain("noarchive");
		}
	});

	// Absența antetului E politica: fără directivă, motorul indexează normal. Un „index"
	// explicit n-ar adăuga nimic și ar sugera că e nevoie de el.
	it("nu pune niciun X-Robots-Tag pe un obiect indexabil", () => {
		for (const publicDemo of [false, true]) {
			const h = mediaHeaders({ ...img, publicDemo, indexable: true });
			expect(h["X-Robots-Tag"]).toBeUndefined();
		}
	});

	// Apărarea contra hotlinkului nu se plătește cu indexarea: `CORP` e verificat de browsere
	// la încorporarea din altă origine, iar un crawler cere adresa direct.
	it("păstrează CORP chiar și pe obiectele indexabile", () => {
		expect(mediaHeaders({ ...img, publicDemo: true, indexable: true })["Cross-Origin-Resource-Policy"]).toBe(
			"same-origin",
		);
	});

	it("blochează hotlinkul de pe alte site-uri", () => {
		expect(mediaHeaders({ ...img, publicDemo: false })["Cross-Origin-Resource-Policy"]).toBe("same-origin");
		expect(mediaHeaders({ ...img, publicDemo: true })["Cross-Origin-Resource-Policy"]).toBe("same-origin");
	});

	it("nu lasă niciun cache comun să păstreze materialul unui elev", () => {
		const h = mediaHeaders({ ...img, publicDemo: false });
		expect(h["Cache-Control"]).toBe("private, max-age=300");
		expect(h["Cache-Control"]).not.toContain("public");
	});

	it("vitrina se cachează public, dar retragerea unui material se vede într-o oră", () => {
		const h = mediaHeaders({ ...img, publicDemo: true });
		expect(h["Cache-Control"]).toBe("public, max-age=3600");
	});

	it("declară că răspunsul depinde de cine cere", () => {
		expect(mediaHeaders({ ...img, publicDemo: false }).Vary).toBe("Cookie");
	});

	it("nu lasă browserul să ghicească tipul", () => {
		expect(mediaHeaders({ ...img, publicDemo: false })["X-Content-Type-Options"]).toBe("nosniff");
	});

	it("trece mai departe tipul și mărimea reale", () => {
		const h = mediaHeaders({ mime: "application/pdf", bytes: 42, publicDemo: false, indexable: false });
		expect(h["Content-Type"]).toBe("application/pdf");
		expect(h["Content-Length"]).toBe("42");
	});
});

describe("withSecurityHeaders", () => {
	const wrap = (url: string, res = new Response("x")) => withSecurityHeaders(new Request(url), res);

	it("blochează încadrarea conținutului în alt site (iframe) și hotlinkul (img)", () => {
		const h = wrap("https://exemplu.ro/clasa/geo-9").headers;
		expect(h.get("Content-Security-Policy")).toContain("frame-ancestors 'self'");
		expect(h.get("X-Frame-Options")).toBe("SAMEORIGIN");
		expect(h.get("Cross-Origin-Resource-Policy")).toBe("same-origin");
	});

	it("nu trimite HSTS pe http (localhost), dar îl trimite pe https", () => {
		expect(wrap("http://localhost:5173/").headers.get("Strict-Transport-Security")).toBeNull();
		expect(wrap("https://exemplu.ro/").headers.get("Strict-Transport-Security")).toContain("max-age=");
	});

	it("nu inventează un X-Robots-Tag global — paginile publice trebuie să rămână indexabile", () => {
		expect(wrap("https://exemplu.ro/demo").headers.get("X-Robots-Tag")).toBeNull();
	});
});
