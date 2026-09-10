import { Fragment } from "react";
import { Link } from "react-router";
import type { Route } from "./+types/liber.intrebari-frecvente";
import { subjectConfig, t } from "../config/subject";
import { LiberFooter, LiberHeader } from "../components/liber/LiberChrome";
import { seo } from "../lib/seo";
import { BUILD_SITE_MODE } from "../lib/site-mode";
import { analyticsToken } from "../lib/env";
import { faqPageJsonLd, ldJson } from "../lib/jsonld";

/**
 * „Întrebări frecvente" — pagină nouă, doar pe instanța liberă (decizia autoarei).
 *
 * Nu există nicăieri altundeva o pagină care să adune, într-un loc, întrebările pe care le
 * pun de obicei elevii, părinții sau profesorii care dau peste site pentru prima dată: e
 * gratuit de-adevăratelea? am nevoie de cont? ce se întâmplă cu datele mele? Răspunsurile de
 * mai jos descriu STRICT ce face codul azi (verificat în `lib/reviews.ts`, `routes/liber.
 * exerseaza.tsx`, `config/subject.ts`) — nimic promis „pe viitor" nu apare aici ca fapt.
 *
 * Structura ține regula de titluri a site-ului: un singur `h1`, apoi câte un `h2` per
 * întrebare — fără să sară niciun nivel.
 */

/**
 * ═══ De ce răspunsurile sunt SEGMENTE și nu JSX scris direct ═══
 *
 * Pagina emite și marcaj `FAQPage` (docs/09-seo-strategy.md, punctul 5). Regula Google pentru
 * rezultatele bogate e categorică: textul din marcaj trebuie să fie EXACT textul pe care îl
 * vede omul pe pagină. Un marcaj care spune altceva decât pagina nu e o mică nepotrivire, e
 * motiv de retragere a rezultatului bogat.
 *
 * Dar cele două au nevoie de forme diferite: pe pagină răspunsul conține `<Link>`, `<strong>`
 * și `<code>`; în JSON-LD trebuie text simplu (Google acceptă puțin HTML inline, dar textul
 * curat e mai sigur și mult mai ușor de verificat cu ochiul). Varianta leneșă — un răspuns
 * scris în JSX și o copie a lui scrisă ca șir — ar fi două surse de adevăr, iar prima corectură
 * făcută într-una singură le-ar face să mintă una despre alta, tăcut.
 *
 * Așa că răspunsul se scrie O SINGURĂ DATĂ, ca listă de segmente. Din aceeași listă ies
 * amândouă formele: `renderSegments` o face JSX (cu linkuri și accente), `plainText` o
 * concatenează în text curat pentru marcaj. Nu se pot desincroniza, pentru că nu sunt două
 * texte — sunt două randări ale aceluiași text.
 *
 * Spațierea trăiește ÎN segmente (șirurile își poartă spațiul de la capete). Fără regula asta,
 * varianta JSX ar arăta corect — JSX-ul înghite spații albe la fel de nemilos pe cât le adaugă —
 * iar cea de text ar lipi cuvintele între ele.
 */
type Segment =
	| string
	| {
			/** Textul vizibil al segmentului. Ăsta ajunge, identic, și în marcaj. */
			text: string;
			/** Cale root-relativă: segmentul devine `<Link>` pe pagină, text simplu în marcaj. */
			to?: string;
			strong?: true;
			code?: true;
	  };

interface FaqEntry {
	q: string;
	a: Segment[];
}

/** Textul curat al unui răspuns — ce ajunge în `acceptedAnswer.text`. */
function plainText(segments: Segment[]): string {
	return segments.map((s) => (typeof s === "string" ? s : s.text)).join("");
}

