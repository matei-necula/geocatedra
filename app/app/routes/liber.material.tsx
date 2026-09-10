import { Link } from "react-router";
import type { Route } from "./+types/liber.material";
import { gradeById, subjectConfig, t, topicsForGrade } from "../config/subject";
import { getDb } from "../db/client";
import { getMaterialBySlug, listMaterialsForGrade } from "../lib/content";
import { listAssets } from "../lib/assets";
import { countPublished } from "../lib/questions";
import { resolveViewer } from "../lib/guard";
import { resolveVisibility } from "../lib/entitlement";
import { MaterialRenderer } from "../components/MaterialRenderer";
import { Attachments } from "../components/Attachments";
import { Breadcrumbs } from "../components/Breadcrumbs";
import { LiberFooter, LiberHeader } from "../components/liber/LiberChrome";
import { TypeChip } from "../components/TypeChip";
import { Plate } from "../components/atlas";
import { seo } from "../lib/seo";
import { breadcrumbJsonLd, educationalLevelLabel, ldJson, learningResourceJsonLd, type CrumbRef } from "../lib/jsonld";

const SELF_RENDERING_TYPES = new Set(["foto", "fisier", "joc", "prezentare"]);

/** Tipurile pe care elevul le ATINGE, nu doar le citește — `interactivityType` din schema.org.
 *  Lista e derivată din cheile din `subjectConfig.materialTypes`, nu din numele materiei: un
 *  motor nou de joc intră aici doar dacă i se dă un tip nou, ceea ce e o decizie de config. */
const ACTIVE_TYPES = new Set(["joc", "interactiv"]);

/** Câte materiale-frate arată raftul „Alte materiale din acest capitol". Patru încap pe două
 *  rânduri de câte două pe telefon și nu împing navigarea înainte/înapoi sub trei ecrane. */
const RELATED_MAX = 4;

export function meta({ data }: Route.MetaArgs) {
	return [
		...seo({
			title: data?.material.title ?? "Material",
			description: data?.material.description,
			path: `/elevi/${data?.grade.id ?? ""}/m/${data?.material.slug ?? ""}`,
			origin: data?.origin,
		}),
		// Firimiturile din marcaj sunt ACELEAȘI obiecte pe care le randează `<Breadcrumbs>` mai
		// jos — vin amândouă din `data.crumbs`, calculat o singură dată în loader. Google cere ca
		// marcajul să corespundă cu ce vede omul; două tablouri scrise separat ar diverge la
		// prima editare. `breadcrumbJsonLd` întoarce `null` sub două firimituri, deci ramura de
		// eroare (`data === undefined`) nu emite nimic în loc să emită un drum gol.
		...ldJson(
			breadcrumbJsonLd(data?.crumbs ?? [], data?.origin),
			data
				? learningResourceJsonLd({
						name: data.material.title,
						description: data.material.description,
						path: `/elevi/${data.grade.id}/m/${data.material.slug}`,
						origin: data.origin,
						learningResourceType: data.resourceType,
						educationalLevel: educationalLevelLabel(data.grade.label),
						audienceRole: "student",
						about: data.topicLabel || undefined,
						interactivityType: data.interactivity,
						image: data.image ?? undefined,
						// Fără `isPartOf`: capitolul e deja declarat în `about`, iar pe instanța
						// liberă el nu are pagină proprie (nu există rută `/elevi/:gradeId`), deci
						// o `Collection` fără URL ar repeta același nume în două câmpuri fără să
						// adauge nimic verificabil.
					})
				: null,
		),
	];
}

