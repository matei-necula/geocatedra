import { Link, redirect } from "react-router";
import type { Route } from "./+types/liber.pedagogie.$collection";
import { subjectConfig, t } from "../config/subject";
import { getDb } from "../db/client";
import { listTeacherCollection } from "../lib/content";
import type { MaterialView } from "../lib/content";
import { thumbsForMaterials } from "../lib/assets";
import { materialePlural, plansePlural } from "../lib/plural";
import { LiberFooter, LiberHeader } from "../components/liber/LiberChrome";
import { Breadcrumbs } from "../components/Breadcrumbs";
import { TypeChip } from "../components/TypeChip";
import { seo } from "../lib/seo";
import { breadcrumbJsonLd, ldJson, type CrumbRef } from "../lib/jsonld";

export function meta({ data }: Route.MetaArgs) {
	return [
		...seo({
			title: data?.label ?? "",
			// NU `desc` simplu: are 32 de caractere („Scheme gata de folosit la clasă."), potrivit
			// pe pagină, lângă titlu și listă, dar prea subțire într-un rezultat de căutare, unde
			// e tot ce vede omul. `seoDesc` îl compune cu numărul REAL de materiale din raft, deci
			// nu poate promite altceva decât ce e publicat. Fără `data`, cădem pe `desc`.
			description: data?.seoDesc ?? data?.desc,
			path: `/pedagogie/${data?.slug ?? ""}`,
			origin: data?.origin,
		}),
		// Firimiturile vizibile și `BreadcrumbList` pleacă din același tablou construit în loader
		// (vezi `components/Breadcrumbs.tsx`): Google cere ca marcajul să corespundă cu ce se vede,
		// iar două liste scrise separat diverg la prima redenumire de raft.
		//
		// N-am adăugat un nod `CollectionPage`/`ItemList` peste el. Ar fi fost o a doua listă cu
		// exact aceleași titluri pe care le are deja pagina, fără nimic în plus pentru cineva care
		// citește rezultatul căutării — iar `lib/jsonld.ts` are regula scrisă: ce nu adaugă nimic
		// cinstit nu se emite.
		...ldJson(breadcrumbJsonLd(data?.crumbs ?? [], data?.origin)),
	];
}

/**
 * Exact câmpurile pe care le randează un rând din listă. `MaterialView` mai poartă `library`,
 * `isTeaser`, `status`, `createdAt`, `topicSlug` (aici e chiar raftul, deci se repetă de N ori)
 * și, mai ales, `body` — JSON-ul teancului de pagini.
 *
 * **Regula, aceeași ca pe `/elevi` (466 kB → 147 kB): un loader de listă nu trimite `body`.**
 * Pe rafturile de pedagogie `body` e mic (`{"kind":"pagini","count":11}`), deci câștigul se
 * măsoară în sute de octeți, nu în sute de kiloocteți — dar regula nu e despre mărimea de azi.
 * Un raft primește mâine un joc sau o grilă, al căror `body` e de zeci de kiloocteți, iar
 * pagina de listă n-are de unde să știe: proiecția e singurul loc în care se poate garanta.
 */
interface ShelfMaterialCard {
	/** Cheia pentru miniatură și numărul de planșe (`thumbs`/`pages`). */
	id: string;
	slug: string;
	type: string;
	title: string;
	description: string;
}

function toCard(m: MaterialView): ShelfMaterialCard {
	return { id: m.id, slug: m.slug, type: m.type, title: m.title, description: m.description };
}

export async function loader({ request, params, context }: Route.LoaderArgs) {
	const collection = subjectConfig.teacherCollections.find((c) => c.slug === params.collection);
	if (!collection) throw redirect("/pedagogie");

	// `includeUnpublished` rămâne implicit false — ciornele nu ies pe internet.
	const materials = await listTeacherCollection(getDb(context.cloudflare.env), collection.slug, subjectConfig.defaultLocale);

	const { first, count } = await thumbsForMaterials(
		getDb(context.cloudflare.env),
		materials.map((m) => m.id),
	);

	const byGrade = subjectConfig.grades
		.map((g) => ({ id: g.id, label: g.label, materials: materials.filter((m) => m.gradeId === g.id).map(toCard) }))
		.filter((g) => g.materials.length > 0);

	const label = t(collection.labelKey);
	const crumbs: CrumbRef[] = [
		{ label: t("crumb.home"), to: "/" },
		{ label: t("crumb.pedagogie"), to: "/pedagogie" },
		{ label },
	];

	const desc = t(collection.descKey);

	return {
		slug: collection.slug,
		label,
		desc,
		// Se calculează aici, unde numărul de materiale e deja în mână — `meta()` n-are acces
		// la nimic în afară de `data`. Vezi comentariul de acolo.
		seoDesc: t("teacher.shelf.seo.desc")
			.replace("{desc}", desc)
			.replace("{n}", materialePlural(materials.length)),
		byGrade,
		thumbs: first,
		pages: count,
		crumbs,
		origin: new URL(request.url).origin,
	};
}

/** „Pregătit de {name}, {role}." — sau nimic, dacă instanța n-are autoare declarată.
 *  `subjectConfig.author` e opțional (vezi `config/types.ts`): o propoziție pe jumătate umplută,
 *  cu „{name}" rămas în text, ar strica exact semnalul de încredere pentru care există linia. */
