import type { Route } from "./+types/confidentialitate";
import { subjectConfig } from "../config/subject";
import { SiteHeader, SiteFooter, ContactOperator } from "../components/site";
import { Link } from "react-router";
import { seo } from "../lib/seo";
import { BUILD_SITE_MODE } from "../lib/site-mode";
import { analyticsToken } from "../lib/env";

// Data ultimei revizii de fond a textului legal. Se schimbă manual, de mână, când se schimbă
// substanța paginii — nu la fiecare atingere cosmetică.
const LAST_UPDATED = "6 septembrie 2026";

// Loaderul dă meta() originea cererii (vezi app/lib/seo.ts) și spune paginii dacă baliza de
// analitice chiar rulează.
//
// Textul despre măsurarea traficului NU e scris de mână, ci ținut de aceeași variabilă care
// aprinde baliza (`CF_BEACON_TOKEN`, vezi root.tsx). O politică de confidențialitate scrisă
// „pentru mai târziu" e falsă acum; una uitată după ce aprinzi măsurarea e falsă atunci. Legată
// de jeton, e adevărată în ambele stări, fără ca cineva să-și amintească s-o actualizeze.
export function loader({ request, context }: Route.LoaderArgs) {
	return {
		origin: new URL(request.url).origin,
		analytics: BUILD_SITE_MODE === "liber" && analyticsToken(context.cloudflare.env).length > 0,
	};
}

export function meta({ data }: Route.MetaArgs) {
	return seo({
		title: "Confidențialitate",
		description:
			"Ce date colectăm și de ce, cât le păstrăm și ce drepturi ai — politica de confidențialitate " +
			`${subjectConfig.siteName}.`,
		path: "/confidentialitate",
		origin: data?.origin,
	});
}

