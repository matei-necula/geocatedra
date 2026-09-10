import { Link, redirect } from "react-router";
import type { Route } from "./+types/material";
import { gradeById, subjectConfig, t, topicsForGrade } from "../config/subject";
import { getDb } from "../db/client";
import { getMaterialBySlug, listMaterialsForGrade } from "../lib/content";
import { listAssets } from "../lib/assets";
import { resolveViewer } from "../lib/guard";
import { resolveVisibility } from "../lib/entitlement";
import { recordMaterialView } from "../lib/viewstats";
import { MaterialRenderer } from "../components/MaterialRenderer";
import { Attachments } from "../components/Attachments";
import { Watermark, WatermarkProvider } from "../components/Watermark";
import { SiteHeader } from "../components/site";
import { TypeChip } from "../components/TypeChip";
import { Plate } from "../components/atlas";
import { seo } from "../lib/seo";

/** Tipuri care randează ele însele asseturile materialului (galerie, joc, carte răsfoibilă). */
const SELF_RENDERING_TYPES = new Set(["foto", "fisier", "joc", "prezentare"]);

export function meta({ data }: Route.MetaArgs) {
	return seo({ title: data?.material.title ?? "Material", path: "/material", noindex: true });
}

export async function loader({ request, context, params }: Route.LoaderArgs) {
	const env = context.cloudflare.env;
	const gradeId = params.gradeId;
	const grade = gradeById(gradeId);
	if (!grade) throw new Response("Not found", { status: 404 });

	const resolved = await resolveViewer(request, env);
	if (!resolved.isAdmin && !resolved.isStudent) throw redirect("/intra");

	const db = getDb(env);
	const material = await getMaterialBySlug(db, gradeId, params.slug, subjectConfig.defaultLocale);
	if (!material) throw new Response("Not found", { status: 404 });

	// Server-side access control — the floor. Never trust the UI.
	const visibility = resolveVisibility(resolved.viewer, material);
	if (visibility !== "full" && visibility !== "view_only" && visibility !== "teaser") {
		throw new Response("Forbidden", { status: 403 });
	}

	// Aggregate view counting — students only, full visibility, student library.
	if (resolved.isStudent && resolved.tokenId && visibility === "full" && material.library === "student") {
		await recordMaterialView(db, material.id, resolved.tokenId);
	}

	const assets = (await listAssets(db, material.id)).map((a) => ({ id: a.id, role: a.role, mime: a.mime, idx: a.idx }));

	// prev / next within the same topic (respecting student vs admin visibility)
	const siblings = (
		await listMaterialsForGrade(db, gradeId, subjectConfig.defaultLocale, material.library, resolved.isAdmin)
	).filter((s) => s.topicSlug === material.topicSlug);
	const idx = siblings.findIndex((s) => s.slug === material.slug);
	const prev = idx > 0 ? { slug: siblings[idx - 1].slug, title: siblings[idx - 1].title } : null;
	const next =
		idx >= 0 && idx < siblings.length - 1
			? { slug: siblings[idx + 1].slug, title: siblings[idx + 1].title }
			: null;
	const topicLabel = topicsForGrade(gradeId).find((tp) => tp.slug === material.topicSlug)?.label ?? "";

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

	return { grade, material, assets, topicLabel, prev, next, companion, wm: resolved.wm ?? null, isAdmin: resolved.isAdmin };
}

export default function MaterialView({ loaderData }: Route.ComponentProps) {
	const { grade, material, assets, topicLabel, prev, next, companion, wm, isAdmin } = loaderData;
	// Paginile răsfoibile și aplicațiile interactive au nevoie de spațiu; restul
	// materialelor rămân pe coloana îngustă, bună pentru citit.
	const isWide = material.type === "prezentare" || material.type === "interactiv";
	// Cartea se strânge pe pagina ei; aplicația ia toată lățimea.
	const hugsContent = material.type === "prezentare";
	const companionIcon = companion
		? (subjectConfig.materialTypes.find((t) => t.key === companion.type)?.icon ?? "→")
		: null;
	const companionKicker = companion?.type === "foto" ? "Galeria foto a lecției" : "Lecția scrisă";
	return (
		<div className="min-h-screen motion-playful">
			<SiteHeader
				right={
					<Link
						to={`/clasa/${grade.id}`}
						viewTransition
						className="text-sm font-medium text-muted hover:text-ink"
					>
						← {grade.label}
					</Link>
				}
			/>

			<main className={`mx-auto px-5 py-8 ${isWide ? "max-w-[1400px]" : "max-w-3xl"}`}>
				<nav className="mx-auto mb-4 flex w-full max-w-3xl flex-wrap items-center gap-1.5 text-sm text-muted">
					<Link to={`/clasa/${grade.id}`} viewTransition className="hover:text-ink">{grade.label}</Link>
					{topicLabel && (
						<>
							<span aria-hidden>/</span>
							<span className="font-medium text-ink">{topicLabel}</span>
						</>
					)}
				</nav>

				<div className="cat-rise mx-auto mb-6 w-full max-w-3xl">
					<TypeChip type={material.type} />
					<h1 className="mt-2 text-4xl font-heading font-bold leading-tight">{material.title}</h1>
					{material.description && <p className="mt-2 text-lg text-muted">{material.description}</p>}
				</div>

				{/* Watermark overlays the content for students; admins preview without it. */}
				<Plate
					className={`cat-rise ${isWide ? (hugsContent ? "mx-auto w-fit p-3" : "w-full p-3") : "p-6 sm:p-8"}`}
					label={topicLabel ? `${t(`type.${material.type}`)} ${t("material.plate_of")} ${topicLabel}` : t(`type.${material.type}`)}
				>
					{wm && !isAdmin && <Watermark code={wm} />}
					{/* Același filigran ajunge și pe vizualizarea pe tot ecranul, care se
					    randează prin portal — vezi components/Watermark.tsx. */}
					<WatermarkProvider value={wm && !isAdmin ? { code: wm } : null}>
						<div className="relative z-0">
							<MaterialRenderer material={material} assets={assets} viewOnly={!isAdmin} />
							{/* Tipurile care își arată singure asseturile nu mai primesc lista de atașamente. */}
							{!SELF_RENDERING_TYPES.has(material.type) && <Attachments assets={assets} viewOnly={!isAdmin} />}
						</div>
					</WatermarkProvider>
				</Plate>

				{companion && (
					<Link
						to={`/clasa/${grade.id}/m/${companion.slug}`}
						viewTransition
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

				{(prev || next) && (
					<nav className="mt-6 flex items-stretch justify-between gap-3">
						{prev ? (
							<Link to={`/clasa/${grade.id}/m/${prev.slug}`} viewTransition className="glow relative flex-1 overflow-hidden rounded-lg border border-border paper p-4">
								<span aria-hidden className="index-tab bg-primary" />
								<span className="text-xs text-muted">← Anterior</span>
								<div className="mt-0.5 font-medium">{prev.title}</div>
							</Link>
						) : (
							<span className="flex-1" />
						)}
						{next ? (
							<Link to={`/clasa/${grade.id}/m/${next.slug}`} viewTransition className="glow relative flex-1 overflow-hidden rounded-lg border border-border paper p-4 text-right">
								<span aria-hidden className="index-tab bg-accent" />
								<span className="text-xs text-muted">Următor →</span>
								<div className="mt-0.5 font-medium">{next.title}</div>
							</Link>
						) : (
							<span className="flex-1" />
						)}
					</nav>
				)}
			</main>
		</div>
	);
}
