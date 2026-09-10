import { Link } from "react-router";
import type { Route } from "./+types/liber.pedagogie";
import { subjectConfig, t } from "../config/subject";
import { getDb } from "../db/client";
import { listTeacherCollection } from "../lib/content";
import { thumbsForMaterials } from "../lib/assets";
import { LiberFooter, LiberHeader } from "../components/liber/LiberChrome";
import { Breadcrumbs } from "../components/Breadcrumbs";
import { Kicker } from "../components/atlas";
import { seo } from "../lib/seo";
import { breadcrumbJsonLd, ldJson, type CrumbRef } from "../lib/jsonld";
import { plansePlural } from "../lib/plural";

export function meta({ data }: Route.MetaArgs) {
	return [
		...seo({
			title: t("liber.pedagogie.seo"),
			description:
				"Biblioteca gratuită pentru profesori: scheme de lecție, ghiduri metodologice, proiecte " +
				"didactice, studii de caz și teste-model, fără cont.",
			path: "/pedagogie",
			origin: data?.origin,
		}),
		// Firimiturile vizibile și cele din marcaj vin din ACELAȘI tablou, construit în loader.
		// Dacă marcajul s-ar scrie aici, separat, ar diverge de ce vede omul la prima redenumire.
		...ldJson(breadcrumbJsonLd(data?.crumbs ?? [], data?.origin)),
	];
}

export async function loader({ request, context }: Route.LoaderArgs) {
	const db = getDb(context.cloudflare.env);
	const locale = subjectConfig.defaultLocale;

	// Fiecare raft își spune greutatea: coperta primului material și câte planșe are în total.
	// Cifrele se NUMĂRĂ, nu se scriu în config — un raft care primește materiale noi își
	// actualizează singur numărul, fără să atingă nimeni codul.
	//
	// **Un loader de listă nu trimite `body`.** `listTeacherCollection` întoarce `MaterialView`
	// întreg (inclusiv `body` — JSON-ul teancului de pagini), dar din el pleacă spre client doar
	// cele șase câmpuri de mai jos, iar `materials` e doar un NUMĂR, nu rândurile. Rămâne o
	// supra-aducere din D1, pe care n-o putem tăia fără o interogare nouă în `lib/content.ts`;
	// ce contează pentru pagina asta e că nu ajunge în sarcina de hidratare.
	const shelves = await Promise.all(
		subjectConfig.teacherCollections.map(async (c) => {
			const materials = await listTeacherCollection(db, c.slug, locale);
			const { first, count } = await thumbsForMaterials(db, materials.map((m) => m.id));
			const pages = Object.values(count).reduce((a, b) => a + b, 0);
			const cover = materials.map((m) => first[m.id]).find(Boolean) ?? null;
			return {
				slug: c.slug,
				label: t(c.labelKey),
				desc: t(c.descKey),
				cover,
				pages,
				materials: materials.length,
			};
		}),
	);

	const crumbs: CrumbRef[] = [
		{ label: t("crumb.home"), to: "/" },
		{ label: t("crumb.pedagogie") },
	];

	return { shelves, crumbs, origin: new URL(request.url).origin };
}

export default function LiberPedagogie({ loaderData }: Route.ComponentProps) {
	const { shelves, crumbs } = loaderData;

	return (
		<>
			<LiberHeader right={<Link to="/" className="text-sm underline-offset-4 hover:underline">{t("liber.back.home")}</Link>} />
			<main id="continut" tabIndex={-1} className="mx-auto max-w-5xl px-5 py-10">
				<Breadcrumbs items={crumbs} className="mb-4" />
				<Kicker>{t("liber.door.profesori.desc")}</Kicker>
				<h1 className="font-heading mt-2 text-3xl">{t("liber.pedagogie.title")}</h1>
				<div className="mt-8 grid gap-5 sm:grid-cols-2">
					{shelves.map((s) => (
						<Link key={s.slug} to={`/pedagogie/${s.slug}`} viewTransition className="group glow flex flex-col overflow-hidden rounded-lg border border-border bg-surface">
							{/* Coperta e prima planșă a primului material din raft. Un raft gol (încă
							    fără materiale publicate) nu randează nimic în locul ei — nu punem un
							    dreptunghi gri care să arate a imagine care n-a venit. */}
							{s.cover && (
								<img
									src={`/media/${s.cover}?t`}
									alt=""
									aria-hidden
									loading="lazy"
									decoding="async"
									width={640}
									height={360}
									className="aspect-video w-full border-b border-border bg-bg object-cover object-top"
								/>
							)}
							<div className="flex flex-1 flex-col p-6">
								<h2 className="font-heading text-xl group-hover:text-primary">{s.label}</h2>
								<p className="mt-2 text-sm text-muted">{s.desc}</p>
								{s.pages > 0 && (
									<p className="mt-4 text-sm font-semibold text-primary">{plansePlural(s.pages)}</p>
								)}
							</div>
						</Link>
					))}
				</div>
			</main>
			<LiberFooter />
		</>
	);
}
