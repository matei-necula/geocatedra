import { Link, redirect } from "react-router";
import type { Route } from "./+types/profesor.m.$gradeId.$slug";
import { gradeById, subjectConfig, t, topicsForGrade } from "../config/subject";
import { getDb } from "../db/client";
import { getMaterialBySlug } from "../lib/content";
import { listAssets } from "../lib/assets";
import { getTeacher } from "../lib/guard";
import { MaterialRenderer } from "../components/MaterialRenderer";
import { Attachments } from "../components/Attachments";
import { SiteHeader } from "../components/site";
import { Watermark, WatermarkProvider } from "../components/Watermark";
import { TypeChip } from "../components/TypeChip";
import { seo } from "../lib/seo";

/** Tipuri care randează ele însele asseturile materialului (galerie, joc, carte răsfoibilă). */
const SELF_RENDERING_TYPES = new Set(["foto", "fisier", "joc", "prezentare"]);

export function meta({ data }: Route.MetaArgs) {
	return seo({ title: data?.material.title ?? "Material", path: "/profesor/m", noindex: true });
}

export async function loader({ request, context, params }: Route.LoaderArgs) {
	const env = context.cloudflare.env;
	const teacher = await getTeacher(request, env);
	if (!teacher) throw redirect("/profesor/login");

	const grade = gradeById(params.gradeId);
	if (!grade) throw new Response("Not found", { status: 404 });

	const db = getDb(env);
	const material = await getMaterialBySlug(db, params.gradeId, params.slug, subjectConfig.defaultLocale);
	if (!material || material.status !== "published") throw new Response("Not found", { status: 404 });

	const assets = (await listAssets(db, material.id)).map((a) => ({ id: a.id, role: a.role, mime: a.mime, idx: a.idx }));
	// Filigranul bibliotecii de pedagogie: aici materialele sunt cele mai valoroase,
	// iar cine le vede are cont, deci scurgerea are un nume. Codul e chiar adresa
	// contului — pe ecranul propriu, ca deterent; într-o poză scursă, ca dovadă.
	const wm = teacher.email;
	const isTeacherLib = material.library === "teacher";
	// Teacher materials are filed by collection, student ones by topic.
	const collection = isTeacherLib
		? subjectConfig.teacherCollections.find((c) => c.slug === material.topicSlug)
		: undefined;
	const topicLabel = isTeacherLib
		? (collection ? t(collection.labelKey) : "")
		: (topicsForGrade(params.gradeId).find((tp) => tp.slug === material.topicSlug)?.label ?? "");
	// Back into the shelf the material came from, not the section landing.
	const backTo = isTeacherLib
		? (collection ? `/profesor/pedagogie/${collection.slug}` : "/profesor/pedagogie")
		: `/profesor/materiale?grade=${params.gradeId}`;
	const backLabel = isTeacherLib ? t("teacher.section.pedagogie.label") : t("teacher.tab.materiale");
	return { grade, material, assets, topicLabel, backTo, backLabel, isTeacherLib, wm };
}

export default function ProfesorMaterial({ loaderData }: Route.ComponentProps) {
	const { grade, material, assets, topicLabel, backTo, backLabel, isTeacherLib, wm } = loaderData;
	// Paginile răsfoibile și aplicațiile interactive au nevoie de spațiu: pe o
	// coloană de 768px textul din ele ajunge prea mic, deci primesc toată lățimea.
	const isWide = material.type === "prezentare" || material.type === "interactiv";
	// Cartea se strânge pe pagina ei (are dimensiune proprie); o aplicație trebuie
	// să primească toată lățimea, altfel iframe-ul n-are pe ce să se întindă.
	const hugsContent = material.type === "prezentare";
	return (
		<div className="min-h-screen motion-playful">
			<SiteHeader
				right={
					<Link to={backTo} viewTransition className="text-sm font-medium text-muted hover:text-ink">
						← {backLabel}
					</Link>
				}
			/>
			<main className={`mx-auto px-5 py-8 ${isWide ? "max-w-[1400px]" : "max-w-3xl"}`}>
				<nav className="mx-auto mb-4 flex w-full max-w-3xl flex-wrap items-center gap-1.5 text-sm text-muted">
					<span>{grade.label}</span>
					{topicLabel && (
						<>
							<span aria-hidden>/</span>
							<span className="text-ink">{topicLabel}</span>
						</>
					)}
				</nav>

				<div className="cat-rise mx-auto mb-6 w-full max-w-3xl">
					<TypeChip type={material.type} />
					<h1 className="mt-2 text-3xl font-bold">{material.title}</h1>
					{material.description && <p className="mt-2 text-muted">{material.description}</p>}
				</div>

				<div className={`cat-rise relative isolate rounded-2xl border border-border bg-surface ${isWide ? (hugsContent ? "mx-auto w-fit p-3" : "w-full p-3") : "mx-auto w-full max-w-3xl p-6"}`}>
					<Watermark code={wm} />
					<WatermarkProvider value={{ code: wm }}>
						<div className="relative z-0">
							<MaterialRenderer material={material} assets={assets} viewOnly={!isTeacherLib} />
							{/* Tipurile care își arată singure asseturile nu mai primesc lista de atașamente. */}
							{!SELF_RENDERING_TYPES.has(material.type) && <Attachments assets={assets} viewOnly={!isTeacherLib} />}
						</div>
					</WatermarkProvider>
				</div>

				<p className="mt-4 text-center text-xs text-muted">
					{isTeacherLib
						? "Bibliotecă de pedagogie — materiale pentru profesori."
						: "Vizualizare pentru profesori — fără descărcare."}
				</p>
			</main>
		</div>
	);
}
