import { Link } from "react-router";
import type { Route } from "./+types/liber.pedagogie.m.$gradeId.$slug";
import { gradeById, subjectConfig, t } from "../config/subject";
import { getDb } from "../db/client";
import { getMaterialBySlug, listTeacherCollection } from "../lib/content";
import type { MaterialView } from "../lib/content";
import { listAssets } from "../lib/assets";
import { resolveViewer } from "../lib/guard";
import { resolveVisibility } from "../lib/entitlement";
import { MaterialRenderer } from "../components/MaterialRenderer";
import { Attachments } from "../components/Attachments";
import { LiberFooter, LiberHeader } from "../components/liber/LiberChrome";
import { Breadcrumbs } from "../components/Breadcrumbs";
import { TypeChip } from "../components/TypeChip";
import { seo } from "../lib/seo";
import { breadcrumbJsonLd, educationalLevelLabel, ldJson, learningResourceJsonLd, type CrumbRef } from "../lib/jsonld";

const SELF_RENDERING_TYPES = new Set(["foto", "fisier", "joc", "prezentare"]);

/** Câte materiale înrudite arătăm sub teanc. Trei încap pe un rând de telefon fără să
 *  împingă subsolul departe; mai multe ar transforma finalul lecției într-un al doilea raft. */
const RELATED_COUNT = 3;

/**
 * Perechea din programă: „Schema de lecție — Hidrosfera" și „Ghidul metodologic — Hidrosfera"
 * sunt același subiect din două unghiuri, iar profesoara le folosește împreună.
 *
 * Legătura NU se ghicește. În date există o convenție reală, scrisă în
 * `content/pedagogie/README.md`: slug-ul unui material de pedagogie e `<prefixul raftului>-<temă>`
 * (`schema-hidrosfera` ↔ `ghid-hidrosfera`). Deci comparăm ce rămâne după PRIMUL segment —
 * fără să scriem nicăieri „schema" sau „ghid", care sunt convenție de conținut, nu de motor.
 *
 * Ce am respins: împerecherea după `position`. Ambele rafturi sunt ordonate 1..12 „după programă",
 * deci pare 1:1 — dar dacă se inserează un material la mijlocul unui singur raft, toate perechile
 * de după el se decalează și pagina afișează, cu aceeași încredere, o pereche GREȘITĂ. Împerecherea
 * după rădăcina slug-ului nu se poate decala: ori se potrivește, ori nu există pereche.
 *
 * Prețul cinstit al alegerii: rădăcinile care nu coincid nu produc pereche (azi, „Universul și
 * Sistemul Solar" ↔ „Pământul în Univers", 1 din 12). Un material fără pereche primește tot raftul
 * înrudit de dedesubt, deci nu rămâne fără drum mai departe. O pereche lipsă e o mică pierdere;
 * o pereche greșită e o informație falsă despre programă.
 */
function stem(slug: string): string {
	const i = slug.indexOf("-");
	return i === -1 ? "" : slug.slice(i + 1);
}

interface RelatedCard {
	slug: string;
	gradeId: string;
	title: string;
}

