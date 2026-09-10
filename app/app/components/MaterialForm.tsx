import { useState } from "react";
import { Form, useNavigation } from "react-router";
import type { GradeDef, MaterialTypeDef, TopicDef } from "../config/types";
import type { AdminMaterialRow } from "../lib/admin-content";
import { subjectConfig, t } from "../config/subject";
import { parseGameBody } from "../lib/games";
import { GameEditor, type GameKind } from "./games/editor/GameEditor";

// "simplu" = grilă clasică cu o singură întrebare (fără motor de joc, folosește
// QuizBlock). E un sentinel separat de motorul de joc "grila" (rundă de
// întrebări cu imagine, vezi GameKind) — deși ambele au etichete „Grilă” în
// UI, valorile trebuie să rămână distincte ca să nu se confunde editorul.
type Fel = "simplu" | GameKind;
const FEL_OPTIONS: { value: Fel; label: string }[] = [
	{ value: "simplu", label: "Grilă (o întrebare)" },
	{ value: "grila", label: "Grilă cu imagine (o variantă corectă)" },
	{ value: "asociere", label: "Asociere" },
	{ value: "ordonare", label: "Ordonare" },
	{ value: "plaseaza-pe-harta", label: "Plasează pe hartă" },
	{ value: "harta-quiz", label: "Hartă-quiz" },
	{ value: "matrice", label: "Matrice de completat" },
	{ value: "sortare", label: "Sortare pe categorii" },
];

interface Props {
	grades: GradeDef[];
	topics: Record<string, TopicDef[]>;
	materialTypes: (MaterialTypeDef & { label: string })[];
	initial?: AdminMaterialRow;
	mode: "create" | "edit";
	error?: string;
	reusable?: { assetId: string; title: string }[];
	initialAssets?: { id: string; idx: number }[];
}

interface QuizOption { text: string }
function parseQuiz(body: string) {
	try {
		const d = JSON.parse(body) as { question: string; options: { text: string; correct?: boolean }[]; explain?: string };
		const correctIndex = Math.max(0, d.options.findIndex((o) => o.correct));
		return { question: d.question ?? "", options: d.options?.map((o) => ({ text: o.text })) ?? [{ text: "" }], correctIndex, explain: d.explain ?? "" };
	} catch {
		return { question: "", options: [{ text: "" }, { text: "" }], correctIndex: 0, explain: "" };
	}
}
function parseExam(body: string) {
	try {
		const d = JSON.parse(body) as { items: { q: string; points: number }[] };
		return d.items?.length ? d.items : [{ q: "", points: 10 }];
	} catch {
		return [{ q: "", points: 10 }];
	}
}
function parseSlides(body: string) {
	try {
		const d = JSON.parse(body) as { slides: { title: string; text: string }[] };
		return d.slides?.length ? d.slides : [{ title: "", text: "" }];
	} catch {
		return [{ title: "", text: "" }];
	}
}
function parseJsonField(body: string, key: string) {
	try {
		return (JSON.parse(body) as Record<string, string>)[key] ?? "";
	} catch {
		return "";
	}
}
// Photo titles as one-per-line text: prefer the `captions` array, fall back to
// the legacy single `caption`.
function parsePhotoTitles(body: string): string {
	try {
		const o = JSON.parse(body) as { captions?: string[]; caption?: string };
		if (Array.isArray(o.captions)) return o.captions.join("\n");
		if (typeof o.caption === "string") return o.caption;
	} catch {
		/* not JSON yet */
	}
	return "";
}

const inputCls =
	"rounded-lg border border-border bg-bg px-3 py-2.5 outline-none focus:border-primary focus:ring-2 focus:ring-primary/20";
const labelCls = "grid gap-1.5 text-sm";

