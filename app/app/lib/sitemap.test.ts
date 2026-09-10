import { describe, expect, it } from "vitest";
import { AI_CRAWLERS, buildLiberSitemapEntries, buildSitemapXml, escapeXml, LEGAL_PATHS, LIBER_ABOUT_PATH, LIBER_STATIC_PATHS, robotsTxt } from "./sitemap";

describe("escapeXml", () => {
	it("escapes all five predefined entities", () => {
		expect(escapeXml(`&<>"'`)).toBe("&amp;&lt;&gt;&quot;&apos;");
	});

	it("leaves plain text untouched", () => {
		expect(escapeXml("Confidențialitate")).toBe("Confidențialitate");
	});
});

describe("buildSitemapXml", () => {
	it("produces a valid urlset with the xml declaration and namespace", () => {
		const xml = buildSitemapXml({ origin: "https://example.com", entries: [{ path: "/" }] });
		expect(xml.startsWith('<?xml version="1.0" encoding="UTF-8"?>\n')).toBe(true);
		expect(xml).toContain('<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">');
		expect(xml).toContain("</urlset>");
		// well-formed: one open/close pair per tag used
		expect((xml.match(/<url>/g) ?? []).length).toBe((xml.match(/<\/url>/g) ?? []).length);
	});

	it("joins origin and path without a double slash", () => {
		const xml = buildSitemapXml({ origin: "https://example.com/", entries: [{ path: "/termeni" }] });
		expect(xml).toContain("<loc>https://example.com/termeni</loc>");
		expect(xml).not.toContain("//termeni");
	});

	it("joins a bare origin with a path missing its leading slash", () => {
		const xml = buildSitemapXml({ origin: "https://example.com", entries: [{ path: "cookie-uri" }] });
		expect(xml).toContain("<loc>https://example.com/cookie-uri</loc>");
	});

	it("includes optional fields only when provided", () => {
		const xml = buildSitemapXml({
			origin: "https://example.com",
			entries: [{ path: "/", lastmod: "2026-08-20", changefreq: "weekly", priority: 1 }, { path: "/termeni" }],
		});
		expect(xml).toContain("<lastmod>2026-08-20</lastmod>");
		expect(xml).toContain("<changefreq>weekly</changefreq>");
		expect(xml).toContain("<priority>1.0</priority>");
		// second entry has none of the optional tags
		const secondUrlBlock = xml.split("<url>")[2];
		expect(secondUrlBlock).not.toContain("<lastmod>");
		expect(secondUrlBlock).not.toContain("<changefreq>");
		expect(secondUrlBlock).not.toContain("<priority>");
	});

	it("escapes XML special characters in the path", () => {
		const xml = buildSitemapXml({ origin: "https://example.com", entries: [{ path: "/a&b" }] });
		expect(xml).toContain("<loc>https://example.com/a&amp;b</loc>");
		expect(xml).not.toContain("/a&b<");
	});

	it("emits an empty urlset with no trailing junk when there are no entries", () => {
		const xml = buildSitemapXml({ origin: "https://example.com", entries: [] });
		expect(xml).toBe(
			'<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n\n</urlset>\n',
		);
	});

	it("ends with a single trailing newline and no content after </urlset>", () => {
		const xml = buildSitemapXml({ origin: "https://example.com", entries: [{ path: "/" }] });
		expect(xml.endsWith("</urlset>\n")).toBe(true);
		expect(xml.indexOf("</urlset>")).toBe(xml.lastIndexOf("</urlset>"));
	});
});

