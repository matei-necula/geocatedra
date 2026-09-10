import { Link } from "react-router";
import type { Route } from "./+types/liber.jocuri";
import { subjectConfig, t, topicsForGrade } from "../config/subject";
import { getDb } from "../db/client";
import { listMaterialsForGrade } from "../lib/content";
import { LiberFooter, LiberHeader } from "../components/liber/LiberChrome";
import { Breadcrumbs } from "../components/Breadcrumbs";
import { CardThumb } from "../components/GradeBrowse";
import { TypeChip, typeColor } from "../components/TypeChip";
import { Kicker } from "../components/atlas";
import { seo } from "../lib/seo";
import { breadcrumbJsonLd, ldJson, type CrumbRef } from "../lib/jsonld";
import { jocuriPlural } from "../lib/plural";

/**
 * O pagină care este DESPRE jocuri, nu una care trimite spre ele.
 *
 * Până acum fiecare joc trăia îngropat în capitolul lui din `/elevi`, deci niciun URL al
 * sitului nu răspundea la o căutare de tipul „jocuri geografie" — Google avea câte un joc pe
 * rând, niciodată o pagină despre jocuri. O redirectare NU ar fi rezolvat asta: o redirectare
 * înseamnă că adresa nu e o pagină, iar motorul de căutare indexează destinația.
 *
 * Nu ține evidența nimănui: lista se recalculează din materialele publicate de tip `joc`, deci
 * un joc nou apare aici în clipa publicării din `/admin`, fără deploy și fără config.
 */
/** Firimiturile paginii — `Acasă › Jocuri`, nu `Acasă › Elevi › Jocuri`: adresa e `/jocuri`, la
 *  rădăcină, iar o firimitură care arată un părinte inexistent minte și omul, și crawlerul.
 *  Același tablou hrănește navigarea vizibilă și `BreadcrumbList`. */
const CRUMBS: CrumbRef[] = [
	{ label: t("crumb.home"), to: "/" },
	{ label: t("crumb.jocuri") },
];

export function meta({ data }: Route.MetaArgs) {
	return [
		...seo({
			title: t("liber.jocuri.seo"),
			// Pe pagină rămâne `intro` (enumeră toate cele șapte motoare); în <meta> merge varianta
		// scurtă, fiindcă Google taie pe la ~160 de caractere. Vezi comentariul de la cheie.
		description: t("liber.jocuri.meta"),
			path: "/jocuri",
			origin: data?.origin,
		}),
		// Ca pe `/elevi`: doar firimituri. Jocul în sine e o resursă de învățat și își are
		// `LearningResource` pe pagina lui; listarea doar trimite spre ele.
		...ldJson(breadcrumbJsonLd(CRUMBS, data?.origin)),
	];
}

/** Cheia tipului „joc" din `subjectConfig.materialTypes` — motorul nu știe ce e un joc, doar
 *  că există un tip cu cheia asta. Dacă vreodată dispare din config, pagina rămâne goală, nu
 *  crapă (vezi `liber.jocuri.empty`). */
const GAME_TYPE = "joc";

export async function loader({ request, context }: Route.LoaderArgs) {
	const db = getDb(context.cloudflare.env);
	const locale = subjectConfig.defaultLocale;

	// Aceeași regulă ca pe `/elevi`: un loader de listare NU trimite `body` (vezi comentariul de
	// acolo). Un joc are cea mai grea definiție din tot bancul — hărți, buline, runde — iar
	// pagina asta afișează doar titlul, descrierea și miniatura.
	const grades = await Promise.all(
		subjectConfig.grades.map(async (grade) => {
			const all = await listMaterialsForGrade(db, grade.id, locale, "student", false);
			const topicLabels = new Map(topicsForGrade(grade.id).map((tp) => [tp.slug, tp.label]));
			const games = all
				.filter((m) => m.type === GAME_TYPE)
				.map((m) => ({
					id: m.id,
					slug: m.slug,
					type: m.type,
					title: m.title,
					description: m.description,
					topic: topicLabels.get(m.topicSlug) ?? "",
					// Nuanța ilustrației de rezervă vine de la capitol, ca pe `/elevi`, deci
					// aceleași jocuri ies în aceeași culoare pe amândouă paginile.
					topicSlug: m.topicSlug,
				}));
			return { id: grade.id, label: grade.label, games };
		}),
	);

	const withGames = grades.filter((g) => g.games.length > 0);
	const total = withGames.reduce((n, g) => n + g.games.length, 0);

	return { grades: withGames, total, origin: new URL(request.url).origin };
}

export default function LiberJocuri({ loaderData }: Route.ComponentProps) {
	const { grades, total } = loaderData;

	return (
		<>
			<LiberHeader
				right={
					<Link to="/elevi" className="text-sm underline-offset-4 hover:underline">
						{t("liber.back.elevi")}
					</Link>
				}
			/>
			<main id="continut" tabIndex={-1} className="mx-auto max-w-5xl px-5 py-10">
				<Breadcrumbs items={CRUMBS} className="mb-4" />
				<Kicker>{t("liber.jocuri.lead")}</Kicker>
				<h1 className="font-heading mt-2 text-3xl">{t("liber.jocuri.title")}</h1>
				<p className="mt-3 max-w-2xl text-muted">{t("liber.jocuri.intro")}</p>
				{total > 0 && <p className="mt-2 text-sm text-muted">{jocuriPlural(total)}</p>}

				{total === 0 ? (
					<p className="mt-8 rounded-lg border border-dashed border-border p-5 text-sm text-muted">
						{t("liber.jocuri.empty")}
					</p>
				) : (
					grades.map((grade) => (
						<section key={grade.id} className="mt-10">
							{grades.length > 1 && <h2 className="font-heading mb-4 text-2xl">{grade.label}</h2>}
							<div className="stagger grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
								{grade.games.map((m) => (
									<Link
										key={m.id}
										to={`/elevi/${grade.id}/m/${m.slug}`}
										viewTransition
										className="group glow relative flex flex-col overflow-hidden rounded-lg border border-border paper p-5"
									>
										<span aria-hidden className={`index-tab ${typeColor(m.type)}`} />
										<CardThumb title={m.title} type={m.type} seed={m.topicSlug} variant={m.slug} />
										<div className="mt-3 mb-2 flex items-center justify-between gap-2">
											<TypeChip type={m.type} />
											{m.topic && <span className="truncate text-xs text-muted">{m.topic}</span>}
										</div>
										<h3 className="text-lg font-semibold group-hover:text-primary">{m.title}</h3>
										{m.description && <p className="mt-1 line-clamp-2 text-sm text-muted">{m.description}</p>}
									</Link>
								))}
							</div>
						</section>
					))
				)}
			</main>
			<LiberFooter />
		</>
	);
}
