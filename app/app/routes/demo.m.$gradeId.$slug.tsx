import { Link } from "react-router";
import type { Route } from "./+types/demo.m.$gradeId.$slug";
import { gradeById, subjectConfig, t, topicsForGrade } from "../config/subject";
import { getDb } from "../db/client";
import { getMaterialBySlug } from "../lib/content";
import { listAssets } from "../lib/assets";
import { demoViewer, resolveViewer } from "../lib/guard";
import { resolveVisibility } from "../lib/entitlement";
import { assetAllowed, inDemoSet } from "../lib/demo";
import { MaterialRenderer } from "../components/MaterialRenderer";
import { PageBook } from "../components/PageBook";
import { SiteHeader, SiteFooter } from "../components/site";
import { TypeChip } from "../components/TypeChip";
import { StampBadge } from "../components/atlas";
import { seo } from "../lib/seo";

export function meta({ data }: Route.MetaArgs) {
	if (!data) return seo({ title: t("demo.title"), path: "/demo", noindex: true });
	return seo({
		title: data.material.title,
		description: data.material.description || undefined,
		path: `/demo/m/${data.material.gradeId}/${data.material.slug}`,
		origin: data.origin,
		type: "article",
	});
}

export async function loader({ request, context, params }: Route.LoaderArgs) {
	const env = context.cloudflare.env;
	const grade = gradeById(params.gradeId);
	if (!grade) throw new Response("Not found", { status: 404 });
	// Prima poartă: adresa trebuie să fie una dintre cele curate. Altfel /demo/m/... ar
	// fi o ușă laterală către toată biblioteca.
	if (!inDemoSet(params.gradeId, params.slug)) throw new Response("Not found", { status: 404 });

	const db = getDb(env);
	const material = await getMaterialBySlug(db, params.gradeId, params.slug, subjectConfig.defaultLocale);
	if (!material) throw new Response("Not found", { status: 404 });

	// A doua poartă: podeaua obișnuită. Un admin/profesor logat își păstrează rolul — accesul
	// lui e mai larg decât al vizitatorului de vitrină. Un elev logat, în schimb, are un rol
	// mai ÎNGUST (vede doar clasa lui): dacă rolul lui real nu ajunge la material — de ex. un
	// elev de clasa a 10-a pe o mostră din clasa a 9-a — încercăm din nou ca vizitator anonim,
	// exact ce ar vedea oricine de pe internet. Fallback-ul e mărginit de `inDemoSet` mai sus,
	// deci nu poate deschide altceva decât cele cinci materiale curate.
	const { viewer } = await resolveViewer(request, env);
	let visibility = resolveVisibility(viewer, material);
	if (visibility !== "full" && visibility !== "view_only" && visibility !== "preview") {
		visibility = resolveVisibility(demoViewer(), material);
	}
	if (visibility !== "full" && visibility !== "view_only" && visibility !== "preview") {
		throw new Response("Forbidden", { status: 403 });
	}

	const all = (await listAssets(db, material.id)).map((a) => ({
		id: a.id,
		role: a.role,
		mime: a.mime,
		idx: a.idx,
	}));

	// Pentru previzualizare trimitem DOAR paginile permise: pagina 7 nu există în payload.
	// Aceeași regulă ca zidul din /media/:id — `assetAllowed`, ca să nu existe două formule
	// care ar putea diverge.
	const imageCount = all.filter((a) => a.role === "image").length;
	const assets =
		visibility === "preview"
			? all.filter((a) => a.role === "image" && assetAllowed(a.idx ?? -1, imageCount))
			: all;
	const locked = visibility === "preview" ? { total: imageCount } : null;

	const collection = subjectConfig.teacherCollections.find((c) => c.slug === material.topicSlug);
	const shelfLabel = collection
		? t(collection.labelKey)
		: (topicsForGrade(params.gradeId).find((tp) => tp.slug === material.topicSlug)?.label ?? "");

	return { grade, material, assets, locked, shelfLabel, origin: new URL(request.url).origin };
}

export default function DemoMaterial({ loaderData }: Route.ComponentProps) {
	const { grade, material, assets, locked, shelfLabel } = loaderData;
	const isWide = material.type === "prezentare" || material.type === "interactiv";

	return (
		<div className="min-h-screen motion-playful">
			<SiteHeader
				right={
					<Link to="/demo" viewTransition className="text-sm font-medium text-muted hover:text-ink">
						← {t("demo.back")}
					</Link>
				}
			/>

			<main className={`mx-auto px-5 py-8 ${isWide ? "max-w-[1400px]" : "max-w-3xl"}`}>
				<div className="cat-rise mx-auto mb-6 w-full max-w-3xl">
					<div className="flex flex-wrap items-center gap-2">
						<TypeChip type={material.type} />
						<StampBadge>{grade.label}</StampBadge>
						{shelfLabel && <span className="text-sm text-muted">{shelfLabel}</span>}
					</div>
					<h1 className="mt-2 font-heading text-4xl font-bold leading-tight">{material.title}</h1>
					{material.description && <p className="mt-2 text-lg text-muted">{material.description}</p>}
				</div>

				{/* Teancurile tăiate se randează direct pe PageBook, ca să primească zidul;
				    restul trece prin motorul obișnuit, exact ca la elevi. */}
				{locked ? (
					<PageBook assets={assets} count={assets.length} locked={locked} />
				) : (
					<MaterialRenderer material={material} assets={assets} viewOnly />
				)}

				<div className="mx-auto mt-12 flex w-full max-w-3xl flex-col gap-3 sm:flex-row">
					<Link
						to="/intra"
						className="flex-1 rounded-lg border border-border px-5 py-3 text-center font-semibold transition hover:border-primary"
					>
						{t("demo.cta.student")}
					</Link>
					<Link
						to="/profesor/inregistrare"
						className="flex-1 rounded-lg bg-accent px-5 py-3 text-center font-semibold text-on-accent transition hover:bg-accent-strong"
					>
						{t("demo.cta.teacher")}
					</Link>
				</div>

				<SiteFooter />
			</main>
		</div>
	);
}
