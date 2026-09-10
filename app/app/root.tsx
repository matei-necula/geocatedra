import {
	isRouteErrorResponse,
	Links,
	Meta,
	Outlet,
	Scripts,
	ScrollRestoration,
} from "react-router";

import type { Route } from "./+types/root";
import "./app.css";
import { subjectConfig } from "./config/subject";
import { themeCss, themeFor, noFlashScript, THEME_COLOR_MEDIA } from "./lib/theme";
import { BUILD_SITE_MODE } from "./lib/site-mode";
import { analyticsToken } from "./lib/env";
import { TopProgress } from "./components/Chrome";
import { SiteBackdrop } from "./components/SiteBackdrop";

// Fallback title for anything that renders without its own meta() — chiefly the ErrorBoundary,
// whose route's meta is skipped when a loader throws. Any route exporting meta() overrides this
// wholesale (react-router does not merge), so every real page still gets its lib/seo.ts title.
export const meta: Route.MetaFunction = () => [
	{ title: `${subjectConfig.siteName} — ${subjectConfig.tagline}` },
];

// Setul de icoane e generat de scripts/gen-icons.mjs (runbook 4.1) — fișiere reale, ca să
// existe icoană maskable, icoană Apple și manifest PWA, lucruri pe care un data-URI nu le poate da.
//
// Există DOUĂ seturi, cu aceeași marcă („globul"), fiecare în paleta instanței lui. `public/`
// e servit de amândouă desfășurările, deci un singur set ar fi însemnat un favicon azuriu pe
// site-ul cobalt. Sufixul se alege la CONSTRUCȚIE, ca și tabela de rute — nu la execuție.
const ICON = BUILD_SITE_MODE === "liber" ? "-liber" : "";

// Tema instanței, calculată o dată: e aleasă la CONSTRUCȚIE, ca și tabela de rute.
const THEME = themeFor(subjectConfig, BUILD_SITE_MODE);

// Cele DOUĂ fonturi de deasupra pliului, doar ale instanței care rulează.
//
// Fonturile sunt găzduite la noi (`public/fonts/`), deci browserul află de ele abia după ce
// parsează CSS-ul — o rundă întreagă de așteptare în care textul e scris cu fontul de sistem.
// Preîncărcarea taie runda aia. Se preîncarcă strict fontul de text și cel de titlu, și doar
// felia `latin`: `latin-ext` ține diacriticele românești, dar sosește oricum la nevoie, iar un
// font preîncărcat și nefolosit e pierdere curată de lățime de bandă pe telefon.
//
// Cele două instanțe au fonturi diferite (ADR-0009). Nu se preîncarcă niciodată amândouă
// seturile: jumătate ar fi, prin definiție, descărcare degeaba.
const PRELOAD_FONTS =
	BUILD_SITE_MODE === "liber"
		? [
				"/fonts/public-sans-normal-400700-latin.woff2", // text + h3/h4 (headingUi)
				"/fonts/instrument-serif-normal-400-latin.woff2", // h1/h2
			]
		: [
				"/fonts/inter-latin.woff2", // text
				"/fonts/spectral-normal-700-latin.woff2", // h1/h2 (`font-bold` peste tot)
			];

export const links: Route.LinksFunction = () => [
	{ rel: "icon", href: `/icon${ICON}.svg`, type: "image/svg+xml" },
	{ rel: "icon", href: `/favicon${ICON}.ico`, sizes: "any" },
	{ rel: "apple-touch-icon", href: `/apple-touch-icon${ICON}.png` },
	{ rel: "manifest", href: `/site${ICON}.webmanifest` },
	// `crossOrigin` e obligatoriu chiar și pentru fonturi din aceeași origine: fără el
	// browserul descarcă fișierul de două ori (preîncărcarea nu se potrivește cu cererea
	// făcută de CSS, care e anonimă prin definiție pentru fonturi).
	...PRELOAD_FONTS.map((href) => ({
		rel: "preload",
		as: "font",
		type: "font/woff2",
		href,
		crossOrigin: "anonymous" as const,
	})),
];

/**
 * Singurul rol al loaderului de rădăcină: jetonul balizei de analitice.
 *
 * Se citește `env` doar pe instanța liberă — pe cea cu clase nu există variabila și nu vrem
 * baliză deloc (elevii sunt minori; site-ul cu clase nu trimite nimic nicăieri).
 */
export function loader({ context }: Route.LoaderArgs) {
	return {
		beaconToken: BUILD_SITE_MODE === "liber" ? analyticsToken(context.cloudflare.env) : "",
	};
}

