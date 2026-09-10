import { useMemo, useState } from "react";
import { assetSrc, quizRounds, renumberPoints, shuffleSeeded, type GameAsset, type MapPoint } from "../../lib/games";
import { GameShell, pickMsg } from "./GameShell";

type Mode = "gaseste" | "numeste";

export function MapQuizGame({
	map,
	maps,
	points,
	draw,
	roundsDef,
	assets,
	resolveSrc,
}: {
	map: number;
	/** Harta de bază a fiecărei runde; unde lipsește, se cade pe `map`. */
	maps?: number[];
	points: MapPoint[];
	draw?: number;
	/** Runde scrise în conținut; au prioritate față de `draw`. */
	roundsDef?: number[][];
	assets: GameAsset[];
	resolveSrc?: (idx: number | undefined) => string | null;
}) {
	const resolve = resolveSrc ?? ((idx: number | undefined) => assetSrc(assets, idx));
	const [mode, setMode] = useState<Mode | null>(null);
	const [seed, setSeed] = useState(0);
	const [roundIdx, setRoundIdx] = useState(0);
	const [qi, setQi] = useState(0);
	const [tries, setTries] = useState(0);
	const [flash, setFlash] = useState<{ n: number; ok: boolean } | null>(null);
	const [msg, setMsg] = useState<{ text: string; ok: boolean } | null>(null);
	// Rundele jocului: cele autorate în conținut (`rounds`), altfel bucăți de
	// `draw` din lista amestecată (o singură rundă când `draw` lipsește).
	// „Joacă din nou" bumps `seed` (re-shuffles, back to round 1); „Runda
	// următoare" only advances `roundIdx`, keeping the same overall shuffle.
	const rounds = useMemo(() => quizRounds(points, roundsDef, draw, seed * 2), [seed, points, roundsDef, draw]);
	const roundCount = rounds.length;
	const roundPoints = rounds[roundIdx] ?? rounds[roundCount - 1] ?? [];
	// Dots in a round are renumbered 1..N (stable, round-local) so they never
	// show gaps like 4, 19, 31 from the original JSON `n`.
	const drawn = useMemo(() => renumberPoints(roundPoints), [roundPoints]);
	const isLastRound = roundIdx >= roundCount - 1;
	const order = drawn.map((p) => p.n);
	const nameOrder = useMemo(() => shuffleSeeded(drawn.map((p) => p.name), seed * 2 + 1 + roundIdx), [seed, drawn, roundIdx]);
	const total = drawn.length;

	const solved = new Set(order.slice(0, qi));
	const current = drawn[qi];
	const roundComplete = mode !== null && current === undefined;
	// Fiecare rundă își poate avea harta ei (ex. runda 1 pe harta câmpiilor,
	// runda 2 pe harta fluviilor); fără `maps`, toate rundele stau pe `map`.
	const mapSrc = resolve(maps?.[roundIdx] ?? map);

	function answer(ok: boolean, flashN: number) {
		setTries((t) => t + 1);
		setFlash({ n: flashN, ok });
		setMsg({ text: pickMsg(ok), ok });
		setTimeout(() => setFlash(null), 900);
		if (ok) setQi((i) => i + 1);
	}

	function clickDot(p: MapPoint) {
		if (mode !== "gaseste" || !current || solved.has(p.n)) return;
		answer(p.n === current.n, p.n);
	}

	function clickName(name: string) {
		if (mode !== "numeste" || !current) return;
		answer(name === current.name, current.n);
	}

	function nextRound() {
		setRoundIdx((r) => r + 1);
		setQi(0);
		setFlash(null);
		setMsg(null);
	}

	function restart() {
		setMode(null);
		setRoundIdx(0);
		setQi(0);
		setTries(0);
		setFlash(null);
		setMsg(null);
		setSeed((s) => s + 1);
	}

	if (!mapSrc) return <p className="text-muted">Harta jocului lipsește.</p>;

	if (mode === null) {
		return (
			<GameShell title="Găsește pe hartă" instruction="Alege cum vrei să joci." done={0} total={total} tries={0} complete={false} onRestart={restart}>
				<div className="grid gap-3 sm:grid-cols-2">
					<button type="button" onClick={() => setMode("gaseste")} className="rounded-xl border-2 border-border bg-surface p-4 text-left shadow-sm transition hover:border-primary">
						<span className="font-heading text-lg font-semibold text-primary">Găsește pe hartă</span>
						<p className="mt-1 text-sm text-muted">Îți spunem numele — tu atingi bulina potrivită.</p>
					</button>
					<button type="button" onClick={() => setMode("numeste")} className="rounded-xl border-2 border-border bg-surface p-4 text-left shadow-sm transition hover:border-primary">
						<span className="font-heading text-lg font-semibold text-primary">Numește bulina</span>
						<p className="mt-1 text-sm text-muted">Îți arătăm o bulină — tu alegi numele corect.</p>
					</button>
				</div>
			</GameShell>
		);
	}

	const roundSuffix = roundCount > 1 ? ` — runda ${roundIdx + 1} din ${roundCount}` : "";

	return (
		<GameShell
			title={(mode === "gaseste" ? "Găsește pe hartă" : "Numește bulina") + roundSuffix}
			instruction={mode === "gaseste" ? "Atinge pe hartă bulina care corespunde numelui." : "Bulina care pulsează — atinge numele ei de mai sus."}
			done={qi}
			total={total}
			tries={tries}
			complete={roundComplete}
			onRestart={restart}
			onNext={!isLastRound ? nextRound : undefined}
			nextLabel={!isLastRound ? `Runda următoare (runda ${roundIdx + 2} din ${roundCount})` : undefined}
		>
			{mode === "numeste" && (
				<div className="mb-3 flex flex-wrap gap-1.5">
					{nameOrder.map((name) => {
						const p = drawn.find((x) => x.name === name);
						const isSolved = p !== undefined && solved.has(p.n);
						return (
							<button
								key={name}
								type="button"
								onClick={() => clickName(name)}
								disabled={isSolved}
								className="min-h-9 rounded-full border border-border bg-surface px-3 py-1 text-sm font-medium transition hover:border-primary disabled:opacity-40"
							>
								{name} {isSolved && "✓"}
							</button>
						);
					})}
				</div>
			)}
			{mode === "gaseste" && current && (
				<p className="mb-3 text-center font-heading text-lg">
					Unde este <strong className="text-primary">{current.name}</strong>?
				</p>
			)}
			<div className="relative overflow-hidden rounded-xl border border-border">
				<img src={mapSrc} alt="Hartă" className="w-full" draggable={false} />
				{drawn.map((p) => {
					const isSolved = solved.has(p.n);
					const isFlash = flash?.n === p.n;
					const isCurrent = mode === "numeste" && current?.n === p.n;
					return (
						<button
							key={p.n}
							type="button"
							onClick={() => clickDot(p)}
							aria-label={isSolved ? p.name : `bulina ${p.n}`}
							className={`absolute z-10 grid h-5 w-5 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full border-2 border-white text-[10px] font-bold text-white shadow-md sm:h-6 sm:w-6 ${isFlash ? (flash.ok ? "game-blink-ok" : "game-blink-bad") : ""} ${isCurrent && !isFlash ? "game-pulse-hi" : ""}`}
							style={{
								left: `${p.x}%`,
								top: `${p.y}%`,
								background: isFlash ? undefined : isSolved ? "var(--game-ok)" : "var(--color-primary)",
							}}
						>
							{p.n}
						</button>
					);
				})}
				{drawn.map((p) => {
					if (!solved.has(p.n)) return null;
					// Eticheta stă pe un singur rând: numele lungi (la jocurile unde
					// „numele" e o propoziție întreagă) se înghesuiau altfel într-un
					// ghemotoc de 2-3 cuvinte pe rând, lat cât bulina. Lângă margini
					// se agață de marginea aceea, ca să nu iasă din hartă.
					const nearRight = p.x > 65;
					const nearLeft = p.x < 35;
					return (
						<span
							key={`l${p.n}`}
							className={`pointer-events-none absolute z-0 max-w-full overflow-hidden rounded-full bg-surface/90 px-1.5 text-[10px] font-medium text-ellipsis whitespace-nowrap shadow-sm ${
								nearRight || nearLeft ? "" : "-translate-x-1/2"
							}`}
							style={{
								top: `calc(${p.y}% + 14px)`,
								...(nearRight ? { right: `calc(${100 - p.x}% - 12px)` } : { left: `calc(${p.x}% ${nearLeft ? "- 12px" : ""})` }),
							}}
						>
							{p.name}
						</span>
					);
				})}
			</div>
			<p aria-live="polite" className="mt-2 min-h-5 text-sm font-medium" style={{ color: msg?.ok ? "var(--game-ok)" : "var(--game-bad)" }}>
				{msg?.text}
			</p>
		</GameShell>
	);
}
