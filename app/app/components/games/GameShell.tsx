import { useMemo, type ReactNode } from "react";

const OK_MSGS = ["Bravo!", "Excelent!", "Corect!", "Așa da!"];
const BAD_MSGS = ["Mai încearcă o dată!", "Aproape — mai încearcă!", "Nu-i nimic, mai încearcă!"];

export function pickMsg(ok: boolean): string {
	const list = ok ? OK_MSGS : BAD_MSGS;
	return list[Math.floor(Math.random() * list.length)];
}

export const PAIR_COLORS = [1, 2, 3, 4, 5, 6, 7, 8].map((n) => `var(--game-pair-${n})`);

export function GameShell({
	title,
	instruction,
	done,
	total,
	tries,
	complete,
	onRestart,
	onNext,
	nextLabel,
	children,
}: {
	title: string;
	instruction: string;
	done: number;
	total: number;
	tries: number;
	complete: boolean;
	onRestart: () => void;
	/** Optional second completion action (e.g. "next round" in a multi-round
	 *  game). When present, the completion overlay offers this instead of
	 *  "Joacă din nou" — `onRestart` stays reachable via a later `complete`
	 *  render once the caller stops passing `onNext` (e.g. on the last round). */
	onNext?: () => void;
	/** Label for the `onNext` button. Defaults to "Runda următoare". */
	nextLabel?: string;
	children: ReactNode;
}) {
	const confetti = useMemo(
		() =>
			Array.from({ length: 36 }, (_, i) => ({
				left: Math.random() * 100,
				delay: Math.random() * 0.9,
				color: PAIR_COLORS[i % PAIR_COLORS.length],
			})),
		// re-generate pieces on every completion
		[complete],
	);

	return (
		<div className="relative overflow-hidden rounded-2xl border border-border bg-bg p-4 sm:p-6">
			<div className="mb-1 flex items-center gap-2">
				<span aria-hidden className="text-accent">✦</span>
				<h3 className="font-heading text-xl font-semibold">{title}</h3>
			</div>
			<p className="mb-4 text-sm text-muted">{instruction}</p>
			{children}
			<div className="mt-4 flex items-center justify-between text-sm text-muted">
				<span aria-live="polite">
					{done} din {total}
				</span>
				{total <= 20 && (
					<span aria-hidden className="flex gap-1">
						{Array.from({ length: total }, (_, i) => (
							<span
								key={i}
								className="h-2 w-2 rounded-full"
								style={{ background: i < done ? "var(--game-ok)" : "var(--color-border)" }}
							/>
						))}
					</span>
				)}
			</div>
			{complete && (
				<div className="absolute inset-0 z-10 grid place-items-center rounded-2xl bg-surface/95">
					<div aria-hidden className="game-confetti pointer-events-none absolute inset-0">
						{confetti.map((c, i) => (
							<span key={i} style={{ left: `${c.left}%`, background: c.color, animationDelay: `${c.delay}s` }} />
						))}
					</div>
					<div className="game-pop relative text-center">
						<p className="font-heading text-3xl font-bold text-primary">{onNext ? "Rundă completă!" : "Felicitări!"}</p>
						<p className="mt-2 text-muted">
							{onNext ? "Ai terminat runda" : "Ai terminat jocul"} din {tries} {tries === 1 ? "încercare" : "încercări"}.
						</p>
						<button
							type="button"
							onClick={onNext ?? onRestart}
							className="mt-5 rounded-full bg-primary px-6 py-2.5 font-medium text-on-primary transition hover:opacity-90"
						>
							{onNext ? (nextLabel ?? "Runda următoare") : "Joacă din nou"}
						</button>
					</div>
				</div>
			)}
		</div>
	);
}