export async function loader({ request, context, params }: Route.LoaderArgs) {
	const env = context.cloudflare.env;
	const grade = gradeById(params.gradeId);
	if (!grade) throw new Response("Not found", { status: 404 });

	const db = getDb(env);
	const material = await getMaterialBySlug(db, params.gradeId, params.slug, subjectConfig.defaultLocale);
	if (!material) throw new Response("Not found", { status: 404 });

	// Podeaua rămâne podea. Rolul `liber` primește `full` pentru orice e publicat, dar
	// ciornele cad tot pe `hidden` — verificarea nu se sare, doar politica e alta.
	const { viewer } = await resolveViewer(request, env);
	const visibility = resolveVisibility(viewer, material);
	if (visibility !== "full") throw new Response("Not found", { status: 404 });

	const assets = (await listAssets(db, material.id)).map((a) => ({ id: a.id, role: a.role, mime: a.mime, idx: a.idx }));

	const siblings = (
		await listMaterialsForGrade(db, params.gradeId, subjectConfig.defaultLocale, material.library, false)
	).filter((s) => s.topicSlug === material.topicSlug);
	const idx = siblings.findIndex((s) => s.slug === material.slug);
	const prev = idx > 0 ? siblings[idx - 1] : null;
	const next = idx >= 0 && idx < siblings.length - 1 ? siblings[idx + 1] : null;
	const topicLabel = topicsForGrade(params.gradeId).find((tp) => tp.slug === material.topicSlug)?.label ?? "";

	// Companion link: pair a written lesson with its photo gallery (and vice versa).
	// Convention (subject-agnostic): the gallery slug is the lesson slug + GALLERY_SUFFIX.
	const GALLERY_SUFFIX = "-galerie-foto";
	let companion: { slug: string; title: string; type: string } | null = null;
	if (material.type === "scris") {
		const c = siblings.find((s) => s.type === "foto" && s.slug === material.slug + GALLERY_SUFFIX);
		if (c) companion = { slug: c.slug, title: c.title, type: c.type };
	} else if (material.type === "foto" && material.slug.endsWith(GALLERY_SUFFIX)) {
		const lessonSlug = material.slug.slice(0, -GALLERY_SUFFIX.length);
		const c = siblings.find((s) => s.type === "scris" && s.slug === lessonSlug);
		if (c) companion = { slug: c.slug, title: c.title, type: c.type };
	}

	// Raftul „Alte materiale din acest capitol" se construiește din `siblings`, tabloul deja
	// adus pentru înainte/înapoi — nicio interogare nouă. Proiecția e de trei câmpuri: regula de
	// pe `/elevi` (un loader de listare NU trimite `body`) se aplică și unei liste de patru
	// elemente, fiindcă `body`-ul unui joc e cel mai greu JSON din tot bancul.
	//
	// Ordinea e cea din capitol, nu una amestecată: un raft care se reordonează la fiecare
	// randare i-ar da motorului de căutare alt graf de legături interne la fiecare trecere, iar
	// cititorului alte „alte materiale" la fiecare reîncărcare.
	const related = siblings
		.filter((s) => s.slug !== material.slug && s.slug !== companion?.slug)
		.slice(0, RELATED_MAX)
		.map((s) => ({ slug: s.slug, title: s.title, type: s.type }));

	// Puntea spre testul grilă se arată DOAR dacă există întrebări publicate chiar pe capitolul
	// ăsta — textul promite „întrebările capitolului", iar un link către un test gol e mai rău
	// decât lipsa lui. Numărăm pe temă, nu pe toată clasa: o clasă poate avea întrebări la alte
	// capitole, dar promisiunea de aici ar rămâne neonorată. O singură interogare de numărare.
	const quizCount = await countPublished(db, params.gradeId, material.topicSlug);

	const typeDef = subjectConfig.materialTypes.find((mt) => mt.key === material.type);
	const interactivity: "active" | "expositive" = ACTIVE_TYPES.has(material.type) ? "active" : "expositive";
	// Imaginea reprezentativă pentru marcaj: primul asset de tip imagine, în varianta miniatură
	// (`?t`). Nu se adaugă nicio interogare — `assets` era deja adus pentru randare.
	const firstImage = assets.find((a) => a.role === "image");

	// O singură sursă pentru firimituri: le randează `<Breadcrumbs>` și le serializează
	// `breadcrumbJsonLd` din `meta()`. Capitolul NU primește `to` (nu are pagină proprie), iar
	// clasa la fel: pe instanța liberă nu există rută `/elevi/:gradeId`, toate clasele stau pe
	// `/elevi`, deci un link acolo ar fi al doilea link identic în aceeași navigare. Legătura
	// spre listare există oricum, mai jos, sub „Vezi tot capitolul".
	const crumbs: CrumbRef[] = [
		{ label: t("crumb.home"), to: "/" },
		{ label: t("crumb.elevi"), to: "/elevi" },
		{ label: grade.label },
		...(topicLabel ? [{ label: topicLabel }] : []),
		{ label: material.title },
	];

	return {
		grade,
		material,
		assets,
		topicLabel,
		prev: prev ? { slug: prev.slug, title: prev.title } : null,
		next: next ? { slug: next.slug, title: next.title } : null,
		companion,
		related,
		crumbs,
		quizCount,
		resourceType: typeDef ? t(typeDef.labelKey) : undefined,
		interactivity,
		image: firstImage ? `/media/${firstImage.id}?t` : null,
		origin: new URL(request.url).origin,
	};
}

