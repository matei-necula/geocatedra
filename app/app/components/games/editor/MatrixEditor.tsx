import { useState } from "react";
import type { MatrixCellState, MatrixState, MatrixVariantState } from "../../../lib/game-editor";

const inputCls =
	"w-full rounded-lg border border-border bg-bg px-2 py-2 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20";

interface Props {
	state: MatrixState;
	onChange: (s: MatrixState) => void;
}

function emptyCell(): MatrixCellState {
	return { text: "", given: false };
}

function resizedVariant(v: MatrixVariantState, rows: number, cols: number): MatrixVariantState {
	const nextRows: MatrixCellState[][] = [];
	for (let r = 0; r < rows; r++) {
		const src = v.rows[r] ?? [];
		const row: MatrixCellState[] = [];
		for (let c = 0; c < cols; c++) row.push(src[c] ?? emptyCell());
		nextRows.push(row);
	}
	return { rows: nextRows };
}

export function MatrixEditor({ state, onChange }: Props) {
	const [active, setActive] = useState(0);
	const vi = Math.min(active, state.variants.length - 1);
	const variant = state.variants[vi];
	const rows = variant.rows.length;
	const cols = variant.rows[0]?.length ?? 0;

	function updateVariant(fn: (v: MatrixVariantState) => MatrixVariantState) {
		onChange({ ...state, variants: state.variants.map((v, i) => (i === vi ? fn(v) : v)) });
	}

	function setRows(n: number) {
		const rowsN = Math.max(1, Math.min(12, n));
		updateVariant((v) => resizedVariant(v, rowsN, cols));
	}
	function setCols(n: number) {
		const colsN = Math.max(1, Math.min(12, n));
		updateVariant((v) => resizedVariant(v, rows, colsN));
	}
	function updateCell(r: number, c: number, fn: (cell: MatrixCellState) => MatrixCellState) {
		updateVariant((v) => ({
			rows: v.rows.map((row, ri) => (ri === r ? row.map((cell, ci) => (ci === c ? fn(cell) : cell)) : row)),
		}));
	}

	function addVariant() {
		// Pornim noua variantă de la structura curentă (aceeași formă + celule fixate),
		// doar cu textele nefixate golite — de completat.
		const blank: MatrixVariantState = {
			rows: variant.rows.map((row) => row.map((cell) => (cell.given ? { ...cell } : { text: "", given: false }))),
		};
		onChange({ ...state, variants: [...state.variants, blank] });
		setActive(state.variants.length);
	}
	function removeVariant(i: number) {
		if (state.variants.length <= 1) return;
		onChange({ ...state, variants: state.variants.filter((_, k) => k !== i) });
		setActive((a) => Math.max(0, a >= i ? a - 1 : a));
	}

	return (
		<div className="grid gap-4">
			<div className="flex flex-wrap items-center gap-2">
				{state.variants.map((_, i) => (
					<div key={i} className="flex items-center gap-1">
						<button
							type="button"
							onClick={() => setActive(i)}
							className={`rounded-lg border px-3 py-1.5 text-sm ${
								i === vi ? "border-primary bg-primary/10 font-semibold text-primary" : "border-border hover:bg-bg-alt"
							}`}
						>
							Varianta {i + 1}
						</button>
						{state.variants.length > 1 && (
							<button
								type="button"
								onClick={() => removeVariant(i)}
								aria-label={`Șterge varianta ${i + 1}`}
								className="px-1 text-accent-strong"
							>
								×
							</button>
						)}
					</div>
				))}
				<button type="button" onClick={addVariant} className="text-sm font-medium text-primary">
					+ Adaugă variantă
				</button>
			</div>

			<div className="flex flex-wrap items-center gap-4">
				<label className="flex items-center gap-2 text-sm">
					<span className="text-muted">Rânduri</span>
					<input
						type="number"
						min={1}
						max={12}
						value={rows}
						onChange={(e) => setRows(Number(e.target.value))}
						className="w-20 rounded-lg border border-border bg-bg px-2 py-1.5 text-sm outline-none focus:border-primary"
					/>
				</label>
				<label className="flex items-center gap-2 text-sm">
					<span className="text-muted">Coloane</span>
					<input
						type="number"
						min={1}
						max={12}
						value={cols}
						onChange={(e) => setCols(Number(e.target.value))}
						className="w-20 rounded-lg border border-border bg-bg px-2 py-1.5 text-sm outline-none focus:border-primary"
					/>
				</label>
			</div>

			<p className="text-xs text-muted">
				Scrie textul corect în fiecare celulă. Bifează „fixată" pentru celulele deja completate (ancore care nu
				intră în banca de cuvinte). Restul devin spații de completat.
			</p>

			<div className="overflow-x-auto pb-1">
				<div className="grid gap-2" style={{ gridTemplateColumns: `repeat(${cols}, minmax(9rem, 1fr))`, minWidth: `${cols * 9}rem` }}>
					{variant.rows.map((row, r) =>
						row.map((cell, c) => (
							<div key={`${r}-${c}`} className="grid gap-1 rounded-lg border border-border p-2">
								<input
									value={cell.text}
									onChange={(e) => updateCell(r, c, (x) => ({ ...x, text: e.target.value }))}
									placeholder={`R${r + 1}·C${c + 1}`}
									aria-label={`Text rândul ${r + 1}, coloana ${c + 1}`}
									className={inputCls}
								/>
								<label className="flex items-center gap-1.5 text-xs text-muted">
									<input
										type="checkbox"
										checked={cell.given}
										onChange={(e) => updateCell(r, c, (x) => ({ ...x, given: e.target.checked }))}
									/>
									fixată
								</label>
							</div>
						)),
					)}
				</div>
			</div>
		</div>
	);
}
