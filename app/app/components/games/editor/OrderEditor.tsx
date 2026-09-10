import { useState } from "react";
import { ImagePicker, type ImgRef } from "./ImagePicker";
import type { OrderCardState, OrderState } from "../../../lib/game-editor";

const inputCls =
	"rounded-lg border border-border bg-bg px-3 py-2.5 outline-none focus:border-primary focus:ring-2 focus:ring-primary/20";
const labelCls = "grid gap-1.5 text-sm";

interface Props {
	state: OrderState<ImgRef>;
	onChange: (s: OrderState<ImgRef>) => void;
	reusable: { assetId: string; title: string }[];
}

function newCard(): OrderCardState<ImgRef> {
	return { label: "", img: null };
}

function swap<T>(arr: T[], i: number, j: number): T[] {
	const next = arr.slice();
	[next[i], next[j]] = [next[j], next[i]];
	return next;
}

export function OrderEditor({ state, onChange, reusable }: Props) {
	const [activeRound, setActiveRound] = useState(0);
	const round = state.rounds[Math.min(activeRound, state.rounds.length - 1)];

	function updateRounds(fn: (rounds: OrderState<ImgRef>["rounds"]) => OrderState<ImgRef>["rounds"]) {
		onChange({ ...state, rounds: fn(state.rounds) });
	}

	function updateRound(ri: number, fn: (r: OrderState<ImgRef>["rounds"][number]) => OrderState<ImgRef>["rounds"][number]) {
		updateRounds((rounds) => rounds.map((r, i) => (i === ri ? fn(r) : r)));
	}

	function addRound() {
		updateRounds((rounds) => [...rounds, { title: "", cards: [] }]);
		setActiveRound(state.rounds.length);
	}

	function removeRound(ri: number) {
		updateRounds((rounds) => rounds.filter((_, i) => i !== ri));
		setActiveRound((a) => Math.max(0, a >= ri ? a - 1 : a));
	}

	function addCard(ri: number) {
		updateRound(ri, (r) => ({ ...r, cards: [...r.cards, newCard()] }));
	}

	function removeCard(ri: number, ci: number) {
		updateRound(ri, (r) => ({ ...r, cards: r.cards.filter((_, i) => i !== ci) }));
	}

	function updateCard(ri: number, ci: number, fn: (c: OrderCardState<ImgRef>) => OrderCardState<ImgRef>) {
		updateRound(ri, (r) => ({ ...r, cards: r.cards.map((c, i) => (i === ci ? fn(c) : c)) }));
	}

	function moveCard(ri: number, ci: number, dir: -1 | 1) {
		updateRound(ri, (r) => {
			const target = ci + dir;
			if (target < 0 || target >= r.cards.length) return r;
			return { ...r, cards: swap(r.cards, ci, target) };
		});
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
					checked={state.imageFit === "contain"}
					onChange={(e) => onChange({ ...state, imageFit: e.target.checked ? "contain" : undefined })}
					className="h-4 w-4"
				/>
				<span>
					Arată imaginile întregi (fără decupare)
					<span className="block text-xs text-muted">Bifează la imagini înalte — altfel se vede doar o fâșie din mijloc.</span>
				</span>
			</label>

			{round && (
				<div className="grid gap-4">
					<label className={labelCls}>
						<span className="text-muted">Titlul rundei</span>
						<input
							value={round.title}
							onChange={(e) => updateRound(activeRound, (r) => ({ ...r, title: e.target.value }))}
							className={inputCls}
						/>
					</label>
					<div className="grid gap-3 sm:grid-cols-2">
						<label className={labelCls}>
							<span className="text-muted">Etichetă început (opțional)</span>
							<input
								value={round.startLabel ?? ""}
								onChange={(e) => updateRound(activeRound, (r) => ({ ...r, startLabel: e.target.value }))}
								className={inputCls}
							/>
						</label>
						<label className={labelCls}>
							<span className="text-muted">Etichetă sfârșit (opțional)</span>
							<input
								value={round.endLabel ?? ""}
								onChange={(e) => updateRound(activeRound, (r) => ({ ...r, endLabel: e.target.value }))}
								className={inputCls}
							/>
						</label>
					</div>

					<div className="grid gap-3">
						{round.cards.map((card, ci) => (
							<div key={ci} className="grid gap-2 rounded-lg border border-border p-3 sm:grid-cols-[auto_1fr_auto] sm:items-start">
								<span className="pt-2.5 text-sm font-semibold text-primary">{ci + 1}.</span>
								<div className="grid gap-2">
									<label className={labelCls}>
										<span className="text-muted">Text</span>
										<input
											value={card.label}
											onChange={(e) => updateCard(activeRound, ci, (c) => ({ ...c, label: e.target.value }))}
											className={inputCls}
										/>
									</label>
									<ImagePicker
										label="Imagine"
										value={card.img?.t ?? null}
										onChange={(v) => updateCard(activeRound, ci, (c) => ({ ...c, img: v ? { t: v } : null }))}
										reusable={reusable}
									/>
								</div>
								<div className="flex gap-1 sm:flex-col">
									<button
										type="button"
										onClick={() => moveCard(activeRound, ci, -1)}
										disabled={ci === 0}
										aria-label={`Mută cardul ${ci + 1} mai sus`}
										className="rounded-lg border border-border px-2 py-1 text-sm hover:bg-bg-alt disabled:opacity-40"
									>
										↑
									</button>
									<button
										type="button"
										onClick={() => moveCard(activeRound, ci, 1)}
										disabled={ci === round.cards.length - 1}
										aria-label={`Mută cardul ${ci + 1} mai jos`}
										className="rounded-lg border border-border px-2 py-1 text-sm hover:bg-bg-alt disabled:opacity-40"
									>
										↓
									</button>
									<button
										type="button"
										onClick={() => removeCard(activeRound, ci)}
										aria-label={`Șterge cardul ${ci + 1}`}
										className="px-2 py-1 text-accent-strong"
									>
										×
									</button>
								</div>
							</div>
						))}
						<button type="button" onClick={() => addCard(activeRound)} className="justify-self-start text-sm font-medium text-primary">
							+ Adaugă card
						</button>
					</div>
				</div>
			)}
		</div>
	);
}
