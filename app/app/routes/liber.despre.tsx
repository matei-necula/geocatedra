import { Link } from "react-router";
import type { Route } from "./+types/liber.despre";
import { subjectConfig, t } from "../config/subject";
import { LiberFooter, LiberHeader } from "../components/liber/LiberChrome";
import { Breadcrumbs } from "../components/Breadcrumbs";
import { Kicker } from "../components/atlas";
import { seo } from "../lib/seo";
import { aboutPageJsonLd, breadcrumbJsonLd, ldJson, type CrumbRef } from "../lib/jsonld";

/**
 * „Despre autoare" — pagina de încredere a sitului (docs/09-seo-strategy.md, punctul 10).
 *
 * De ce există: pentru un sit făcut de un singur om, „cine a scris astea" e cel mai puternic
 * semnal de Experiență/Expertiză pe care îl poate da — și era singurul care lipsea cu totul.
 * Un cititor care aterizează pe o schemă de lecție și nu găsește nicăieri un nume nu are cum
 * să decidă dacă merită încredere; nici cititorul om, nici cel algoritmic.
 *
 * **Nimic nu se scrie de mână aici.** Numele vine din `subjectConfig.author`, textele din
 * `strings` — aceleași chei pe care le citește și marcajul `Person` din `lib/jsonld.ts`. Dacă
 * ar exista două locuri unde stă numele autoarei, ele ar diverge la prima corectură, iar Google
 * retrage rezultatele bogate exact pentru marcajul care nu se regăsește pe pagină.
 *
 * **Pagina e și un nod de legături interne**, nu doar un text: secțiunea „Ce am publicat aici"
 * leagă efectiv cele două biblioteci, pagina de jocuri și fiecare dintre rafturile de pedagogie.
 * Fiind legată din subsolul FIECĂREI pagini, e singurul loc din sit din care se ajunge într-un
 * clic la orice raft — exact ce cere strategia la capitolul de legături interne.
 *
 * **Când `subjectConfig.author` lipsește** (câmpul e opțional — altă materie, alt profesor,
 * config nou), pagina NU dă 404 și NU inventează un nume: se randează fără kicker, fără
 * biografie și fără repere, păstrând secțiunile care nu depind de o persoană (ce e publicat,
 * de ce nu se descarcă, cum se ia legătura). Motivul e concret: linkul din subsol și intrarea
 * din sitemap sunt statice, deci un 404 aici ar însemna un link mort în subsolul fiecărei
 * pagini și o adresă moartă trimisă la indexare. `aboutPageJsonLd` întoarce oricum `null` în
 * cazul ăsta, iar `ldJson` sare peste el — deci marcajul nu minte, pur și simplu lipsește.
 */

// Trivial loader whose only job is to hand meta() the request origin (see app/lib/seo.ts).
export function loader({ request }: Route.LoaderArgs) {
	return { origin: new URL(request.url).origin };
}

/** Firimiturile, o singură dată: același tablou merge și la `<Breadcrumbs>`, și în marcaj. */
const CRUMBS: CrumbRef[] = [
	{ label: t("crumb.home"), to: "/" },
	{ label: t("about.title") },
];

export function meta({ data }: Route.MetaArgs) {
	return [
		...seo({
			title: t("about.seo"),
			description: t("about.meta_desc"),
			path: "/despre",
			origin: data?.origin,
		}),
		...ldJson(breadcrumbJsonLd(CRUMBS, data?.origin), aboutPageJsonLd("/despre", data?.origin)),
	];
}

/**
 * Cum se ia legătura cu autoarea.
 *
 * Aceeași regulă ca la `ContactOperator` (components/site.tsx): adresa se publică doar dacă
 * există în config, altfel se trimite cinstit spre singurul canal public de scris, `/pareri`.
 * Nu refolosim direct `ContactOperator` pentru că acela e textul juridic al operatorului de
 * date (Art. 13 GDPR) — „Operator de date: …" pe o pagină personală ar suna a formular, nu a
 * invitație. Forma e împrumutată, textul e al paginii ăsteia.
 *
 * `/pareri` există sigur: ruta asta trăiește doar în bundle-ul liber (routes.ts, `liberOnly`),
 * unde `/pareri` e la fel de prezentă — deci aici nu e nevoie de ramificația pe instanță pe
 * care o are `ContactOperator`.
 */
