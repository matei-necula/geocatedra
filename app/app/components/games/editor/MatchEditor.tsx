import { useState } from "react";
import { ImagePicker, type ImgRef } from "./ImagePicker";
import type { MatchPairState, MatchSideState, MatchState } from "../../../lib/game-editor";

const inputCls =
	"rounded-lg border border-border bg-bg px-3 py-2.5 outline-none focus:border-primary focus:ring-2 focus:ring-primary/20";
const labelCls = "grid gap-1.5 text-sm";

interface Props {
	state: MatchState<ImgRef>;
	onChange: (s: MatchState<ImgRef>) => void;
	reusable: { assetId: string; title: string }[];
}

function emptySide(): MatchSideState<ImgRef> {
	return { text: "", img: null };
}

function newPair(idx: number): MatchPairState<ImgRef> {
	return { left: emptySide(), right: emptySide(), group: `g${idx}` };
}

export function MatchEditor({ state, onChange, reusable }: Props) {
	const [activeRound, setActiveRound] = useState(0);
	const round = state.rounds[Math.min(activeRound, state.rounds.length - 1)];

	function updateRounds(fn: (rounds: MatchState<ImgRef>["rounds"]) => MatchState<ImgRef>["rounds"]) {
		onChange({ ...state, rounds: fn(state.rounds) });
	}

	function updateRound(ri: number, fn: (r: MatchState<ImgRef>["rounds"][number]) => MatchState<ImgRef>["rounds"][number]) {
		updateRounds((rounds) => rounds.map((r, i) => (i === ri ? fn(r) : r)));
	}

	function addRound() {
		updateRounds((rounds) => [...rounds, { title: "", pairs: [] }]);
		setActiveRound(state.rounds.length);
	}

	function removeRound(ri: number) {
		updateRounds((rounds) => rounds.filter((_, i) => i !== ri));
		setActiveRound((a) => Math.max(0, a >= ri ? a - 1 : a));
	}

	function addPair(ri: number) {
		updateRound(ri, (r) => ({ ...r, pairs: [...r.pairs, newPair(r.pairs.length)] }));
	}

	function removePair(ri: number, pi: number) {
		updateRound(ri, (r) => ({ ...r, pairs: r.pairs.filter((_, i) => i !== pi) }));
	}

	function updatePair(ri: number, pi: number, fn: (p: MatchPairState<ImgRef>) => MatchPairState<ImgRef>) {
		updateRound(ri, (r) => ({ ...r, pairs: r.pairs.map((p, i) => (i === pi ? fn(p) : p)) }));
	}

	return (
		<div className="grid gap-4">
			<div className="flex flex-wrap items-center gap-2">
				{state.rounds.map((r, ri) => (
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
								onClick={() => removeRound(ri)}
								aria-label={`Șterge runda ${ri + 1}`}
								className="px-1 text-accent-strong"
							>
								×
							</button>
						)}
					</div>
				))}
				<button type="button" onClick={addRound} className="text-sm font-medium text-primary">
					+ Adaugă rundă
				</button>
			</div>

			<label className="flex items-center gap-2 text-sm">
				<input
					type="checkbox"
					checked={state.layout === "rows"}
					onChange={(e) => onChange({ ...state, layout: e.target.checked ? "rows" : undefined })}
					className="h-4 w-4"
				/>
				<span>
					Așază pe două rânduri (imagini sus, răspunsuri jos)
					<span className="block text-xs text-muted">Implicit sunt două coloane. Răspunsul corect nu ajunge niciodată exact sub perechea lui.</span>
				</span>
			</label>

			<label className="flex items-center gap-2 text-sm">
				<input
					type="checkbox"
					checked={state.imageFit === "contain"}
					onChange={(e) => onChange({ ...state, imageFit: e.target.checked ? "contain" : undefined })}
					className="h-4 w-4"
				/>
				<span>
					Arată imaginile întregi (fără decupare)
					<span className="block text-xs text-muted">Bifează la imagini înalte, ca profilurile de sol — altfel se vede doar o parte.</span>
				</span>
			</label>

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
						{round.pairs.map((pair, pi) => (
							<div key={pi} className="grid gap-3 rounded-lg border border-border p-3">
								<div className="flex items-center justify-between">
									<span className="text-xs font-medium text-muted">Perechea {pi + 1}</span>
									<button
										type="button"
										onClick={() => removePair(activeRound, pi)}
										aria-label={`Șterge perechea ${pi + 1}`}
										className="text-accent-strong"
									>
										×
									</button>
								</div>
								<div className="grid gap-3 sm:grid-cols-2">
									<div className="grid gap-2">
										<label className={labelCls}>
											<span className="text-muted">Text stânga</span>
											<input
												value={pair.left.text ?? ""}
												onChange={(e) =>
													updatePair(activeRound, pi, (p) => ({ ...p, left: { ...p.left, text: e.target.value } }))
												}
												className={inputCls}
											/>
										</label>
										<ImagePicker
											label="Imagine stânga"
											value={pair.left.img?.t ?? null}
											onChange={(v) =>
												updatePair(activeRound, pi, (p) => ({ ...p, left: { ...p.left, img: v ? { t: v } : null } }))
											}
											reusable={reusable}
										/>
									</div>
									<div className="grid gap-2">
										<label className={labelCls}>
											<span className="text-muted">Text dreapta</span>
											<input
												value={pair.right.text ?? ""}
												onChange={(e) =>
													updatePair(activeRound, pi, (p) => ({ ...p, right: { ...p.right, text: e.target.value } }))
												}
												className={inputCls}
											/>
										</label>
										<ImagePicker
											label="Imagine dreapta"
											value={pair.right.img?.t ?? null}
											onChange={(v) =>
												updatePair(activeRound, pi, (p) => ({ ...p, right: { ...p.right, img: v ? { t: v } : null } }))
											}
											reusable={reusable}
										/>
									</div>
								</div>
								<label className={labelCls}>
									<span className="text-muted">Grup (perechile din același grup se potrivesc)</span>
									<input
										value={pair.group}
										onChange={(e) => updatePair(activeRound, pi, (p) => ({ ...p, group: e.target.value }))}
										className={inputCls}
									/>
								</label>
							</div>
						))}
						<button type="button" onClick={() => addPair(activeRound)} className="justify-self-start text-sm font-medium text-primary">
							+ Adaugă pereche
						</button>
					</div>
				</div>
			)}
		</div>
	);
}
