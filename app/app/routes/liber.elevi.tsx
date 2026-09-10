import { Link } from "react-router";
import type { Route } from "./+types/liber.elevi";
import { subjectConfig, t, topicsForGrade } from "../config/subject";
import { getDb } from "../db/client";
import { listMaterialsForGrade } from "../lib/content";
import type { MaterialView } from "../lib/content";
import { countPublished } from "../lib/questions";
import { LiberFooter, LiberHeader } from "../components/liber/LiberChrome";
import { GradeBrowse } from "../components/GradeBrowse";
import { Breadcrumbs } from "../components/Breadcrumbs";
import { Kicker } from "../components/atlas";
import { seo } from "../lib/seo";
import { breadcrumbJsonLd, ldJson, type CrumbRef } from "../lib/jsonld";

/** Firimiturile paginii de listare — două trepte, atât. Stau aici, în modul, nu în loader:
 *  spre deosebire de paginile de material, nu depind de nimic din bază, iar `meta()` și
 *  componenta citesc ACELAȘI tablou, ceea ce e tot ce cere regula „marcajul = ce se vede". */
const CRUMBS: CrumbRef[] = [
	{ label: t("crumb.home"), to: "/" },
	{ label: t("crumb.elevi") },
];

export function meta({ data }: Route.MetaArgs) {
	return [
		...seo({
			title: t("liber.elevi.seo"),
			description:
				"Lecții, galerii foto, jocuri interactive și teste grilă la geografie, grupate pe capitole — " +
				"gratuit, fără cont, pentru orice elev.",
			path: "/elevi",
			origin: data?.origin,
		}),
		// Doar firimituri: pagina e o listare, nu o resursă de învățat. Un `LearningResource`
		// aici ar descrie o pagină care nu predă nimic, iar un marcaj care nu corespunde
		// conținutului e exact felul de greșeală pentru care Google retrage rezultatele bogate.
		...ldJson(breadcrumbJsonLd(CRUMBS, data?.origin)),
	];
}

/**
 * Exact câmpurile pe care `GradeBrowse` le randează pentru un card din listare — vezi
 * `MaterialCard` din `components/GradeBrowse.tsx`. `MaterialView` mai poartă `gradeId`,
 * `topicSlug`, `library`, `isTeaser` (nefolosite aici, `topicSlug` doar cât filtrăm mai jos) și,
 * mai ales, `body` — JSON-ul complet al lecției/jocului/grilei. Pe o pagină cu ~60 de materiale,
 * `body` era tot payload-ul de hidratare al paginii; cardul nu-l afișează niciodată.
 */
interface EleviMaterialCard {
	id: string;
	slug: string;
	type: string;
	title: string;
	description: string;
	status: string;
	createdAt: number;
}

function toCard(m: MaterialView): EleviMaterialCard {
	return {
		id: m.id,
		slug: m.slug,
		type: m.type,
		title: m.title,
		description: m.description,
		status: m.status,
		createdAt: m.createdAt,
	};
}

export async function loader({ request, context }: Route.LoaderArgs) {
	const db = getDb(context.cloudflare.env);
	const locale = subjectConfig.defaultLocale;

	// Gruparea e pe CLASĂ, apoi pe temă. Azi există o singură clasă cu materiale publicate,
	// deci pagina arată ca „toate materialele". Când se adaugă clasa a 10-a, apare singură a
	// doua grupă — fără nicio modificare de cod.
	const grades = await Promise.all(
		subjectConfig.grades.map(async (grade) => {
			const materials = await listMaterialsForGrade(db, grade.id, locale, "student", false);
			const topics = await Promise.all(
				topicsForGrade(grade.id).map(async (topic) => ({
					...topic,
					materials: materials.filter((m) => m.topicSlug === topic.slug).map(toCard),
					quizCount: await countPublished(db, grade.id, topic.slug),
				})),
			);
			return { id: grade.id, label: grade.label, count: materials.length, topics };
		}),
	);

	return {
		// Nu se filtrează după `count > 0`: clasele fără materiale încă (10-12, în așteptarea
		// noii programe) trebuie să apară oricum, cu mesajul din `grade.noticeKey` — vezi
		// ramura „topics.length === 0" din `GradeBrowse`. Ascunderea lor completă (ca înainte)
		// lăsa impresia că site-ul acoperă doar clasa a 9-a, nu întregul liceu.
		grades,
		origin: new URL(request.url).origin,
	};
}

export default function LiberElevi({ loaderData }: Route.ComponentProps) {
	const { grades } = loaderData;

	return (
		<>
			<LiberHeader right={<Link to="/" className="text-sm underline-offset-4 hover:underline">{t("liber.back.home")}</Link>} />
			<main id="continut" tabIndex={-1} className="mx-auto max-w-5xl px-5 py-10">
				<Breadcrumbs items={CRUMBS} className="mb-4" />
				<Kicker>{t("liber.hero.lead")}</Kicker>
				<h1 className="font-heading mt-2 text-3xl">{t("liber.elevi.title")}</h1>

				{/* Singurul link intern către /jocuri. Fără el pagina ar exista doar în sitemap —
				    o pagină la care nu duce niciun link din site e un semnal slab pentru motoarele
				    de căutare și, mai important, invizibilă pentru un elev care răsfoiește. */}
				<Link
					to="/jocuri"
					viewTransition
					className="glow mt-4 inline-flex items-center gap-2.5 rounded-lg border border-border paper px-4 py-2.5 text-sm font-semibold text-primary"
				>
					<span aria-hidden className="text-base">✦</span>
					{t("liber.elevi.jocuri_cta")}
					<span aria-hidden className="ml-auto">→</span>
				</Link>

				{grades.map((grade) => (
					<section key={grade.id} className="mt-10">
						{grades.length > 1 && <h2 className="font-heading mb-4 text-2xl">{grade.label}</h2>}
						<GradeBrowse
							gradeId={grade.id}
							topics={grade.topics}
							isAdmin={false}
							newSince={null}
							base="elevi"
							collapsible
						/>
					</section>
				))}
			</main>
			<LiberFooter />
		</>
	);
}
