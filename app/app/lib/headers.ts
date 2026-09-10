// Security response headers applied to EVERY response at the worker edge (see workers/app.ts).
// Defense-in-depth: clickjacking, MIME sniffing, referrer leakage, transport downgrade, and a
// Content-Security-Policy. 'unsafe-inline' is required for the theme <style> and no-flash <script>
// injected in root.tsx; the rest of the policy still meaningfully narrows the attack surface.
// Fonts are self-hosted (runbook 4.7) — no fonts.googleapis.com / fonts.gstatic.com exception
// needed. challenges.cloudflare.com is allowed for Turnstile on the auth forms (script + frame).

import { BUILD_SITE_MODE } from "./site-mode";

// Analitice: DOAR pe instanța liberă (Cloudflare Web Analytics, fără cookie-uri). Modul se
// stabilește la construcție, ca și tabela de rute, deci bundle-ul instanței cu clase nici nu
// conține gazdele astea — politica ei rămâne EXACT cât era. Motivul e cel obișnuit aici:
// elevii sunt minori, iar site-ul cu clase nu are de ce să lărgească nimic pentru o baliză pe
// care n-o încarcă niciodată.
//
// Două gazde diferite, și e ușor de greșit: scriptul vine de pe `static.cloudflareinsights.com`,
// dar raportează prin `fetch` către `cloudflareinsights.com`. Lipsa celei de-a doua se vede ca
// o baliză care se încarcă și nu numără nimic.
const ANALYTICS_SCRIPT_SRC = BUILD_SITE_MODE === "liber" ? " https://static.cloudflareinsights.com" : "";
const ANALYTICS_CONNECT_SRC = BUILD_SITE_MODE === "liber" ? " https://cloudflareinsights.com" : "";

const CSP = [
	"default-src 'self'",
	`script-src 'self' 'unsafe-inline' https://challenges.cloudflare.com${ANALYTICS_SCRIPT_SRC}`,
	"style-src 'self' 'unsafe-inline'",
	"font-src 'self'",
	"img-src 'self' data: blob:",
	"media-src 'self' blob:",
	`connect-src 'self'${ANALYTICS_CONNECT_SRC}`,
	// 'self' (not 'none'): our own pages embed PDFs from /media via an <iframe>.
	// challenges.cloudflare.com: Turnstile widget iframe on the auth forms.
	"frame-src 'self' https://challenges.cloudflare.com",
	"frame-ancestors 'self'",
	"object-src 'none'",
	"base-uri 'self'",
	"form-action 'self'",
].join("; ");

/** Re-wrap a response with security headers (fresh, mutable Headers; preserves the body stream). */
export function withSecurityHeaders(request: Request, response: Response): Response {
	const headers = new Headers(response.headers);

	headers.set("Content-Security-Policy", CSP);
	headers.set("X-Content-Type-Options", "nosniff");
	headers.set("X-Frame-Options", "SAMEORIGIN");
	headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
	headers.set("Permissions-Policy", "camera=(), microphone=(), geolocation=(), browsing-topics=()");
	headers.set("Cross-Origin-Opener-Policy", "same-origin");
	// Anti-hotlink: `frame-ancestors 'self'` oprește doar <iframe>, NU și <img src="…/media/…">.
	// CORP e exact bucata care lipsea — un alt site nu mai poate afișa imaginile doamnei
	// profesoare direct de pe serverul nostru. Crawlerele de social media (og:image) preiau
	// fișierul server-side, unde CORP nu se aplică, deci previzualizările rămân intacte.
	headers.set("Cross-Origin-Resource-Policy", "same-origin");

	// HSTS only over HTTPS (browsers ignore it on http, but no point sending it on localhost).
	if (new URL(request.url).protocol === "https:") {
		headers.set("Strict-Transport-Security", "max-age=31536000; includeSubDomains");
	}

	return new Response(response.body, {
		status: response.status,
		statusText: response.statusText,
		headers,
	});
}

// ---------------------------------------------------------------------------
// Antetele binarelor din R2 (routes/media.tsx). Pure, ca să fie testabile.
// ---------------------------------------------------------------------------

/**
 * Tipurile pe care le randăm în pagină. Restul — și SVG în particular, care poate purta
 * script — pleacă drept `attachment`, ca să nu se execute în originea noastră. Asta e o
 * măsură de securitate, NU una anti-copiere: fișierul rămâne oricum al celui care are acces.
 */
export function isInlineMime(mime: string): boolean {
	if (mime === "image/svg+xml") return false;
	return mime.startsWith("image/") || mime.startsWith("video/") || mime === "application/pdf";
}