function renderSegments(segments: Segment[]) {
	return segments.map((s, i) => {
		if (typeof s === "string") return <Fragment key={i}>{s}</Fragment>;
		let node: React.ReactNode = s.text;
		if (s.code) node = <code>{node}</code>;
		if (s.strong) node = <strong>{node}</strong>;
		if (s.to)
			node = (
				<Link to={s.to} className="text-primary hover:underline">
					{node}
				</Link>
			);
		return <Fragment key={i}>{node}</Fragment>;
	});
}

// Rafturile de pedagogie se citesc din config, nu se scriu de mână — dacă doamna profesoară
// adaugă un raft nou, și răspunsul de pe pagină, și marcajul se actualizează deodată.
const rafturi = subjectConfig.teacherCollections.map((c) => t(c.labelKey));
const rafturiListate = `${rafturi.slice(0, -1).join(", ")} și ${rafturi[rafturi.length - 1]}`;

// Numele autoarei vine din config (ca pe /despre și ca în marcajul `Person`), ca să nu existe
// două locuri în care poate fi scris altfel. `author` e opțional (config/types.ts), deci
// răspunsul are și forma fără nume — un `<strong>` gol legat la /despre ar fi arătat ca un bug.
const numeAutoare = subjectConfig.author?.name;
const CINE_A_FACUT_CODA =
	", profesoară de geografie. A scris lecțiile, a pregătit jocurile și testele și a ales " +
	"fotografiile — toate din domeniul public sau cu licență CC0, ca să poată fi folosite " +
	"fără nicio grijă de drepturi.";

/**
 * ═══ De ce lista e o FUNCȚIE de `analytics`, nu o constantă ═══
 *
 * Răspunsul despre urmărire era scris ca fapt fix: „Niciunul." Era adevărat când s-a scris,
 * dar `CF_BEACON_TOKEN` a fost aprins între timp pe instanța liberă, iar `/cookie-uri` și
 * `/confidentialitate` — care sunt legate de jeton — au început să spună, corect, că vizitele
 * SE numără. Pagina asta nu era legată de nimic, deci a rămas în urmă: două pagini ale
 * aceluiași sit dădeau răspunsuri diferite la aceeași întrebare, iar de data asta răspunsul
 * vechi ajungea și în marcajul `FAQPage`, adică direct în rezultatele Google.
 *
 * Lecția e chiar regula din CLAUDE.md: **textul care descrie ce face codul trebuie legat de
 * cod, nu de memorie.** Aici asta înseamnă exact aceeași condiție ca în `routes/cookie-uri.tsx`
 * — `BUILD_SITE_MODE === "liber" && analyticsToken(env).length > 0` — calculată în loader și
 * dată mai departe. Se stinge jetonul, se stinge și propoziția; se aprinde, apare.
 *
 * Afirmația de fond („niciun cookie") rămâne neatinsă, fiindcă rămâne adevărată: Cloudflare
 * Web Analytics e fără cookie-uri și fără amprentarea dispozitivului — chiar de-asta a fost ales.
 * Ce lipsea era nuanța dintre „nu pun cookie-uri" și „nu măsor nimic".
 */
function buildFaq(analytics: boolean): FaqEntry[] {
	return FAQ_BASE.map((item) =>
		item.q === TRACKING_Q ? { ...item, a: trackingAnswer(analytics) } : item,
	);
}

/** Cheia întrebării despre urmărire — scrisă o dată, ca potrivirea de mai sus să nu depindă
 *  de retranscrierea unui șir lung cu ghilimele tipografice. */
const TRACKING_Q = "Site-ul mă urmărește? Ce cookie-uri pune?";

