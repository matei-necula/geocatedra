import { useMemo, useState } from "react";
import { matrixBank, type MatrixVariant } from "../../lib/games";
import { GameShell, pickMsg } from "./GameShell";

type Placement = { chipId: number; r: number; c: number };

export function MatrixGame({ variants }: { variants: MatrixVariant[] }) {
	const [round, setRound] = useState(0);
	const [seed, setSeed] = useState(0);
	const [placements, setPlacements] = useState<Placement[]>([]);
	const [sel, setSel] = useState<number | null>(null); // id-ul chip-ului selectat din bancă
	const [wrong, setWrong] = useState<{ r: number; c: number } | null>(null);
	const [tries, setTries] = useState(0);
	const [msg, setMsg] = useState<{ text: string; ok: boolean } | null>(null);

	// Se joacă toate variantele pe rând, ca runde succesive.
	const blanksOf = (v: MatrixVariant) => v.rows.reduce((s, row) => s + row.filter((c) => !c.given).length, 0);
	const variant = variants[round];
	const cols = variant.rows[0]?.length ?? 0;
	// Banca completă pentru această rundă: câte un chip stabil per celulă nefixată.
	const fullBank = useMemo(() => matrixBank(variant, seed * 100 + round).map((text, id) => ({ id, text })), [variant, seed, round]);
	const roundBlanks = fullBank.length;

	const placedChipIds = useMemo(() => new Set(placements.map((p) => p.chipId)), [placements]);
	const bank = fullBank.filter((chip) => !placedChipIds.has(chip.id));
	const filledAt = useMemo(() => {
		const m = new Map<string, string>();
		for (const p of placements) m.set(`${p.r}-${p.c}`, fullBank[p.chipId]?.text ?? "");
		return m;
	}, [placements, fullBank]);

	const doneBefore = variants.slice(0, round).reduce((s, v) => s + blanksOf(v), 0);
	const grandTotal = variants.reduce((s, v) => s + blanksOf(v), 0);
	const roundDone = placements.length === roundBlanks && roundBlanks > 0;
	const complete = roundDone && round === variants.length - 1;

	function tapCell(r: number, c: number) {
		const cell = variant.rows[r][c];
		if (cell.given) return;
		if (filledAt.has(`${r}-${c}`)) return; // deja completată
		if (sel === null) return;
		const chip = fullBank.find((x) => x.id === sel);
		if (!chip) return;
		if (chip.text === cell.text) {
			setPlacements((ps) => [...ps, { chipId: chip.id, r, c }]);
			setSel(null);
			setMsg({ text: pickMsg(true), ok: true });
		} else {
			setTries((t) => t + 1);
			setWrong({ r, c });
			setMsg({ text: pickMsg(false), ok: false });
			setTimeout(() => setWrong(null), 700);
		}
	}

	function restart() {
		setRound(0);
		setPlacements([]);
		setSel(null);
		setTries(0);
		setWrong(null);
		setMsg(null);
		setSeed((s) => s + 1);
	}

	return (
		<GameShell
			title={variants.length > 1 ? `Completează matricea — runda ${round + 1}/${variants.length}` : "Completează matricea"}
			instruction="Atinge un cuvânt din bancă, apoi celula goală unde se potrivește."
			done={doneBefore + placements.length}
			total={grandTotal}
			tries={tries}
			complete={complete}
			onRestart={restart}
		>
			{/* Doar tabelul derulează pe orizontală, nu pagina. */}
			<div className="overflow-x-auto pb-1">
				<div
					role="grid"
					className="grid gap-1.5"
					style={{ gridTemplateColumns: `repeat(${cols}, minmax(7rem, 1fr))`, minWidth: `${cols * 7}rem` }}
				>
					{variant.rows.map((row, r) =>
						row.map((cell, c) => {
							const key = `${r}-${c}`;
							const headerish = r === 0 || c === 0;
							const filled = filledAt.get(key);
							const isWrong = wrong?.r === r && wrong?.c === c;
							if (cell.given) {
								return (
									<div
										key={key}
										role="gridcell"
										className={`min-h-11 rounded-lg border px-2 py-2 text-center text-xs leading-snug sm:text-sm ${headerish ? "font-semibold" : "font-medium"}`}
										style={{
											borderColor: "var(--color-border)",
											background: "color-mix(in srgb, var(--color-ink) 6%, transparent)",
											color: "color-mix(in srgb, var(--color-ink) 70%, transparent)",
										}}
									>
										{cell.text}
									</div>
								);
							}
							if (filled !== undefined) {
								return (
									<div
										key={key}
										role="gridcell"
										className={`min-h-11 rounded-lg border-2 px-2 py-2 text-center text-xs leading-snug sm:text-sm ${headerish ? "font-semibold" : "font-medium"}`}
										style={{
											borderColor: "var(--color-primary)",
											background: "color-mix(in srgb, var(--color-primary) 12%, transparent)",
											color: "var(--color-primary-strong)",
										}}
									>
										{filled}
									</div>
								);
							}
							return (
								<button
									key={key}
									type="button"
									role="gridcell"
									onClick={() => tapCell(r, c)}
									aria-label={`celulă goală, rândul ${r + 1}, coloana ${c + 1}`}
									className={`min-h-11 rounded-lg border-2 border-dashed px-2 py-2 text-center text-xs transition sm:text-sm ${isWrong ? "game-shake" : ""} ${sel !== null ? "hover:shadow-md" : ""}`}
									style={{ borderColor: isWrong ? "var(--game-bad)" : "var(--color-border)" }}
								/>
							);
						}),
					)}
				</div>
			</div>

			<div className="mt-4">
				<p className="mb-2 text-sm text-muted">Banca de cuvinte</p>
				<div className="flex flex-wrap gap-2">
					{bank.map((chip) => {
						const isSel = sel === chip.id;
						return (
							<button
								key={chip.id}
								type="button"
								onClick={() => setSel((cur) => (cur === chip.id ? null : chip.id))}
								aria-pressed={isSel}
								className={`min-h-11 rounded-full border-2 bg-surface px-3 py-1.5 text-sm font-medium shadow-sm transition ${isSel ? "scale-[1.03] shadow-md" : "hover:shadow-md"}`}
								style={{ borderColor: isSel ? "var(--color-accent)" : "var(--color-border)" }}
							>
								{chip.text}
							</button>
						);
					})}
					{bank.length === 0 && <span className="text-sm text-muted">Toate cuvintele au fost plasate.</span>}
				</div>
			</div>

			<div className="mt-3 flex min-h-6 items-center justify-between gap-2">
				<span aria-live="polite" className="text-sm font-medium" style={{ color: msg?.ok ? "var(--game-ok)" : "var(--game-bad)" }}>
					{msg?.text}
				</span>
				{roundDone && !complete && (
					<button
						type="button"
						onClick={() => {
							setRound((r) => r + 1);
							setPlacements([]);
							setSel(null);
							setWrong(null);
							setMsg(null);
						}}
						className="game-pop shrink-0 rounded-full bg-primary px-4 py-1.5 text-sm font-medium text-on-primary"
					>
						Runda următoare →
					</button>
				)}
			</div>
		</GameShell>
	);
}
