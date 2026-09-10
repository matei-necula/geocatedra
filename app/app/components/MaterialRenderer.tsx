import { useState, type ReactNode } from "react";
import type { MaterialView } from "../lib/content";
import { parseGameBody } from "../lib/games";
import { MatchGame } from "./games/MatchGame";
import { OrderGame } from "./games/OrderGame";
import { PlaceOnMapGame } from "./games/PlaceOnMapGame";
import { MapQuizGame } from "./games/MapQuizGame";
import { MatrixGame } from "./games/MatrixGame";
import { GrilaGame } from "./games/GrilaGame";
import { SortareGame } from "./games/SortareGame";
import { AssetView, ImageGallery, type AssetLite } from "./Attachments";
import { FullscreenButton, Lightbox, useLightbox } from "./Lightbox";
import { PageBook } from "./PageBook";
import { InteractiveApp } from "./InteractiveApp";
import { parsePageBook } from "../lib/pagebook";
import { classifyBlock, parseInline, splitBlocks, type InlineToken, type MdListItem } from "../lib/markdown";

function safeJson<T>(raw: string, fallback: T): T {
	try {
		return JSON.parse(raw) as T;
	} catch {
		return fallback;
	}
}

export function MaterialRenderer({
	material,
	assets = [],
	viewOnly = false,
}: {
	material: MaterialView;
	assets?: AssetLite[];
	viewOnly?: boolean;
}) {
	switch (material.type) {
		case "video":
			return <VideoBlock material={material} />;
		case "scris":
			return <WrittenBlock body={material.body} />;
		case "joc":
			return <GameBlock body={material.body} assets={assets} />;
		case "examen":
			return <ExamBlock body={material.body} />;
		case "foto":
			return <PhotoBlock body={material.body} assets={assets} viewOnly={viewOnly} />;
		case "prezentare":
			return <PresentationBlock body={material.body} assets={assets} title={material.title} />;
		case "fisier":
			return <FileBlock assets={assets} viewOnly={viewOnly} />;
		case "interactiv":
			return <InteractiveApp html={material.body} title={material.title} />;
		default:
			return <p className="text-muted">Tip de material necunoscut.</p>;
	}
}

function FileBlock({ assets, viewOnly }: { assets: AssetLite[]; viewOnly: boolean }) {
	// Descrierea e deja afișată în antetul paginii (student și profesor) — n-o repetăm aici.
	return (
		<div className="grid gap-4">
			{assets.length === 0 ? (
				<p className="rounded-lg border border-dashed border-border p-4 text-sm text-muted">
					Niciun fișier încărcat încă.
				</p>
			) : (
				assets.map((a) => <AssetView key={a.id} asset={a} viewOnly={viewOnly} />)
			)}
		</div>
	);
}

// „Prezentare" acoperă două lucruri: teancul de pagini-imagine (schițe de lecție,
// ghiduri metodologice) și vechiul slideshow de text. Alege după `kind` din body.
function PresentationBlock({ body, assets, title }: { body: string; assets: AssetLite[]; title: string }) {
	const book = parsePageBook(body, assets.filter((a) => a.role === "image").length);
	// `title` pleacă mai departe prin zonele de clic, ca materialul-țintă să poată
	// oferi drumul înapoi spre cel din care ai venit.
	if (book) return <PageBook assets={assets} count={book.count} links={book.links} title={title} />;
	return <SlideshowBlock body={body} />;
}

function VideoBlock({ material }: { material: MaterialView }) {
	return (
		<div>
			<div className="relative grid aspect-video place-items-center overflow-hidden rounded-xl bg-gradient-to-br from-primary to-ink text-white">
				<button className="grid h-16 w-16 place-items-center rounded-full bg-white/90 text-2xl text-primary shadow-lg transition hover:scale-105">
					▶
				</button>
				<span className="absolute bottom-3 left-4 text-sm opacity-80">
					Lecție video (demonstrativ)
				</span>
			</div>
			{material.description && <p className="mt-4 text-muted">{material.description}</p>}
		</div>
	);
}

// Render a parsed inline-token list (from lib/markdown) into React nodes.
// Only ever produces plain text, <strong> and <em> — no raw HTML, safe by
// construction.
function renderTokens(tokens: InlineToken[]): ReactNode[] {
	return tokens.map((tok, i) => {
		if (tok.kind === "bold") return <strong key={i}>{tok.text}</strong>;
		if (tok.kind === "em") return <em key={i}>{tok.text}</em>;
		return tok.text;
	});
}
function renderInline(text: string): ReactNode[] {
	return renderTokens(parseInline(text));
}

function MdList({ ordered, items }: { ordered: boolean; items: MdListItem[] }) {
	const Tag = ordered ? "ol" : "ul";
	return (
		<Tag>
			{items.map((it, i) => (
				<li key={i}>
					{renderInline(it.text)}
					{it.children.length > 0 && <MdList ordered={it.children[0].ordered} items={it.children} />}
				</li>
			))}
		</Tag>
	);
}

