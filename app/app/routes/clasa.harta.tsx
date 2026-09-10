import { Link, redirect } from "react-router";
import type { Route } from "./+types/clasa.harta";
import { gradeById, subjectConfig, t, topicsForGrade } from "../config/subject";
import { getDb } from "../db/client";
import { listMaterialsForGrade } from "../lib/content";
import { resolveViewer } from "../lib/guard";
import { SiteHeader } from "../components/site";
import { TopicMindMap } from "../components/TopicMindMap";
import { Plate, Kicker } from "../components/atlas";
import { seo } from "../lib/seo";

export function meta({ data }: Route.MetaArgs) {
	return seo({
		title: `${t("mindmap.panel")}: ${data?.node.label ?? ""}`,
		path: "/clasa/harta",
		noindex: true,
	});
}

export async function loader({ request, context, params }: Route.LoaderArgs) {
	const env = context.cloudflare.env;
	const gradeId = params.gradeId;
	const grade = gradeById(gradeId);
	if (!grade) throw new Response("Not found", { status: 404 });

	// Same access floor as the class page: students may only see their own grade.
	const resolved = await resolveViewer(request, env);
	const { isAdmin, isStudent } = resolved;
	if (!isAdmin) {
		if (!isStudent) throw redirect("/intra");
		if (resolved.gradeId !== gradeId) throw redirect(`/clasa/${resolved.gradeId}`);
	}

	const topicSlug = params.topicSlug;
	const node = subjectConfig.mindmaps?.[`${gradeId}:${topicSlug}`];
	if (!node) throw new Response("Not found", { status: 404 });

	const topicLabel = topicsForGrade(gradeId).find((tp) => tp.slug === topicSlug)?.label ?? node.label;

	// Link to the topic's written lesson, if one exists (respecting visibility).
	const db = getDb(env);
	const materials = await listMaterialsForGrade(db, gradeId, subjectConfig.defaultLocale, "student", isAdmin);
	const lesson = materials.find((m) => m.topicSlug === topicSlug && m.type === "scris");
	const lessonHref = lesson ? `/clasa/${gradeId}/m/${lesson.slug}` : null;

	return { grade, node, topicLabel, lessonHref };
}

export default function TopicMindMapPage({ loaderData }: Route.ComponentProps) {
	const { grade, node, topicLabel, lessonHref } = loaderData;
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

			<main className="mx-auto max-w-3xl px-5 py-8">
				<nav className="mb-4 flex flex-wrap items-center gap-1.5 text-sm text-muted">
					<Link to={`/clasa/${grade.id}`} viewTransition className="hover:text-ink">
						{grade.label}
					</Link>
					<span aria-hidden>/</span>
					<span className="font-medium text-ink">{topicLabel}</span>
				</nav>

				<div className="cat-rise mb-6">
					<Kicker>
						<span aria-hidden className="mr-1.5">🧠</span>
						{t("mindmap.panel")}
					</Kicker>
					<h1 className="mt-1 text-4xl font-heading font-bold leading-tight">{node.label}</h1>
					<p className="mt-2 text-lg text-muted">{t("mindmap.hint")}</p>
				</div>

				<Plate className="cat-rise p-6 sm:p-8">
					<TopicMindMap node={node} lessonHref={lessonHref ?? undefined} />
				</Plate>
			</main>
		</div>
	);
}
