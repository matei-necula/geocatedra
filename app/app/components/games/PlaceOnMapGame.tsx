import { useMemo, useState } from "react";
import { assetSrc, placeRounds, shuffleSeeded, type GameAsset, type MapTarget } from "../../lib/games";
import { GameShell, pickMsg } from "./GameShell";
import { dragStyle, useDrag } from "./useDrag";

export function PlaceOnMapGame({
	map,
	targets,
	reveal,
	rounds,
	assets,
	resolveSrc,
}: {
	map: number;
	targets: MapTarget[];
	reveal?: "below";
	/** Runde autorate: listele de `id`-uri jucate una după alta. Lipsă ⇒ o
	 *  singură rundă cu toate țintele (comportamentul de dinainte). */
	rounds?: string[][];
	assets: GameAsset[];
	resolveSrc?: (idx: number | undefined) => string | null;
}) {
	const resolve = resolveSrc ?? ((idx: number | undefined) => assetSrc(assets, idx));
	const [placed, setPlaced] = useState<ReadonlySet<string>>(new Set());
	const [wrongId, setWrongId] = useState<string | null>(null);
	const [tries, setTries] = useState(0);
	const [seed, setSeed] = useState(0);
	const [roundIdx, setRoundIdx] = useState(0);
	const [zoomId, setZoomId] = useState<string | null>(null); // lightbox (mod normal)
	const [msg, setMsg] = useState<{ text: string; ok: boolean } | null>(null);
	// Rundele jocului: cele scrise în conținut, altfel una singură cu tot.
	// „Joacă din nou" schimbă seed-ul și revine la runda 1; „Runda următoare"
	// doar avansează `roundIdx`.
	const roundList = useMemo(() => placeRounds(targets, rounds), [targets, rounds]);
	const roundCount = roundList.length;
	const roundTargets = roundList[roundIdx] ?? roundList[roundCount - 1] ?? [];
	const isLastRound = roundIdx >= roundCount - 1;
	const order = useMemo(
		() => shuffleSeeded(roundTargets.map((t) => t.id), seed * 100 + roundIdx),
		[seed, roundIdx, roundTargets],
	);
	const { drag, start } = useDrag(onDrop);

	const revealBelow = reveal === "below";
	const remaining = order.filter((id) => !placed.has(id));
	const complete = remaining.length === 0;
	// Progresul se numără peste toate rundele, ca bara să nu sară înapoi.
	const doneBefore = roundList.slice(0, roundIdx).reduce((s, r) => s + r.length, 0);
	const grandTotal = roundList.reduce((s, r) => s + r.length, 0);
	const mapSrc = resolve(map);
	const zoomTarget = roundTargets.find((t) => t.id === zoomId);
	// mod „reveal": elementul curent de plasat (primul rămas, în ordinea amestecată
	// determinist) — apare mărit sub hartă înainte de a fi atașat.
	const current = revealBelow ? roundTargets.find((t) => t.id === remaining[0]) : undefined;

	/** Verifică o încercare de plasare a elementului `id` peste ținta `tid`
	 *  (folosit atât la tragere, cât și la atingerea directă a bulinei). */
	function evaluate(id: string, tid: string) {
		setTries((t) => t + 1);
		if (tid === id) {
			setPlaced((p) => new Set(p).add(id));
			setMsg({ text: pickMsg(true), ok: true });
		} else {
			setWrongId(tid);
			setMsg({ text: pickMsg(false), ok: false });
			setTimeout(() => setWrongId(null), 900);
		}
	}

	function onDrop(id: string, x: number, y: number) {
		const el = document.elementFromPoint(x, y)?.closest("[data-target]");
		const tid = el?.getAttribute("data-target");
		if (!tid) return;
		evaluate(id, tid);
	}

	function nextRound() {
		setRoundIdx((r) => r + 1);
		setPlaced(new Set());
		setZoomId(null);
		setMsg(null);
	}

	function restart() {
		setRoundIdx(0);
		setPlaced(new Set());
		setZoomId(null);
		setTries(0);
		setMsg(null);
		setSeed((s) => s + 1);
	}

	if (!mapSrc) return <p className="text-muted">Harta jocului lipsește.</p>;

	return (
		<GameShell
			title={roundCount > 1 ? `Așază etichetele pe hartă — runda ${roundIdx + 1} din ${roundCount}` : "Așază etichetele pe hartă"}
			instruction={
				revealBelow
					? "Trage eticheta mărită de sub hartă peste bulina potrivită sau atinge direct bulina potrivită."
					: "Trage fiecare etichetă de jos peste bulina potrivită de pe hartă. Atinge o etichetă așezată ca s-o vezi mărită."
			}
			done={doneBefore + (roundTargets.length - remaining.length)}
			total={grandTotal}
			tries={tries}
			complete={complete}
			onRestart={restart}
			onNext={!isLastRound ? nextRound : undefined}
			nextLabel={!isLastRound ? `Runda următoare (runda ${roundIdx + 2} din ${roundCount})` : undefined}
		>
			<div className="relative overflow-hidden rounded-xl border border-border">
				<img src={mapSrc} alt="Hartă" className="w-full" draggable={false} />
				{roundTargets.map((t) => {
					const isPlaced = placed.has(t.id);
					const thumb = t.img === undefined ? null : resolve(t.img);
					// În modul „reveal", eticheta așezată devine un marcaj mic (nu acoperă
					// bulinele vecine); elementul curent se vede mărit sub hartă, nu pe hartă.
					if (isPlaced && revealBelow) {
						return (
							<div key={t.id} className="absolute -translate-x-1/2 -translate-y-1/2" style={{ left: `${t.x}%`, top: `${t.y}%` }}>
								<span
									aria-label={`${t.label}: plasat corect`}
									className="grid h-5 w-5 place-items-center rounded-full border-2 border-white text-[10px] font-bold text-white shadow-md sm:h-6 sm:w-6"
									style={{ background: "var(--game-ok)" }}
								>
									✓
								</span>
							</div>
						);
					}
					return (
						<div key={t.id} className="absolute -translate-x-1/2 -translate-y-1/2" style={{ left: `${t.x}%`, top: `${t.y}%` }}>
							{isPlaced ? (
								<button
									type="button"
									onClick={() => setZoomId(t.id)}
									aria-label={`Vezi mărit: ${t.label}`}
									className="game-pop block rounded-md border-2 bg-surface p-0.5 shadow-md"
									style={{ borderColor: "var(--game-ok)" }}
								>
									{thumb ? (
										<img src={thumb} alt="" className="h-9 w-9 rounded-sm object-cover sm:h-11 sm:w-11" />
									) : (
										<span className="block px-1 text-[10px] font-medium">{t.label}</span>
									)}
								</button>
							) : revealBelow ? (
								<button
									type="button"
									data-target={t.id}
									onClick={() => current && evaluate(current.id, t.id)}
									aria-label={`Atașează aici: ${t.label}`}
									className={`block h-7 w-7 rounded-full border-2 border-white shadow-md sm:h-8 sm:w-8 ${wrongId === t.id ? "game-blink-bad" : ""}`}
									style={{ background: wrongId === t.id ? undefined : "var(--color-primary)" }}
								/>
							) : (
								<span
									data-target={t.id}
									aria-label={t.label}
									className={`block h-7 w-7 rounded-full border-2 border-white shadow-md sm:h-8 sm:w-8 ${wrongId === t.id ? "game-blink-bad" : ""}`}
									style={{ background: wrongId === t.id ? undefined : "var(--color-primary)" }}
								/>
							)}
						</div>
					);
				})}
			</div>

			{revealBelow ? (
				current && (
					<figure
						key={current.id}
						onPointerDown={(e) => start(e, current.id)}
						style={dragStyle(drag, current.id)}
						className="game-pop touch-none mx-auto mt-3 w-fit max-w-full cursor-grab select-none rounded-xl border-2 border-border bg-surface p-2 text-center shadow-sm"
					>
						{current.img !== undefined && resolve(current.img) ? (
							<>
								<img
									src={resolve(current.img)!}
									alt={current.label}
									draggable={false}
									className="pointer-events-none mx-auto max-h-72 w-auto rounded-md object-contain"
								/>
								{/* Numele obiectului de plasat, sub imagine. NU eticheta întreagă:
								    aceea conține și ținta, adică răspunsul. */}
								{current.caption && (
									<figcaption className="mt-1.5 text-sm font-medium text-ink">{current.caption}</figcaption>
								)}
							</>
						) : (
							<span className="block px-3 py-10 text-sm font-medium">{current.label}</span>
						)}
					</figure>
				)
			) : (
				<div className="mt-3 flex gap-2 overflow-x-auto pb-2">
					{remaining.map((id) => {
						const t = roundTargets.find((x) => x.id === id);
						if (!t) return null;
						const thumb = t.img === undefined ? null : resolve(t.img);
						return (
							<div
								key={id}
								onPointerDown={(e) => start(e, id)}
								style={dragStyle(drag, id)}
								className="touch-none w-24 shrink-0 cursor-grab rounded-xl border-2 border-border bg-surface p-1.5 text-center shadow-sm select-none sm:w-28"
							>
								{thumb ? (
									<img src={thumb} alt={t.label} draggable={false} className="pointer-events-none h-20 w-full rounded-md object-cover sm:h-24" />
								) : (
									<span className="text-xs font-medium">{t.label}</span>
								)}
							</div>
						);
					})}
				</div>
			)}
			<p aria-live="polite" className="min-h-5 text-sm font-medium" style={{ color: msg?.ok ? "var(--game-ok)" : "var(--game-bad)" }}>
				{msg?.text}
			</p>
			{!revealBelow && zoomTarget && (
				<div
					role="dialog"
					aria-label={zoomTarget.label}
					onClick={() => setZoomId(null)}
					className="fixed inset-0 z-50 grid cursor-zoom-out place-items-center bg-ink/70 p-4"
				>
					<figure className="max-w-lg">
						{zoomTarget.img !== undefined && resolve(zoomTarget.img) && (
							<img src={resolve(zoomTarget.img)!} alt={zoomTarget.label} className="max-h-[80vh] w-full rounded-xl bg-surface object-contain" />
						)}
						<figcaption className="mt-2 text-center font-medium text-white">{zoomTarget.label}</figcaption>
					</figure>
				</div>
			)}
		</GameShell>
	);
}