// A GitHub-style pipe table: a header row, a "---" separator row, then body
// rows — every line starts with "|". Parsed by lib/markdown so it never
// touches normal paragraphs.
function MdTable({ header, rows }: { header: string[]; rows: string[][] }) {
	return (
		<div className="prose-table-wrap" role="region" aria-label="Tabel" tabIndex={0}>
			<table>
				<thead>
					<tr>
						{header.map((c, i) => (
							<th key={i} scope="col">
								{renderInline(c)}
							</th>
						))}
					</tr>
				</thead>
				<tbody>
					{rows.map((r, ri) => (
						<tr key={ri}>
							{r.map((c, ci) =>
								ci === 0 ? (
									<th key={ci} scope="row">
										{renderInline(c)}
									</th>
								) : (
									<td key={ci}>{renderInline(c)}</td>
								),
							)}
						</tr>
					))}
				</tbody>
			</table>
		</div>
	);
}

function WrittenBlock({ body }: { body: string }) {
	// Rendered as plain-text blocks (no raw HTML) — safe by construction. The
	// actual splitting/classifying (headings, lists, tables, "---" rule,
	// "**bold**"/"*italic*") lives in the pure, tested lib/markdown module —
	// this component only turns its output into JSX.
	const blocks = splitBlocks(body);
	return (
		<div className="prose-ro max-w-none">
			{blocks.map((raw, i) => {
				const block = classifyBlock(raw);
				switch (block.kind) {
					case "hr":
						return <hr key={i} />;
					case "heading": {
						const Tag = block.level === 2 ? "h2" : block.level === 3 ? "h3" : "h4";
						return <Tag key={i}>{renderInline(block.text)}</Tag>;
					}
					case "table":
						return <MdTable key={i} header={block.header} rows={block.rows} />;
					case "list":
						return <MdList key={i} ordered={block.ordered} items={block.items} />;
					case "paragraph":
						return <p key={i}>{renderInline(block.text)}</p>;
				}
			})}
		</div>
	);
}

interface QuizData {
	question: string;
	options: { text: string; correct?: boolean }[];
	explain?: string;
}

function QuizBlock({ body }: { body: string }) {
	const data = safeJson<QuizData>(body, { question: "", options: [] });
	const [picked, setPicked] = useState<number | null>(null);
	return (
		<div className="rounded-xl border border-border bg-surface p-5">
			<p className="mb-4 font-heading text-lg font-semibold">{data.question}</p>
			<div className="grid gap-2">
				{data.options.map((opt, i) => {
					const chosen = picked === i;
					const reveal = picked !== null;
					const ok = opt.correct;
					return (
						<button
							key={i}
							onClick={() => setPicked(i)}
							disabled={reveal}
							className={`rounded-lg border px-4 py-2.5 text-left transition ${
								reveal && ok
									? "border-emerald-500 bg-emerald-50"
									: chosen
										? "border-accent bg-accent/10"
										: "border-border hover:border-primary"
							}`}
						>
							{opt.text}
							{reveal && ok && <span className="ml-2 text-emerald-600">✓</span>}
						</button>
					);
				})}
			</div>
			{picked !== null && data.explain && (
				<p className="mt-4 rounded-lg bg-sand/30 p-3 text-sm">{data.explain}</p>
			)}
		</div>
	);
}

function GameBlock({ body, assets }: { body: string; assets: AssetLite[] }) {
	const game = parseGameBody(body);
	if (!game) return <QuizBlock body={body} />;
	const gameAssets = assets.flatMap((a) => (a.idx === undefined ? [] : [{ id: a.id, idx: a.idx }]));
	switch (game.kind) {
		case "asociere":
			return <MatchGame rounds={game.rounds} imageFit={game.imageFit} layout={game.layout} assets={gameAssets} />;
		case "plaseaza-pe-harta":
			return <PlaceOnMapGame map={game.map} targets={game.targets} reveal={game.reveal} rounds={game.rounds} assets={gameAssets} />;
		case "ordonare":
			return <OrderGame rounds={game.rounds} imageFit={game.imageFit} assets={gameAssets} />;
		case "harta-quiz":
			return <MapQuizGame map={game.map} maps={game.maps} points={game.points} draw={game.draw} roundsDef={game.rounds} assets={gameAssets} />;
		case "matrice":
			return <MatrixGame variants={game.variants} />;
		case "grila":
			return <GrilaGame rounds={game.rounds} assets={gameAssets} />;
		case "sortare":
			return <SortareGame buckets={game.buckets} rounds={game.rounds} assets={gameAssets} />;
	}
}

interface ExamData {
	items: { q: string; points: number }[];
}