export function Layout({ children }: { children: React.ReactNode }) {
	return (
		<html lang={subjectConfig.defaultLocale}>
			<head>
				<meta charSet="utf-8" />
				<meta name="viewport" content="width=device-width, initial-scale=1" />
				{/* Bara browserului de pe telefon (Chrome pe Android, Safari pe iOS) se colorează
				    din `theme-color`. Un singur meta însemna fundalul LUMINOS mereu: pagina trecea
				    pe bleumarin, bara rămânea crem — o cusătură vizibilă, confirmată pe telefon.
				    Două meta-uri, alese de browser după `prefers-color-scheme`; când vizitatorul
				    alege explicit altceva decât sistemul, `applyTheme` (lib/theme.ts) dezactivează
				    meta-ul care nu trebuie. O temă fără `colorsDark` primește, ca înainte, unul
				    singur — mai bine o culoare corectă decât două din care una e inventată. */}
				{THEME.colorsDark ? (
					<>
						<meta name="theme-color" media={THEME_COLOR_MEDIA.light} content={THEME.colors.bg} />
						<meta name="theme-color" media={THEME_COLOR_MEDIA.dark} content={THEME.colorsDark.bg} />
					</>
				) : (
					<meta name="theme-color" content={THEME.colors.bg} />
				)}
				{/* No <title> here: <Meta /> renders the one each route builds via lib/seo.ts.
				    A static title alongside it would emit TWO <title> tags, and browsers and
				    crawlers honour the first — every page would advertise the bare site name. */}
				<Meta />
				<Links />
				<style dangerouslySetInnerHTML={{ __html: themeCss({ ...subjectConfig, theme: THEME }) }} />
				<script dangerouslySetInnerHTML={{ __html: noFlashScript }} />
			</head>
			{/* Fără `bg-bg` aici — vezi comentariul din app.css: un body opac ar ascunde textura. */}
			<body className="text-ink antialiased">
				{children}
				<ScrollRestoration />
				<Scripts />
			</body>
		</html>
	);
}

export default function App({ loaderData }: Route.ComponentProps) {
	return (
		<>
			{/* Textura de fundal, o singură dată pentru tot site-ul. E `fixed`, deci nicio rută
			    nu trebuie s-o pună și nicio pagină lungă nu rămâne fără ea după primul ecran. */}
			<SiteBackdrop />
			<TopProgress />
			<Outlet />
			{/* Baliza de analitice stă AICI, nu în `Layout`, dintr-un motiv concret: `Layout`
			    învelește și `ErrorBoundary`, iar acolo datele loaderului de rădăcină pot lipsi
			    (o cerere fără rută potrivită nu ajunge niciodată la loader). Un `loaderData.x`
			    scris naiv în `Layout` ar arunca exact în pagina de eroare și ar transforma un
			    404 curat într-un 500. În `App` problema nu există: componenta se randează doar
			    când loaderul a reușit. Pierdem statistica paginilor de eroare — un preț mic.

			    Inertă cât timp jetonul lipsește (vezi `analyticsToken`), și niciodată pe
			    instanța cu clase. */}
			{loaderData?.beaconToken ? (
				<script
					defer
					src="https://static.cloudflareinsights.com/beacon.min.js"
					data-cf-beacon={JSON.stringify({ token: loaderData.beaconToken })}
				/>
			) : null}
		</>
	);
}

export function ErrorBoundary({ error }: Route.ErrorBoundaryProps) {
	let message = "A apărut o problemă";
	let details = "Ceva nu a mers bine. Încearcă din nou.";
	let stack: string | undefined;

	if (isRouteErrorResponse(error)) {
		message = error.status === 404 ? "Pagină negăsită" : `Eroare ${error.status}`;
		details =
			error.status === 404
				? "Pagina căutată nu există sau nu ai acces la ea."
				: error.statusText || details;
	} else if (import.meta.env.DEV && error && error instanceof Error) {
		details = error.message;
		stack = error.stack;
	}

	return (
		<main className="mx-auto flex min-h-screen max-w-xl flex-col items-center justify-center gap-4 p-6 text-center">
			<h1 className="text-3xl font-semibold">{message}</h1>
			<p className="text-muted">{details}</p>
			<a
				href="/"
				className="rounded-lg bg-primary px-5 py-2.5 font-medium text-on-primary transition hover:bg-primary-strong"
			>
				Înapoi la pagina principală
			</a>
			{stack && (
				<pre className="mt-4 w-full overflow-x-auto rounded-lg bg-ink/5 p-4 text-left text-xs">
					<code>{stack}</code>
				</pre>
			)}
		</main>
	);
}