export default function LiberMaterial({ loaderData }: Route.ComponentProps) {
	const { grade, material, assets, prev, next, companion, related, crumbs, quizCount } = loaderData;
	const isWide = material.type === "prezentare" || material.type === "interactiv";
	const hugsContent = material.type === "prezentare";
	const companionIcon = companion
		? (subjectConfig.materialTypes.find((mt) => mt.key === companion.type)?.icon ?? "→")
		: null;
	const companionKicker = companion?.type === "foto" ? "Galeria foto a lecției" : "Lecția scrisă";

	return (
		<>
			<LiberHeader right={<Link to="/elevi" className="text-sm underline-offset-4 hover:underline">{t("liber.back.elevi")}</Link>} />
			<main id="continut" tabIndex={-1} className={`mx-auto px-5 py-8 ${isWide ? "max-w-6xl" : "max-w-3xl"}`}>
				{/* Firimiturile ÎNLOCUIESC linia de context de dinainte („Clasa a 9-a · Hidrosfera").
				    Amândouă spuneau același drum; păstrate împreună, pagina l-ar fi arătat de două ori. */}
				<Breadcrumbs items={crumbs} className="mb-3" />
				<TypeChip type={material.type} />
				<h1 className="font-heading mt-2 text-3xl">{material.title}</h1>

				{/* Singurul bloc de proză indexabil al paginii. Un teanc de pagini, o galerie sau un
				    joc sunt imagini și canvas: titlul și descrierea asta sunt tot ce poate citi un
				    motor de căutare. Titlul secțiunii e vizibil, dar în registrul discret de
				    „kicker" al sitului — un `h2` gros peste două rânduri de text ar rupe ierarhia
				    vizuală chiar sub `h1`. Fără descriere nu randăm titlul singur: un capăt de
				    secțiune gol e mai rău decât o secțiune absentă. */}
				{material.description && (
					<section className="mt-4">
						<h2 className="kicker text-sm">{t("material.about.title")}</h2>
						<p className="mt-1.5 opacity-80">{material.description}</p>
					</section>
				)}

				{/* Titlul secțiunii de conținut există în DOM, dar e `sr-only`: vizibil, ar fi stat
				    imediat sub titlu și descriere, peste o placă ce se explică singură, iar
				    formularea „Răsfoiește lecția" ar fi fost falsă pentru un joc sau o galerie.
				    Cititorul de ecran și motorul de căutare capătă structura; ochiul nu capătă un
				    rând de umplutură. */}
				<section className="mt-6">
					<h2 className="sr-only">{t("material.browse.title")}</h2>
					<Plate className={hugsContent ? "" : "p-6"}>
						{/* Fără filigran: pe instanța liberă nu există sesiune de la care să vină un cod,
						    iar materialele sunt oricum publice. `viewOnly={false}` din același motiv. */}
						<MaterialRenderer material={material} assets={assets} viewOnly={false} />
						{!SELF_RENDERING_TYPES.has(material.type) && <Attachments assets={assets} viewOnly={false} />}
					</Plate>
				</section>

				{companion && (
					<Link
						to={`/elevi/${grade.id}/m/${companion.slug}`}
						className="plate paper glow mt-6 flex items-center justify-between gap-3 p-4"
					>
						<span className="flex items-center gap-3">
							<span aria-hidden className="grid h-10 w-10 shrink-0 place-items-center rounded-md bg-primary/10 text-lg text-primary">
								{companionIcon}
							</span>
							<span>
								<span className="text-xs text-muted">{companionKicker}</span>
								<span className="mt-0.5 block font-medium">{companion.title}</span>
							</span>
						</span>
						<span aria-hidden className="text-primary">→</span>
					</Link>
				)}

				{/* Puntea spre „Exersează". Se randează doar cu `quizCount > 0` (vezi loader), iar
				    linkul duce direct pe capitolul curent — ruta validează oricum `?topic=` și cade
				    pe toată clasa dacă tema n-are întrebări, deci parametrul nu poate deschide un
				    test gol. */}
				{quizCount > 0 && (
					<section className="mt-10">
						<h2 className="font-heading text-xl">{t("material.practice.title")}</h2>
						<p className="mt-2 text-muted">{t("material.practice.text")}</p>
						<Link
							to={`/elevi/${grade.id}/exerseaza?topic=${material.topicSlug}`}
							viewTransition
							className="glow mt-4 inline-flex items-center gap-2.5 rounded-md bg-accent px-4 py-2.5 text-sm font-semibold text-on-accent transition hover:bg-accent-strong"
						>
							{t("material.practice.cta")}
							<span aria-hidden>→</span>
						</Link>
					</section>
				)}

				{/* Raftul de fraţi: transformă capitolele din liste izolate într-o plasă de legături
				    interne. Fiecare titlu e `h3` sub `h2`-ul secțiunii — ierarhia pe care o
				    așteaptă și cititorul de ecran, și crawlerul. */}
				{related.length > 0 && (
					<section className="mt-10">
						<h2 className="font-heading text-xl">{t("material.related.title")}</h2>
						<div className="mt-3 grid gap-3 sm:grid-cols-2">
							{related.map((r) => {
								const icon = subjectConfig.materialTypes.find((mt) => mt.key === r.type)?.icon ?? "→";
								return (
									<Link
										key={r.slug}
										to={`/elevi/${grade.id}/m/${r.slug}`}
										viewTransition
										className="group glow flex items-center gap-3 rounded-lg border border-border paper p-4"
									>
										<span
											aria-hidden
											className="grid h-9 w-9 shrink-0 place-items-center rounded-md bg-primary/10 text-primary"
										>
											{icon}
										</span>
										<h3 className="text-sm font-medium group-hover:text-primary">{r.title}</h3>
									</Link>
								);
							})}
						</div>
						{/* Singura adresă care listează capitolul întreg pe instanța liberă e `/elevi`
						    (nu există rută pe clasă) — de aceea firimitura clasei e text, iar legătura
						    spre listare stă aici, o singură dată, cu o etichetă care spune ce face. */}
						<Link to="/elevi" viewTransition className="mt-4 inline-block text-sm text-primary underline-offset-4 hover:underline">
							{t("material.chapter_all")} <span aria-hidden>→</span>
						</Link>
					</section>
				)}

				<nav className="mt-8 flex justify-between gap-4 text-sm">
					{prev ? <Link to={`/elevi/${grade.id}/m/${prev.slug}`} className="underline-offset-4 hover:underline">← {prev.title}</Link> : <span />}
					{next ? <Link to={`/elevi/${grade.id}/m/${next.slug}`} className="underline-offset-4 hover:underline">{next.title} →</Link> : <span />}
				</nav>
			</main>
			<LiberFooter />
		</>
	);
}