export function MaterialForm({ grades, topics, materialTypes, initial, mode, error, reusable = [], initialAssets }: Props) {
	const nav = useNavigation();
	const [gradeId, setGradeId] = useState(initial?.gradeId ?? grades[0].id);
	const [library, setLibrary] = useState(initial?.library ?? "student");
	// The teacher library is filed by collection (scheme de lecție, ghid
	// metodologic), not by the student topics — same column, different shelf.
	const collectionOptions = subjectConfig.teacherCollections.map((c) => ({ slug: c.slug, label: t(c.labelKey) }));
	const gradeTopics = library === "teacher" ? collectionOptions : (topics[gradeId] ?? []);
	const [topicSlug, setTopicSlug] = useState(initial?.topicSlug ?? gradeTopics[0]?.slug ?? "");
	const topicValue = gradeTopics.some((tp) => tp.slug === topicSlug) ? topicSlug : (gradeTopics[0]?.slug ?? "");
	const [type, setType] = useState(initial?.type ?? materialTypes[0].key);
	const initialFel: Fel = initial?.type === "joc" ? (parseGameBody(initial.body)?.kind ?? "simplu") : "simplu";
	const [fel, setFel] = useState<Fel>(initialFel);

	// per-type editors
	const [scrisText, setScrisText] = useState(initial && initial.type === "scris" ? initial.body : "");
	const [appHtml, setAppHtml] = useState(initial && initial.type === "interactiv" ? initial.body : "");
	const [videoUrl, setVideoUrl] = useState(initial?.type === "video" ? parseJsonField(initial.body, "url") : "");
	const [photoTitles, setPhotoTitles] = useState(initial?.type === "foto" ? parsePhotoTitles(initial.body) : "");
	const quiz0 = initial?.type === "joc" ? parseQuiz(initial.body) : parseQuiz("");
	const [question, setQuestion] = useState(quiz0.question);
	const [options, setOptions] = useState<QuizOption[]>(quiz0.options);
	const [correctIndex, setCorrectIndex] = useState(quiz0.correctIndex);
	const [explain, setExplain] = useState(quiz0.explain);
	const [examItems, setExamItems] = useState(initial?.type === "examen" ? parseExam(initial.body) : parseExam(""));
	const [slides, setSlides] = useState(initial?.type === "prezentare" ? parseSlides(initial.body) : parseSlides(""));

	function onGradeChange(id: string) {
		setGradeId(id);
		const first = topics[id]?.[0]?.slug ?? "";
		setTopicSlug(first);
	}

	function computeBody(): string {
		switch (type) {
			case "scris":
				return scrisText;
			case "interactiv":
				return appHtml;
			case "video":
				return videoUrl ? JSON.stringify({ url: videoUrl }) : "";
			case "foto": {
				const captions = photoTitles.split("\n").map((s) => s.trim());
				while (captions.length && captions[captions.length - 1] === "") captions.pop();
				return JSON.stringify({ captions });
			}
			case "joc":
				return JSON.stringify({
					question,
					options: options.map((o, i) => ({ text: o.text, ...(i === correctIndex ? { correct: true } : {}) })),
					explain,
				});
			case "examen":
				return JSON.stringify({ items: examItems });
			case "prezentare":
				return JSON.stringify({ slides });
			default:
				return "";
		}
	}

	return (
		<Form
			method="post"
			className="grid gap-5"
			encType={type === "joc" && fel !== "simplu" ? "multipart/form-data" : undefined}
		>
			{error && (
				<p className="rounded-lg bg-accent/10 px-3 py-2 text-sm text-accent-strong">{error}</p>
			)}

			<div className="grid gap-4 sm:grid-cols-2">
				<label className={labelCls}>
					<span className="text-muted">Clasa</span>
					<select name="gradeId" value={gradeId} onChange={(e) => onGradeChange(e.target.value)} className={inputCls}>
						{grades.map((g) => (
							<option key={g.id} value={g.id}>{g.label}</option>
						))}
					</select>
				</label>
				<label className={labelCls}>
					<span className="text-muted">{library === "teacher" ? "Colecție" : "Tema"}</span>
					<select name="topicSlug" value={topicValue} onChange={(e) => setTopicSlug(e.target.value)} className={inputCls}>
						{gradeTopics.map((tp) => (
							<option key={tp.slug} value={tp.slug}>{tp.label}</option>
						))}
					</select>
				</label>
				<label className={labelCls}>
					<span className="text-muted">Tip material</span>
					<select name="type" value={type} onChange={(e) => setType(e.target.value)} className={inputCls}>
						{materialTypes.map((mt) => (
							<option key={mt.key} value={mt.key}>{mt.label}</option>
						))}
					</select>
				</label>
				<label className={labelCls}>
					<span className="text-muted">Bibliotecă</span>
					<select
						name="library"
						value={library}
						onChange={(e) => setLibrary(e.target.value)}
						className={inputCls}
					>
						<option value="student">Materiale elevi</option>
						<option value="teacher">Materiale profesori (pedagogie)</option>
					</select>
				</label>
			</div>

			<label className={labelCls}>
				<span className="text-muted">Titlu</span>
				<input name="title" required defaultValue={initial?.title ?? ""} placeholder="ex. Vulcanii" className={inputCls} />
			</label>
			<label className={labelCls}>
				<span className="text-muted">Descriere scurtă</span>
				<input name="description" defaultValue={initial?.description ?? ""} placeholder="O propoziție despre material" className={inputCls} />
			</label>

			{type === "joc" && (
				<label className={labelCls}>
					<span className="text-muted">Fel de joc</span>
					<select value={fel} onChange={(e) => setFel(e.target.value as Fel)} className={inputCls}>
						{FEL_OPTIONS.map((o) => (
							<option key={o.value} value={o.value}>{o.label}</option>
						))}
					</select>
				</label>
			)}

			{/* type-specific editor */}
			<div className="rounded-xl border border-border bg-surface p-4">
				{type === "scris" && (
					<label className={labelCls}>
						<span className="text-muted">Conținutul lecției</span>
						<textarea
							value={scrisText}
							onChange={(e) => setScrisText(e.target.value)}
							rows={10}
							placeholder={"Scrie lecția aici.\n\nFolosește „# ” și „## ” la început de rând pentru subtitluri, „- ” pentru o listă, „---” pentru o linie despărțitoare și „**text**” pentru cuvinte îngroșate."}
							className={inputCls}
						/>
					</label>
				)}

				{type === "interactiv" && (
					<label className={labelCls}>
						<span className="text-muted">Codul aplicației (HTML)</span>
						<textarea
							value={appHtml}
							onChange={(e) => setAppHtml(e.target.value)}
							rows={12}
							spellCheck={false}
							placeholder={"Lipește aici un fișier HTML de sine stătător, cu tot cu stiluri și scripturi."}
							className={`${inputCls} font-mono text-xs`}
						/>
						<span className="text-xs text-muted">
							Aplicația rulează izolat: nu are acces la contul tău, la datele site-ului sau la restul
							paginii. Folosește doar fișiere în care ai încredere, complete (fără legături către alte
							site-uri).
						</span>
					</label>
				)}

				{type === "video" && (
					<label className={labelCls}>
						<span className="text-muted">Link video (opțional)</span>
						<input value={videoUrl} onChange={(e) => setVideoUrl(e.target.value)} placeholder="ex. https://… (poate fi adăugat mai târziu)" className={inputCls} />
						<span className="text-xs text-muted">Descrierea de mai sus apare sub video.</span>
					</label>
				)}

				{type === "foto" && (
					<label className={labelCls}>
						<span className="text-muted">Titlurile fotografiilor</span>
						<textarea
							value={photoTitles}
							onChange={(e) => setPhotoTitles(e.target.value)}
							rows={5}
							placeholder={"Un titlu pe rând, în ordinea în care încarci imaginile.\nEx.:\nTeoria Big Bang\nCalea Lactee\nNebuloasa Vulturul"}
							className={inputCls}
						/>
						<span className="text-xs text-muted">Câte un titlu pe rând, în aceeași ordine ca imaginile. Titlul apare sub fiecare fotografie în carusel. Imaginile se încarcă după salvare, în secțiunea „Fișiere".</span>
					</label>
				)}

				{type === "joc" && fel === "simplu" && (
					<div className="grid gap-3">
						<label className={labelCls}>
							<span className="text-muted">Întrebarea</span>
							<input value={question} onChange={(e) => setQuestion(e.target.value)} className={inputCls} />
						</label>
						<div className="grid gap-2">
							<span className="text-sm text-muted">Variante (bifează răspunsul corect)</span>
							{options.map((opt, i) => (
								<div key={i} className="flex items-center gap-2">
									<input type="radio" name="correctRadio" checked={correctIndex === i} onChange={() => setCorrectIndex(i)} aria-label="Corect" />
									<input
										value={opt.text}
										onChange={(e) => setOptions((prev) => prev.map((o, j) => (j === i ? { text: e.target.value } : o)))}
										placeholder={`Varianta ${i + 1}`}
										className={`${inputCls} flex-1`}
									/>
									{options.length > 2 && (
										<button type="button" onClick={() => { setOptions((p) => p.filter((_, j) => j !== i)); if (correctIndex >= i) setCorrectIndex(Math.max(0, correctIndex - 1)); }} className="px-2 text-accent-strong">×</button>
									)}
								</div>
							))}
							<button type="button" onClick={() => setOptions((p) => [...p, { text: "" }])} className="justify-self-start text-sm font-medium text-primary">+ Adaugă variantă</button>
						</div>
						<label className={labelCls}>
							<span className="text-muted">Explicație (apare după răspuns)</span>
							<input value={explain} onChange={(e) => setExplain(e.target.value)} className={inputCls} />
						</label>
					</div>
				)}

				{type === "joc" && fel !== "simplu" && (
					<GameEditor
						kind={fel}
						initialBody={initial?.type === "joc" ? initial.body : undefined}
						initialAssets={initialAssets}
						reusable={reusable}
					/>
				)}

				{type === "examen" && (
					<div className="grid gap-2">
						<span className="text-sm text-muted">Itemi (întrebare + punctaj)</span>
						{examItems.map((it, i) => (
							<div key={i} className="flex items-start gap-2">
								<span className="pt-2.5 text-sm font-semibold text-primary">{i + 1}.</span>
								<textarea value={it.q} onChange={(e) => setExamItems((p) => p.map((x, j) => (j === i ? { ...x, q: e.target.value } : x)))} rows={2} placeholder="Cerința" className={`${inputCls} flex-1`} />
								<input type="number" value={it.points} onChange={(e) => setExamItems((p) => p.map((x, j) => (j === i ? { ...x, points: Number(e.target.value) } : x)))} className={`${inputCls} w-20`} />
								{examItems.length > 1 && (
									<button type="button" onClick={() => setExamItems((p) => p.filter((_, j) => j !== i))} className="pt-2 text-accent-strong">×</button>
								)}
							</div>
						))}
						<button type="button" onClick={() => setExamItems((p) => [...p, { q: "", points: 10 }])} className="justify-self-start text-sm font-medium text-primary">+ Adaugă item</button>
					</div>
				)}

				{type === "prezentare" && (
					<div className="grid gap-2">
						<span className="text-sm text-muted">Slide-uri (titlu + text)</span>
						{slides.map((s, i) => (
							<div key={i} className="grid gap-2 rounded-lg border border-border p-3">
								<div className="flex items-center justify-between">
									<span className="text-xs font-medium text-muted">Slide {i + 1}</span>
									{slides.length > 1 && (
										<button type="button" onClick={() => setSlides((p) => p.filter((_, j) => j !== i))} className="text-accent-strong">×</button>
									)}
								</div>
								<input value={s.title} onChange={(e) => setSlides((p) => p.map((x, j) => (j === i ? { ...x, title: e.target.value } : x)))} placeholder="Titlu slide" className={inputCls} />
								<textarea value={s.text} onChange={(e) => setSlides((p) => p.map((x, j) => (j === i ? { ...x, text: e.target.value } : x)))} rows={2} placeholder="Text" className={inputCls} />
							</div>
						))}
						<button type="button" onClick={() => setSlides((p) => [...p, { title: "", text: "" }])} className="justify-self-start text-sm font-medium text-primary">+ Adaugă slide</button>
					</div>
				)}

				{type === "fisier" && (
					<p className="text-sm text-muted">
						Nu trebuie completat nimic aici. După ce salvezi, încarci fișierul (PDF, Word,
						PowerPoint, imagine sau video) în secțiunea „Fișiere".
					</p>
				)}
			</div>

			<div className="grid gap-4 sm:grid-cols-3 sm:items-end">
				<label className={labelCls}>
					<span className="text-muted">Stare</span>
					<select name="status" defaultValue={initial?.status ?? "draft"} className={inputCls}>
						<option value="draft">Ciornă (ascuns)</option>
						<option value="published">Publicat (vizibil elevilor)</option>
					</select>
				</label>
				<label className={labelCls}>
					<span className="text-muted">Ordine în temă (opțional)</span>
					<input name="position" type="number" defaultValue={initial?.position ?? ""} placeholder="auto" className={inputCls} />
				</label>
				<label className="flex items-center gap-2 text-sm">
					<input type="checkbox" name="isTeaser" defaultChecked={initial?.isTeaser ?? false} />
					<span>Demonstrativ pentru public</span>
				</label>
			</div>

			{/* computed payload (GameEditor renders its own name="body" input when active) */}
			{!(type === "joc" && fel !== "simplu") && (
				<input type="hidden" name="body" value={computeBody()} />
			)}
			<input type="hidden" name="kind" value={type === "joc" ? (fel === "simplu" ? "" : fel) : ""} />

			<div className="flex gap-3">
				<button type="submit" disabled={nav.state !== "idle"} className="rounded-lg bg-primary px-5 py-2.5 font-semibold text-on-primary transition hover:bg-primary-strong disabled:opacity-60">
					{mode === "create" ? "Adaugă material" : "Salvează modificările"}
				</button>
				<a href="/admin/materiale" className="rounded-lg px-5 py-2.5 font-medium text-muted hover:text-ink">Anulează</a>
			</div>
		</Form>
	);
}
