import { Link } from "react-router";
import type { Route } from "./+types/cookie-uri";
import { subjectConfig } from "../config/subject";
import { SiteHeader, SiteFooter } from "../components/site";
import { seo } from "../lib/seo";
import { BUILD_SITE_MODE } from "../lib/site-mode";
import { analyticsToken } from "../lib/env";

// Aceeași dată ca pe /confidentialitate și /termeni — cele trei pagini legale se actualizează
// împreună, de mână, când se schimbă substanța textului.
const LAST_UPDATED = "6 septembrie 2026";

// Originea cererii pentru meta() (vezi app/lib/seo.ts) + dacă baliza de analitice rulează.
// Aceeași legare de `CF_BEACON_TOKEN` ca pe /confidentialitate: „nu folosim cookie-uri de
// analiză" rămâne adevărat oricum (Cloudflare Web Analytics e fără cookie-uri), dar un cititor
// ar deduce din asta că nu se măsoară nimic. Nota de mai jos apare exact când chiar se măsoară.
export function loader({ request, context }: Route.LoaderArgs) {
	return {
		origin: new URL(request.url).origin,
		analytics: BUILD_SITE_MODE === "liber" && analyticsToken(context.cloudflare.env).length > 0,
	};
}

export function meta({ data }: Route.MetaArgs) {
	return seo({
		title: "Cookie-uri",
		description:
			BUILD_SITE_MODE === "liber"
				? `${subjectConfig.siteName} nu folosește niciun cookie — nici de autentificare, nici de urmărire.`
				: `Ce cookie-uri folosește ${subjectConfig.siteName} — doar cele strict necesare pentru ` +
					"autentificare, fără urmărire sau publicitate.",
		path: "/cookie-uri",
		origin: data?.origin,
	});
}

// Pe instanța liberă nu există sesiuni (resolveViewer iese devreme, fără să citească niciun
// cookie — lib/guard.ts), deci cele trei cookie-uri de sesiune de mai jos pur și simplu nu
// există acolo. Singurul lucru păstrat local e preferința de temă, în localStorage.
function CookieUriLiber({ analytics }: { analytics: boolean }) {
	return (
		<>
			<h1 className="text-3xl font-bold">Politica de cookie-uri</h1>
			<p className="text-sm text-muted">Ultima actualizare: {LAST_UPDATED}</p>

			<p>Acest site <strong>nu folosește niciun cookie</strong>. Nu există conturi și nu există
			sesiuni, deci nu e nevoie de cookie-uri de autentificare; nu folosim nici cookie-uri de
			analiză, publicitate sau urmărire.</p>

			{analytics && (
				<p>Numărăm totuși vizitele, ca să știm dacă site-ul e de folos — dar cu o unealtă care
				<strong> nu pune cookie-uri</strong> și nu face amprentarea dispozitivului. Ce se reține,
				și ce nu, scrie pe pagina{" "}
				<Link to="/confidentialitate" className="text-primary hover:underline">Confidențialitate</Link>.</p>
			)}

			<h2>Preferința de temă</h2>
			<p>Tema deschisă/întunecată o reținem în <code>localStorage</code> (cheia
			<code>theme</code>), în browserul tău. Aceasta <strong>nu este un cookie</strong> — rămâne
			doar pe dispozitivul tău și nu este trimisă niciodată către server.</p>

			<h2>Cum le poți controla</h2>
			<p>Nu trebuie să controlezi nimic — nu punem niciun cookie. Poți șterge oricând preferința
			de temă din setările browserului (ștergerea datelor site-ului).</p>

			<p>Detalii despre datele prelucrate găsești în{" "}
			<Link to="/confidentialitate" className="text-primary hover:underline">Politica de confidențialitate</Link>.</p>
		</>
	);
}

function CookieUriClase() {
	return (
		<>
			<h1 className="text-3xl font-bold">Politica de cookie-uri</h1>
			<p className="text-sm text-muted">Ultima actualizare: {LAST_UPDATED}</p>

			<p>Folosim exclusiv <strong>cookie-uri strict necesare</strong> pentru funcționarea
			platformei {subjectConfig.siteName}. Nu folosim cookie-uri de analiză, publicitate sau
			urmărire și nu partajăm date cu terți. Pentru că sunt indispensabile, conform regulilor
			ePrivacy aceste cookie-uri <strong>nu necesită un banner de consimțământ</strong>.</p>

			<h2>Cookie-uri pe care le folosim</h2>
			<ul>
				<li><code>cat_student</code> — păstrează sesiunea elevului (tokenul clasei) după ce
				intră. Semnat, <code>HttpOnly</code>, <code>SameSite=Lax</code>. Durată: 6 ore.</li>
				<li><code>cat_teacher</code> — păstrează sesiunea profesorului autentificat. Semnat,
				<code>HttpOnly</code>, <code>SameSite=Lax</code>. Durată: 12 ore.</li>
				<li><code>cat_admin</code> — păstrează sesiunea administratorului. Semnat,
				<code>HttpOnly</code>, <code>SameSite=Lax</code>. Durată: 8 ore.</li>
			</ul>

			<h2>Preferința de temă</h2>
			<p>Tema deschisă/întunecată o reținem în <code>localStorage</code> (cheia
			<code>theme</code>), în browserul tău. Aceasta <strong>nu este un cookie</strong> și nu
			este trimisă către server.</p>

			<h2>Cum le poți controla</h2>
			<p>Poți șterge cookie-urile din setările browserului. Fără cookie-urile de sesiune va
			trebui să te autentifici din nou, iar elevii vor trebui să reintroducă tokenul clasei.</p>

			<p>Detalii despre datele prelucrate găsești în{" "}
			<Link to="/confidentialitate" className="text-primary hover:underline">Politica de confidențialitate</Link>.</p>
		</>
	);
}

export default function CookieUri({ loaderData }: Route.ComponentProps) {
	return (
		<div className="min-h-screen">
			<SiteHeader />
			<main className="prose-ro mx-auto max-w-2xl px-5 py-10">
				{BUILD_SITE_MODE === "liber" ? <CookieUriLiber analytics={loaderData.analytics} /> : <CookieUriClase />}
			</main>
			<div className="mx-auto max-w-2xl px-5"><SiteFooter /></div>
		</div>
	);
}