// Conținutul liber trăiește separat pentru că descrie o realitate complet diferită: pe
// instanța liberă nu există conturi, sesiuni sau salvare — vezi resolveViewer în lib/guard.ts,
// care pe modul „liber" iese înainte de orice citire de cookie sau atingere a bazei.
function ConfidentialitateLiber({ analytics }: { analytics: boolean }) {
	return (
		<>
			<h1 className="text-3xl font-bold">Politica de confidențialitate</h1>
			<p className="text-sm text-muted">Ultima actualizare: {LAST_UPDATED}</p>

			<h2>Operatorul de date</h2>
			<ContactOperator />

			<h2>Ce date colectăm</h2>
			<ul>
				<li>Acest site <strong>nu are conturi</strong> — nu există înregistrare, autentificare sau
				parolă, pentru nimeni.</li>
				<li>Nu ți se cere <strong>nicio dată personală</strong> ca să vezi materialele: nu completezi
				niciun formular, nu introduci niciun cod. Singurul formular de pe site este cel de la
				„Păreri", pe care îl completezi doar dacă vrei (vezi mai jos).</li>
				<li>La secțiunea „Exersează", testul grilă nu se salvează: <strong>nici scorul, nici o
				poreclă, nici altceva</strong>. Când închizi pagina, nu rămâne nicio urmă.</li>
			</ul>

			<h2>Părerile</h2>
			<p>Pagina{" "}
			<Link to="/pareri" className="text-primary hover:underline">Păreri</Link>{" "}
			este singurul loc din acest site în care poți trimite ceva, și numai dacă vrei tu. Dacă
			completezi formularul, păstrăm <strong>doar</strong> ce ai scris acolo: rolul ales din listă
			(elev, profesor, părinte sau altcineva), numărul de stele, textul părerii și — dacă îl
			completezi — un nume, care <strong>poate fi o poreclă</strong>; îți cerem explicit să nu scrii
			numele întreg.</p>
			<p>Nu îți cerem și <strong>nu păstrăm adresa de e-mail</strong>, <strong>nu stocăm adresa
			IP</strong> (nici măcar sub formă de amprentă criptografică) și <strong>nu punem niciun
			cookie</strong> când trimiți o părere. Nu poți fi contactat pe baza ei și nu o putem lega de
			alte vizite ale tale.</p>
			<p><strong>Nimic nu apare public înainte de a fi citit.</strong> Fiecare părere trimisă rămâne
			ascunsă până când autoarea site-ului o citește și o publică; una respinsă nu se vede niciodată pe
			site. Temeiul prelucrării este consimțământul tău, dat prin însuși actul de a trimite
			formularul. Dacă vrei ca o părere publicată să fie ștearsă, scrie-ne prin același formular —
			ștergem rândul cu totul.</p>

			<h2>Cât păstrăm datele</h2>
			<p>O părere trece prin cel mult trei stări, și fiecare are propria durată de
			păstrare. Cea <strong>în așteptare</strong> stă necitită și nepublicată până o
			citește autoarea — de obicei în câteva zile. Cea <strong>publicată</strong> rămâne
			vizibilă pe site pe termen nelimitat, până ceri tu să fie retrasă (scrie-ne din nou
			prin formular) sau până o retrage autoarea. Cea <strong>respinsă</strong> nu apare
			niciodată public; rândul rămâne în bază, nepublicat, până este șters manual de
			autoare — nu există o ștergere automată programată pentru părerile respinse.</p>

			<h2>Cookie-uri</h2>
			<p>Acest site <strong>nu folosește niciun cookie</strong> — nici de sesiune, nici de urmărire,
			nici de analiză sau publicitate. Detalii pe pagina{" "}
			<Link to="/cookie-uri" className="text-primary hover:underline">Cookie-uri</Link>.</p>

			<h2>Jurnalele tehnice</h2>
			<p>La fiecare vizită sunt atinse jurnalele tehnice standard ale furnizorului nostru de
			găzduire, <strong>Cloudflare</strong>: adresa IP, momentul cererii și adresa solicitată.
			Acestea sunt păstrate exclusiv pentru funcționarea și securitatea serviciului (prevenirea
			abuzului, depanare) și nu sunt folosite în alte scopuri.</p>

			{analytics && (
				<>
					<h2>Măsurarea traficului</h2>
					<p>Ca să știm dacă site-ul e de folos cuiva, numărăm vizitele cu <strong>Cloudflare Web
					Analytics</strong>. Se rețin doar date agregate — pagina vizitată, pagina de pe care ai
					venit, tipul de browser, țara și cât de repede s-a încărcat pagina.</p>
					<p>Măsurătoarea aceasta <strong>nu pune niciun cookie</strong>, nu face amprentarea
					dispozitivului și nu creează un profil despre tine: nu te putem recunoaște de la o vizită
					la alta, nu te putem urmări pe alte site-uri și nu vindem și nu dăm nimănui aceste date.
					Numerele ne arată câți oameni au deschis o lecție, nu <em>cine</em> a deschis-o.</p>
				</>
			)}

			<h2>Materialele</h2>
			<p>Materialele publicate — lecții, hărți, fotografii, jocuri interactive, scheme de lecție,
			proiecte didactice, studii de caz — sunt opera originală a autoarei și sunt oferite gratuit
			pentru uz didactic. Detalii despre drepturile de autor în pagina{" "}
			<Link to="/termeni" className="text-primary hover:underline">Termeni și condiții</Link>.</p>

			<h2>Drepturile tale</h2>
			<p>Acest site nu îți cere nimic direct și nu păstrează despre tine decât ce alegi tu să scrii
			în formularul de la „Păreri" (unde nu ești obligat să-ți dai numele). Cealaltă
			excepție sunt jurnalele tehnice de mai sus, ținute de Cloudflare — adresa IP este o dată cu
			caracter personal, deci acolo (și numai acolo) au sens drepturile de acces, rectificare sau
			ștergere; le poți exercita adresându-te direct Cloudflare, care administrează acele jurnale.
			Ai, de asemenea, oricând dreptul de a depune o plângere la Autoritatea Națională de
			Supraveghere a Prelucrării Datelor cu Caracter Personal (ANSPDCP) cu privire la ele.</p>
		</>
	);
}