function ContactAutoare() {
	return (
		<p>
			{t("about.contact.text")}{" "}
			{subjectConfig.contactEmail ? (
				<a href={`mailto:${subjectConfig.contactEmail}`} className="text-primary hover:underline">
					{subjectConfig.contactEmail}
				</a>
			) : (
				<>
					Scrie-mi prin formularul de la{" "}
					<Link to="/pareri" className="text-primary hover:underline">
						Păreri
					</Link>
					.
				</>
			)}
		</p>
	);
}

export default function LiberDespre() {
	const author = subjectConfig.author;

	// Rafturile se citesc din config, nu se scriu de mână: un raft nou apare aici singur,
	// fără să atingă nimeni pagina asta (aceeași regulă ca la /intrebari-frecvente).
	const rafturi = subjectConfig.teacherCollections;

	return (
		<div className="min-h-screen">
			<LiberHeader
				right={
					<Link to="/" className="text-sm underline-offset-4 hover:underline">
						{t("liber.back.home")}
					</Link>
				}
			/>
			<main id="continut" tabIndex={-1} className="mx-auto max-w-2xl px-5 py-10">
				{/* Firimiturile stau ÎN AFARA blocului `prose-ro`: acolo `ol > li` primește un
				    contor („1. 2."), care pe un drum de navigare ar arăta a listă numerotată. */}
				<Breadcrumbs items={CRUMBS} className="mb-6" />

				{/* Kicker și `h1` stau tot în afara blocului `prose-ro`, ca pe celelalte pagini
				    libere: `.prose-ro > p:first-of-type` e stilul de „lead" (mai mare, ușor
				    virat spre primar) și trebuie să cadă pe primul paragraf de biografie, nu pe
				    kicker, care are deja stilul lui. */}
				{author && <Kicker>{t("about.kicker")}</Kicker>}
				<h1 className="font-heading mt-2 text-3xl">{t("about.title")}</h1>

				<div className="prose-ro mt-6">
					{author?.bioKeys.map((key) => (
						<p key={key}>{t(key)}</p>
					))}

					{author && author.credentialKeys.length > 0 && (
						<>
							<h2>{t("about.credentials.title")}</h2>
							<ul>
								{author.credentialKeys.map((key) => (
									<li key={key}>{t(key)}</li>
								))}
							</ul>
						</>
					)}

					{/* Secțiunea care face pagina utilă și pentru cititor, și pentru indexare: din
					    subsol se ajunge aici de pe orice pagină, iar de aici într-un clic în oricare
					    raft. Descrierea fără legături ar fi fost doar text. */}
					<h2>{t("about.work.title")}</h2>
					<ul>
						<li>
							<Link to="/elevi" className="text-primary hover:underline">
								{t("liber.door.elevi")}
							</Link>{" "}
							— {t("liber.door.elevi.desc")}
						</li>
						<li>
							<Link to="/jocuri" className="text-primary hover:underline">
								{t("liber.jocuri.title")}
							</Link>{" "}
							— {t("liber.jocuri.lead")}
						</li>
						<li>
							<Link to="/pedagogie" className="text-primary hover:underline">
								{t("liber.door.profesori")}
							</Link>{" "}
							— {t("liber.door.profesori.desc")}
						</li>
					</ul>
					<ul>
						{rafturi.map((c) => (
							<li key={c.slug}>
								<Link to={`/pedagogie/${c.slug}`} className="text-primary hover:underline">
									{t(c.labelKey)}
								</Link>{" "}
								— {t(c.descKey)}
							</li>
						))}
					</ul>
					<p>{t("curriculum.note")}</p>

					<h2>{t("about.nodownload.title")}</h2>
					<p>{t("about.nodownload.text")}</p>

					<h2>{t("about.contact.title")}</h2>
					<ContactAutoare />
				</div>
			</main>
			<LiberFooter />
		</div>
	);
}