describe("robotsTxt", () => {
	it("blocks everything on the workers.dev deployment host", () => {
		const body = robotsTxt("https://catedra.geografie.workers.dev", "catedra.geografie.workers.dev");
		expect(body).toContain("Disallow: /\n");
		expect(body).not.toContain("Allow: /");
		// No sitemap advertised from a host we don't want crawled in the first place.
		expect(body).not.toContain("Sitemap:");
	});

	it("blocks localhost so a dev tunnel can't get indexed", () => {
		expect(robotsTxt("http://localhost:5173", "localhost")).toContain("Disallow: /\n");
	});

	it("serves the real policy on a custom domain, with the gated areas disallowed", () => {
		const body = robotsTxt("https://example.com", "example.com");
		expect(body).toContain("Allow: /");
		for (const gated of ["/admin", "/profesor", "/clasa", "/intra", "/exerseaza"]) {
			expect(body).toContain(`Disallow: ${gated}`);
		}
		expect(body).toContain("Sitemap: https://example.com/sitemap.xml");
	});

	// Linia asta a EXISTAT și a fost scoasă deliberat (2026-09-08) — vezi comentariul lung din
	// `robotsTxt` și `indexable` din lib/headers.ts. Testul o ține scoasă, fiindcă e exact felul
	// de linie care se pune la loc „ca să fim siguri": ar părea o întărire a apărării, dar ar
	// anula tăcut politica per-obiect, oprind crawlerul înainte să apuce să citească antetul.
	// Podeaua de acces nu depinde de ea: `routes/media.tsx` verifică vizibilitatea la fiecare
	// cerere și întoarce 403 pentru ce n-ai voie să vezi.
	it("NU mai interzice /media — indexarea binarelor se decide per obiect, în antet", () => {
		const body = robotsTxt("https://example.com", "example.com");
		expect(body).not.toContain("Disallow: /media");
	});

	// Gazda necanonică rămâne închisă cu totul: acolo `Disallow: /` acoperă și `/media`, iar
	// asta trebuie să rămână adevărat — o copie a sitului pe *.workers.dev n-are voie să-și
	// indexeze nici paginile, nici imaginile.
	it("blochează totuși /media pe o gazdă necanonică, prin `Disallow: /`", () => {
		const body = robotsTxt("https://x.workers.dev", "x.workers.dev");
		expect(body).toContain("Disallow: /\n");
		expect(body).not.toContain("Allow: /");
	});

	it("treats www of a real domain as canonical", () => {
		expect(robotsTxt("https://www.example.com", "www.example.com")).toContain("Allow: /");
	});

	it("blochează pe nume crawlerele care antrenează modele AI", () => {
		const body = robotsTxt("https://example.com", "example.com");
		for (const bot of AI_CRAWLERS) {
			expect(body).toContain(`User-agent: ${bot}
Disallow: /`);
		}
		expect(body).toContain("Content-Signal: search=yes,ai-train=no,use=reference");
	});

	// Regula care contează cel mai mult: identitățile de CĂUTARE trebuie să rămână libere.
	// `Google-Extended` e cea de antrenament, `Googlebot` e cea care indexează — dacă vreodată
	// cineva le confundă, situl dispare din Google fără niciun alt semn.
	it("nu blochează niciodată crawlerele de căutare", () => {
		for (const searchBot of ["Googlebot", "Applebot", "Bingbot", "DuckDuckBot"]) {
			expect(AI_CRAWLERS as readonly string[]).not.toContain(searchBot);
		}
		const body = robotsTxt("https://example.com", "example.com");
		expect(body).not.toContain("User-agent: Googlebot");
		expect(body).not.toContain("User-agent: Applebot" + String.fromCharCode(10));
	});

	// Un singur grup `User-agent: *`. Cât timp robots.txt era gestionat și de Cloudflare, erau
	// două, iar politica trăia în două locuri deodată — mergea, dar se putea schimba din panou
	// fără deploy și fără să știe nimeni.
	it("are un singur grup User-agent: *", () => {
		const body = robotsTxt("https://example.com", "example.com");
		expect(body.match(/^User-agent: \*$/gm)?.length).toBe(1);
	});

	it("nu pomenește crawlerele AI pe gazda temporară — acolo e blocat tot, oricum", () => {
		const body = robotsTxt("https://catedra.geografie.workers.dev", "catedra.geografie.workers.dev");
		expect(body).not.toContain("GPTBot");
		expect(body).not.toContain("Content-Signal");
	});
});

describe("sitemap pe instanța liberă", () => {
	it("listează adresele publice, nu pe cele cu clase", () => {
		const xml = buildSitemapXml({
			origin: "https://exemplu.ro",
			entries: [
				{ path: "/", changefreq: "weekly", priority: 1 },
				{ path: "/elevi", changefreq: "weekly", priority: 0.9 },
				{ path: "/pedagogie", changefreq: "weekly", priority: 0.9 },
			],
		});
		expect(xml).toContain("<loc>https://exemplu.ro/elevi</loc>");
		expect(xml).toContain("<loc>https://exemplu.ro/pedagogie</loc>");
		expect(xml).not.toContain("/clasa/");
		expect(xml).not.toContain("/demo");
	});
});