export function meta({ data }: Route.MetaArgs) {
	const grade = data?.grade;
	const material = data?.material;
	return [
		...seo({
			title: material?.title ?? "Material",
			description: material?.description,
			path: `/pedagogie/m/${grade?.id ?? ""}/${material?.slug ?? ""}`,
			origin: data?.origin,
		}),
		...ldJson(
			breadcrumbJsonLd(data?.crumbs ?? [], data?.origin),
			material && grade
				? learningResourceJsonLd({
						name: material.title,
						description: material.description,
						path: `/pedagogie/m/${grade.id}/${material.slug}`,
						origin: data?.origin,
						// Ce fel de resursă e o spune chiar raftul din care vine — aceeași etichetă
						// pe care o citește vizitatorul în firimituri. („Scheme de lecție" e la plural,
						// fiindcă e numele raftului; singularul ar cere o cheie de interfață nouă.)
						learningResourceType: data?.resourceType,
						educationalLevel: educationalLevelLabel(grade.label),
						audienceRole: "teacher",
						partOfName: data?.backLabel,
						partOfPath: data?.backTo,
						// Teancuri de pagini care se citesc, nu se joacă.
						interactivityType: "expositive",
						// Prima planșă, prin miniatură. Fără `about`: la biblioteca de profesor
						// `topic_slug` e RAFTUL, nu tema din programă, deci n-avem de unde lua
						// cinstit subiectul lecției — iar un `about` inventat e mai rău decât lipsa lui.
						image: data?.image ?? undefined,
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
	const locale = subjectConfig.defaultLocale;
	const material = await getMaterialBySlug(db, params.gradeId, params.slug, locale);
	if (!material) throw new Response("Not found", { status: 404 });

	const { viewer } = await resolveViewer(request, env);
	if (resolveVisibility(viewer, material) !== "full") throw new Response("Not found", { status: 404 });

	const assets = (await listAssets(db, material.id)).map((a) => ({ id: a.id, role: a.role, mime: a.mime, idx: a.idx }));

	const collection = subjectConfig.teacherCollections.find((c) => c.slug === material.topicSlug);
	const backTo = collection ? `/pedagogie/${collection.slug}` : "/pedagogie";
	const backLabel = collection ? t(collection.labelKey) : t("liber.pedagogie.title");
	// Numele UNUI material de pe raft, la singular. `learningResourceType` descrie pagina
	// curentă — o singură schemă — nu raftul, deci „Scheme de lecție" ar fi fost o afirmație
	// greșită despre ce e pagina. `singularKey` e opțional în config (types.ts), deci un raft
	// care nu-l definește cade înapoi pe eticheta raftului, exact ca înainte.
	const resourceType =
		collection?.singularKey ? t(collection.singularKey) : backLabel;

	// Rafturile se citesc doar pentru un material care chiar stă pe un raft. Sunt cinci
	// interogări în paralel — nu se pot reduce fără o funcție nouă în `lib/content.ts`, iar
	// perechea se poate afla pe oricare dintre celelalte rafturi, deci n-avem cum să ghicim
	// dinainte pe care să întrebăm. Rândurile rămân pe server: spre client pleacă doar
	// `{slug, gradeId, title}` (**un loader nu trimite `body`**, nici când lista e mică).
	let pair: (RelatedCard & { shelf: string }) | null = null;
	const related: RelatedCard[] = [];

	if (collection) {
		const shelves = await Promise.all(
			subjectConfig.teacherCollections.map(async (c) => ({
				c,
				rows: await listTeacherCollection(db, c.slug, locale),
			})),
		);

		const radacina = stem(material.slug);
		if (radacina) {
			for (const s of shelves) {
				if (s.c.slug === collection.slug) continue;
				// Aceeași clasă: perechea din programă e per clasă, nu peste tot liceul.
				const m = s.rows.find((r) => r.gradeId === material.gradeId && stem(r.slug) === radacina);
				// Prima potrivire, în ordinea rafturilor din config. Două rafturi cu aceeași
				// rădăcină ar fi o ambiguitate de conținut, nu o alegere de făcut aici.
				if (m) {
					pair = { slug: m.slug, gradeId: m.gradeId, title: m.title, shelf: t(s.c.labelKey) };
					break;
				}
			}
		}

		const acelasiRaft = (shelves.find((s) => s.c.slug === collection.slug)?.rows ?? []).filter(
			(m: MaterialView) => m.gradeId === material.gradeId,
		);
		const idx = acelasiRaft.findIndex((m) => m.slug === material.slug);
		// Fereastră circulară pornind de după materialul curent: ultimul material dintr-un raft
		// ar fi altfel o fundătură, cu zero linkuri mai departe. Ordinea e cea din `position`,
		// adică ordinea programei, deci „următoarele trei" sunt chiar lecțiile de după.
		if (idx >= 0 && acelasiRaft.length > 1) {
			for (let k = 1; k <= RELATED_COUNT && k < acelasiRaft.length; k++) {
				const m = acelasiRaft[(idx + k) % acelasiRaft.length];
				related.push({ slug: m.slug, gradeId: m.gradeId, title: m.title });
			}
		}
	}

	const crumbs: CrumbRef[] = [
		{ label: t("crumb.home"), to: "/" },
		{ label: t("crumb.pedagogie"), to: "/pedagogie" },
		{ label: backLabel, to: backTo },
		{ label: material.title },
	];

	// Imaginea reprezentativă pentru marcaj: prima planșă a teancului, pe traseul cu miniatură
	// (`?t`) — aceeași cheie pe care o folosesc și cardurile din rafturi, deci nu se descarcă
	// nimic în plus. Fără planșe (un material de alt tip), câmpul lipsește cu totul.
	const image = assets.find((a) => a.role === "image")?.id;

	return {
		grade,
		material,
		assets,
		backTo,
		backLabel, resourceType,
		crumbs,
		pair,
		related,
		image: image ? `/media/${image}?t` : null,
		origin: new URL(request.url).origin,
	};
}

export default function LiberPedagogieMaterial({ loaderData }: Route.ComponentProps) {
	const { grade, material, assets, backTo, backLabel, crumbs, pair, related } = loaderData;
	const isWide = material.type === "prezentare" || material.type === "interactiv";

	return (
		<>
			<LiberHeader right={<Link to={backTo} className="text-sm underline-offset-4 hover:underline">← {backLabel}</Link>} />
			<main id="continut" tabIndex={-1} className={`mx-auto px-5 py-8 ${isWide ? "max-w-6xl" : "max-w-3xl"}`}>
				{/* Firimiturile ÎNLOCUIESC vechea linie de context („Scheme de lecție · Clasa a 9-a"):
				    spun același lucru, dar cu drumul întreg și cu linkuri. Randate de două ori ar fi
				    fost aceeași cale, scrisă o dată ca text mort și o dată ca navigare. */}
				<Breadcrumbs items={crumbs} className="mb-3" />
				<TypeChip type={material.type} />
				<h1 className="font-heading mt-2 text-3xl">{material.title}</h1>

				{/* Paginile unui teanc sunt IMAGINI. În afara titlului, descrierea e singurul text
				    pe care îl poate citi un motor de căutare sau un cititor de ecran — de aceea are
				    titlu de secțiune propriu, nu doar un paragraf pierdut sub titlu. */}
				{material.description && (
					<section className="mt-5">
						<h2 className="font-heading text-lg">{t("material.about.title")}</h2>
						<p className="mt-1 opacity-80">{material.description}</p>
					</section>
				)}

				{/* Fără filigran: pe ruta de profesor codul era e-mailul contului, iar aici nu
				    există cont. Fără `locked`: teancurile se văd întregi, nu pe jumătate ca în vitrină. */}
				<section className="mt-6">
					<h2 className="font-heading text-lg">{t("material.browse.title")}</h2>
					<div className="mt-2">
						<MaterialRenderer material={material} assets={assets} viewOnly={false} />
						{!SELF_RENDERING_TYPES.has(material.type) && <Attachments assets={assets} viewOnly={false} />}
					</div>
				</section>

				{/* Perechea din programă — vezi comentariul de la `stem()` pentru ce anume o
				    leagă și de ce nu se ghicește. Lipsește complet când nu există potrivire sigură. */}
				{pair && (
					<section className="mt-8">
						<h2 className="font-heading text-lg">{t("teacher.shelf.pair.title")}</h2>
						<Link
							to={`/pedagogie/m/${pair.gradeId}/${pair.slug}`}
							viewTransition
							className="glow mt-2 flex items-center justify-between gap-3 rounded-lg border border-border bg-surface p-4"
						>
							<span>
								<span className="text-xs text-muted">{pair.shelf}</span>
								<span className="mt-0.5 block font-medium">{pair.title}</span>
							</span>
							<span aria-hidden className="text-primary">→</span>
						</Link>
					</section>
				)}

				{related.length > 0 && (
					<section className="mt-8">
						<h2 className="font-heading text-lg">{t("teacher.shelf.related.title")}</h2>
						<ul className="mt-2 grid gap-2 sm:grid-cols-3">
							{related.map((m) => (
								<li key={m.slug}>
									<Link
										to={`/pedagogie/m/${m.gradeId}/${m.slug}`}
										viewTransition
										className="glow block h-full rounded-lg border border-border bg-surface px-4 py-3 text-sm font-medium"
									>
										{m.title}
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