function ConfidentialitateClase() {
	return (
		<>
			<h1 className="text-3xl font-bold">Politica de confidențialitate</h1>
			<p className="text-sm text-muted">Ultima actualizare: {LAST_UPDATED}</p>

			<h2>Operatorul de date</h2>
			<ContactOperator />

			<h2>Ce date colectăm</h2>
			<ul>
				<li><strong>Administrator (profesoara):</strong> e-mail și parolă pentru autentificare.</li>
				<li><strong>Profesori:</strong> e-mail și parolă pentru autentificarea contului.</li>
				<li><strong>Elevi:</strong> intră cu un token de clasă și <strong>nu furnizează date personale</strong>.
				La secțiunea „Exersează", elevul alege o <strong>poreclă neidentificatoare</strong> (i se cere explicit
				să nu folosească numele real); aceasta nu este o dată cu caracter personal.</li>
				<li><strong>„Exersează" (greșeli):</strong> pentru această funcție păstrăm porecla aleasă (ca să nu fie folosită de doi elevi din aceeași clasă) și ce întrebări ai greșit, ca să le poți reexersa; greșelile dispar automat când răspunzi corect. Nu cerem și nu păstrăm numele real.</li>
				<li><strong>Cookie pe dispozitiv:</strong> un cookie mic reține pe acest dispozitiv porecla aleasă, ca să te recunoaștem fără parolă; doamna profesoară poate elibera oricând o poreclă.</li>
				<li><strong>Cookie-uri:</strong> doar cookie-uri esențiale de autentificare (vezi mai jos).</li>
			</ul>

			<p>Deschiderile de materiale sunt numărate doar agregat, pe clasă și pe zi, pentru
			ca profesorul să vadă ce materiale sunt folosite. Nu se înregistrează nimic despre
			un elev anume.</p>

			<h2>Temeiul legal al prelucrării</h2>
			<p>Prelucrăm e-mailul și parola conturilor pentru a-ți putea oferi serviciul cerut —
			temeiul este <strong>executarea contractului</strong> (art. 6 alin. (1) lit. b GDPR), respectiv
			<strong> interesul legitim</strong> (art. 6 alin. (1) lit. f GDPR) de a securiza accesul și de a
			preveni abuzul. Statisticile de exersare sunt pseudonime și nu identifică elevi.</p>

			<h2>Scopul prelucrării</h2>
			<p>Furnizarea platformei educaționale: autentificare, accesul la materiale pe baza tokenului,
			generarea testelor de exersare și statistici agregate pentru profesoară.</p>

			<h2>Minori</h2>
			<p>Platforma este concepută astfel încât elevii (minori) să <strong>nu</strong> furnizeze date cu
			caracter personal: accesul se face cu un token de clasă, fără cont și fără nume real.</p>

			<h2>Cui divulgăm datele</h2>
			<p>Nu vindem și nu partajăm datele în scopuri de marketing. Folosim furnizorul
			<strong> Cloudflare</strong> (găzduire și bază de date) pentru a opera platforma; acesta
			prelucrează datele doar la instrucțiunile noastre.</p>

			<h2>Cât păstrăm datele</h2>
			<p>Tokenurile sunt valabile până la sfârșitul anului școlar. Datele de exersare se păstrează
			cel mult până la sfârșitul anului școlar și pot fi șterse oricând de către profesoară.</p>

			<h2>Cookie-uri</h2>
			<p>Folosim exclusiv <strong>cookie-uri strict necesare</strong> pentru autentificare
			(<code>cat_student</code>, <code>cat_teacher</code>, <code>cat_admin</code>). Acestea sunt
			indispensabile funcționării și, conform regulilor ePrivacy, <strong>nu necesită un banner de
			consimțământ</strong>. Nu folosim cookie-uri de analiză sau de urmărire. Detalii pe pagina{" "}
			<Link to="/cookie-uri" className="text-primary hover:underline">Cookie-uri</Link>.</p>

			<h2>Drepturile tale</h2>
			<p>Ai dreptul de acces, rectificare, ștergere, restricționare, opoziție și portabilitate, conform
			GDPR. Ai, de asemenea, dreptul de a depune o plângere la Autoritatea Națională de Supraveghere a
			Prelucrării Datelor cu Caracter Personal (ANSPDCP).</p>
		</>
	);
}

export default function Confidentialitate({ loaderData }: Route.ComponentProps) {
	return (
		<div className="min-h-screen">
			<SiteHeader />
			<main className="prose-ro mx-auto max-w-2xl px-5 py-10">
				{BUILD_SITE_MODE === "liber" ? <ConfidentialitateLiber analytics={loaderData.analytics} /> : <ConfidentialitateClase />}
			</main>
			<div className="mx-auto max-w-2xl px-5"><SiteFooter /></div>
		</div>
	);
}
