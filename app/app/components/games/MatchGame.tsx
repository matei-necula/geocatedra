import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { assetSrc, derangeAgainst, shuffleSeeded, type GameAsset, type GameSide, type ImageFit, type MatchRound } from "../../lib/games";
import { GameShell, PAIR_COLORS, pickMsg } from "./GameShell";

type Match = { l: number; r: number; color: string }; // l/r = pair indices
type Line = { x1: number; y1: number; x2: number; y2: number; color: string };

/** Cartonaș fără text, doar imagine, la `imageFit: "natural"`: imaginea umple
 *  toată caseta, deci caseta are exact dimensiunea imaginii — fără chenar gol în
 *  jur și fără etichetă dedesubt. Cere imagini cu același raport lățime/înălțime. */
function isFullBleed(item: GameSide, fit: ImageFit | undefined) {
	return fit === "natural" && item.img !== undefined && !(item.label ?? item.text);
}

function SideContent({
	item,
	resolve,
	fit,
}: {
	item: GameSide;
	resolve: (idx: number | undefined) => string | null;
	fit?: ImageFit;
}) {
	const src = resolve(item.img);
	const label = item.label ?? item.text;
	// „contain" = imaginea se vede întreagă (utilă la imagini înalte, unde
	// decuparea implicită ar ascunde o parte); are nevoie de o casetă mai înaltă.
	// „natural" = imaginea umple caseta (vezi `isFullBleed`). Caseta n-avea nicio
	// înălțime fixă — se forma abia după ce imaginea se încărca, deci grila „sărea".
	// Toate seturile care folosesc `natural` azi vin decupate în jurul raportului A4
	// (≈1,41:1); `aspect-[1.41/1]` rezervă exact acel spațiu, fără nicio decupare vizibilă
	// în plus față de ce se întâmpla oricum (vezi cerința de mai sus, „același raport").
	const imgClass =
		fit === "natural"
			? "aspect-[1.41/1] w-full rounded-lg object-cover"
			: fit === "contain"
				? "h-48 w-full rounded-md object-contain sm:h-56"
				: "h-20 w-full rounded-md object-cover sm:h-24";
	if (isFullBleed(item, fit)) return <img src={src ?? ""} alt="" className={imgClass} loading="lazy" />;
	return (
		<span className="grid gap-1">
			{src && <img src={src} alt={label ?? ""} className={imgClass} loading="lazy" />}
			{(label || !src) && <span className="text-xs leading-snug font-medium sm:text-sm">{label ?? "?"}</span>}
		</span>
	);
}

