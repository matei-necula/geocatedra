import { useMemo, useState } from "react";
import { Link } from "react-router";
import { gradeById, subjectConfig, t } from "../config/subject";
import { allChaptersOpen, chapterSummary, isChapterOpen, nextOpenChapters } from "../lib/chapter-collapse";
import { fold } from "../lib/text";
import { CardArt } from "./CardArt";
import { TypeChip, typeColor } from "./TypeChip";
import { roman, StampBadge } from "./atlas";

interface MaterialCard {
	id: string;
	slug: string;
	type: string;
	title: string;
	description: string;
	status: string;
	createdAt: number;
}
interface Topic {
	slug: string;
	label: string;
	materials: MaterialCard[];
	quizCount: number;
}

/**
 * Miniatura unui card: niciodată fotografia proprie a materialului — **tipul spune ce e
 * cardul**, fie prin pictograma vectorială pe nuanța capitolului (majoritatea tipurilor), fie
 * prin fotografia FIXĂ a categoriei pentru cele patru cu culoare fixă (scris/foto/joc/
 * exersează — vezi `CATEGORY_PHOTO` din `lib/card-art.ts`). Fotografia proprie a materialului
 * rămâne vizibilă doar în interiorul lui, după click — cu o parte din carduri pe fotografia
 * lor și restul pe siglă, nimic din grilă nu se citea la fel. Deciziile pure sunt în
 * `lib/card-art.ts`.
 *
 * `seed` e slug-ul temei. Când lipsește (cardul e scos din contextul capitolului lui, ca pe
 * `/jocuri`), cade pe slug-ul materialului: nuanța rămâne stabilă pentru același card.
 */
export function CardThumb({ title, type, seed, variant }: { title: string; type: string; seed?: string; variant?: string }) {
	return (
		<CardArt
			type={type}
			seed={seed || title}
			variant={variant ?? title}
			className="aspect-video w-full rounded-md border border-border"
		/>
	);
}

/** Chevron care se rotește la deschidere (`group-open:`); tranziția e neutralizată global de
 *  blocul `prefers-reduced-motion` din `app.css`, deci nu trebuie dublată aici. */
function Chevron() {
	return (
		<svg
			aria-hidden
			viewBox="0 0 20 20"
			className="h-4 w-4 shrink-0 text-muted transition-transform duration-200 group-open:rotate-180"
		>
			<path fill="currentColor" d="M5.8 7.4a1 1 0 0 1 1.4-1.4L10 8.8l2.8-2.8a1 1 0 1 1 1.4 1.4l-3.5 3.5a1 1 0 0 1-1.4 0z" />
		</svg>
	);
}

/** Sigla „hartă conceptuală" — noduri legate prin linii, în același stil de linie ca pictogramele
 *  din `CardArt` (nu vine de acolo fiindcă banner-ul e un simplu link, nu un card cu nuanță de
 *  capitol; culoarea vine din `text-primary`-ul link-ului, ca restul textului lui). */
function MindMapGlyph({ className = "" }: { className?: string }) {
	return (
		<svg
			aria-hidden
			viewBox="0 0 24 24"
			fill="none"
			stroke="currentColor"
			strokeWidth="1.6"
			strokeLinecap="round"
			strokeLinejoin="round"
			className={className}
		>
			<path d="M12 6.4 6 10.2M12 6.4l6 3.8M6 10.2v4.6M18 10.2v4.6M6 14.8l6 3.8M18 14.8l-6 3.8" />
			<circle cx="12" cy="6.4" r="2" />
			<circle cx="6" cy="10.2" r="2" />
			<circle cx="18" cy="10.2" r="2" />
			<circle cx="6" cy="14.8" r="2" />
			<circle cx="18" cy="14.8" r="2" />
			<circle cx="12" cy="18.6" r="2" />
		</svg>
	);
}

