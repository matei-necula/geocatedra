import { useState } from "react";
import { ImagePicker, type ImgRef } from "./ImagePicker";
import type { GrilaQuestionState, GrilaRoundState, GrilaState } from "../../../lib/game-editor";

const inputCls =
	"rounded-lg border border-border bg-bg px-3 py-2.5 outline-none focus:border-primary focus:ring-2 focus:ring-primary/20";
const labelCls = "grid gap-1.5 text-sm";

interface Props {
	state: GrilaState<ImgRef>;
	onChange: (s: GrilaState<ImgRef>) => void;
	reusable: { assetId: string; title: string }[];
}

function emptyQuestion(): GrilaQuestionState<ImgRef> {
	return { img: null, text: "", options: ["", ""], answer: 0, why: ["", ""] };
}

export function GrilaEditor({ state, onChange, reusable }: Props) {
	const [activeRound, setActiveRound] = useState(0);
	const round = state.rounds[Math.min(activeRound, state.rounds.length - 1)];

	function updateRounds(fn: (rounds: GrilaState<ImgRef>["rounds"]) => GrilaState<ImgRef>["rounds"]) {
		onChange({ ...state, rounds: fn(state.rounds) });
	}

	function updateRound(ri: number, fn: (r: GrilaRoundState<ImgRef>) => GrilaRoundState<ImgRef>) {
		updateRounds((rounds) => rounds.map((r, i) => (i === ri ? fn(r) : r)));
	}

	function addRound() {
		updateRounds((rounds) => [...rounds, { title: "", questions: [emptyQuestion()] }]);
		setActiveRound(state.rounds.length);
	}

	function removeRound(ri: number) {
		updateRounds((rounds) => rounds.filter((_, i) => i !== ri));
		setActiveRound((a) => Math.max(0, a >= ri ? a - 1 : a));
	}

	function addQuestion(ri: number) {
		updateRound(ri, (r) => ({ ...r, questions: [...r.questions, emptyQuestion()] }));
	}

	function removeQuestion(ri: number, qi: number) {
		updateRound(ri, (r) => ({ ...r, questions: r.questions.filter((_, i) => i !== qi) }));
	}

	function updateQuestion(ri: number, qi: number, fn: (q: GrilaQuestionState<ImgRef>) => GrilaQuestionState<ImgRef>) {
		updateRound(ri, (r) => ({ ...r, questions: r.questions.map((q, i) => (i === qi ? fn(q) : q)) }));
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
						{round.questions.map((q, qi) => (
							<div key={qi} className="grid gap-3 rounded-lg border border-border p-3">
								<div className="flex items-center justify-between">
									<span className="text-xs font-medium text-muted">Întrebarea {qi + 1}</span>
									{round.questions.length > 1 && (
										<button
											type="button"
											onClick={() => removeQuestion(activeRound, qi)}
											aria-label={`Șterge întrebarea ${qi + 1}`}
											className="text-accent-strong"
										>
											×
										</button>
									)}
								</div>

								<ImagePicker
									label="Imagine (opțional dacă ai text)"
									value={q.img?.t ?? null}
									onChange={(v) => updateQuestion(activeRound, qi, (qq) => ({ ...qq, img: v ? { t: v } : null }))}
									reusable={reusable}
								/>

								<label className={labelCls}>
									<span className="text-muted">Text întrebare (opțional dacă ai imagine)</span>
									<input
										value={q.text}
										onChange={(e) => updateQuestion(activeRound, qi, (qq) => ({ ...qq, text: e.target.value }))}
										className={inputCls}
									/>
								</label>

								<label className={labelCls}>
									<span className="text-muted">Indiciu sub imagine (opțional)</span>
									<input
										value={q.hint ?? ""}
										onChange={(e) => updateQuestion(activeRound, qi, (qq) => ({ ...qq, hint: e.target.value }))}
										placeholder="O caracteristică proprie, care să nu apară în răspuns"
										className={inputCls}
									/>
								</label>

								<div className="grid gap-2">
									<span className="text-sm text-muted">Variante (bifează răspunsul corect)</span>
									{q.options.map((opt, oi) => (
										<div key={oi} className="grid gap-1.5">
											<div className="flex items-center gap-2">
												<input
													type="radio"
													name={`grila-correct-${activeRound}-${qi}`}
													checked={q.answer === oi}
													onChange={() => updateQuestion(activeRound, qi, (qq) => ({ ...qq, answer: oi }))}
													aria-label="Corect"
												/>
												<input
													value={opt}
													onChange={(e) =>
														updateQuestion(activeRound, qi, (qq) => ({
															...qq,
															options: qq.options.map((o, j) => (j === oi ? e.target.value : o)),
														}))
													}
													placeholder={`Varianta ${oi + 1}`}
													className={`${inputCls} flex-1`}
												/>
												{q.options.length > 2 && (
													<button
														type="button"
														onClick={() =>
															updateQuestion(activeRound, qi, (qq) => {
																const options = qq.options.filter((_, j) => j !== oi);
																const why = (qq.why ?? []).filter((_, j) => j !== oi);
																const answer = qq.answer === oi ? 0 : qq.answer > oi ? qq.answer - 1 : qq.answer;
																return { ...qq, options, why, answer };
															})
														}
														className="px-2 text-accent-strong"
													>
														×
													</button>
												)}
											</div>
											<input
												value={q.why?.[oi] ?? ""}
												onChange={(e) =>
													updateQuestion(activeRound, qi, (qq) => ({
														...qq,
														why: qq.options.map((_, j) => (j === oi ? e.target.value : (qq.why?.[j] ?? ""))),
													}))
												}
												placeholder="Explicație (opțional) — se arată după ce elevul alege această variantă"
												aria-label={`Explicație pentru varianta ${oi + 1}`}
												className={`${inputCls} ml-6 text-sm`}
											/>
										</div>
									))}
									<button
										type="button"
										onClick={() =>
											updateQuestion(activeRound, qi, (qq) => ({
												...qq,
												options: [...qq.options, ""],
												why: [...qq.options.map((_, j) => qq.why?.[j] ?? ""), ""],
											}))
										}
										className="justify-self-start text-sm font-medium text-primary"
									>
										+ Adaugă variantă
									</button>
								</div>
							</div>
						))}
						<button type="button" onClick={() => addQuestion(activeRound)} className="justify-self-start text-sm font-medium text-primary">
							+ Adaugă întrebare
						</button>
					</div>
				</div>
			)}
		</div>
	);
}