export function MatchGame({
	rounds,
	imageFit,
	layout,
	assets,
	resolveSrc,
}: {
	rounds: MatchRound[];
	imageFit?: ImageFit;
	/** „rows" = o parte pe un rând, cealaltă pe rândul de dedesubt.
	 *  Se poate pune și pe o rundă anume, care are prioritate. */
	layout?: "rows";
	assets: GameAsset[];
	resolveSrc?: (idx: number | undefined) => string | null;
}) {
	const resolve = resolveSrc ?? ((idx: number | undefined) => assetSrc(assets, idx));
	const [round, setRound] = useState(0);
	const [seed, setSeed] = useState(0);
	const [matches, setMatches] = useState<Match[]>([]);
	const [sel, setSel] = useState<{ side: "L" | "R"; i: number } | null>(null);
	const [wrong, setWrong] = useState<{ l: number; r: number } | null>(null);
	const [tries, setTries] = useState(0);
	const [msg, setMsg] = useState<{ text: string; ok: boolean } | null>(null);
	const [lines, setLines] = useState<Line[]>([]);
	const [tick, setTick] = useState(0);
	const boardRef = useRef<HTMLDivElement>(null);
	const itemRefs = useRef(new Map<string, HTMLButtonElement>());

	const pairs = rounds[round].pairs;
	const rowsLayout = (rounds[round].layout ?? layout) === "rows";
	const leftOrder = useMemo(() => shuffleSeeded(pairs.map((_, i) => i), seed * 1000 + round * 2), [round, seed, pairs]);
	// Derajat față de coloana/rândul stâng: perechea corectă nu stă niciodată
	// exact vizavi (sau exact dedesubt, la `layout: "rows"`).
	const rightOrder = useMemo(
		() => derangeAgainst(leftOrder, shuffleSeeded(pairs.map((_, i) => i), seed * 1000 + round * 2 + 1)),
		[leftOrder, round, seed, pairs],
	);
	const matchedL = new Set(matches.map((m) => m.l));
	const matchedR = new Set(matches.map((m) => m.r));
	const doneBefore = rounds.slice(0, round).reduce((s, r) => s + r.pairs.length, 0);
	const total = rounds.reduce((s, r) => s + r.pairs.length, 0);
	const roundDone = matches.length === pairs.length;
	const complete = roundDone && round === rounds.length - 1;

	useEffect(() => {
		const onResize = () => setTick((t) => t + 1);
		window.addEventListener("resize", onResize);
		return () => window.removeEventListener("resize", onResize);
	}, []);

	useLayoutEffect(() => {
		const box = boardRef.current?.getBoundingClientRect();
		if (!box) return;
		setLines(
			matches.flatMap((m) => {
				const le = itemRefs.current.get(`L${m.l}`);
				const re = itemRefs.current.get(`R${m.r}`);
				if (!le || !re) return [];
				const lr = le.getBoundingClientRect();
				const rr = re.getBoundingClientRect();
				// Pe două rânduri linia coboară (de sub imagine spre eticheta de jos);
				// pe două coloane merge lateral.
				return [
					rowsLayout
						? {
							x1: lr.left + lr.width / 2 - box.left,
							y1: lr.bottom - box.top,
							x2: rr.left + rr.width / 2 - box.left,
							y2: rr.top - box.top,
							color: m.color,
						}
						: {
							x1: lr.right - box.left,
							y1: lr.top + lr.height / 2 - box.top,
							x2: rr.left - box.left,
							y2: rr.top + rr.height / 2 - box.top,
							color: m.color,
						},
				];
			}),
		);
	}, [matches, round, tick, rowsLayout]);

	function pick(side: "L" | "R", i: number) {
		if ((side === "L" ? matchedL : matchedR).has(i)) return;
		if (!sel || sel.side === side) {
			setSel({ side, i });
			return;
		}
		const l = side === "L" ? i : sel.i;
		const r = side === "R" ? i : sel.i;
		setTries((t) => t + 1);
		setSel(null);
		if (pairs[l].group === pairs[r].group) {
			setMatches((ms) => [...ms, { l, r, color: PAIR_COLORS[ms.length % PAIR_COLORS.length] }]);
			setMsg({ text: pickMsg(true), ok: true });
		} else {
			setWrong({ l, r });
			setMsg({ text: pickMsg(false), ok: false });
			setTimeout(() => setWrong(null), 800);
		}
	}

	function restart() {
		setRound(0);
		setMatches([]);
		setSel(null);
		setTries(0);
		setMsg(null);
		setSeed((s) => s + 1);
	}

	function itemBtn(side: "L" | "R", i: number) {
		const item = side === "L" ? pairs[i].left : pairs[i].right;
		const matched = (side === "L" ? matchedL : matchedR).has(i);
		const color = matches.find((m) => (side === "L" ? m.l : m.r) === i)?.color;
		const isSel = sel?.side === side && sel.i === i;
		const isWrong = wrong !== null && (side === "L" ? wrong.l : wrong.r) === i;
		// Cartonașul „full bleed" nu are padding: caseta = imaginea.
		const pad = isFullBleed(item, imageFit) ? "overflow-hidden p-0" : "p-2 sm:p-3";
		return (
			<button
				key={`${side}${i}`}
				type="button"
				ref={(el) => {
					if (el) itemRefs.current.set(`${side}${i}`, el);
					else itemRefs.current.delete(`${side}${i}`);
				}}
				onClick={() => pick(side, i)}
				disabled={matched}
				aria-pressed={isSel}
				className={`min-h-11 rounded-xl border-2 bg-surface text-left shadow-sm transition ${pad} ${isWrong ? "game-shake" : ""} ${isSel ? "scale-[1.03] shadow-md" : ""} ${matched ? "opacity-90" : "hover:shadow-md"}`}
				style={{ borderColor: isWrong ? "var(--game-bad)" : (color ?? (isSel ? "var(--color-accent)" : "var(--color-border)")) }}
			>
				<SideContent item={item} resolve={resolve} fit={imageFit} />
			</button>
		);
	}

	return (
		<GameShell
			title={rounds[round].title ?? "Asociază perechile"}
			instruction={
				rowsLayout
					? "Atinge o imagine de sus, apoi perechea ei de pe rândul de jos."
					: "Atinge un element dintr-o coloană, apoi perechea lui din cealaltă."
			}
			done={doneBefore + matches.length}
			total={total}
			tries={tries}
			complete={complete}
			onRestart={restart}
		>
			<div ref={boardRef} className="relative">
				<svg aria-hidden className="pointer-events-none absolute inset-0 z-10 h-full w-full">
					{lines.map((l, i) => (
						<line key={i} x1={l.x1} y1={l.y1} x2={l.x2} y2={l.y2} stroke={l.color} strokeWidth={3} strokeLinecap="round" />
					))}
				</svg>
				{rowsLayout ? (
					<div className="grid gap-y-8">
						<div className="grid auto-cols-fr grid-flow-col gap-2">{leftOrder.map((i) => itemBtn("L", i))}</div>
						<div className="grid auto-cols-fr grid-flow-col gap-2">{rightOrder.map((i) => itemBtn("R", i))}</div>
					</div>
				) : (
					<div className="grid grid-cols-2 gap-x-10 gap-y-2 sm:gap-x-16">
						<div className="grid content-start gap-2">{leftOrder.map((i) => itemBtn("L", i))}</div>
						<div className="grid content-start gap-2">{rightOrder.map((i) => itemBtn("R", i))}</div>
					</div>
				)}
			</div>
			<div className="mt-3 flex min-h-6 items-center justify-between">
				<span aria-live="polite" className="text-sm font-medium" style={{ color: msg?.ok ? "var(--game-ok)" : "var(--game-bad)" }}>
					{msg?.text}
				</span>
				{roundDone && !complete && (
					<button
						type="button"
						onClick={() => {
							setRound((r) => r + 1);
							setMatches([]);
							setSel(null);
							setMsg(null);
						}}
						className="game-pop rounded-full bg-primary px-4 py-1.5 text-sm font-medium text-on-primary"
					>
						Runda următoare →
					</button>
				)}
			</div>
		</GameShell>
	);
}
