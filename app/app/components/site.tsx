import { Link } from "react-router";
import { subjectConfig, t } from "../config/subject";
import { ThemeToggle } from "./ThemeToggle";
import { BUILD_SITE_MODE } from "../lib/site-mode";

/**
 * Marca „Geo-catedra": un glob văzut din profil — disc plin, tăiat de un meridian și de
 * linia ecuatorului.
 *
 * E desenată, nu compusă dintr-o literă într-un pătrat, pentru că același desen trebuie să
 * fie și în pagină, și în fișierele de icoane (`scripts/gen-icons.mjs` îl repetă). O literă
 * randată de browser cu fontul disponibil nu poate fi reprodusă identic într-un PNG generat.
 *
 * Culorile vin din temă, deci marca se schimbă singură între instanțe și între moduri.
 */
export function Logo({ size = 40 }: { size?: number }) {
	return (
		<svg
			width={size}
			height={size}
			viewBox="0 0 40 40"
			fill="none"
			aria-hidden
			className="shrink-0"
		>
			<circle cx="20" cy="20" r="19" fill="var(--color-primary)" />
			{/* Meridianul: o elipsă strânsă pe verticală. Ecuatorul: o linie orizontală.
			    Împreună citesc ca un glob chiar și la 16px, unde detaliile dispar. */}
			<ellipse cx="20" cy="20" rx="8.5" ry="19" stroke="var(--color-on-primary)" strokeWidth="2" opacity="0.85" />
			<path d="M1 20h38" stroke="var(--color-on-primary)" strokeWidth="2" opacity="0.85" />
			<circle cx="20" cy="20" r="19" stroke="var(--color-on-primary)" strokeWidth="2" opacity="0.85" />
		</svg>
	);
}

/**
 * Antetul comun al ambelor instanțe.
 *
 * `nav` sunt legăturile din mijloc (instanța liberă își pune acolo cele două uși; cea cu
 * clase nu pune nimic). `right` rămâne exact ce era — zona de acțiuni din dreapta. Semnătura
 * n-a fost restrânsă, deci rutele care foloseau `SiteHeader` nu se ating.
 */
export function SiteHeader({ nav, right }: { nav?: React.ReactNode; right?: React.ReactNode }) {
	return (
		<header className="bg-bg/80 backdrop-blur">
			<div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-5 py-3">
				{/* `whitespace-nowrap`: pe telefon, „Geo-catedra" se rupea la cratimă și numele
				    site-ului apărea pe două rânduri, în antet. */}
				<Link to="/" viewTransition className="flex shrink-0 items-center gap-3">
					<Logo size={36} />
					<span className="font-heading text-xl font-bold whitespace-nowrap">{subjectConfig.siteName}</span>
				</Link>
				<div className="flex items-center gap-3">
					{nav}
					<ThemeToggle />
					{right}
				</div>
			</div>
			<div aria-hidden className="h-[3px] border-t border-b border-ink/15" />
		</header>
	);
}

/**
 * Subsolul comun. Poartă singur containerul (`mx-auto max-w-5xl px-5`) pentru că e folosit
 * în două poziții diferite: pe instanța cu clase stă ÎNĂUNTRUL unui `<main>` deja îngustat,
 * pe cea liberă stă direct în pagină. Un container repetat înăuntrul altuia identic nu
 * schimbă nimic; lipsa lui, în schimb, ar întinde subsolul pe toată lățimea ecranului.
 */
/**
 * `links` sunt legături SUPLIMENTARE lângă cele legale, pentru instanța care le are. Există
 * ca prop, nu ca linie scrisă direct aici, pentru că `/pareri` trăiește doar pe instanța
 * liberă: pusă în subsolul comun, ar fi apărut și pe site-ul cu clase, unde ruta nici nu e în
 * bundle — adică un link mort în fiecare pagină. Semnătura veche (`{ className? }`) rămâne
 * validă, deci niciun apelant existent nu se atinge.
 */
