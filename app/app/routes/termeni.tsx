import type { Route } from "./+types/termeni";
import { subjectConfig } from "../config/subject";
import { SiteHeader, SiteFooter, ContactOperator } from "../components/site";
import { seo } from "../lib/seo";
import { BUILD_SITE_MODE } from "../lib/site-mode";

// Aceeași dată ca pe /confidentialitate și /cookie-uri — cele trei pagini legale se
// actualizează împreună, de mână, când se schimbă substanța textului.
const LAST_UPDATED = "6 septembrie 2026";

// Trivial loader whose only job is to hand meta() the request origin (see app/lib/seo.ts).
export function loader({ request }: Route.LoaderArgs) {
	return { origin: new URL(request.url).origin };
}

export function meta({ data }: Route.MetaArgs) {
	return seo({
		title: "Termeni și condiții",
		description: `Termenii și condițiile de utilizare a platformei ${subjectConfig.siteName}.`,
		path: "/termeni",
		origin: data?.origin,
	});
}

// Instanța liberă nu are conturi de profesor, nu ia bani și nu planifică s-o facă — decizia
// #2 din spec: „Fără conturi de profesor pe site-ul nou". Restul (proprietatea materialelor,
// limitarea răspunderii) rămâne identic în literă, doar fără mențiunile despre cont/platformă
// cu autentificare.
function TermeniLiber() {
	return (
		<>
			<h1 className="text-3xl font-bold">Termeni și condiții</h1>
			<p className="text-sm text-muted">Ultima actualizare: {LAST_UPDATED}</p>

			<h2>Cine suntem</h2>
			<ContactOperator />

			<h2>Acceptarea termenilor</h2>
			<p>Prin folosirea acestui site accepți acești termeni. Dacă nu ești de acord, te rugăm
			să nu îl folosești.</p>

			<h2>Acces gratuit</h2>
			<p>Tot conținutul publicat pe acest site este gratuit, pentru oricine, fără cont și fără
			plată. Nu există și nu sunt planificate servicii contra cost pe acest site.</p>

			<h2>Utilizare acceptabilă</h2>
			<p>Conținutul este destinat uzului educațional — poți citi, viziona și folosi materialele
			la clasă sau pentru studiu individual. Nu este permisă copierea, redistribuirea sau
			republicarea materialelor fără acordul autoarei.</p>

			<h2>Proprietatea conținutului</h2>
			<p>Autoarea materialelor publicate pe acest site este <strong>Liliana Necula</strong>.
			Materialele — lecții, scheme de lecție, ghiduri metodologice, proiecte didactice, studii de
			caz, fotografii, hărți și jocuri interactive — sunt opere originale, protejate de
			<strong> Legea nr. 8/1996 privind dreptul de autor și drepturile conexe</strong>. Faptul că
			sunt oferite gratuit nu înseamnă că sunt libere de drepturi: dreptul de autor rămâne al
			autoarei din chiar momentul creării operei, fără nicio formalitate de înregistrare.</p>
			<p>Este interzisă reproducerea, distribuirea, comunicarea publică, închirierea sau
			modificarea materialelor, integral sau parțial, fără acordul scris prealabil al autoarei.
			Le poți folosi liber pentru predare și învățare, fără drept de redistribuire în afara
			acestui site.</p>
			<p>Site-ul păstrează data primei publicări a fiecărui material, ceea ce constituie dovadă
			a anteriorității în caz de litigiu. Dacă identifici un material publicat fără acord în altă
			parte, te rugăm să ne semnalezi acest lucru.</p>

			<h2>Limitarea răspunderii</h2>
			<p>Site-ul este oferit „ca atare". Autoarea nu garantează lipsa erorilor și nu răspunde
			pentru daune indirecte rezultate din utilizare.</p>

			<h2>Modificarea termenilor</h2>
			<p>Putem actualiza acești termeni. Versiunea în vigoare este cea publicată pe această pagină;
			utilizarea în continuare a site-ului după modificare înseamnă acceptarea noii versiuni.</p>

			<h2>Legea aplicabilă</h2>
			<p>Acești termeni sunt guvernați de legislația din România.</p>
		</>
	);
}

function TermeniClase() {
	return (
		<>
			<h1 className="text-3xl font-bold">Termeni și condiții</h1>
			<p className="text-sm text-muted">Ultima actualizare: {LAST_UPDATED}</p>

			<h2>Cine suntem</h2>
			<ContactOperator />

			<h2>Acceptarea termenilor</h2>
			<p>Prin utilizarea platformei {subjectConfig.siteName} accepți acești termeni. Dacă nu ești
			de acord, te rugăm să nu folosești platforma.</p>

			<h2>Utilizare acceptabilă</h2>
			<p>Conținutul este destinat uzului educațional. Nu este permisă descărcarea, copierea,
			redistribuirea sau publicarea materialelor fără acordul autorului.</p>

			<h2>Proprietatea conținutului</h2>
			<p>Autoarea materialelor publicate pe această platformă este <strong>Liliana Necula</strong>.
			Materialele — lecții, scheme de lecție, ghiduri metodologice, proiecte didactice, studii de
			caz, fotografii, hărți și jocuri interactive — sunt opere originale, protejate de
			<strong> Legea nr. 8/1996 privind dreptul de autor și drepturile conexe</strong>. Dreptul de
			autor se naște din chiar momentul creării operei, fără nicio formalitate de înregistrare.</p>
			<p>Este interzisă reproducerea, distribuirea, comunicarea publică, închirierea sau
			modificarea materialelor, integral sau parțial, fără acordul scris prealabil al autoarei.
			Utilizarea lor la clasă de către profesorii cu cont pe platformă este permisă în scop
			didactic, fără drept de redistribuire în afara platformei.</p>
			<p>Platforma păstrează data primei publicări a fiecărui material, ceea ce constituie dovadă
			a anteriorității în caz de litigiu. Dacă identifici un material publicat fără acord în altă
			parte, te rugăm să ne semnalezi acest lucru.</p>

			<h2>Limitarea răspunderii</h2>
			<p>Platforma este oferită „ca atare". Autorul nu garantează lipsa erorilor și nu răspunde
			pentru daune indirecte rezultate din utilizare.</p>

			<h2>Modificarea termenilor</h2>
			<p>Putem actualiza acești termeni. Versiunea în vigoare este cea publicată pe această pagină;
			utilizarea în continuare a platformei după modificare înseamnă acceptarea noii versiuni.</p>

			<h2>Protecția consumatorului</h2>
			<p>Dacă în viitor vor fi oferite servicii contra cost, se vor aplica drepturile prevăzute de
			legislația din România privind protecția consumatorilor. Reclamațiile pot fi adresate
			operatorului sau Autorității Naționale pentru Protecția Consumatorilor (ANPC). Este disponibilă
			și platforma europeană de soluționare online a litigiilor (SOL):{" "}
			<a href="https://ec.europa.eu/consumers/odr" className="text-primary hover:underline">ec.europa.eu/consumers/odr</a>.</p>

			<h2>Legea aplicabilă</h2>
			<p>Acești termeni sunt guvernați de legislația din România.</p>
		</>
	);
}

export default function Termeni() {
	return (
		<div className="min-h-screen">
			<SiteHeader />
			<main className="prose-ro mx-auto max-w-2xl px-5 py-10">
				{BUILD_SITE_MODE === "liber" ? <TermeniLiber /> : <TermeniClase />}
			</main>
			<div className="mx-auto max-w-2xl px-5"><SiteFooter /></div>
		</div>
	);
}
