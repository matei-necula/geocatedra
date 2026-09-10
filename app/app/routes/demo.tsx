import { Link } from "react-router";
import type { Route } from "./+types/demo";
import { subjectConfig, t } from "../config/subject";
import { getDb } from "../db/client";
import { countStudentMaterialsByGrade, loadDemoCards, type DemoCard } from "../lib/demo-content";
import { SiteHeader, SiteFooter } from "../components/site";
import { TypeChip } from "../components/TypeChip";
import { Kicker, Plate, StampBadge, roman } from "../components/atlas";
import { seo, bcp47Locale } from "../lib/seo";

export function meta({ data }: Route.MetaArgs) {
	return [
		...seo({
			title: t("demo.title"),
			description: t("demo.lead"),
			path: "/demo",
			origin: data?.origin,
		}),
		{
			"script:ld+json": {
				"@context": "https://schema.org",
				"@type": "WebPage",
				name: `${t("demo.title")} — ${subjectConfig.siteName}`,
				url: data?.origin ? `${data.origin}/demo` : "/demo",
				inLanguage: bcp47Locale(subjectConfig.defaultLocale),
				description: t("demo.lead"),
			},
		},
	];
}

export async function loader({ request, context }: Route.LoaderArgs) {
	const db = getDb(context.cloudflare.env);
	const [students, teachers, counts] = await Promise.all([
		loadDemoCards(db, subjectConfig.demo.student),
		loadDemoCards(db, subjectConfig.demo.teacher),
		countStudentMaterialsByGrade(db),
	]);
	const grades = subjectConfig.grades.map((g) => ({
		id: g.id,
		label: g.label,
		count: counts[g.id] ?? 0,
		notice: g.noticeKey ? t(g.noticeKey) : null,
	}));
	return { students, teachers, grades, origin: new URL(request.url).origin };
}

export default function Demo({ loaderData }: Route.ComponentProps) {
	const { students, teachers, grades } = loaderData;
	return (
		<div className="relative isolate min-h-screen overflow-hidden">
			<SiteHeader
				right={
					<Link
						to="/intra"
						viewTransition
						className="rounded-lg border border-border px-3 py-1.5 text-sm font-medium transition hover:border-primary"
					>
						{t("home.cta.token")}
					</Link>
				}
			/>

			<main className="mx-auto max-w-6xl px-5 py-10">
				<section className="cat-rise mb-10">
					<Kicker>{t("demo.kicker")}</Kicker>
					<h1 className="mt-2 max-w-2xl font-heading text-4xl leading-tight font-bold sm:text-5xl">
						{t("demo.title")}
					</h1>
					<p className="mt-4 max-w-2xl text-lg text-muted">{t("demo.lead")}</p>
				</section>

				<div className="grid gap-8 lg:grid-cols-2">
					{/* Elevii primii: pe telefon, coloana lor e cea care contează. */}
					<section className="stagger grid content-start gap-4">
						<header>
							<h2 className="font-heading text-2xl font-bold">{t("demo.students")}</h2>
							<p className="text-sm text-muted">{t("demo.students.desc")}</p>
						</header>
						{students.map((c) => (
							<DemoCardView key={c.slug} card={c} />
						))}
						<QuizCard />
					</section>

					<section className="stagger grid content-start gap-4">
						<header>
							<h2 className="font-heading text-2xl font-bold">{t("demo.teachers")}</h2>
							<p className="text-sm text-muted">{t("demo.teachers.desc")}</p>
						</header>
						{teachers.map((c) => (
							<DemoCardView key={c.slug} card={c} />
						))}
					</section>
				</div>

				<GradeStrip grades={grades} />
				<SiteFooter />
			</main>
		</div>
	);
}

function DemoCardView({ card }: { card: DemoCard }) {
	const isGallery = card.photoIds.length > 1 && card.type === "foto";
	return (
		<Link
			to={`/demo/m/${card.gradeId}/${card.slug}`}
			viewTransition
			className="group glow flex flex-col overflow-hidden rounded-lg border border-border bg-surface transition hover:border-primary"
		>
			{isGallery ? (
				<div className="grid grid-cols-3 gap-px bg-border">
					{card.photoIds.map((id) => (
						<img key={id} src={`/media/${id}`} alt="" loading="lazy" className="h-32 w-full object-cover" />
					))}
				</div>
			) : card.thumbId ? (
				<img
					src={`/media/${card.thumbId}`}
					alt=""
					loading="lazy"
					className="h-40 w-full border-b border-border bg-bg object-contain"
				/>
			) : null}

			<div className="flex flex-1 flex-col p-5">
				<div className="flex flex-wrap items-center gap-2">
					<TypeChip type={card.type} />
					<StampBadge>{card.gradeLabel}</StampBadge>
				</div>
				<h3 className="mt-2 font-heading text-xl font-semibold">{card.title}</h3>
				{card.excerpt ? (
					<p className="mt-2 text-sm text-muted">{card.excerpt}</p>
				) : (
					card.description && <p className="mt-2 text-sm text-muted">{card.description}</p>
				)}
				{card.pages !== null && (
					<p className="mt-2 text-xs text-muted">
						{card.shelfLabel} · {card.pages} pagini
					</p>
				)}
				<span className="mt-auto pt-4 text-sm font-semibold text-primary group-hover:underline">
					{t("demo.open")} →
				</span>
			</div>
		</Link>
	);
}

function QuizCard() {
	return (
		<Link
			to="/demo/exerseaza"
			viewTransition
			className="group glow flex flex-col rounded-lg border border-border bg-surface p-5 transition hover:border-primary"
		>
			<h3 className="font-heading text-xl font-semibold">{t("demo.quiz.title")}</h3>
			<p className="mt-2 text-sm text-muted">{t("demo.quiz.desc")}</p>
			<span className="mt-4 text-sm font-semibold text-primary group-hover:underline">
				{t("demo.quiz.start")} →
			</span>
		</Link>
	);
}

/**
 * Banda e informativă, nu navigabilă: vitrina are exact cinci materiale alese manual (al
 * șaselea card de pe pagină e testul, nu un material), iar o clasă aprinsă nu înseamnă
 * că are și ea o mostră publică. Numărul vine din bază, deci clasa se aprinde singură
 * când apare conținut — fără nicio modificare de cod.
 */
function GradeStrip({ grades }: { grades: { id: string; label: string; count: number; notice: string | null }[] }) {
	return (
		<Plate className="mt-12 p-6">
			<h2 className="font-heading text-xl font-semibold">{t("demo.grades.title")}</h2>
			<ul className="mt-4 flex flex-wrap gap-2">
				{grades.map((g) => (
					<li
						key={g.id}
						className={`rounded-lg border px-3 py-2 text-sm ${
							g.count > 0
								? "border-primary/40 bg-primary/5 text-ink"
								: "border-dashed border-border text-muted"
						}`}
					>
						<span className="font-heading font-semibold">{roman(Number(g.id))}</span>
						<span className="ml-2 text-xs">
							{g.count > 0
								? t("demo.grades.count").replace("{n}", String(g.count))
								: (g.notice ?? t("demo.grades.soon"))}
						</span>
					</li>
				))}
			</ul>
		</Plate>
	);
}