export function SiteFooter({ className = "", links }: { className?: string; links?: React.ReactNode }) {
	return (
		<footer className={`mx-auto mt-16 max-w-5xl px-5 py-8 text-center text-sm text-muted ${className}`}>
			<div aria-hidden className="mb-8 h-[3px] border-t border-b border-ink/15" />
			<p>
				<span className="font-heading italic">{subjectConfig.siteName}</span> — {subjectConfig.strings["footer.note"]}
			</p>
			<p className="mx-auto mt-3 max-w-xl text-xs text-muted">
				{subjectConfig.strings["footer.copyright"].replace("{year}", String(new Date().getFullYear()))}
			</p>
			<p className="mt-2 flex flex-wrap justify-center gap-4">
				<Link to="/confidentialitate" className="hover:text-ink">
					{subjectConfig.strings["footer.privacy"]}
				</Link>
				<Link to="/termeni" className="hover:text-ink">
					{subjectConfig.strings["footer.terms"]}
				</Link>
				<Link to="/cookie-uri" className="hover:text-ink">
					{subjectConfig.strings["footer.cookies"]}
				</Link>
				{/* Rutele /intrebari-frecvente și /despre există doar în bundle-ul liber (routes.ts,
				    liberOnly) — pe instanța cu clase linkurile ar duce la pagini inexistente,
				    deci se randează doar când modul de build e „liber".

				    „Despre autoare" stă în subsol, nu în bara de sus, tocmai ca să apară pe
				    FIECARE pagină: e semnalul de încredere al sitului (cine a scris astea) și,
				    în același timp, singura legătură internă care duce într-un clic în oricare
				    raft de pedagogie, de oriunde din sit. */}
				{BUILD_SITE_MODE === "liber" && (
					<>
						<Link to="/intrebari-frecvente" className="hover:text-ink">
							{t("footer.faq")}
						</Link>
						<Link to="/despre" className="hover:text-ink">
							{t("footer.about")}
						</Link>
					</>
				)}
				{links}
			</p>
		</footer>
	);
}

/**
 * Identitatea operatorului de date (Art. 13 GDPR) — comună celor două pagini legale care au
 * nevoie de ea (`/confidentialitate`, `/termeni`). Trăiește aici, o singură dată, ca numele și
 * adresa de contact să nu poată diverge între cele două pagini care le repetă.
 *
 * `contactEmail` e gol până se cumpără domeniul propriu (`config/subject.ts`) — CLAUDE.md
 * interzice orice domeniu scris direct în cod, iar adresa personală a autoarei n-are ce căuta
 * pe o pagină publică. Până atunci alternativa depinde de instanță: pe cea liberă există
 * `/pareri`, unicul canal public de scris ceva, deci se leagă direct; pe cea cu clase ruta aia
 * nici nu e în bundle (`routes.ts`, `liberOnly`), deci fallback-ul o descrie fără s-o lege —
 * un link mort ar fi mai rău decât un text simplu.
 */
export function ContactOperator() {
	if (subjectConfig.contactEmail) {
		return (
			<p>
				Operator de date: <strong>Liliana Necula</strong>. Ne poți scrie la{" "}
				<a href={`mailto:${subjectConfig.contactEmail}`} className="text-primary hover:underline">
					{subjectConfig.contactEmail}
				</a>
				.
			</p>
		);
	}
	return (
		<p>
			Operator de date: <strong>Liliana Necula</strong>. Adresa de contact dedicată se publică o
			dată cu domeniul propriu al site-ului.{" "}
			{BUILD_SITE_MODE === "liber" ? (
				<>
					Până atunci, cel mai sigur mod de a ne scrie este formularul de la{" "}
					<Link to="/pareri" className="text-primary hover:underline">
						Păreri
					</Link>
					.
				</>
			) : (
				<>
					Până atunci, cel mai sigur mod de a ne scrie este formularul „Păreri” de pe site-ul
					liber al aceleiași autoare.
				</>
			)}
		</p>
	);
}