// Testul de mai sus verifică doar `buildSitemapXml` (deja testat exhaustiv mai sus) cu niște
// intrări scrise de mână — nu atinge deloc `buildLiberSitemapEntries`, care e partea nouă din
// task-ul ăsta (ordinea intrărilor, formele de URL, ce lipsește). Testele de mai jos exersează
// direct funcția pură, cu materiale și rafturi „fetch-uite" fictiv — exact ce ar chema ruta
// după interogările D1.
describe("buildLiberSitemapEntries", () => {
	const emptyFixture = {
		studentMaterials: [],
		practiceGrades: [],
		conceptMaps: [],
		teacherCollections: [],
		teacherMaterials: [],
	};

	const fixture = {
		studentMaterials: [
			{ gradeId: "9", slug: "relief" },
			{ gradeId: "9", slug: "clima" },
		],
		practiceGrades: [{ gradeId: "9" }],
		conceptMaps: [
			{ gradeId: "9", topicSlug: "hidrosfera" },
			{ gradeId: "9", topicSlug: "climatele-terrei" },
		],
		teacherCollections: [{ slug: "scheme-de-lectie" }, { slug: "ghid-metodologic" }],
		teacherMaterials: [{ gradeId: "9", slug: "introducere" }],
	};

	it("respectă ordinea: /, /elevi, /jocuri, materiale elevi, exersează pe clasă, hărți conceptuale, /pedagogie, rafturi, materiale profesor, /despre, pagini statice, pagini legale", () => {
		const entries = buildLiberSitemapEntries(fixture);
		expect(entries.map((e) => e.path)).toEqual([
			"/",
			"/elevi",
			"/jocuri",
			"/elevi/9/m/relief",
			"/elevi/9/m/clima",
			"/elevi/9/exerseaza",
			"/elevi/9/harta/hidrosfera",
			"/elevi/9/harta/climatele-terrei",
			"/pedagogie",
			"/pedagogie/scheme-de-lectie",
			"/pedagogie/ghid-metodologic",
			"/pedagogie/m/9/introducere",
			LIBER_ABOUT_PATH,
			...LIBER_STATIC_PATHS,
			...LEGAL_PATHS,
		]);
	});

	it("construiește formele corecte de URL pentru materiale, exersează, hărți și rafturi", () => {
		const entries = buildLiberSitemapEntries(fixture);
		const bySlug = Object.fromEntries(entries.map((e) => [e.path, e]));

		expect(bySlug["/elevi/9/m/relief"]).toBeDefined();
		expect(bySlug["/elevi/9/exerseaza"]).toBeDefined();
		expect(bySlug["/elevi/9/harta/hidrosfera"]).toBeDefined();
		expect(bySlug["/pedagogie/scheme-de-lectie"]).toBeDefined();
		expect(bySlug["/pedagogie/m/9/introducere"]).toBeDefined();
	});

	it("include cele trei pagini legale, indiferent de câte materiale există", () => {
		const entries = buildLiberSitemapEntries(emptyFixture);
		const paths = entries.map((e) => e.path);
		for (const legal of LEGAL_PATHS) expect(paths).toContain(legal);
	});

	it("include /pareri și /intrebari-frecvente, indiferent de câte materiale există", () => {
		const entries = buildLiberSitemapEntries(emptyFixture);
		const paths = entries.map((e) => e.path);
		expect(paths).toContain("/pareri");
		expect(paths).toContain("/intrebari-frecvente");
	});

	// „Despre autoare" e legată din subsolul fiecărei pagini; dacă lipsește din sitemap,
	// singura pagină de încredere a sitului se indexează târziu sau deloc.
	it("include /despre, indiferent de câte materiale există", () => {
		const entries = buildLiberSitemapEntries(emptyFixture);
		expect(entries.map((e) => e.path)).toContain("/despre");
	});

	// Prioritatea ei NU e cea a paginilor statice de subsol (0.4): vezi comentariul de la
	// `LIBER_ABOUT_PATH`. Testul e aici tocmai ca cineva care adaugă mâine încă o pagină
	// statică să n-o topească înapoi în tierul greșit.
	it("dă lui /despre o prioritate proprie, peste paginile statice și peste cele legale", () => {
		const entries = buildLiberSitemapEntries(emptyFixture);
		const byPath = Object.fromEntries(entries.map((e) => [e.path, e]));

		expect(byPath["/despre"]).toMatchObject({ changefreq: "monthly", priority: 0.6 });
		expect(byPath["/intrebari-frecvente"]).toMatchObject({ priority: 0.4 });
		expect(byPath["/termeni"]).toMatchObject({ priority: 0.5 });
		expect(LIBER_STATIC_PATHS).not.toContain("/despre");
	});

	it("nu emite /exerseaza pentru o clasă fără întrebări publicate", () => {
		const entries = buildLiberSitemapEntries(emptyFixture);
		const paths = entries.map((e) => e.path);
		expect(paths.some((p) => p.includes("/exerseaza"))).toBe(false);
	});

	it("nu emite o hartă conceptuală care nu a fost confirmată de apelant", () => {
		const entries = buildLiberSitemapEntries(emptyFixture);
		const paths = entries.map((e) => e.path);
		expect(paths.some((p) => p.includes("/harta/"))).toBe(false);
	});

	it("nu conține nicio adresă de pe instanța cu clase sau din vitrina veche", () => {
		const entries = buildLiberSitemapEntries(fixture);
		const paths = entries.map((e) => e.path);
		for (const p of paths) {
			expect(p).not.toContain("/clasa");
			expect(p).not.toContain("/demo");
			expect(p).not.toContain("/admin");
			expect(p).not.toContain("/profesor");
		}
	});

	it("cu zero materiale, clase și hărți, rămâne doar scheletul fix: /, /elevi, /pedagogie, /despre, paginile statice, cele trei pagini legale", () => {
		const entries = buildLiberSitemapEntries(emptyFixture);
		expect(entries.map((e) => e.path)).toEqual([
			"/",
			"/elevi",
			"/jocuri",
			"/pedagogie",
			LIBER_ABOUT_PATH,
			...LIBER_STATIC_PATHS,
			...LEGAL_PATHS,
		]);
	});

	it("marchează materialele, exersează, hărțile și rafturile cu changefreq/priority coerente", () => {
		const entries = buildLiberSitemapEntries(fixture);
		const bySlug = Object.fromEntries(entries.map((e) => [e.path, e]));

		expect(bySlug["/elevi/9/m/relief"]).toMatchObject({ changefreq: "monthly", priority: 0.6 });
		expect(bySlug["/elevi/9/exerseaza"]).toMatchObject({ changefreq: "monthly", priority: 0.6 });
		expect(bySlug["/elevi/9/harta/hidrosfera"]).toMatchObject({ changefreq: "monthly", priority: 0.5 });
		expect(bySlug["/pedagogie/m/9/introducere"]).toMatchObject({ changefreq: "monthly", priority: 0.6 });
		expect(bySlug["/pedagogie/scheme-de-lectie"]).toMatchObject({ changefreq: "monthly", priority: 0.7 });
		expect(bySlug["/"]).toMatchObject({ changefreq: "weekly", priority: 1 });
		expect(bySlug["/confidentialitate"]).toMatchObject({ changefreq: "monthly", priority: 0.5 });
	});

	it("produce XML valid când e trecut prin buildSitemapXml", () => {
		const xml = buildSitemapXml({ origin: "https://exemplu.ro", entries: buildLiberSitemapEntries(fixture) });
		expect(xml).toContain("<loc>https://exemplu.ro/elevi/9/m/relief</loc>");
		expect(xml).toContain("<loc>https://exemplu.ro/elevi/9/exerseaza</loc>");
		expect(xml).toContain("<loc>https://exemplu.ro/elevi/9/harta/hidrosfera</loc>");
		expect(xml).toContain("<loc>https://exemplu.ro/pedagogie/scheme-de-lectie</loc>");
		expect(xml).toContain("<loc>https://exemplu.ro/pareri</loc>");
		expect(xml).toContain("<loc>https://exemplu.ro/intrebari-frecvente</loc>");
		expect(xml).toContain("<loc>https://exemplu.ro/despre</loc>");
		expect(xml).toContain("<loc>https://exemplu.ro/confidentialitate</loc>");
	});
});