/**
 * Conținutul unui capitol — la fel indiferent dacă stă direct într-o `<section>` (instanța cu
 * clase) sau într-un `<details>` pliabil (instanța liberă). Scos separat ca să nu se poată bifurca
 * accidental cele două căi de randare cu timpul.
 */
function ChapterBody({
	topic,
	gradeId,
	base,
	active,
	isAdmin,
	newSince,
}: {
	topic: Topic;
	gradeId: string;
	base: string;
	active: boolean;
	isAdmin: boolean;
	newSince?: number | null;
}) {
	return (
		<>
			{!active && subjectConfig.mindmaps?.[`${gradeId}:${topic.slug}`] && (
				<Link
					to={`/${base}/${gradeId}/harta/${topic.slug}`}
					viewTransition
					className="glow mb-4 flex items-center gap-2.5 rounded-lg border border-border paper px-4 py-2.5 text-sm font-semibold text-primary"
				>
					<MindMapGlyph className="h-4 w-4 shrink-0" />
					{t("mindmap.shortcut")}
					<span aria-hidden className="ml-auto">→</span>
				</Link>
			)}
			{topic.materials.length === 0 && topic.quizCount === 0 ? (
				<p className="rounded-lg border border-dashed border-border p-5 text-sm text-muted">
					În curând materiale pentru această temă.
				</p>
			) : (
				<div className="stagger grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
					{topic.materials.map((m) => (
						<Link
							key={m.id}
							to={`/${base}/${gradeId}/m/${m.slug}`}
							viewTransition
							className="group glow relative flex flex-col overflow-hidden rounded-lg border border-border paper p-5"
						>
							<span aria-hidden className={`index-tab ${typeColor(m.type)}`} />
							<CardThumb title={m.title} type={m.type} seed={topic.slug} variant={m.slug} />
							<div className="mt-3 mb-2 flex items-center justify-between gap-2">
								<TypeChip type={m.type} />
								{isAdmin && m.status !== "published" && <StampBadge>ciornă</StampBadge>}
								{newSince != null && m.createdAt > newSince && <StampBadge>{t("browse.new_badge")}</StampBadge>}
							</div>
							<h3 className="text-lg font-semibold group-hover:text-primary">{m.title}</h3>
							{m.description && <p className="mt-1 line-clamp-2 text-sm text-muted">{m.description}</p>}
						</Link>
					))}
					{topic.quizCount > 0 && (
						<Link
							to={`/${base}/${gradeId}/exerseaza?topic=${topic.slug}`}
							viewTransition
							className="group glow relative flex flex-col overflow-hidden rounded-lg border border-border paper p-5"
						>
							<span aria-hidden className="index-tab bg-rose-500" />
							{/* Culoarea vine automat din `fixedCategory("question")` — cardul de test are
							    deja o identitate cromatică proprie, indiferent de capitol. */}
							<CardArt
								motif="question"
								seed={topic.slug}
								className="aspect-video w-full rounded-md border border-border"
							/>
							<div className="mt-3 mb-2 flex items-center justify-between gap-2">
								<span className="inline-flex items-center gap-1.5 rounded-[4px] bg-rose-100 px-2 py-0.5 text-[11px] font-semibold tracking-wide text-rose-700 uppercase">
									<span aria-hidden>❓</span>
									{t("practice.cta")}
								</span>
							</div>
							<h3 className="text-lg font-semibold group-hover:text-primary">{t("practice.cta")}</h3>
							<p className="mt-1 text-sm text-muted">
								{topic.quizCount} {topic.quizCount === 1 ? "întrebare" : "întrebări"} din această lecție
							</p>
						</Link>
					)}
				</div>
			)}
		</>
	);
}

