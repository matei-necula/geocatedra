import { type RouteConfig, index, route } from "@react-router/dev/routes";
import { parseSiteMode } from "./lib/site-mode";

/**
 * Comutatorul e la CONSTRUCȚIE, nu la execuție.
 *
 * Pe instanța liberă rutele de admin/profesor/tokenuri nu sunt „blocate" — nu ajung în
 * bundle. O rută care nu există nu poate fi atinsă de niciun bug de autorizare, de niciun
 * cookie scurs și de nicio greșeală viitoare. E mai tare decât orice verificare la execuție.
 *
 * Fișierul ăsta e evaluat de @react-router/dev la configurare, în Node, unde `define` din
 * vite.config.ts nu se aplică — deci citim direct din mediu, aceeași variabilă pe care o
 * folosește și pluginul Cloudflare ca să aleagă environmentul din wrangler.json. `parseSiteMode`
 * e sigur aici: e o funcție pură care doar compară șirul cu "liber", fără nicio legătură cu
 * `__SITE_MODE__` (definit de Vite doar la build-ul clientului/serverului, nu la configurare).
 */
const mode = parseSiteMode(process.env.CLOUDFLARE_ENV);

/**
 * Doar pentru `react-router typegen`, NICIODATĂ pentru `react-router build`.
 *
 * `tsc -b` verifică fiecare fișier din `app/`, inclusiv rutele instanței care NU e activă acum
 * — dar `typegen` generează `+types` doar pentru rutele din tabela aleasă. Fără asta, cele șapte
 * cioturi `liber.*` pică la typecheck în modul `clase` (și simetric, rutele admin/profesor ar
 * pica în modul `liber`). Soluția: la `typegen`, cerem reuniunea ambelor tabele — seturile de căi
 * `claseOnly` și `liberOnly` sunt disjuncte, deci reuniunea e o `RouteConfig` validă, fără căi
 * duplicate. Scriptul `typecheck` din package.json e SINGURUL loc care setează
 * `ROUTES_TYPEGEN_ALL`. Dacă variabila asta ar ajunge vreodată setată la un `build` adevărat,
 * rutele de admin s-ar întoarce în bundle-ul liber — exact ce task-ul ăsta există să prevină.
 */
const typegenAll = process.env.ROUTES_TYPEGEN_ALL === "1";

/** Rute prezente pe amândouă instanțele. */
const comune = [
	index("routes/home.tsx"),
	route("media/:id", "routes/media.tsx"),
	route("robots.txt", "routes/robots[.]txt.tsx"),
	route("sitemap.xml", "routes/sitemap[.]xml.tsx"),
	route("confidentialitate", "routes/confidentialitate.tsx"),
	route("termeni", "routes/termeni.tsx"),
	route("cookie-uri", "routes/cookie-uri.tsx"),
];

