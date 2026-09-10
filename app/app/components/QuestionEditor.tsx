import { useState } from "react";

const inputCls =
	"rounded-lg border border-border bg-bg px-3 py-2.5 outline-none focus:border-primary focus:ring-2 focus:ring-primary/20";

interface Props {
	initial?: { stem: string; options: string[]; correctIndex: number; explanation: string };
}

/** Single-correct MCQ editor. Emits hidden `options_json` + `correctIndex`; `stem` and
 *  `explanation` are named inputs. Embedded inside a route <Form> that also carries
 *  grade/topic/status. Mirrors the `joc` material editor UX. */
export function QuestionEditor({ initial }: Props) {
	const [stem, setStem] = useState(initial?.stem ?? "");
	const [options, setOptions] = useState<string[]>(
		initial?.options && initial.options.length >= 2 ? initial.options : ["", ""],
	);
	const [correctIndex, setCorrectIndex] = useState(initial?.correctIndex ?? 0);
	const [explanation, setExplanation] = useState(initial?.explanation ?? "");

	return (
		<div className="grid gap-3 rounded-xl border border-border bg-surface p-4">
			<label className="grid gap-1.5 text-sm">
				<span className="text-muted">Întrebarea</span>
				<textarea name="stem" value={stem} onChange={(e) => setStem(e.target.value)} rows={2} required className={inputCls} />
			</label>

			<div className="grid gap-2">
				<span className="text-sm text-muted">Variante (bifează răspunsul corect)</span>
				{options.map((opt, i) => (
					<div key={i} className="flex items-center gap-2">
						<input type="radio" name="correctRadio" checked={correctIndex === i} onChange={() => setCorrectIndex(i)} aria-label="Corect" />
						<input
							value={opt}
							onChange={(e) => setOptions((p) => p.map((o, j) => (j === i ? e.target.value : o)))}
							placeholder={`Varianta ${i + 1}`}
							className={`${inputCls} flex-1`}
						/>
						{options.length > 2 && (
							<button
								type="button"
								onClick={() => {
									setOptions((p) => p.filter((_, j) => j !== i));
									if (correctIndex >= i) setCorrectIndex(Math.max(0, correctIndex - 1));
								}}
								className="px-2 text-accent-strong"
							>
								×
							</button>
						)}
					</div>
				))}
				<button type="button" onClick={() => setOptions((p) => [...p, ""])} className="justify-self-start text-sm font-medium text-primary">
					+ Adaugă variantă
				</button>
			</div>

			<label className="grid gap-1.5 text-sm">
				<span className="text-muted">Explicație (apare după răspuns)</span>
				<input name="explanation" value={explanation} onChange={(e) => setExplanation(e.target.value)} className={inputCls} />
			</label>

			<input type="hidden" name="options_json" value={JSON.stringify(options)} />
			<input type="hidden" name="correctIndex" value={correctIndex} />
		</div>
	);
}
