// Pure sitemap XML building — no DB, no request. The loader (routes/sitemap[.]xml.tsx)
// decides which URLs are genuinely public; this module only turns that list into valid XML.

export interface SitemapEntry {
	/** Path starting with "/", e.g. "/termeni". Joined onto origin without a double slash. */
	path: string;
	/** ISO date (YYYY-MM-DD) or full timestamp; omitted from the entry when absent. */
	lastmod?: string;
	changefreq?: "always" | "hourly" | "daily" | "weekly" | "monthly" | "yearly" | "never";
	/** 0.0–1.0 */
	priority?: number;
}

export interface BuildSitemapOptions {
	/** Request origin, e.g. "https://example.com" — no trailing slash expected, but tolerated. */
	origin: string;
	entries: SitemapEntry[];
}

/** Escapes the five XML predefined entities. Safe for text nodes and quoted attributes alike. */
export function escapeXml(value: string): string {
	return value
		.replace(/&/g, "&amp;")
		.replace(/</g, "&lt;")
		.replace(/>/g, "&gt;")
		.replace(/"/g, "&quot;")
		.replace(/'/g, "&apos;");
}

function joinUrl(origin: string, path: string): string {
	const base = origin.replace(/\/+$/, "");
	const p = path.startsWith("/") ? path : `/${path}`;
	return base + p;
}

/** Hosts that must never be indexed: the free *.workers.dev deployment target and localhost.
 *  Letting Google index catedra.geografie.workers.dev would leave a stale, duplicate copy of the
 *  site in the index the day a real domain goes live (runbook Part 1/Part 5) — and de-indexing a
 *  host you don't control the DNS of is slow. A custom domain gets the real policy automatically. */
export function isNonCanonicalHost(hostname: string): boolean {
	return (
		hostname.endsWith(".workers.dev") ||
		hostname === "localhost" ||
		hostname === "127.0.0.1" ||
		hostname.endsWith(".local")
	);
}

/** Crawlers that take content to train or ground AI models, blocked by name.
 *
 *  This list is deliberately identical to what Cloudflare's "managed robots.txt" feature was
 *  injecting on geocatedra.com (07.09.2026), so turning that feature OFF changed nothing a
 *  crawler can see. It lives here now for the same reason every other user-facing string does:
 *  one source of truth, in the repo, covered by a test. The dashboard version was a second
 *  place the policy could change — silently, without a deploy, and without review.
 *
 *  **The search crawlers are NOT in this list, on purpose.** `Google-Extended` and
 *  `Applebot-Extended` are the AI-training identities; plain `Googlebot` and `Applebot` still
 *  match the `User-agent: *` group above and index the site normally. Blocking the wrong one of
 *  each pair would quietly remove the site from search — the exact opposite of why we bought
 *  a domain.
 *
 *  robots.txt is a request, not a fence. It is obeyed by operators who choose to; it is not the
 *  access-control floor and must never be mistaken for one (see docs/04-anti-piracy.md). */
export const AI_CRAWLERS = [
	"Amazonbot",
	"Applebot-Extended",
	"Bytespider",
	"CCBot",
	"ClaudeBot",
	"CloudflareBrowserRenderingCrawler",
	"Google-Extended",
	"GPTBot",
	"meta-externalagent",
] as const;

/** robots.txt body. Gated areas are always disallowed; on a non-canonical host everything is. */
export function robotsTxt(origin: string, hostname: string): string {
	if (isNonCanonicalHost(hostname)) {
		return `# Găzduire temporară (${hostname}) — nu este adresa publică a site-ului.
# Indexarea e blocată ca să nu rămână o copie veche în Google după mutarea pe domeniul propriu.
User-agent: *
Disallow: /
`;
	}

	// ═══ De ce `/media` NU mai e interzis aici (2026-09-08) ═══
	//
	// Era, până acum, alături de zonele închise. Dar `/media/:id` nu e o zonă închisă: podeaua
	// de acces stă în `routes/media.tsx`, care verifică vizibilitatea la fiecare cerere și
	// întoarce 403 pentru ce n-ai voie să vezi. Interdicția de aici nu apăra nimic din ce nu
	// era deja apărat — ținea doar imaginile în afara Google Images.
	//
	// Iar asta le ținea pe TOATE afară, nediferențiat: și planșele de pedagogie ale autoarei
	// (care chiar au ce apăra), și fotografiile din domeniul public din biblioteca elevilor
	// (care n-au — aceleași fișiere ies oricum în căutare, de pe Wikimedia), și hărțile,
	// climogramele și hidrografele desenate de noi, care sunt tocmai lucrul original după care
	// caută un profesor.
	//
	// Distincția se face acum pe rând, în `mediaHeaders` (lib/headers.ts), care are materialul
	// în mână și știe din ce bibliotecă vine. robots.txt nu putea s-o facă: el vorbește despre
	// CĂI, iar `/media/:id` e un spațiu plat de identificatori — din adresă nu se vede nimic.
	//
	// **Cele două nu pot fi folosite împreună.** O adresă interzisă în robots.txt nu e cerută
	// niciodată, deci antetul ei nu e citit niciodată; păstrarea liniei ar fi anulat tăcut exact
	// distincția de mai sus. Scoaterea ei nu deschide nimic: un crawler care cere un binar de
	// profesor îl primește cu `X-Robots-Tag: noindex`, iar unul la care n-are drept ia 403.
	//
	// `Content-Signal` states the same policy in machine-readable form for operators who read it:
	// yes to search, no to AI training, reference-only use. In the EU it doubles as an express
	// reservation of rights under Article 4 of Directive 2019/790 — the opt-out that text-and-data
	// mining exceptions require to be declared, rather than assumed.
	const aiGroups = AI_CRAWLERS.map((bot) => `User-agent: ${bot}\nDisallow: /\n`).join("\n");

	return `User-agent: *
Content-Signal: search=yes,ai-train=no,use=reference
Allow: /
Disallow: /admin
Disallow: /profesor
Disallow: /clasa
Disallow: /intra
Disallow: /exerseaza

${aiGroups}
Sitemap: ${origin}/sitemap.xml
`;
}

/** The bit of a material the sitemap needs — not the full `MaterialView` from lib/content.ts,
 *  so this stays a pure function with no dependency on the DB layer or its types. */
export interface SitemapMaterialRef {
	gradeId: string;
	slug: string;
}

export interface SitemapCollectionRef {
	slug: string;
}

/** A grade whose "Exersează" bank has at least one published question — caller already filtered
 *  with `countPublished(db, gradeId, null) > 0` (see lib/questions.ts), so a grade that would
 *  only show the "practice.empty" message never gets indexed. */
export interface SitemapPracticeGradeRef {
	gradeId: string;
}

/** A (grade, topic) pair that genuinely resolves to a concept map — caller already checked
 *  `subjectConfig.mindmaps[gradeId:topicSlug]` exists (see routes/liber.harta.tsx's loader,
 *  which 404s otherwise). Emitting one that doesn't resolve is worse than omitting it. */
export interface SitemapConceptMapRef {
	gradeId: string;
	topicSlug: string;
}

export interface BuildLiberEntriesInput {
	/** Published student materials, any grade — already fetched by the caller. */
	studentMaterials: SitemapMaterialRef[];
	/** Grades with at least one published question (Exersează), already filtered by the caller. */
	practiceGrades: SitemapPracticeGradeRef[];
	/** (grade, topic) pairs with a real concept map, already filtered by the caller. */
	conceptMaps: SitemapConceptMapRef[];
	/** The pedagogy shelves (subjectConfig.teacherCollections), in display order. */
	teacherCollections: SitemapCollectionRef[];
	/** Published teacher materials, any shelf — already fetched by the caller. */
	teacherMaterials: SitemapMaterialRef[];
}

/** The three legal pages, common to both instances (see app/routes.ts). */
export const LEGAL_PATHS = ["/confidentialitate", "/termeni", "/cookie-uri"];

/** Static, liber-only pages that don't come from a DB list or a config array — just single
 *  routes that existed but were never added here (see routes.ts `liberOnly`). */
export const LIBER_STATIC_PATHS = ["/pareri", "/intrebari-frecvente"];

/** „Despre autoare" (/despre) — intrare proprie, NU în tierul de 0.4 de mai sus.
 *
 *  Nu e o pagină de subsol ca oricare: e pagina care spune cine a scris materialele, e legată
 *  din subsolul FIECĂREI pagini și leagă mai departe ambele biblioteci și toate rafturile
 *  (docs/09-seo-strategy.md, punctul 10 — cel mai puternic semnal de încredere al unui sit
 *  făcut de un singur om). Prioritatea e un semnal relativ ÎN INTERIORUL sitemapului propriu:
 *  a o pune la 0.4, sub cele trei pagini legale (0.5), ar spune exact pe dos despre importanța
 *  ei. 0.6 o așază la același nivel cu un material — sub paginile-hub (0.8–1.0), peste
 *  formularul de păreri și peste textele legale. */
export const LIBER_ABOUT_PATH = "/despre";

/**
 * Pure entry-list builder for the `liber` instance's sitemap: no DB, no request — the route
 * (routes/sitemap[.]xml.tsx) does the D1 queries and hands the plain results in here. Order:
 * `/`, `/elevi`, student materials, exersează per grade, hărți conceptuale, `/pedagogie`,
 * shelves, teacher materials, `/despre`, the standalone static pages, then the three legal pages.
 */
export function buildLiberSitemapEntries({
	studentMaterials,
	practiceGrades,
	conceptMaps,
	teacherCollections,
	teacherMaterials,
}: BuildLiberEntriesInput): SitemapEntry[] {
	return [
		{ path: "/", changefreq: "weekly", priority: 1 },
		{ path: "/elevi", changefreq: "weekly", priority: 0.9 },
		// Pagină de intrare dinspre căutare, nu o pagină statică de subsol — de aceea are
		// prioritate mare aici și NU stă în `LIBER_STATIC_PATHS` (0.4).
		{ path: "/jocuri", changefreq: "weekly", priority: 0.8 },
		...studentMaterials.map(
			(m): SitemapEntry => ({
				path: `/elevi/${m.gradeId}/m/${m.slug}`,
				changefreq: "monthly",
				priority: 0.6,
			}),
		),
		...practiceGrades.map(
			(g): SitemapEntry => ({
				path: `/elevi/${g.gradeId}/exerseaza`,
				changefreq: "monthly",
				priority: 0.6,
			}),
		),
		...conceptMaps.map(
			(m): SitemapEntry => ({
				path: `/elevi/${m.gradeId}/harta/${m.topicSlug}`,
				changefreq: "monthly",
				priority: 0.5,
			}),
		),
		{ path: "/pedagogie", changefreq: "weekly", priority: 0.9 },
		...teacherCollections.map(
			(c): SitemapEntry => ({
				path: `/pedagogie/${c.slug}`,
				changefreq: "monthly",
				priority: 0.7,
			}),
		),
		...teacherMaterials.map(
			(m): SitemapEntry => ({
				path: `/pedagogie/m/${m.gradeId}/${m.slug}`,
				changefreq: "monthly",
				priority: 0.6,
			}),
		),
		{ path: LIBER_ABOUT_PATH, changefreq: "monthly", priority: 0.6 },
		...LIBER_STATIC_PATHS.map((path): SitemapEntry => ({ path, changefreq: "monthly", priority: 0.4 })),
		...LEGAL_PATHS.map((path): SitemapEntry => ({ path, changefreq: "monthly", priority: 0.5 })),
	];
}

/** Builds a valid urlset sitemap.xml document from a flat list of entries. */
export function buildSitemapXml({ origin, entries }: BuildSitemapOptions): string {
	const urls = entries
		.map((e) => {
			const parts = [`    <loc>${escapeXml(joinUrl(origin, e.path))}</loc>`];
			if (e.lastmod) parts.push(`    <lastmod>${escapeXml(e.lastmod)}</lastmod>`);
			if (e.changefreq) parts.push(`    <changefreq>${escapeXml(e.changefreq)}</changefreq>`);
			if (e.priority != null) parts.push(`    <priority>${e.priority.toFixed(1)}</priority>`);
			return `  <url>\n${parts.join("\n")}\n  </url>`;
		})
		.join("\n");

	return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`;
}
