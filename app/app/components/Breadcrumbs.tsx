import { Link } from "react-router";
import type { CrumbRef } from "../lib/jsonld";

/**
 * Firimituri de navigare — vizibile, nu doar în marcaj.
 *
 * Perechea lor structurată e `breadcrumbJsonLd` din `lib/jsonld.ts`, iar amândouă primesc
 * ACELAȘI tablou `CrumbRef[]`. Regula Google pentru rezultate bogate cere ca marcajul să
 * corespundă cu ce vede omul pe pagină; o singură sursă e singurul fel în care rămâne
 * adevărat și după următoarea editare.
 *
 * Ultima firimitură e pagina curentă: se randează ca text, nu ca link (`aria-current="page"`),
 * fiindcă un link către pagina pe care ești deja e zgomot pentru cititorul de ecran.
 *
 * Înlocuiește linia de context care exista deja pe paginile de material („Clasa a 9-a ·
 * Hidrosfera") — nu se adaugă peste ea, ca să nu apară același drum de două ori.
 */
export function Breadcrumbs({ items, className = "" }: { items: CrumbRef[]; className?: string }) {
	if (items.length === 0) return null;

	return (
		<nav aria-label="Firimituri" className={`text-sm text-muted ${className}`}>
			<ol className="flex flex-wrap items-center gap-x-2 gap-y-1">
				{items.map((c, i) => {
					const last = i === items.length - 1;
					return (
						<li key={`${c.to ?? c.label}-${i}`} className="flex items-center gap-2">
							{i > 0 && (
								<span aria-hidden className="opacity-50">
									›
								</span>
							)}
							{c.to && !last ? (
								<Link to={c.to} className="underline-offset-4 hover:text-ink hover:underline">
									{c.label}
								</Link>
							) : (
								<span aria-current={last ? "page" : undefined} className={last ? "text-ink/70" : ""}>
									{c.label}
								</span>
							)}
						</li>
					);
				})}
			</ol>
		</nav>
	);
}