function trackingAnswer(analytics: boolean): Segment[] {
	return [
		"Niciunul. Site-ul nu pune ",
		{ text: "niciun cookie", strong: true } as Segment,
		" — nu are conturi, deci nu are nevoie de cookie-uri de autentificare, și nu folosește " +
			"nici cookie-uri de analiză sau de publicitate. Singurul lucru ținut minte e preferința " +
			"de temă (deschisă/întunecată), și aceea stă doar în browserul tău (",
		{ text: "localStorage", code: true } as Segment,
		"), niciodată trimisă către server. ",
		// Apare exact când baliza chiar rulează. Fără ea, „nu punem cookie-uri" l-ar lăsa pe
		// cititor să deducă „nu se măsoară nimic" — adevărat despre cookie-uri, fals despre
		// măsurare. Formularea o urmează pe cea de pe /cookie-uri, ca cele două să nu difere.
		...(analytics
			? ([
					"Numărăm totuși vizitele, ca să știm dacă site-ul e de folos, cu o unealtă care nu " +
						"pune cookie-uri și nu face amprentarea dispozitivului. ",
				] as Segment[])
			: []),
		"Detalii pe pagina ",
		{ text: "Cookie-uri", to: "/cookie-uri" } as Segment,
		".",
	];
}

const FAQ_BASE: FaqEntry[] = [
	{
		q: "Chiar e gratuit? Unde e „prinderea”?",
		a: [
			"Da, chiar e gratuit — tot ce vezi la ",
			{ text: "Materiale pentru elevi", to: "/elevi" },
			" și la ",
			{ text: "Materiale pentru profesori", to: "/pedagogie" },
			". Nu există o variantă „plătită” ascunsă undeva, nu apar reclame și nu ți se cere card " +
				"bancar. Site-ul e făcut de o singură profesoară de geografie și e gândit de la început " +
				"ca instanță gratuită, publică.",
		],
	},
	{
		q: "Am nevoie de cont, parolă sau cod de clasă?",
		a: [
			"Nu. Intri direct pe pagină, fără înregistrare, fără autentificare și fără niciun cod de " +
				"introdus. Ce e publicat se vede imediat, pentru oricine.",
		],
	},
	{
		q: "Ce clase și ce materie acoperă site-ul?",
		a: [
			"Geografie, pentru liceu (clasele 9–12, sistemul românesc). Deocamdată materia completă " +
				"e publicată pentru clasa a 9-a; pentru clasele 10–12 materialele se adaugă pe măsură ce " +
				"intră în vigoare noile programe școlare. La secțiunea pentru profesori găsești cinci " +
				`rafturi: ${rafturiListate}.`,
		],
	},
	{
		q: "Pot folosi materialele la propria mea clasă?",
		a: [
			"Da — exact pentru asta sunt oferite gratuit. Poți să le arăți la oră, să le folosești ca " +
				"sprijin pentru predare sau pentru studiu individual.",
		],
	},
	{
		q: "Pot să le republic sau să le distribui în altă parte?",
		a: [
			"Nu. Materialele — lecții, fotografii, jocuri, scheme de lecție, proiecte didactice, " +
				"studii de caz, teste — sunt opera originală a autoarei, protejate de Legea nr. 8/1996 " +
				"privind dreptul de autor. Le poți folosi liber pentru predare și învățare, dar nu poți " +
				"să le încarci pe alt site, să le retipărești sau să le vinzi fără acordul ei scris. " +
				"Detalii complete în ",
			{ text: "Termeni și condiții", to: "/termeni" },
			".",
		],
	},
	{
		q: "Site-ul mă urmărește? Ce cookie-uri pune?",
		a: [
			"Niciunul. Site-ul nu pune ",
			{ text: "niciun cookie", strong: true },
			" — nu are conturi, deci nu are nevoie de cookie-uri de autentificare, și nu folosește " +
				"nici cookie-uri de analiză sau de publicitate. Singurul lucru ținut minte e preferința " +
				"de temă (deschisă/întunecată), și aceea stă doar în browserul tău (",
			{ text: "localStorage", code: true },
			"), niciodată trimisă către server. Detalii pe pagina ",
			{ text: "Cookie-uri", to: "/cookie-uri" },
			".",
		],
	},
	{
		q: "Ce se întâmplă cu rezultatele mele la „Exersează”?",
		a: [
			"Nimic — nu se salvează. Testul grilă de aici nu cere și nu păstrează nicio poreclă, " +
				"niciun scor și nicio urmă a răspunsurilor tale. Când închizi pagina, testul dispare de " +
				"tot; dacă vrei să exersezi din nou, iei un test nou, generat pe loc.",
		],
	},
	{
		q: "Cine a făcut acest site?",
		a: numeAutoare
			? [
					"O singură persoană: ",
					// Numele e și legătura către pagina de prezentare: cine pune întrebarea asta e
					// exact omul care vrea să citească mai mult, iar /despre e răspunsul lung.
					{ text: numeAutoare, to: "/despre", strong: true },
					CINE_A_FACUT_CODA,
				]
			: [`O singură persoană${CINE_A_FACUT_CODA}`],
	},
	{
		q: "Am găsit o greșeală într-o lecție — cui o semnalez?",
		a: [
			"Pe pagina ",
			{ text: "Păreri", to: "/pareri" },
			" poți scrie orice observație, inclusiv o greșeală găsită. Fiecare mesaj e citit de " +
				"autoare înainte de a fi publicat, așa că ajunge la ea chiar dacă nu apare imediat pe site.",
		],
	},
	{
		q: "Va rămâne gratuit?",
		a: [
			"Nu putem promite „pentru totdeauna”, dar site-ul liber a fost gândit chiar așa — gratuit, " +
				"pentru oricine, fără cont — și nu există niciun plan de a introduce plată aici.",
		],
	},
];

