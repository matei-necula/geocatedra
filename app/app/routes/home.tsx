import { Link } from "react-router";
import type { Route } from "./+types/home";
import { subjectConfig, t } from "../config/subject";
import { Logo, SiteFooter } from "../components/site";
import { ThemeToggle } from "../components/ThemeToggle";
import { Kicker, Plate } from "../components/atlas";
import { seo } from "../lib/seo";
import { ldJson, organizationJsonLd, websiteJsonLd } from "../lib/jsonld";
import { getDb } from "../db/client";
import { loadDemoCards } from "../lib/demo-content";
import { listMaterialsForGrade } from "../lib/content";
import { thumbsForMaterials } from "../lib/assets";
import { BUILD_SITE_MODE } from "../lib/site-mode";
import { HomeLiber } from "../components/liber/HomeLiber";

// Aduce originea pentru meta() (canonical/og:url — vezi app/lib/seo.ts) și miniaturile
// eroului, care sunt imagini reale din vitrină, nu fișiere statice duplicate.
export async function loader({ request, context }: Route.LoaderArgs) {
	const db = getDb(context.cloudflare.env);
	// Miniaturile sunt decor (`aria-hidden`, pagina merge și cu `thumbs: []`) — un hop de bază
	// de date căzut aici n-are voie să dărâme ușa de intrare a site-ului cu eroarea generică.
	//
	// Instanța liberă arată mai multe (o fâșie derulabilă, nu trei pătrate) și le ia din TOATĂ
	// biblioteca de elevi, nu din lista scurtă a vitrinei: pe site-ul liber nu există vitrină,
	// totul e deja public, deci n-are de ce să se limiteze la cele cinci materiale alese
	// pentru `/demo`.
	let thumbs: string[] = [];
	try {
		if (BUILD_SITE_MODE === "liber") {
			const materials = await listMaterialsForGrade(db, subjectConfig.grades[0].id, subjectConfig.defaultLocale);
			const found = await thumbsForMaterials(db, materials.map((m) => m.id));
			thumbs = materials.map((m) => found.first[m.id]).filter((id): id is string => Boolean(id)).slice(0, 8);
		} else {
			const cards = await loadDemoCards(db, [...subjectConfig.demo.student, ...subjectConfig.demo.teacher]);
			thumbs = cards.map((c) => c.thumbId).filter((id): id is string => id !== null).slice(0, 3);
		}
	} catch {
		thumbs = [];
	}
	return { origin: new URL(request.url).origin, thumbs };
}

// Aceeași rută randează două site-uri diferite (vezi loader-ul de mai sus): descrierea trebuie
// să fie adevărată pentru instanța care se construiește chiar acum, nu o singură propoziție
// vagă care să mintă pe una dintre ele — de-asta e ramificată pe BUILD_SITE_MODE, nu comună.
const HOME_DESCRIPTION =
	BUILD_SITE_MODE === "liber"
		? "Geografie gratuită, fără cont, pentru elevi și profesori: lecții, jocuri interactive, " +
			"teste grilă, scheme de lecție și materiale didactice."
		: subjectConfig.tagline;

/**
 * Titlul paginii de start — pe instanța liberă, ce se caută; pe cea cu clase, ce era.
 *
 * Până acum pagina de start n-avea titlu propriu, deci cădea pe varianta implicită din
 * `lib/seo.ts`: `Geo-catedra — Geografia, toată într-un singur loc.` Sloganul e frumos, dar
 * nu conține niciunul dintre cuvintele pe care le tastează cineva în Google („lecții",
 * „jocuri", „teste", „geografie") — exact ce cere docs/09-seo-strategy.md să apară acolo.
 *
 * **Nu se ramifică degeaba pe instanță**: ruta asta e comună (routes.ts, `comune`), iar orice
 * formulare cu „gratuit" e adevărată numai pe site-ul liber. Pe cel cu clase se lasă exact
 * comportamentul de azi — e închis prin proiectare și nu se indexează oricum (robots.txt).
 *
 * **De ce `subjectConfig.strings[...]` și nu `t(...)`**: `t()` întoarce CHEIA când textul
 * lipsește, deci un `t("home.seo.liber")" înainte ca doamna să aibă cheia în config ar fi pus
 * literal „home.seo.liber — Geo-catedra" în titlul paginii de start, pe producție. Citit
 * direct din `strings`, un text absent e `undefined`, iar `seo()` cade curat pe titlul de azi.
 *
 * Cheia `home.seo.liber` există în `config/subject.ts` (adăugată odată cu acest titlu), deci
 * titlul randat azi e „Lecții, jocuri și teste de geografie, gratuit — Geo-catedra" — 58 de
 * caractere, sub pragul de tăiere din SERP. Citirea defensivă de mai jos rămâne oricum: e
 * plasa care ține pagina de start pe un titlu bun dacă cineva șterge vreodată cheia.
 *
 * Forma exactă din strategie — `Geo-catedra — lecții, jocuri și teste de geografie, gratuit`,
 * cu marca ÎNAINTE — nu se poate obține de aici: `seo()` compune întotdeauna
 * `${title} — ${siteName}`, deci ar ieși numele sitului de două ori. Ar cere o opțiune nouă în
 * `SeoOptions` (un `titleExact`, care sare peste sufix), iar `lib/seo.ts` nu e fișierul meu.
 * Vezi raportul. Ordinea de aici — cuvintele căutate întâi, marca la urmă — e oricum cea pe
 * care o preferă un rezultat tăiat la ~60 de caractere.
 */
