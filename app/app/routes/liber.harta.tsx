import { Link } from "react-router";
import type { Route } from "./+types/liber.harta";
import { gradeById, subjectConfig, t, topicsForGrade } from "../config/subject";
import { getDb } from "../db/client";
import { listMaterialsForGrade } from "../lib/content";
import { LiberFooter, LiberHeader } from "../components/liber/LiberChrome";
import { Breadcrumbs } from "../components/Breadcrumbs";
import { TopicMindMap } from "../components/TopicMindMap";
import { Kicker, Plate } from "../components/atlas";
import { seo } from "../lib/seo";
import { breadcrumbJsonLd, educationalLevelLabel, ldJson, learningResourceJsonLd, type CrumbRef } from "../lib/jsonld";

export function meta({ data }: Route.MetaArgs) {
	// Fiecare din cele 15 hărți conceptuale trebuie să aibă propria descriere — nu fraza-tichetă
	// unică a `seo()` — deci o construim din datele deja aduse de loader (eticheta temei și
	// clasa), nu dintr-un literal fix. Fără `data` (eroare de loader), sărim peste descriere:
	// `seo()` cade pe tagline-ul site-ului, mai bine decât un șablon cu găuri goale.
	const description = data
		? `Harta conceptuală: „${data.node.label}” (clasa ${data.grade.label.replace(/^Clasa\s+/i, "")}). ` +
			`Noțiunile-cheie și legăturile dintre ele, cu lecția scrisă asociată, gratuit.`
		: undefined;
	const path = `/elevi/${data?.grade.id ?? ""}/harta/${data?.topicSlug ?? ""}`;
	return [
		...seo({
			title: `${t("mindmap.panel")}: ${data?.node.label ?? ""}`,
			description,
			path,
			origin: data?.origin,
		}),
		...ldJson(
			// Aceleași firimituri pe care le vede omul (vezi `data.crumbs`, construit în loader).
			breadcrumbJsonLd(data?.crumbs ?? [], data?.origin),
			data
				? learningResourceJsonLd({
						// Numele din marcaj e chiar `h1`-ul paginii (eticheta capitolului), nu titlul
						// din filă — cel din filă poartă în plus prefixul „Harta conceptuală", care
						// aici e deja spus separat, în `learningResourceType`.
						name: data.topicLabel,
						description,
						path,
						origin: data.origin,
						learningResourceType: t("mindmap.panel"),
						educationalLevel: educationalLevelLabel(data.grade.label),
						audienceRole: "student",
						about: data.topicLabel,
						// Harta se desfășoară la atingere, ramură cu ramură: e o resursă cu care
						// elevul lucrează, nu una pe care o citește de la cap la coadă.
						interactivityType: "active",
					})
				: null,
		),
	];
}

export async function loader({ request, context, params }: Route.LoaderArgs) {
	const grade = gradeById(params.gradeId);
	if (!grade) throw new Response("Not found", { status: 404 });

	const node = subjectConfig.mindmaps?.[`${params.gradeId}:${params.topicSlug}`];
	if (!node) throw new Response("Not found", { status: 404 });

	const topicLabel = topicsForGrade(params.gradeId).find((tp) => tp.slug === params.topicSlug)?.label ?? node.label;

	const db = getDb(context.cloudflare.env);
	const materials = await listMaterialsForGrade(db, params.gradeId, subjectConfig.defaultLocale, "student", false);
	const lesson = materials.find((m) => m.topicSlug === params.topicSlug && m.type === "scris");

	// O singură sursă pentru firimituri, ca pe pagina de material: clasa rămâne text, fiindcă pe
	// instanța liberă nu există rută `/elevi/:gradeId` — toate clasele stau pe `/elevi`, iar un
	// al doilea link către aceeași pagină în aceeași navigare n-ar ajuta pe nimeni.
	const crumbs: CrumbRef[] = [
		{ label: t("crumb.home"), to: "/" },
		{ label: t("crumb.elevi"), to: "/elevi" },
		{ label: grade.label },
		{ label: topicLabel },
	];

	return {
		grade,
		node,
		topicLabel,
		crumbs,
		topicSlug: params.topicSlug,
		lessonHref: lesson ? `/elevi/${params.gradeId}/m/${lesson.slug}` : null,
		origin: new URL(request.url).origin,
	};
}

export default function LiberHarta({ loaderData }: Route.ComponentProps) {
	const { node, topicLabel, crumbs, lessonHref } = loaderData;

	return (
		<>
			<LiberHeader right={<Link to="/elevi" className="text-sm underline-offset-4 hover:underline">{t("liber.back.elevi")}</Link>} />
			<main id="continut" tabIndex={-1} className="mx-auto max-w-5xl px-5 py-8">
				{/* Înlocuiesc linia de context de dinainte („Clasa a 9-a · Hidrosfera"): spuneau
				    același drum, iar păstrate împreună l-ar fi arătat de două ori. */}
				<Breadcrumbs items={crumbs} className="mb-3" />
				<Kicker>{t("mindmap.panel")}</Kicker>
				<h1 className="font-heading mt-2 text-3xl">{topicLabel}</h1>
				<Plate className="mt-6 p-6">
					<TopicMindMap node={node} lessonHref={lessonHref ?? undefined} />
				</Plate>
			</main>
			<LiberFooter />
		</>
	);
}