export interface MediaHeaderOptions {
	mime: string;
	/**
	 * Mărimea, când o știm. Lipsește pentru miniaturile generate: acolo octeții din baza de
	 * date descriu ORIGINALUL, iar un `Content-Length` greșit e mai rău decât niciunul —
	 * browserul ar tăia răspunsul sau l-ar considera stricat.
	 */
	bytes?: number;
	/** Accesul a fost acordat rolului public de vitrină → conținutul e deja public pe internet. */
	publicDemo: boolean;
	/**
	 * Are voie obiectul ăsta să apară în Google Images?
	 *
	 * ═══ De ce nu mai e „nu" pentru tot ═══
	 *
	 * Până acum răspunsul era NU, pentru absolut orice binar, întărit și de un
	 * `Disallow: /media` în robots.txt. Raționamentul era corect în intenție — cea mai comodă
	 * sursă de plagiat chiar e căutarea de imagini — dar proteja nediferențiat, iar costul îl
	 * plăteau imagini care n-aveau ce apăra:
	 *
	 *  - **Biblioteca elevilor** e, în bună parte, fotografii din domeniul public sau CC0, pe
	 *    care autoarea nu le-a făcut (`content/site/SOURCES.md`, `content/games/SOURCES.md`).
	 *    Aceleași fișiere stau deja pe Wikimedia și ies acolo în căutare. Blocarea lor nu apăra
	 *    nimic. Restul sunt hărțile, climogramele și hidrografele DESENATE de noi
	 *    (`scripts/draw-*.mjs`) — exact felul de imagine originală după care caută un profesor,
	 *    și singurul lucru la care situl bate din start competiția (docs/09-seo-strategy.md).
	 *  - **Biblioteca profesorului** e altceva: planșele vin din `.pptx`-urile autoarei, sunt
	 *    munca ei proprie și n-au niciun echivalent public. Acolo răspunsul rămâne NU.
	 *
	 * Antetul e instrumentul potrivit pentru distincția asta, iar robots.txt nu era: robots.txt
	 * vorbește despre CĂI, iar `/media/:id` e un spațiu plat de identificatori în care nu se
	 * vede din adresă din ce bibliotecă face parte obiectul. Antetul se calculează pe rând, cu
	 * materialul în mână.
	 *
	 * **De aceea `Disallow: /media` a și fost scos din robots.txt** (vezi `robotsTxt` în
	 * lib/sitemap.ts): o adresă interzisă acolo nu e cerută NICIODATĂ, deci antetul ei nu e
	 * citit niciodată. Cele două nu se pot folosi împreună — interdicția ar fi anulat exact
	 * distincția pe care o face funcția asta.
	 *
	 * Nu e o slăbire a podelei de acces: `routes/media.tsx` verifică în continuare vizibilitatea
	 * ÎNAINTE de a ajunge aici, iar un obiect la care n-ai drept întoarce 403 indiferent de antet.
	 * Antetul spune doar dacă un crawler care AVEA oricum voie să vadă fișierul poate să-l și
	 * indexeze.
	 */
	indexable: boolean;
}

/**
 * Antetele pentru un obiect servit din R2.
 *
 * Ce fac, sincer:
 * - `Content-Disposition: inline` — nu oferim NICIODATĂ un „Save as" din partea serverului
 *   pentru imagini/PDF. Nu împiedică „salvează imaginea" din browser.
 * - `X-Robots-Tag` — pus DOAR pe ce nu vrem în Google Images (vezi `indexable` mai sus).
 *   Absența antetului e ea însăși politica: fără directivă, motorul indexează normal. Nu se
 *   pune „index" explicit, fiindcă n-ar spune nimic în plus și ar sugera că e nevoie de el.
 * - `Cross-Origin-Resource-Policy: same-origin` — alt site nu mai poate afișa fișierul cu
 *   `<img src>` de pe serverul nostru (hotlink). `frame-ancestors` acoperea doar `<iframe>`.
 * - `Cache-Control` — vezi mai jos; e un compromis deliberat cu traficul mobil.
 * - `Vary: Cookie` — pentru că politica de cache depinde de cine cere.
 *
 * NU punem `Referrer-Policy` aici: pe un răspuns care nu e document, antetul e inert.
 * Referrer-ul e decis de pagina care cere fișierul, iar acolo e deja setat global.
 */
export function mediaHeaders({ mime, bytes, publicDemo, indexable }: MediaHeaderOptions): Record<string, string> {
	return {
		"Content-Type": mime,
		...(bytes === undefined ? {} : { "Content-Length": String(bytes) }),
		"Content-Disposition": isInlineMime(mime) ? "inline" : "attachment",
		"X-Content-Type-Options": "nosniff",
		...(indexable ? {} : { "X-Robots-Tag": "noindex, noimageindex, noarchive, nofollow" }),
		// Rămâne pus chiar și pe obiectele indexabile: `CORP` e verificat de BROWSERE, la
		// încorporarea din altă origine, deci oprește hotlinkul de pe alt sit. Un crawler cere
		// adresa direct, ca document, și nu-l atinge — iar Google Images își servește oricum
		// propria miniatură. Adică apărarea contra hotlinkului nu costă nimic din indexare.
		"Cross-Origin-Resource-Policy": "same-origin",
		// Vitrina: public, dar doar o oră. Materialul trecut pe „ciornă" trebuie să dispară de pe
		// internet în ordinul minutelor, nu al zilelor — 24h însemna o zi de servit din edge după
		// retragere. Restul: `private` (niciun cache comun, niciun CDN) + 5 minute, cât să nu
		// re-descarce un teanc de 170 de pagini WebP la fiecare întoarcere de pagină pe telefon.
		// `no-store` ar fi fost teatru scump: nu oprește nicio copiere, doar consumă datele elevilor.
		"Cache-Control": publicDemo ? "public, max-age=3600" : "private, max-age=300",
		Vary: "Cookie",
	};
}