const HOME_TITLE: string | undefined =
	BUILD_SITE_MODE === "liber" ? subjectConfig.strings["home.seo.liber"] : undefined;

export function meta({ data }: Route.MetaArgs) {
	return [
		...seo({
			title: HOME_TITLE,
			description: HOME_DESCRIPTION,
			path: "/",
			origin: data?.origin,
		}),
		// Cele două noduri erau scrise de mână aici, cu numele și descrierea sitului repetate în
		// fiecare. Acum vin din `lib/jsonld.ts`, adică din aceeași sursă ca marcajul de pe toate
		// celelalte pagini: organizația câștigă și `email`-ul de contact, și `founder` (autoarea,
		// legată la /despre), iar `WebSite` un `publisher` — legături pe care Google le folosește
		// ca să lege paginile între ele într-o singură entitate, nu în trei fără rudenie.
		//
		// Ruta e comună celor două instanțe, deci aici nu are ce intra decât marcaj adevărat pe
		// amândouă: cine publică situl și cum se numește. Nimic despre gratuitate, nimic despre
		// conținut — alea diferă între instanțe și stau pe paginile lor.
		...ldJson(organizationJsonLd(data?.origin), websiteJsonLd(data?.origin)),
	];
}

/**
 * Preîncărcarea fotografiei-erou (docs/09-seo-strategy.md, Core Web Vitals, punctul 3).
 *
 * Eroul E elementul LCP al paginii de start libere: ocupă tot ecranul de deasupra pliului.
 * Browserul află de el abia după ce parsează `<picture>`-ul din corpul paginii; preîncărcarea
 * pornește descărcarea din `<head>`, deci cu o rundă mai devreme.
 *
 * **Se preîncarcă o VARIANTĂ RESPONSIVĂ, nu fișierul mare.** Un `href="/img/erou-1920.avif"`
 * simplu ar fi descărcat 82 kB pe orice telefon și, mai rău, ar fi fost o A DOUA imagine pe
 * lângă cea aleasă de `<picture>` — adică fix pe dos decât scopul. De aceea `imageSrcSet` +
 * `imageSizes` reproduc EXACT `srcSet`-ul și `sizes`-ul primului `<source>` din
 * `components/liber/Photo.tsx` (AVIF, `100vw`) — aceleași trei candidate, aceeași regulă de
 * lățime, deci browserul potrivește preîncărcarea cu cererea reală și descarcă un singur fișier.
 * `type: "image/avif"` face restul: un browser fără AVIF ignoră preîncărcarea și cade, ca și
 * `<picture>`, pe `<source>`-ul WebP. Dacă `Photo.tsx` își schimbă vreodată lățimile sau
 * `sizes`, linia asta trebuie schimbată odată cu el, altfel se descarcă două imagini.
 *
 * Doar pe instanța liberă: pagina de start cu clase n-are fotografie-erou, iar o preîncărcare
 * pentru un fișier pe care pagina nu-l folosește e lățime de bandă aruncată la fiecare vizită.
 */
export const links: Route.LinksFunction = () =>
	BUILD_SITE_MODE === "liber"
		? [
				{
					rel: "preload",
					as: "image",
					type: "image/avif",
					imageSrcSet: [640, 1280, 1920].map((w) => `/img/erou-${w}.avif ${w}w`).join(", "),
					imageSizes: "100vw",
					fetchPriority: "high" as const,
				},
			]
		: [];