function signature(): string | null {
	const author = subjectConfig.author;
	if (!author) return null;
	return t("teacher.shelf.signature").replace("{name}", author.name).replace("{role}", t(author.roleKey));
}

export default function LiberRaft({ loaderData }: Route.ComponentProps) {
	const { slug, label, desc, byGrade, thumbs, pages, crumbs } = loaderData;
	// Celelalte patru rafturi. Se citesc din config, nu din loader: sunt date de construcție,
	// aceleași la fiecare cerere, deci n-au ce căuta în sarcina de hidratare.
	const otherShelves = subjectConfig.teacherCollections.filter((c) => c.slug !== slug);
	const semnatura = signature();

	return (
		<>
			<LiberHeader right={<Link to="/pedagogie" className="text-sm underline-offset-4 hover:underline">{t("liber.back.pedagogie")}</Link>} />
			<main id="continut" tabIndex={-1} className="mx-auto max-w-5xl px-5 py-10">
				<Breadcrumbs items={crumbs} className="mb-4" />
				<h1 className="font-heading text-3xl">{label}</h1>

				{/* Descrierea raftului stătea într-un `<Kicker>` DEASUPRA titlului. A coborât aici,
				    sub un titlu de secțiune propriu, și kicker-ul a dispărut — n-am păstrat
				    amândouă, fiindcă același text de două ori pe aceeași pagină nu ajută nici
				    cititorul, nici motorul de căutare, care vede duplicat în loc de conținut.
				    Contextul pe care îl dădea kicker-ul („unde sunt?") îl dau acum firimiturile,
				    care îl spun mai bine: cu drumul întreg și cu linkuri. */}
				<section className="mt-6 max-w-2xl">
					<h2 className="font-heading text-xl">{t("teacher.shelf.about.title")}</h2>
					<p className="mt-2 text-muted">{desc}</p>
					{/* Cele două linii de dedesubt sunt singurul semnal de experiență/expertiză pe
					    care îl are un sit făcut de un singur om: cine a pregătit materialele și
					    după ce programă. Numele vine din `subjectConfig.author`, același din care
					    se construiește pagina „Despre autoare" și nodul `Person` din marcaj — o
					    singură sursă, deci nu se pot contrazice. */}
					{semnatura && <p className="mt-3 text-sm font-medium">{semnatura}</p>}
					<p className="mt-1 text-sm text-muted">{t("curriculum.note")}</p>
				</section>

				{byGrade.map((grade) => (
					<section key={grade.id} className="mt-8">
						{byGrade.length > 1 && <h2 className="font-heading mb-3 text-xl">{grade.label}</h2>}
						<ul className="grid gap-3">
							{grade.materials.map((m) => (
								<li key={m.id}>
									<Link
										to={`/pedagogie/m/${grade.id}/${m.slug}`}
										viewTransition
										className="glow flex gap-4 rounded-lg border border-border bg-surface p-4"
									>
										{/* Coperta e prima planșă a teancului. Îngustă și pe stânga: lista
										    de raft e o listă de titluri, nu o galerie — imaginea ajută la
										    recunoaștere, nu trebuie să domine rândul. */}
										{thumbs[m.id] && (
											<img
												src={`/media/${thumbs[m.id]}?t`}
												alt=""
												aria-hidden
												loading="lazy"
												decoding="async"
												width={160}
												height={90}
												className="hidden h-20 w-32 shrink-0 rounded border border-border bg-bg object-cover object-top sm:block"
											/>
										)}
										<div className="min-w-0">
											<TypeChip type={m.type} />
											<h3 className="mt-1 text-lg font-semibold">{m.title}</h3>
											{m.description && <p className="mt-1 text-sm text-muted">{m.description}</p>}
											{pages[m.id] > 0 && (
												<p className="mt-2 text-sm text-muted">{plansePlural(pages[m.id])}</p>
											)}
										</div>
									</Link>
								</li>
							))}
						</ul>
					</section>
				))}

				{/* Rafturile erau cinci insule: se ajungea la ele doar din `/pedagogie`, niciodată
				    unul dintr-altul. Blocul ăsta le leagă între ele — pentru cineva care a deschis
				    „Scheme de lecție" dintr-o căutare și n-a văzut niciodată pagina-mamă, e singurul
				    drum spre restul bibliotecii. */}
				{otherShelves.length > 0 && (
					<section className="mt-12 border-t border-border pt-6">
						<h2 className="font-heading text-xl">{t("teacher.shelf.other_shelves")}</h2>
						<ul className="mt-3 grid gap-2 sm:grid-cols-2">
							{otherShelves.map((c) => (
								<li key={c.slug}>
									<Link
										to={`/pedagogie/${c.slug}`}
										viewTransition
										className="glow flex flex-col rounded-lg border border-border bg-surface px-4 py-3"
									>
										<span className="font-medium text-primary">{t(c.labelKey)}</span>
										<span className="mt-0.5 text-sm text-muted">{t(c.descKey)}</span>
									</Link>
								</li>
							))}
						</ul>
					</section>
				)}
			</main>
			<LiberFooter />
		</>
	);
}