export function GradeBrowse({
	gradeId,
	topics,
	isAdmin,
	newSince,
	base = "clasa",
	collapsible = false,
}: {
	gradeId: string;
	topics: Topic[];
	isAdmin: boolean;
	newSince?: number | null;
	/** Segmentul de adresă sub care stau materialele. `clasa` pe instanța cu clase, `elevi` pe cea liberă. */
	base?: string;
	/**
	 * Capitole pliabile, închise implicit — pentru site-ul liber, unde o clasă are 15 capitole.
	 * OPȚIONAL înadins, implicit `false`: `/clasa/:gradeId` (instanța cu clase) și orice alt
	 * apelant care nu-l trece randează identic cu înainte, byte cu byte.
	 */
	collapsible?: boolean;
}) {
	const [query, setQuery] = useState("");
	const [types, setTypes] = useState<string[]>([]);
	// Capitole deschise MANUAL de utilizator (relevant doar când `collapsible`). Implicit gol —
	// toate capitolele pornesc închise, ca pagina să se deschidă drept un cuprins curat.
	const [openSlugs, setOpenSlugs] = useState<Set<string>>(new Set());

	// Types actually present in this grade, in config order (subject-agnostic).
	const presentTypes = useMemo(() => {
		const present = new Set<string>();
		for (const tp of topics) for (const m of tp.materials) present.add(m.type);
		return subjectConfig.materialTypes.map((mt) => mt.key).filter((k) => present.has(k));
	}, [topics]);

	const q = fold(query.trim());
	const active = q.length > 0 || types.length > 0;

	const filtered = useMemo(() => {
		return topics
			.map((tp) => ({
				...tp,
				materials: tp.materials.filter((m) => {
					const matchesText = q.length === 0 || fold(m.title).includes(q) || fold(m.description).includes(q);
					const matchesType = types.length === 0 || types.includes(m.type);
					return matchesText && matchesType;
				}),
			}))
			.filter((tp) => tp.materials.length > 0 || !active);
	}, [topics, q, types, active]);

	const toggleType = (key: string) =>
		setTypes((cur) => (cur.includes(key) ? cur.filter((k) => k !== key) : [...cur, key]));
	const clear = () => {
		setQuery("");
		setTypes([]);
	};

	const nothing = active && filtered.every((tp) => tp.materials.length === 0);

	// Numărul de bază (necenzurat de căutare/filtru) per capitol, pentru rezumatul din `<summary>`
	// — un capitol închis arată mereu totalul lui real, nu câte materiale se potrivesc acum.
	const baseMaterialCount = useMemo(() => new Map(topics.map((tp) => [tp.slug, tp.materials.length])), [topics]);

	const allSlugs = useMemo(() => topics.map((tp) => tp.slug), [topics]);
	const allOpen = allChaptersOpen(allSlugs, openSlugs);
	const toggleAll = () => setOpenSlugs(nextOpenChapters(allSlugs, allOpen));
	const setTopicOpen = (slug: string, open: boolean) =>
		setOpenSlugs((cur) => {
			const next = new Set(cur);
			if (open) next.add(slug);
			else next.delete(slug);
			return next;
		});

	// Clasă fără teme încă (ex. programă nouă neintrată în vigoare) — un anunț calm,
	// nu o pagină goală. Vine din config (`grade.noticeKey`), nu e cablat pe niciun id de clasă.
	if (topics.length === 0) {
		const grade = gradeById(gradeId);
		const notice = grade?.noticeKey ? t(grade.noticeKey) : null;
		return notice ? (
			<div className="cat-rise plate paper p-6 text-center">
				<p className="text-muted">{notice}</p>
			</div>
		) : null;
	}

	return (
		<>
			{/* Bara rămâne la vedere: pe `/elevi` sunt 15 capitole și ~60 de carduri, iar filtrul
			    care dispare după primul ecran e un filtru pe care nimeni nu-l mai folosește.
			    Fundalul e opac (nu translucid) ca textul cardurilor să nu transpară pe sub. */}
			<div className="cat-rise sticky top-0 z-20 mb-6 grid gap-3 bg-bg py-3">
				<input
					type="search"
					value={query}
					onChange={(e) => setQuery(e.target.value)}
					placeholder={t("browse.search")}
					aria-label={t("browse.search")}
					className="w-full rounded-md border border-border bg-surface px-4 py-2.5 outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
				/>
				{(presentTypes.length > 1 || collapsible) && (
					<div className="flex flex-wrap items-center gap-2">
						{presentTypes.map((key) => {
							const on = types.includes(key);
							return (
								<button
									key={key}
									type="button"
									aria-pressed={on}
									onClick={() => toggleType(key)}
									className={`rounded-[6px] ring-2 transition ${on ? "ring-primary" : "ring-transparent opacity-70 hover:opacity-100"}`}
								>
									<TypeChip type={key} />
								</button>
							);
						})}
						{collapsible && (
							<button
								type="button"
								onClick={toggleAll}
								className="ml-auto rounded-md border border-border bg-surface px-3 py-1.5 text-sm font-medium text-primary hover:bg-bg"
							>
								{allOpen ? t("browse.collapse_all") : t("browse.expand_all")}
							</button>
						)}
					</div>
				)}
			</div>

			{nothing ? (
				<div className="cat-rise rounded-lg border border-dashed border-border p-8 text-center">
					<p className="text-muted">{t("browse.no_results")}</p>
					<button type="button" onClick={clear} className="mt-3 text-sm font-medium text-primary hover:underline">
						{t("browse.clear")}
					</button>
				</div>
			) : (
				<div className="grid gap-8">
					{filtered.map((topic) => {
						const chapterNo = topics.findIndex((x) => x.slug === topic.slug) + 1;

						if (collapsible) {
							const ownOpen = openSlugs.has(topic.slug);
							const open = isChapterOpen(ownOpen, active);
							return (
								<details key={topic.slug} className="group" open={open}>
									{/* `<summary>` acceptă un singur element de titlu, primul copil, urmat de conținut de tip
									    „phrasing" — de-aia numeralul roman stă ÎN h2, nu înaintea lui ca în varianta necolapsabilă.

									    Comutarea e pe `onClick` + `preventDefault`, NU pe `onToggle`: Chrome emite „toggle" și
									    când `open` e schimbat din cod (deci și când NOI îl forțăm de la căutare), iar
									    `onToggle` ar scrie starea forțată înapoi în starea proprie — un capitol găsit de căutare
									    ar rămâne „deschis manual" pentru totdeauna, chiar după ce se șterge căutarea. Verificat
									    într-un Chrome real: fără `preventDefault`, exact asta se întâmpla. */}
									<summary
										onClick={(e) => {
											e.preventDefault();
											setTopicOpen(topic.slug, !ownOpen);
										}}
										className="mb-3 flex cursor-pointer list-none items-baseline gap-3 marker:content-none [&::-webkit-details-marker]:hidden"
									>
										<h2 className="font-heading flex flex-1 items-baseline gap-3 text-xl font-semibold">
											<span className="text-lg text-primary">{roman(chapterNo)}.</span>
											{topic.label}
										</h2>
										<span className="text-sm whitespace-nowrap text-muted">
											{chapterSummary(baseMaterialCount.get(topic.slug) ?? topic.materials.length, topic.quizCount)}
										</span>
										<Chevron />
									</summary>
									<div aria-hidden className="rule-azure mb-4" />
									<ChapterBody
										topic={topic}
										gradeId={gradeId}
										base={base}
										active={active}
										isAdmin={isAdmin}
										newSince={newSince}
									/>
								</details>
							);
						}

						return (
							<section key={topic.slug}>
								<div className="mb-3 flex items-baseline gap-3">
									<span className="font-heading text-lg text-primary">{roman(chapterNo)}.</span>
									<h2 className="font-heading text-xl font-semibold">{topic.label}</h2>
								</div>
								<div aria-hidden className="rule-azure mb-4" />
								<ChapterBody
									topic={topic}
									gradeId={gradeId}
									base={base}
									active={active}
									isAdmin={isAdmin}
									newSince={newSince}
								/>
							</section>
						);
					})}
				</div>
			)}
		</>
	);
}