const doors = [
	{ key: "students", to: "/intra", titleKey: "role.students", descKey: "role.students.desc", ctaKey: "role.students.cta" },
	{ key: "teachers", to: "/profesor", titleKey: "role.teachers", descKey: "role.teachers.desc", ctaKey: "role.teachers.cta" },
];

// Line-art icons per door (24×24, currentColor stroke). Engine stays subject-agnostic.
const doorIcons: Record<string, React.ReactNode> = {
	students: (
		<>
			<rect x="4" y="8" width="16" height="12" rx="2.5" />
			<path d="M9 8V6a3 3 0 0 1 6 0v2" />
			<path d="M4 13h16" />
			<path d="M12 13v2.5" />
		</>
	),
	teachers: (
		<>
			<path d="M12 6c-1.8-1.4-4.2-2-7-2v14c2.8 0 5.2.6 7 2 1.8-1.4 4.2-2 7-2V4c-2.8 0-5.2.6-7 2Z" />
			<path d="M12 6v14" />
		</>
	),
};

function DoorIcon({ paths }: { paths: React.ReactNode }) {
	return (
		<svg
			viewBox="0 0 24 24"
			width="26"
			height="26"
			fill="none"
			stroke="currentColor"
			strokeWidth="1.8"
			strokeLinecap="round"
			strokeLinejoin="round"
			aria-hidden
		>
			{paths}
		</svg>
	);
}

export default function Home({ loaderData }: Route.ComponentProps) {
	if (BUILD_SITE_MODE === "liber") return <HomeLiber thumbs={loaderData.thumbs} />;
	return (
		<div className="relative isolate min-h-screen overflow-hidden">

			<div className="mx-auto max-w-5xl px-5 pt-10 pb-4">
				<nav className="flex items-center justify-between">
					<Link to="/" viewTransition className="flex items-center gap-3">
						<Logo />
						<span className="font-heading text-2xl font-bold">{subjectConfig.siteName}</span>
					</Link>
					<div className="flex items-center gap-3">
						<Link
							to="/intra"
							viewTransition
							className="rounded-lg border border-border px-3 py-1.5 text-sm font-medium transition hover:border-primary"
						>
							{t("home.cta.token")}
						</Link>
						<ThemeToggle />
						<span className="rounded-lg border border-border px-3 py-1.5 text-sm text-muted">RO</span>
					</div>
				</nav>
			</div>

			<main id="continut" tabIndex={-1} className="mx-auto max-w-5xl px-5">
				<Plate className="cat-rise mt-6 p-6 sm:p-10">
					<Kicker>{t("demo.kicker")}</Kicker>
					<h1 className="mt-2 max-w-2xl font-heading text-5xl leading-[1.05] font-bold tracking-tight sm:text-6xl">
						Geografia, toată <span className="text-primary">într-un singur loc</span>.
					</h1>
					<p className="mt-5 max-w-xl text-lg text-muted">{t("demo.lead")}</p>

					{loaderData.thumbs.length > 0 && (
						<div aria-hidden className="mt-8 grid grid-cols-3 gap-3">
							{loaderData.thumbs.map((id) => (
								<img
									key={id}
									src={`/media/${id}`}
									alt=""
									loading="lazy"
									className="h-28 w-full rounded-lg border border-border bg-bg object-cover sm:h-36"
								/>
							))}
						</div>
					)}

					<Link
						to="/demo"
						viewTransition
						className="mt-8 inline-block rounded-lg bg-accent px-7 py-3.5 text-lg font-semibold text-on-accent transition hover:bg-accent-strong"
					>
						{t("demo.title")}
					</Link>
				</Plate>

				<section className="stagger mt-8 grid gap-5 sm:grid-cols-2">
					{doors.map((d) => (
						<Link
							key={d.key}
							to={d.to}
							viewTransition
							className="group glow flex flex-col rounded-lg border border-border bg-surface p-6"
						>
							<div className="mb-4 text-primary">
								<DoorIcon paths={doorIcons[d.key]} />
							</div>
							<h3 className="text-xl font-semibold">{t(d.titleKey)}</h3>
							<p className="mt-2 mb-5 min-h-16 text-sm text-muted">{t(d.descKey)}</p>
							<span className="mt-auto inline-block self-start rounded-lg border border-border px-4 py-2 text-sm font-semibold text-ink transition group-hover:border-primary">
								{t(d.ctaKey)}
							</span>
						</Link>
					))}
				</section>

				<SiteFooter />
			</main>
		</div>
	);
}
