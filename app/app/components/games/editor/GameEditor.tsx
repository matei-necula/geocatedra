import { Component, useEffect, useRef, useState, type ReactNode } from "react";
import {
	compileGame,
	validateGame,
	bodyToEditor,
	type GameEditorState,
	type PlaceState,
	type PlaceTargetState,
	type MapQuizState,
	type MapQuizPointState,
} from "../../../lib/game-editor";
import { parseGameBody } from "../../../lib/games";
import type { ImgRef } from "./ImagePicker";
import { MatchEditor } from "./MatchEditor";
import { OrderEditor } from "./OrderEditor";
import { MapPinEditor, type Pin } from "./MapPinEditor";
import { MatrixEditor } from "./MatrixEditor";
import { GrilaEditor } from "./GrilaEditor";
import { SortareEditor } from "./SortareEditor";
import { MatchGame } from "../MatchGame";
import { OrderGame } from "../OrderGame";
import { PlaceOnMapGame } from "../PlaceOnMapGame";
import { MapQuizGame } from "../MapQuizGame";
import { MatrixGame } from "../MatrixGame";
import { GrilaGame } from "../GrilaGame";
import { SortareGame } from "../SortareGame";

export type GameKind = "asociere" | "ordonare" | "plaseaza-pe-harta" | "harta-quiz" | "matrice" | "grila" | "sortare";

interface Props {
	kind: GameKind;
	initialBody?: string;
	initialAssets?: { id: string; idx: number }[];
	reusable: { assetId: string; title: string }[];
}

function emptyState(kind: GameKind): GameEditorState<ImgRef> {
	switch (kind) {
		case "asociere":
			return {
				kind: "asociere",
				rounds: [
					{
						title: "",
						pairs: [
							{ left: { text: "", img: null }, right: { text: "", img: null }, group: "g0" },
							{ left: { text: "", img: null }, right: { text: "", img: null }, group: "g1" },
						],
					},
				],
			};
		case "ordonare":
			return {
				kind: "ordonare",
				rounds: [{ title: "", cards: [{ label: "", img: null }, { label: "", img: null }] }],
			};
		case "plaseaza-pe-harta":
			return { kind: "plaseaza-pe-harta", map: null, targets: [] };
		case "harta-quiz":
			return { kind: "harta-quiz", map: null, points: [] };
		case "matrice":
			return {
				kind: "matrice",
				variants: [
					{
						rows: [
							[{ text: "", given: false }, { text: "", given: false }],
							[{ text: "", given: false }, { text: "", given: false }],
						],
					},
				],
			};
		case "grila":
			return {
				kind: "grila",
				rounds: [{ title: "", questions: [{ img: null, text: "", options: ["", ""], answer: 0 }] }],
			};
		case "sortare":
			return {
				kind: "sortare",
				buckets: [{ label: "" }, { label: "" }],
				rounds: [{ title: "", cards: [{ img: null, text: "", bucket: 0 }] }],
			};
	}
}

// -- plaseaza-pe-harta <-> Pin adapter --
function placeToPins(state: PlaceState<ImgRef>): Pin[] {
	return state.targets.map((t) => ({ id: t.id, x: t.x, y: t.y, label: t.label, img: t.img?.t ?? null }));
}
function pinsToPlaceTargets(pins: Pin[]): PlaceTargetState<ImgRef>[] {
	return pins.map((p) => ({ id: p.id, x: p.x, y: p.y, label: p.label, img: p.img ? { t: p.img } : null }));
}

// -- harta-quiz <-> Pin adapter (points carry no img; label <-> name).
// Points get a stable `id` assigned once on load (see GameEditor's initial
// state below) so MapPinEditor's selection survives the round-trip through
// this adapter — without it, a freshly-added-then-renamed pin would lose
// its selection on the very next render (index-based ids regenerate).
function quizToPins(state: MapQuizState<ImgRef>): Pin[] {
	return state.points.map((p, i) => ({ id: p.id ?? String(i), x: p.x, y: p.y, label: p.name, img: null }));
}
function pinsToQuizPoints(pins: Pin[]): MapQuizPointState[] {
	return pins.map((p) => ({ id: p.id, x: p.x, y: p.y, name: p.label }));
}

function FileField({ name, file }: { name: string; file: File }) {
	const ref = useRef<HTMLInputElement>(null);
	useEffect(() => {
		if (!ref.current) return;
		const dt = new DataTransfer();
		dt.items.add(file);
		ref.current.files = dt.files;
	}, [file]);
	return <input ref={ref} type="file" name={name} className="hidden" />;
}

// Guards the live preview: an engine component crashing on a half-filled
// body must not take down the whole admin page.
class PreviewBoundary extends Component<{ children: ReactNode }, { error: boolean }> {
	state = { error: false };
	static getDerivedStateFromError() {
		return { error: true };
	}
	render() {
		if (this.state.error) {
			return <p className="text-sm text-accent-strong">Previzualizarea nu a putut fi afișată.</p>;
		}
		return this.props.children;
	}
}