// Originea cererii pentru meta() (vezi app/lib/seo.ts) + dacă baliza de analitice rulează.
// A doua valoare se citește cu EXACT aceeași condiție ca în `routes/cookie-uri.tsx` — vezi
// `buildFaq` pentru de ce răspunsul despre urmărire n-are voie să fie o constantă.
export function loader({ request, context }: Route.LoaderArgs) {
	return {
		origin: new URL(request.url).origin,
		analytics: BUILD_SITE_MODE === "liber" && analyticsToken(context.cloudflare.env).length > 0,
	};
}

export function meta({ data }: Route.MetaArgs) {
	return [
		...seo({
			title: t("faq.title"),
			description:
				"Răspunsuri simple despre Geo-catedra: e gratuit pentru oricine, fără cont, ce se " +
				"întâmplă cu datele tale și cum poți folosi materialele la clasă.",
			path: "/intrebari-frecvente",
			origin: data?.origin,
		}),
		// Marcajul se construiește din ACELAȘI tablou care randează lista vizibilă (vezi
		// comentariul de la `Segment`). Nu există aici niciun text scris a doua oară.
		//
		// Fără `data` (ramura de eroare, unde loaderul n-a rulat) nu emitem nimic: un `FAQPage`
		// construit pe valoarea implicită a lui `analytics` ar publica în Google exact
		// răspunsul greșit despre urmărire — cel pe care tocmai l-am legat de jeton.
		...(data
			? ldJson(
					faqPageJsonLd(
						buildFaq(data.analytics).map((item) => ({ q: item.q, a: plainText(item.a) })),
						"/intrebari-frecvente",
						data.origin,
					),
				)
			: []),
	];
}

export default function LiberIntrebariFrecvente({ loaderData }: Route.ComponentProps) {
	const faq = buildFaq(loaderData.analytics);

	return (
		<div className="min-h-screen">
			<LiberHeader
				right={
					<Link to="/" className="text-sm underline-offset-4 hover:underline">
						{t("liber.back.home")}
					</Link>
				}
			/>
			<main id="continut" tabIndex={-1} className="prose-ro mx-auto max-w-2xl px-5 py-10">
				<h1 className="text-3xl font-bold">{t("faq.title")}</h1>

				{faq.map((item) => (
					<Fragment key={item.q}>
						<h2>{item.q}</h2>
						<p>{renderSegments(item.a)}</p>
					</Fragment>
				))}
			</main>
			<LiberFooter />
		</div>
	);
}
