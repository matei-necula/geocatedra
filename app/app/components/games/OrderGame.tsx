import { useMemo, useState } from "react";
import { assetSrc, shuffleSeeded, type GameAsset, type ImageFit, type OrderRound } from "../../lib/games";
import { GameShell, pickMsg } from "./GameShell";
import { dragStyle, useDrag } from "./useDrag";

export function OrderGame({
	rounds,
	imageFit,
	assets,
	resolveSrc,
}: {
	rounds: OrderRound[];
	imageFit?: ImageFit;
	assets: GameAsset[];
	resolveSrc?: (idx: number | undefined) => string | null;
}) {
	const resolve = resolveSrc ?? ((idx: number | undefined) => assetSrc(assets, idx));
	const [round, setRound] = useState(0);
	const [seed, setSeed] = useState(0);
	const r = rounds[round];
	const poolOrder = useMemo(() => shuffleSeeded(r.cards.map((_, i) => i), seed * 1000 + round), [round, seed, r.cards]);
	const [slots, setSlots] = useState<(number | null)[]>(() => r.cards.map(() => null));
	const [checked, setChecked] = useState<boolean[] | null>(null);
	const [tries, setTries] = useState(0);
	const [roundsDone, setRoundsDone] = useState(0);
	const [msg, setMsg] = useState<{ text: string; ok: boolean } | null>(null);
	const { drag, start } = useDrag(onDrop);

	const pool = poolOrder.filter((i) => !slots.includes(i));
	const complete = roundsDone === rounds.length;
	const allOk = checked !== null && checked.every(Boolean);

	function onDrop(id: string, x: number, y: number) {
		const el = document.elementFromPoint(x, y)?.closest("[data-slot],[data-pool]");
		if (!el) return;
		const card = Number(id);
		setChecked(null);
		setMsg(null);
		if (el.hasAttribute("data-pool")) {
			setSlots((s) => s.map((v) => (v === card ? null : v)));
			return;
		}
		const si = Number(el.getAttribute("data-slot"));
		setSlots((s) => {
			const n = s.map((v) => (v === card ? null : v));
			n[si] = card;
			return n;
		});
	}

	function verify() {
		const res = slots.map((ci, si) => ci !== null && r.cards[ci].order === si + 1);
		setChecked(res);
		setTries((t) => t + 1);
		if (res.every(Boolean)) {
			setMsg({ text: pickMsg(true), ok: true });
			setRoundsDone((d) => d + 1);
		} else {
			setMsg({ text: pickMsg(false), ok: false });
		}
	}

	function nextRound() {
		setRound((v) => v + 1);
		setSlots(rounds[round + 1].cards.map(() => null));
		setChecked(null);
		setMsg(null);
	}

	function restart() {
		setRound(0);
		setSlots(rounds[0].cards.map(() => null));
		setChecked(null);
		setTries(0);
		setRoundsDone(0);
		setMsg(null);
		setSeed((s) => s + 1);
	}

	function card(ci: number) {
		const c = r.cards[ci];
		const src = resolve(c.img);
		const hasLabel = c.label.trim().length > 0;
		return (
			<div
				key={ci}
				onPointerDown={(e) => start(e, String(ci))}
				style={dragStyle(drag, String(ci))}
				className="touch-none grid w-24 shrink-0 cursor-grab gap-1 rounded-xl border-2 border-border bg-surface p-2 text-center shadow-sm select-none sm:w-28"
			>
				{src && (
					<img
						src={src}
						alt={hasLabel ? "" : "imagine"}
						draggable={false}
						className={`pointer-events-none w-full rounded-md ${imageFit === "natural" ? "" : imageFit === "contain" ? "h-28 object-contain" : "h-16 object-cover"}`}
						loading="lazy"
					/>
				)}
				{hasLabel && <span className="text-xs font-medium">{c.label}</span>}
			</div>
		);
	}

	return (
		<GameShell
			title={r.title}
			instruction="Trage fiecare card în căsuța lui, în ordinea cerută, apoi apasă „Verifică”."
			done={roundsDone}
			total={rounds.length}
			tries={tries}
			complete={complete}
			onRestart={restart}
		>
			<div className="mb-2 flex items-center justify-between text-xs font-medium text-muted">
				<span>{r.startLabel ? `← ${r.startLabel}` : ""}</span>
				<span>{r.endLabel ? `${r.endLabel} →` : ""}</span>
			</div>
			<div className="flex flex-wrap gap-2">
				{slots.map((ci, si) => (
					<div
						key={si}
						data-slot={si}
						className="grid min-h-28 w-24 place-items-center rounded-xl border-2 border-dashed p-1 sm:w-28"
						style={{
							borderColor:
								checked === null ? "var(--color-border)" : checked[si] ? "var(--game-ok)" : "var(--game-bad)",
						}}
					>
						{ci === null ? <span className="text-lg font-semibold text-muted">{si + 1}</span> : card(ci)}
					</div>
				))}
			</div>
			<div data-pool className="mt-4 flex min-h-28 flex-wrap gap-2 rounded-xl bg-sand/20 p-2">
				{pool.map((ci) => card(ci))}
				{pool.length === 0 && <span className="self-center px-2 text-sm text-muted">Toate cardurile sunt așezate.</span>}
			</div>
			<div className="mt-3 flex min-h-9 items-center justify-between">
				<span aria-live="polite" className="text-sm font-medium" style={{ color: msg?.ok ? "var(--game-ok)" : "var(--game-bad)" }}>
					{msg?.text}
				</span>
				{allOk && round < rounds.length - 1 ? (
					<button type="button" onClick={nextRound} className="game-pop rounded-full bg-primary px-4 py-1.5 text-sm font-medium text-on-primary">
						Runda următoare →
					</button>
				) : (
					<button
						type="button"
						onClick={verify}
						disabled={slots.includes(null)}
						className="rounded-full bg-primary px-4 py-1.5 text-sm font-medium text-on-primary disabled:opacity-40"
					>
						Verifică
					</button>
				)}
			</div>
		</GameShell>
	);
}
