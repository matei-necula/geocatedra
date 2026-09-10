import { Link } from "react-router";
import { t } from "../../config/subject";
import { SiteFooter, SiteHeader } from "../site";

/**
 * Antetul și subsolul instanței libere.
 *
 * Erau, până acum, o copie a lui `SiteHeader`/`SiteFooter` — aceeași formă, alt fișier. Două
 * antete care arată la fel dar se editează separat divergează în tăcere, iar prima dată când
 * cineva schimbă unul și uită celălalt, cele două instanțe încep să arate diferit fără motiv.
 * Acum sunt învelișuri subțiri: aici stă doar CE e specific instanței libere — cele două uși
 * în bara de sus, și niciun buton de ieșire, pentru că aici nu există sesiuni.
 *
 * Semnătura publică (`{ right? }`) e neschimbată, deci nicio rută existentă nu se atinge.
 */
/**
 * „Sari la conținut" — primul element focusabil din pagină, invizibil până la Tab.
 *
 * Fără el, un vizitator care navighează cu tastatura trece prin tot antetul pe FIECARE pagină
 * ca să ajungă la conținut; pe `/elevi`, cu capitolele pliate, drumul până la primul card e și
 * mai lung. E singura nereușită de nivel A pe care a găsit-o auditul.
 *
 * Ținta e `<main id="continut" tabIndex={-1}>`. `tabIndex` e obligatoriu acolo: fără el, o parte
 * din browsere mută ancora, dar nu și focusul de tastatură, deci saltul pare că nu face nimic.
 *
 * Stă doar pe instanța liberă, nu în `SiteHeader`: paginile site-ului cu clase n-au încă ținta,
 * iar un link de salt care nu aterizează nicăieri e mai rău decât niciunul.
 */
function SkipLink() {
	return (
		<a
			href="#continut"
			className="sr-only focus:not-sr-only focus:fixed focus:start-3 focus:top-3 focus:z-50 focus:rounded-md focus:border focus:border-border focus:bg-surface focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-primary"
		>
			{t("a11y.skip")}
		</a>
	);
}

export function LiberHeader({ right }: { right?: React.ReactNode }) {
	return (
		<>
			<SkipLink />
			<SiteHeader
				nav={
					<>
						<Link to="/elevi" className="text-sm underline-offset-4 hover:underline">
							{t("liber.door.elevi")}
						</Link>
						<Link to="/pedagogie" className="text-sm underline-offset-4 hover:underline">
							{t("liber.door.profesori")}
						</Link>
					</>
				}
				right={right}
			/>
		</>
	);
}

export function LiberFooter() {
	// „Păreri" stă lângă cele legale, nu în bara de sus: e o invitație, nu o ușă principală.
	// Ruta există doar în bundle-ul liber, de-aia linkul se pune de aici, nu în `SiteFooter`.
	return (
		<SiteFooter
			links={
				<Link to="/pareri" className="hover:text-ink">
					{t("reviews.title")}
				</Link>
			}
		/>
	);
}
