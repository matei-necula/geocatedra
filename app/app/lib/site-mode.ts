/**
 * Care dintre cele două instanțe rulează.
 *
 * `clase` — site-ul cu tokenuri de clasă, conturi de profesor și admin.
 * `liber` — site-ul public și gratuit: tot ce e publicat, pentru oricine, fără cont.
 *
 * Comutatorul e `CLOUDFLARE_ENV`, aceeași variabilă cu care pluginul Cloudflare alege
 * environmentul din wrangler.json la build. Deci numele Workerului, bindingurile și modul
 * vin dintr-o singură sursă și nu pot ajunge în dezacord.
 */
export type SiteMode = "clase" | "liber";

/**
 * Fail-safe deliberat: doar șirul exact `liber` deschide site-ul. Orice altceva —
 * variabilă lipsă, scrisă greșit, cu majusculă — cade pe `clase`, adică pe instanța
 * RESTRÂNSĂ. O greșeală de configurare nu are voie să publice pedagogia pe internet.
 */
export function parseSiteMode(raw: string | undefined): SiteMode {
	return raw === "liber" ? "liber" : "clase";
}

/** Injectată de vite.config.ts din CLOUDFLARE_ENV. Vezi `declare const` din vite-env.d.ts. */
declare const __SITE_MODE__: string;

/**
 * Modul stabilit la BUILD. Se folosește doar acolo unde nu există o cerere din care să se
 * citească `env.SITE_MODE`: tabela de rute (evaluată la configurare) și alegerea temei în
 * root.tsx. În loadere și în logica de server se citește `env.SITE_MODE`, ca funcțiile să
 * rămână testabile cu un env fals.
 */
export const BUILD_SITE_MODE: SiteMode = parseSiteMode(
	typeof __SITE_MODE__ === "string" ? __SITE_MODE__ : undefined,
);
