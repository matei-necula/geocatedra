import { useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { assetSrc, shuffleSeeded, type GameAsset, type GrilaRound } from "../../lib/games";
import { GameShell, pickMsg } from "./GameShell";

export function GrilaGame({
	rounds,
	assets,
	resolveSrc,
}: {
	rounds: GrilaRound[];
	assets: GameAsset[];
	resolveSrc?: (idx: number | undefined) => string | null;
}) {
	const resolve = resolveSrc ?? ((idx: number | undefined) => assetSrc(assets, idx));
	const [seed, setSeed] = useState(0);
	const [roundIdx, setRoundIdx] = useState(0);
	const [qi, setQi] = useState(0);
	const [tries, setTries] = useState(0);
	const [flash, setFlash] = useState<{ i: number; ok: boolean } | null>(null);
	const [locked, setLocked] = useState(false);
	const [msg, setMsg] = useState<{ text: string; ok: boolean } | null>(null);
	// Când varianta corectă are o explicație, nu mai trecem singuri mai departe:
	// elevul apucă s-o citească și dă clic pe „Mai departe".
	const [pending, setPending] = useState(false);
	// Imaginea întrebării e mică în pagină (stă lângă variante). Unele grile
	// pun în ea un desen de citit — climograme, profile de sol, curbe de nivel —
	// pe care elevul trebuie să le poată mări.
	const [zoom, setZoom] = useState(false);

	const round = rounds[Math.min(roundIdx, rounds.length - 1)];
	const question = round.questions[qi];
	const isLastRound = roundIdx >= rounds.length - 1;
	const roundComplete = question === undefined;

	const total = useMemo(() => rounds.reduce((s, r) => s + r.questions.length, 0), [rounds]);
	const doneBefore = useMemo(() => rounds.slice(0, roundIdx).reduce((s, r) => s + r.questions.length, 0), [rounds, roundIdx]);
	const done = doneBefore + Math.min(qi, round.questions.length);

	// Amestecare determinist-seedată: aceeași primă redare pe server și client
	// (fără hydration mismatch), dar altă ordine la „Joacă din nou" (seed nou).
	const optionOrder = useMemo(() => {
		if (!question) return [];
		return shuffleSeeded(question.options.map((_, i) => i), seed * 10000 + roundIdx * 97 + qi + 1);
	}, [question, seed, roundIdx, qi]);

	function advance() {
		setFlash(null);
		setMsg(null);
		setLocked(false);
		setPending(false);
		setQi((q) => q + 1);
		setZoom(false);
	}

	function pick(oi: number) {
		if (locked || !question) return;
		setTries((t) => t + 1);
		const ok = oi === question.answer;
		// Explicația scrisă în conținut bate mesajul generic („Bravo!").
		const why = question.why?.[oi]?.trim();
		setFlash({ i: oi, ok });
		setMsg({ text: why || pickMsg(ok), ok });
		if (ok) {
			setLocked(true);
			if (why) {
				setPending(true);
				setTimeout(() => setFlash(null), 900);
			} else {
				setTimeout(advance, 900);
			}
		} else {
			setTimeout(() => setFlash(null), 900);
		}
	}

	function nextRound() {
		setRoundIdx((r) => r + 1);
		setQi(0);
		setFlash(null);
		setMsg(null);
		setLocked(false);
		setPending(false);
	}

	function restart() {
		setRoundIdx(0);
		setQi(0);
		setTries(0);
		setFlash(null);
		setMsg(null);
		setLocked(false);
		setPending(false);
		setSeed((s) => s + 1);
	}

	const roundSuffix = rounds.length > 1 ? ` — runda ${roundIdx + 1} din ${rounds.length}` : "";
	const imgSrc = question ? resolve(question.img) : null;

	return (
		<GameShell
			title={(round.title ?? "Grilă") + roundSuffix}
			instruction="Alege varianta corectă."
			done={done}
			total={total}
			tries={tries}
			complete={roundComplete}
			onRestart={restart}
			onNext={!isLastRound ? nextRound : undefined}
			nextLabel={!isLastRound ? `Runda următoare (runda ${roundIdx + 2} din ${rounds.length})` : undefined}
		>
			{question && (
				<div className="grid gap-3">
					{question.text && <p className="font-heading text-lg font-semibold">{question.text}</p>}
					<div className={imgSrc ? "grid gap-4 sm:grid-cols-2 sm:items-start" : "grid gap-2"}>
						{imgSrc && (
							<div className="grid gap-2">
								<button
									type="button"
									onClick={() => setZoom(true)}
									aria-label="Vezi imaginea mărită"
									className="block w-full cursor-zoom-in rounded-xl"
								>
									<img
										src={imgSrc}
										alt=""
										className="w-full rounded-xl border border-border object-contain sm:max-h-80"
										loading="lazy"
									/>
								</button>
								{question.hint && <p className="text-sm italic text-muted">{question.hint}</p>}
							</div>
						)}
						{!imgSrc && question.hint && <p className="text-sm italic text-muted">{question.hint}</p>}
						<div className="grid gap-2 content-start">
							{optionOrder.map((oi) => {
								const isFlash = flash?.i === oi;
								return (
									<button
										key={oi}
										type="button"
										onClick={() => pick(oi)}
										disabled={locked}
										className={`min-h-11 rounded-xl border-2 border-border bg-surface px-4 py-2.5 text-left font-medium shadow-sm transition hover:shadow-md disabled:opacity-70 ${
											isFlash ? (flash.ok ? "game-blink-ok text-white" : "game-blink-bad text-white") : ""
										}`}
										style={{ borderColor: isFlash ? (flash.ok ? "var(--game-ok)" : "var(--game-bad)") : undefined }}
									>
										{question.options[oi]}
									</button>
								);
							})}
						</div>
					</div>
				</div>
			)}
			{/* Prin portal în <body>: pagina materialului are un strat animat cu
			    `transform`, iar un `position: fixed` dinăuntrul lui s-ar raporta la
			    acel strat, nu la fereastră — imaginea ar ieși din ecran. */}
			{zoom &&
				imgSrc &&
				createPortal(
					<div
						role="dialog"
						aria-label="Imaginea întrebării, mărită"
						onClick={() => setZoom(false)}
						className="fixed inset-0 z-50 grid cursor-zoom-out place-items-center bg-ink/80 p-4"
					>
						<img
							src={imgSrc}
							alt=""
							className="rounded-xl bg-surface object-contain"
							style={{ maxHeight: "92vh", maxWidth: "96vw" }}
						/>
					</div>,
					document.body,
				)}
			<p aria-live="polite" className="mt-2 min-h-5 text-sm font-medium" style={{ color: msg?.ok ? "var(--game-ok)" : "var(--game-bad)" }}>
				{msg?.text}
			</p>
			{pending && (
				<button
					type="button"
					onClick={advance}
					className="mt-3 min-h-11 rounded-full bg-primary px-5 py-2 font-medium text-on-primary shadow-sm transition hover:shadow-md"
				>
					Mai departe →
				</button>
			)}
		</GameShell>
	);
}