function ExamBlock({ body }: { body: string }) {
	const data = safeJson<ExamData>(body, { items: [] });
	const total = data.items.reduce((s, it) => s + it.points, 0);
	return (
		<ol className="grid gap-3">
			{data.items.map((it, i) => (
				<li key={i} className="flex items-start justify-between gap-4 rounded-lg border border-border bg-surface p-4">
					<span>
						<span className="mr-2 font-semibold text-primary">{i + 1}.</span>
						{it.q}
					</span>
					<span className="shrink-0 rounded-full bg-sand/40 px-3 py-1 text-sm font-medium">
						{it.points}p
					</span>
				</li>
			))}
			<li className="text-right text-sm text-muted">Total: {total} puncte (+ 10 din oficiu)</li>
		</ol>
	);
}

function PhotoBlock({ body, assets, viewOnly }: { body: string; assets: AssetLite[]; viewOnly: boolean }) {
	// `captions` holds one title per image (aligned to upload order); `caption`
	// is the legacy single description, shown once when no per-photo titles exist.
	const data = safeJson<{ caption?: string; captions?: string[] }>(body, {});
	const images = assets.filter((a) => a.role === "image");
	const [i, setI] = useState(0);

	if (images.length === 0) {
		return (
			<figure>
				<ImageGallery assets={assets} viewOnly={viewOnly} />
				{data.caption && <figcaption className="mt-3 text-center text-sm text-muted">{data.caption}</figcaption>}
			</figure>
		);
	}

	const idx = Math.min(i, images.length - 1);
	const current = images[idx];
	const title = data.captions?.[idx];
	const lightbox = useLightbox();

	return (
		<figure className="grid gap-3">
			<div className="cat-img-frame group relative overflow-hidden rounded-xl border border-border bg-surface">
				<img
					key={current.id}
					src={`/media/${current.id}`}
					alt={title ?? ""}
					draggable={false}
					onContextMenu={(e) => e.preventDefault()}
					onClick={() => lightbox.open(idx)}
					className="mx-auto max-h-[70vh] w-full cursor-zoom-in object-contain"
					loading="lazy"
				/>
				<FullscreenButton onClick={() => lightbox.open(idx)} className="absolute right-3 bottom-3" />
				{images.length > 1 && (
					<>
						<button
							type="button"
							onClick={() => setI(Math.max(0, idx - 1))}
							disabled={idx === 0}
							aria-label="Fotografia anterioară"
							className="absolute top-1/2 left-2 grid h-10 w-10 -translate-y-1/2 place-items-center rounded-full bg-white/85 text-xl text-primary shadow-md transition hover:bg-white disabled:opacity-30"
						>
							←
						</button>
						<button
							type="button"
							onClick={() => setI(Math.min(images.length - 1, idx + 1))}
							disabled={idx === images.length - 1}
							aria-label="Fotografia următoare"
							className="absolute top-1/2 right-2 grid h-10 w-10 -translate-y-1/2 place-items-center rounded-full bg-white/85 text-xl text-primary shadow-md transition hover:bg-white disabled:opacity-30"
						>
							→
						</button>
					</>
				)}
			</div>
			{lightbox.openIndex !== null && (
				<Lightbox
					images={images.map((img) => ({ id: img.id }))}
					index={lightbox.openIndex}
					onIndexChange={lightbox.setIndex}
					onClose={lightbox.close}
					renderCaption={(i2) => data.captions?.[i2] ?? (!data.captions?.length ? data.caption : undefined)}
				/>
			)}
			<figcaption className="text-center">
				{title && <span className="block font-medium">{title}</span>}
				{images.length > 1 && (
					<span className="mt-1 block text-sm text-muted">
						{idx + 1} / {images.length}
					</span>
				)}
				{!data.captions?.length && data.caption && (
					<span className="mt-1 block text-sm text-muted">{data.caption}</span>
				)}
			</figcaption>
		</figure>
	);
}

interface SlideData {
	slides: { title: string; text: string }[];
}

function SlideshowBlock({ body }: { body: string }) {
	const data = safeJson<SlideData>(body, { slides: [] });
	const [i, setI] = useState(0);
	if (data.slides.length === 0) return null;
	const slide = data.slides[i];
	return (
		<div className="overflow-hidden rounded-xl border border-border">
			<div className="grid min-h-56 place-items-center bg-gradient-to-br from-primary to-ink p-8 text-center text-white">
				<div>
					<h3 className="font-heading text-2xl font-bold text-white">{slide.title}</h3>
					<p className="mt-3 max-w-md opacity-90">{slide.text}</p>
				</div>
			</div>
			<div className="flex items-center justify-between bg-surface px-4 py-3">
				<button
					onClick={() => setI((v) => Math.max(0, v - 1))}
					disabled={i === 0}
					className="rounded-lg px-3 py-1.5 text-sm font-medium text-primary disabled:opacity-40"
				>
					← Înapoi
				</button>
				<span className="text-sm text-muted">
					{i + 1} / {data.slides.length}
				</span>
				<button
					onClick={() => setI((v) => Math.min(data.slides.length - 1, v + 1))}
					disabled={i === data.slides.length - 1}
					className="rounded-lg px-3 py-1.5 text-sm font-medium text-primary disabled:opacity-40"
				>
					Înainte →
				</button>
			</div>
		</div>
	);
}