export function GameEditor({ kind, initialBody, initialAssets, reusable }: Props) {
	function assetForIdx(idx: number): ImgRef {
		const a = initialAssets?.find((x) => x.idx === idx);
		return a ? { kind: "asset", assetId: a.id, previewUrl: "/media/" + a.id } : { kind: "asset", assetId: "", previewUrl: "" };
	}

	const [state, setState] = useState<GameEditorState<ImgRef>>(() => {
		const parsed = initialBody ? parseGameBody(initialBody) : null;
		if (parsed && parsed.kind === kind) {
			const loaded = bodyToEditor(parsed, assetForIdx);
			// bodyToEditor stays pure (no crypto); assign stable ids here, once,
			// so harta-quiz points can be tracked by MapPinEditor across renders.
			if (loaded.kind === "harta-quiz") {
				return { ...loaded, points: loaded.points.map((p) => ({ ...p, id: p.id ?? crypto.randomUUID().slice(0, 8) })) };
			}
			return loaded;
		}
		return emptyState(kind);
	});
	const [showLoadWarning] = useState(() => {
		if (!initialBody) return false;
		const parsed = parseGameBody(initialBody);
		return !parsed || parsed.kind !== kind;
	});
	const [preview, setPreview] = useState(false);

	const { body, plan } = compileGame(state);
	const errors = validateGame(body);
	const resolveSrc = (idx: number | undefined) => plan.find((s) => s.idx === idx)?.image.previewUrl ?? null;

	return (
		<div className="grid gap-4">
			{showLoadWarning && (
				<p className="rounded-lg bg-accent/10 px-3 py-2 text-sm text-accent-strong">
					Jocul salvat nu a putut fi încărcat; pornești de la zero.
				</p>
			)}

			<div className="flex items-center justify-between gap-2">
				<span className="text-sm font-medium text-muted">Conținutul jocului</span>
				<button
					type="button"
					onClick={() => setPreview((p) => !p)}
					className="rounded-lg border border-border px-3 py-1.5 text-sm hover:bg-bg-alt"
				>
					{preview ? "Înapoi la editare" : "Previzualizează / Joacă"}
				</button>
			</div>

			{preview &&
				(errors.length > 0 ? (
					<p className="rounded-lg border border-dashed border-border p-4 text-sm text-muted">
						Completează jocul ca să-l poți previzualiza.
					</p>
				) : (
					<PreviewBoundary>
						{body.kind === "asociere" && <MatchGame rounds={body.rounds} imageFit={body.imageFit} layout={body.layout} assets={[]} resolveSrc={resolveSrc} />}
						{body.kind === "ordonare" && <OrderGame rounds={body.rounds} imageFit={body.imageFit} assets={[]} resolveSrc={resolveSrc} />}
						{body.kind === "plaseaza-pe-harta" && (
							<PlaceOnMapGame map={body.map} targets={body.targets} reveal={body.reveal} assets={[]} resolveSrc={resolveSrc} />
						)}
						{body.kind === "harta-quiz" && <MapQuizGame map={body.map} points={body.points} draw={body.draw} roundsDef={body.rounds} assets={[]} resolveSrc={resolveSrc} />}
						{body.kind === "matrice" && <MatrixGame variants={body.variants} />}
						{body.kind === "grila" && <GrilaGame rounds={body.rounds} assets={[]} resolveSrc={resolveSrc} />}
						{body.kind === "sortare" && <SortareGame buckets={body.buckets} rounds={body.rounds} assets={[]} resolveSrc={resolveSrc} />}
					</PreviewBoundary>
				))}

			{/* Sub-editor stays mounted even while previewing so its ImagePicker
				instances never unmount — unmounting would revoke the blob URLs
				(URL.createObjectURL) that the preview's resolveSrc reads from
				`plan`, breaking both the preview and the editor thumbnails. */}
			<div className={preview ? "hidden" : undefined}>
				{state.kind === "asociere" && <MatchEditor state={state} onChange={setState} reusable={reusable} />}
				{state.kind === "ordonare" && <OrderEditor state={state} onChange={setState} reusable={reusable} />}
				{state.kind === "plaseaza-pe-harta" && (
					<MapPinEditor
						mode="targets"
						map={state.map?.t ?? null}
						pins={placeToPins(state)}
						onMapChange={(v) => setState({ ...state, map: v ? { t: v } : null })}
						onPinsChange={(pins) => setState({ ...state, targets: pinsToPlaceTargets(pins) })}
						reusable={reusable}
					/>
				)}
				{state.kind === "harta-quiz" && (
					<MapPinEditor
						mode="points"
						map={state.map?.t ?? null}
						pins={quizToPins(state)}
						onMapChange={(v) => setState({ ...state, map: v ? { t: v } : null })}
						onPinsChange={(pins) => setState({ ...state, points: pinsToQuizPoints(pins) })}
						reusable={reusable}
						drawValue={state.draw}
						onDrawChange={(v) => setState({ ...state, draw: v })}
					/>
				)}
				{state.kind === "matrice" && <MatrixEditor state={state} onChange={setState} />}
				{state.kind === "grila" && <GrilaEditor state={state} onChange={setState} reusable={reusable} />}
				{state.kind === "sortare" && <SortareEditor state={state} onChange={setState} reusable={reusable} />}
			</div>

			{errors.length > 0 && (
				<div className="rounded-lg bg-accent/10 px-3 py-2 text-sm text-accent-strong">
					<p className="font-medium">De completat:</p>
					<ul className="list-disc pl-5">
						{errors.map((e, i) => (
							<li key={i}>{e}</li>
						))}
					</ul>
				</div>
			)}

			<input type="hidden" name="body" value={JSON.stringify(body)} />
			{plan.map((slot) =>
				slot.image.kind === "asset" ? (
					<input key={slot.idx} type="hidden" name={`src_${slot.idx}`} value={slot.image.assetId} />
				) : (
					<FileField key={slot.idx} name={`img_${slot.idx}`} file={slot.image.file} />
				),
			)}
		</div>
	);
}
