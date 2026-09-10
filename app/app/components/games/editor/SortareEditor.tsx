import { useState } from "react";
import { ImagePicker, type ImgRef } from "./ImagePicker";
import type { SortCardState, SortRoundState, SortareState } from "../../../lib/game-editor";

const inputCls =
	"rounded-lg border border-border bg-bg px-3 py-2.5 outline-none focus:border-primary focus:ring-2 focus:ring-primary/20";
const labelCls = "grid gap-1.5 text-sm";

interface Props {
	state: SortareState<ImgRef>;
	onChange: (s: SortareState<ImgRef>) => void;
	reusable: { assetId: string; title: string }[];
}

function emptyCard(): SortCardState<ImgRef> {
	return { img: null, text: "", bucket: 0 };
}

export function SortareEditor({ state, onChange, reusable }: Props) {
	const [activeRound, setActiveRound] = useState(0);
	const round = state.rounds[Math.min(activeRound, state.rounds.length - 1)];

	function updateRound(ri: number, fn: (r: SortRoundState<ImgRef>) => SortRoundState<ImgRef>) {
		onChange({ ...state, rounds: state.rounds.map((r, i) => (i === ri ? fn(r) : r)) });
	}
	function updateCard(ri: number, ci: number, fn: (c: SortCardState<ImgRef>) => SortCardState<ImgRef>) {
		updateRound(ri, (r) => ({ ...r, cards: r.cards.map((c, i) => (i === ci ? fn(c) : c)) }));
	}

	return (
		<div className="grid gap-4">
			<div className="grid gap-2 rounded-lg border border-border p-3">
				<span className="text-sm font-medium text-muted">Categorii (coșurile în care se sortează)</span>
				{state.buckets.map((b, bi) => (
					<div key={bi} className="flex items-center gap-2">
						<input
							value={b.label}
							onChange={(e) =>
								onChange({ ...state, buckets: state.buckets.map((x, i) => (i === bi ? { label: e.target.value } : x)) })
							}
							placeholder={`Categoria ${bi + 1}`}
							className={`${inputCls} flex-1`}
						/>
						{state.buckets.length > 2 && (
							<button
								type="button"
								aria-label={`Șterge categoria ${bi + 1}`}
								className="px-1 text-accent-strong"
								onClick={() =>
									onChange({
										...state,
										buckets: state.buckets.filter((_, i) => i !== bi),
										// cardurile care trimiteau la categoria ștearsă trec la prima
										rounds: state.rounds.map((r) => ({
											...r,
											cards: r.cards.map((c) => ({ ...c, bucket: c.bucket === bi ? 0 : c.bucket > bi ? c.bucket - 1 : c.bucket })),
										})),
									})
								}
							>
								×
							</button>
						)}
					</div>
				))}
				{state.buckets.length < 4 && (
					<button
						type="button"
						className="justify-self-start text-sm font-medium text-primary"
						onClick={() => onChange({ ...state, buckets: [...state.buckets, { label: "" }] })}
					>
						+ Adaugă categorie
					</button>
				)}
			</div>

			<div className="flex flex-wrap items-center gap-2">
				{state.rounds.map((_, ri) => (
					<div key={ri} className="flex items-center gap-1">
						<button
							type="button"
							onClick={() => setActiveRound(ri)}
							className={`rounded-lg border px-3 py-1.5 text-sm ${
								ri === activeRound ? "border-primary bg-primary/10 font-semibold text-primary" : "border-border hover:bg-bg-alt"
							}`}
						>
							Runda {ri + 1}
						</button>
						{state.rounds.length > 1 && (
							<button
								type="button"
								onClick={() => {
									onChange({ ...state, rounds: state.rounds.filter((_, i) => i !== ri) });
									setActiveRound((a) => Math.max(0, a - (ri <= a ? 1 : 0)));
								}}
								aria-label={`Șterge runda ${ri + 1}`}
								className="px-1 text-accent-strong"
							>
								×
							</button>
						)}
					</div>
				))}
				<button
					type="button"
					onClick={() => {
						onChange({ ...state, rounds: [...state.rounds, { title: "", cards: [emptyCard()] }] });
						setActiveRound(state.rounds.length);
					}}
					className="text-sm font-medium text-primary"
				>
					+ Adaugă rundă
				</button>
			</div>

			{round && (
				<div className="grid gap-4">
					<label className={labelCls}>
						<span className="text-muted">Titlul rundei (opțional)</span>
						<input
							value={round.title ?? ""}
							onChange={(e) => updateRound(activeRound, (r) => ({ ...r, title: e.target.value }))}
							className={inputCls}
						/>
					</label>

					<div className="grid gap-3">
						{round.cards.map((c, ci) => (
							<div key={ci} className="grid gap-3 rounded-lg border border-border p-3">
								<div className="flex items-center justify-between">
									<span className="text-xs font-medium text-muted">Cartonașul {ci + 1}</span>
									{round.cards.length > 1 && (
										<button
											type="button"
											onClick={() => updateRound(activeRound, (r) => ({ ...r, cards: r.cards.filter((_, i) => i !== ci) }))}
											aria-label={`Șterge cartonașul ${ci + 1}`}
											className="text-accent-strong"
										>
											×
										</button>
									)}
								</div>

								<ImagePicker
									label="Imagine (opțional dacă ai text)"
									value={c.img?.t ?? null}
									onChange={(v) => updateCard(activeRound, ci, (cc) => ({ ...cc, img: v ? { t: v } : null }))}
									reusable={reusable}
								/>

								<label className={labelCls}>
									<span className="text-muted">Text (opțional dacă ai imagine)</span>
									<input
										value={c.text}
										onChange={(e) => updateCard(activeRound, ci, (cc) => ({ ...cc, text: e.target.value }))}
										className={inputCls}
									/>
								</label>

								<label className={labelCls}>
									<span className="text-muted">Categoria corectă</span>
									<select
										value={c.bucket}
										onChange={(e) => updateCard(activeRound, ci, (cc) => ({ ...cc, bucket: Number(e.target.value) }))}
										className={inputCls}
									>
										{state.buckets.map((b, bi) => (
											<option key={bi} value={bi}>
												{b.label.trim() || `Categoria ${bi + 1}`}
											</option>
										))}
									</select>
								</label>
							</div>
						))}
						<button
							type="button"
							onClick={() => updateRound(activeRound, (r) => ({ ...r, cards: [...r.cards, emptyCard()] }))}
							className="justify-self-start text-sm font-medium text-primary"
						>
							+ Adaugă cartonaș
						</button>
					</div>
				</div>
			)}
		</div>
	);
}