/** Doar pe instanța cu clase, tokenuri, conturi de profesor, admin. Neschimbată. */
const claseOnly = [
	route("intra", "routes/student.intra.tsx"),
	route("clasa/:gradeId", "routes/clasa.tsx"),
	route("clasa/:gradeId/m/:slug", "routes/material.tsx"),
	route("clasa/:gradeId/harta/:topicSlug", "routes/clasa.harta.tsx"),
	route("clasa/:gradeId/exerseaza", "routes/exerseaza.tsx"),
	route("demo", "routes/demo.tsx"),
	route("demo/exerseaza", "routes/demo.exerseaza.tsx"),
	route("demo/m/:gradeId/:slug", "routes/demo.m.$gradeId.$slug.tsx"),
	route("info/:role", "routes/soon.tsx"),
	route("admin/login", "routes/admin.login.tsx"),
	route("admin", "routes/admin.tsx"),
	route("admin/materiale", "routes/admin.materiale.tsx"),
	route("admin/materiale/nou", "routes/admin.materiale.nou.tsx"),
	route("admin/materiale/:id", "routes/admin.materiale.$id.tsx"),
	route("admin/intrebari", "routes/admin.intrebari.tsx"),
	route("admin/intrebari/nou", "routes/admin.intrebari.nou.tsx"),
	route("admin/intrebari/:id", "routes/admin.intrebari.$id.tsx"),
	route("admin/rezultate", "routes/admin.rezultate.tsx"),
	route("admin/anunturi", "routes/admin.anunturi.tsx"),
	route("admin/teme", "routes/admin.teme.tsx"),
	route("admin/statistici", "routes/admin.statistici.tsx"),
	route("admin/profesori", "routes/admin.profesori.tsx"),
	// Moderarea părerilor scrise pe site-ul liber. Baza e comună, deci aprobarea se vede acolo
	// imediat; ruta, în schimb, nu ajunge fizic în bundle-ul liber — ca toate rutele de admin.
	route("admin/pareri", "routes/admin.pareri.tsx"),
	route("profesor", "routes/profesor.tsx"),
	route("profesor/login", "routes/profesor.login.tsx"),
	route("profesor/inregistrare", "routes/profesor.inregistrare.tsx"),
	route("profesor/verifica", "routes/profesor.verifica.tsx"),
	route("profesor/clase", "routes/profesor.clase.tsx"),
	route("profesor/pedagogie", "routes/profesor.pedagogie.tsx"),
	route("profesor/pedagogie/:collection", "routes/profesor.pedagogie.$collection.tsx"),
	route("profesor/materiale", "routes/profesor.materiale.tsx"),
	route("profesor/m/:gradeId/:slug", "routes/profesor.m.$gradeId.$slug.tsx"),
	route("profesor/tokenuri", "routes/profesor.tokenuri.tsx"),
	route("profesor/rezultate", "routes/profesor.rezultate.tsx"),
	route("profesor/anunturi", "routes/profesor.anunturi.tsx"),
	route("profesor/teme", "routes/profesor.teme.tsx"),
	route("profesor/statistici", "routes/profesor.statistici.tsx"),
	route("profesor/exerseaza", "routes/profesor.exerseaza.tsx"),
	route("iesire", "routes/logout.tsx"),
];

/** Doar pe instanța liberă: două biblioteci, gratis, fără cont. Atât. */
const liberOnly = [
	route("elevi", "routes/liber.elevi.tsx"),
	// Pagina care adună jocurile la un loc. Top-level, nu sub /elevi: e o pagină de intrare
	// dinspre căutare, iar adresa scurtă e chiar termenul căutat.
	route("jocuri", "routes/liber.jocuri.tsx"),
	route("elevi/:gradeId/m/:slug", "routes/liber.material.tsx"),
	route("elevi/:gradeId/harta/:topicSlug", "routes/liber.harta.tsx"),
	route("elevi/:gradeId/exerseaza", "routes/liber.exerseaza.tsx"),
	route("pedagogie", "routes/liber.pedagogie.tsx"),
	route("pedagogie/:collection", "routes/liber.pedagogie.$collection.tsx"),
	route("pedagogie/m/:gradeId/:slug", "routes/liber.pedagogie.m.$gradeId.$slug.tsx"),
	route("pareri", "routes/liber.pareri.tsx"),
	// Doar pe instanța liberă (decizia autoarei) — nu există echivalent pe cea cu clase.
	route("intrebari-frecvente", "routes/liber.intrebari-frecvente.tsx"),
	// „Despre autoare" — pagina de încredere (E-E-A-T) cerută de docs/09-seo-strategy.md.
	// Tot ce publică ea (nume, biografie, repere) e public prin definiție, deci n-are ce
	// căuta pe instanța cu clase, care e închisă și nu se indexează oricum.
	route("despre", "routes/liber.despre.tsx"),
];

const routes = typegenAll
	? [...comune, ...claseOnly, ...liberOnly]
	: mode === "liber"
		? [...comune, ...liberOnly]
		: [...comune, ...claseOnly];

export default routes satisfies RouteConfig;
