import { useMemo, useState } from "react";
import { assetSrc, shuffleSeeded, type GameAsset, type SortBucket, type SortRound } from "../../lib/games";
import { GameShell, pickMsg } from "./GameShell";

/** Sortare pe categorii: un card apare pe rând, iar elevul atinge coșul potrivit.
 *  Subiect-agnostic — etichetele coșurilor și cardurile vin din body. */
export function SortareGame({
	buckets,
	rounds,
	assets,
	resolveSrc,
}: {
	buckets: SortBucket[];
	rounds: SortRound[];
	assets: GameAsset[];
	resolveSrc?: (idx: number | undefined) => string | null;
}) {
	const resolve = resolveSrc ?? ((idx: number | undefined) => assetSrc(assets, idx));
	const [seed, setSeed] = useState(0);
	const [roundIdx, setRoundIdx] = useState(0);
	const [ci, setCi] = useState(0);
	const [tries, setTries] = useState(0);
	const [flash, setFlash] = useState<{ b: number; ok: boolean } | null>(null);
	const [locked, setLocked] = useState(false);
	const [msg, setMsg] = useState<{ text: string; ok: boolean } | null>(null);
	const [sorted, setSorted] = useState<number[]>(() => buckets.map(() => 0));

	const round = rounds[Math.min(roundIdx, rounds.length - 1)];
	const isLastRound = roundIdx >= rounds.length - 1;

	// Amestecare determinist-seedată: aceeași primă redare pe server și pe client.
	const order = useMemo(
		() => shuffleSeeded(round.cards.map((_, i) => i), seed * 10000 + roundIdx * 131 + 1),
		[round, seed, roundIdx],
	);
	const card = ci < order.length ? round.cards[order[ci]] : undefined;
	const roundComplete = card === undefined;

	const total = useMemo(() => rounds.reduce((s, r) => s + r.cards.length, 0), [rounds]);
	const doneBefore = useMemo(() => rounds.slice(0, roundIdx).reduce((s, r) => s + r.cards.length, 0), [rounds, roundIdx]);
	const done = doneBefore + Math.min(ci, round.cards.length);

	function pick(bi: number) {
		if (locked || !card) return;
		setTries((t) => t + 1);
		const ok = bi === card.bucket;
		setFlash({ b: bi, ok });
		setMsg({ text: pickMsg(ok), ok });
		if (ok) {
			setLocked(true);
			setSorted((s) => s.map((n, i) => (i === bi ? n + 1 : n)));
			setTimeout(() => {
				setFlash(null);
				setMsg(null);
				setLocked(false);
				setCi((c) => c + 1);
			}, 750);
		} else {
			setTimeout(() => setFlash(null), 750);
		}
	}

	function nextRound() {
		setRoundIdx((r) => r + 1);
		setCi(0);
		setFlash(null);
		setMsg(null);
		setLocked(false);
		setSorted(buckets.map(() => 0));
	}

	function restart() {
		setRoundIdx(0);
		setCi(0);
		setTries(0);
		setFlash(null);
		setMsg(null);
		setLocked(false);
		setSorted(buckets.map(() => 0));
		setSeed((s) => s + 1);
	}

	const roundSuffix = rounds.length > 1 ? ` — runda ${roundIdx + 1} din ${rounds.length}` : "";
	const imgSrc = card ? resolve(card.img) : null;

	return (
		<GameShell
			title={(round.title ?? "Sortare") + roundSuffix}
			instruction="Atinge categoria în care se potrivește cartonașul."
			done={done}
			total={total}
			tries={tries}
			complete={roundComplete}
			onRestart={restart}
			onNext={!isLastRound ? nextRound : undefined}
			nextLabel={!isLastRound ? `Runda următoare (runda ${roundIdx + 2} din ${rounds.length})` : undefined}
		>
			{card && (
				<div className="grid gap-4">
					<div className="mx-auto grid w-full max-w-md gap-2 rounded-xl border-2 border-border bg-surface p-3 shadow-sm">
						{imgSrc && (
							<img src={imgSrc} alt="" className="max-h-56 w-full rounded-lg object-contain" loading="lazy" />
						)}
						{card.text && <p className="text-center font-medium">{card.text}</p>}
					</div>
					<div className="grid gap-2 sm:grid-cols-2">
						{buckets.map((b, bi) => {
							const isFlash = flash?.b === bi;
							return (
								<button
									key={bi}
									type="button"
									onClick={() => pick(bi)}
									disabled={locked}
									className={`min-h-16 rounded-xl border-2 border-border bg-surface px-4 py-3 text-center font-heading text-base font-semibold shadow-sm transition hover:shadow-md disabled:opacity-70 ${
										isFlash ? (flash.ok ? "game-blink-ok text-white" : "game-blink-bad text-white") : ""
									}`}
								>
									{b.label}
									<span className="mt-0.5 block text-sm font-normal text-muted">
										{sorted[bi]} {sorted[bi] === 1 ? "cartonaș" : "cartonașe"}
									</span>
								</button>
							);
						})}
					</div>
				</div>
			)}
			<p aria-live="polite" className="mt-2 min-h-5 text-sm font-medium" style={{ color: msg?.ok ? "var(--game-ok)" : "var(--game-bad)" }}>
				{msg?.text}
			</p>
		</GameShell>
	);
}
