// Pure logic for interactive games ("joc" materials with a `kind` body).
// Subject-agnostic: all content comes from the JSON body. UI lives in
// components/games/.

/** Cum umple imaginea caseta cartonașului:
 *  - lipsă   → casetă joasă, imaginea decupată ca să umple (`object-cover`);
 *  - contain → casetă înaltă, imaginea se vede întreagă, cu spațiu în jur;
 *  - natural → caseta are exact dimensiunea imaginii (fără chenar gol, fără
 *    etichetă dedesubt). Cere imagini cu același raport lățime/înălțime. */
export type ImageFit = "contain" | "natural";
export type GameSide = { text?: string; img?: number; label?: string };
export type MatchPair = { left: GameSide; right: GameSide; group: string };
export type MatchRound = { title?: string; pairs: MatchPair[]; layout?: "rows" };
export type OrderCard = { label: string; img?: number; order: number };
export type OrderRound = { title: string; startLabel?: string; endLabel?: string; cards: OrderCard[] };
/** `caption` (opțional): textul arătat SUB imaginea de plasat, în modul
 *  „reveal”. E separat de `label` fiindcă eticheta conține și răspunsul
 *  (ex. „Laterit — pădurea ecuatorială”), iar sub imagine vrem doar numele
 *  obiectului de plasat (ex. „Laterit”). */
export type MapTarget = { id: string; x: number; y: number; label: string; img?: number; caption?: string };
export type MapPoint = { n: number; x: number; y: number; name: string };
export type MatrixCell = { text: string; given?: boolean }; // text = conținutul corect al celulei
export type MatrixVariant = { rows: MatrixCell[][] };        // grilă dreptunghiulară
/** `why` (opțional): explicația arătată după ce elevul alege varianta cu acel
 *  indice — de ce e greșită, sau de ce e cea bună. Aliniată la `options`
 *  (aceeași lungime); un text gol înseamnă „fără explicație aici". */
export type GrilaQuestion = { img?: number; text?: string; hint?: string; options: string[]; answer: number; why?: string[] };
export type GrilaRound = { title?: string; questions: GrilaQuestion[] };
export type SortBucket = { label: string };
export type SortCard = { img?: number; text?: string; bucket: number };
export type SortRound = { title?: string; cards: SortCard[] };

export type GameBody =
	| { kind: "asociere"; rounds: MatchRound[]; imageFit?: ImageFit; layout?: "rows" }
	| { kind: "plaseaza-pe-harta"; map: number; targets: MapTarget[]; reveal?: "below"; rounds?: string[][] }
	| { kind: "ordonare"; rounds: OrderRound[]; imageFit?: ImageFit }
	| { kind: "harta-quiz"; map: number; maps?: number[]; points: MapPoint[]; draw?: number; rounds?: number[][] }
	| { kind: "matrice"; variants: MatrixVariant[] }
	| { kind: "grila"; rounds: GrilaRound[] }
	| { kind: "sortare"; buckets: SortBucket[]; rounds: SortRound[] };

const KINDS = new Set(["asociere", "plaseaza-pe-harta", "ordonare", "harta-quiz", "matrice", "grila", "sortare"]);

/** Validated game body, or null for legacy quiz bodies (no `kind`) and any
 *  malformed payload — callers fall back instead of crashing. */
export function parseGameBody(raw: string): GameBody | null {
	let data: unknown;
	try {
		data = JSON.parse(raw);
	} catch {
		return null;
	}
	if (!data || typeof data !== "object") return null;
	const b = data as Record<string, unknown>;
	if (typeof b.kind !== "string" || !KINDS.has(b.kind)) return null;
	if (b.kind === "asociere" || b.kind === "ordonare") {
		if (!Array.isArray(b.rounds) || b.rounds.length === 0) return null;
		// `imageFit` (optional): "contain" arată imaginea întreagă într-o casetă
		// mai înaltă, "natural" face caseta cât imaginea; orice altceva se aruncă.
		if ("imageFit" in b && b.imageFit !== "contain" && b.imageFit !== "natural") delete b.imageFit;
		// `layout: "rows"` (optional, asociere) pune o parte pe un rând și
		// cealaltă pe rândul de dedesubt, în loc de două coloane.
		if ("layout" in b && b.layout !== "rows") delete b.layout;
		// Aceeași opțiune se poate pune și pe o rundă anume (are prioritate față
		// de cea a jocului), ca o rundă cu imagini să stea pe rânduri, iar
		// rundele numai-text să rămână pe două coloane.
		for (const r of b.rounds) {
			if (r && typeof r === "object" && "layout" in r && (r as { layout?: unknown }).layout !== "rows")
				delete (r as Record<string, unknown>).layout;
		}
	} else if (b.kind === "matrice") {
		if (!Array.isArray(b.variants) || b.variants.length === 0) return null;
		for (const v of b.variants) {
			if (!v || typeof v !== "object") return null;
			const rows = (v as { rows?: unknown }).rows;
			if (!Array.isArray(rows) || rows.length === 0) return null;
			const first = rows[0];
			if (!Array.isArray(first) || first.length === 0) return null;
			const cols = first.length;
			for (const row of rows) {
				if (!Array.isArray(row) || row.length !== cols) return null;
				for (const cell of row) {
					if (!cell || typeof cell !== "object") return null;
					const text = (cell as { text?: unknown }).text;
					if (typeof text !== "string" || !text.trim()) return null;
				}
			}
		}
	} else if (b.kind === "grila") {
		if (!Array.isArray(b.rounds) || b.rounds.length === 0) return null;
		for (const r of b.rounds) {
			if (!r || typeof r !== "object") return null;
			const questions = (r as { questions?: unknown }).questions;
			if (!Array.isArray(questions) || questions.length === 0) return null;
			for (const q of questions) {
				if (!q || typeof q !== "object") return null;
				const qq = q as { img?: unknown; text?: unknown; hint?: unknown; options?: unknown; answer?: unknown };
				// `hint` (optional) e un indiciu scurt arătat sub imagine; orice altceva se aruncă.
				if ("hint" in qq && typeof qq.hint !== "string") delete (q as Record<string, unknown>).hint;
				// `why` (optional) e explicația pe fiecare variantă; o păstrăm doar dacă
				// e o listă de texte cât variantele — altfel s-ar alinia greșit.
				if ("why" in qq) {
					const w = qq.why;
					const ok =
						Array.isArray(w) &&
						Array.isArray(qq.options) &&
						w.length === qq.options.length &&
						w.every((x) => typeof x === "string");
					if (!ok) delete (q as Record<string, unknown>).why;
				}
				const hasImg = typeof qq.img === "number";
				const hasText = typeof qq.text === "string";
				if (!hasImg && !hasText) return null;
				if (!Array.isArray(qq.options) || qq.options.length < 2 || qq.options.some((o) => typeof o !== "string")) return null;
				if (typeof qq.answer !== "number" || !Number.isInteger(qq.answer) || qq.answer < 0 || qq.answer >= qq.options.length) return null;
			}
		}
	} else if (b.kind === "sortare") {
		// Fiecare card merge într-un „coș” (categorie). Minimum două coșuri, altfel
		// nu e o sortare; fiecare card are text sau imagine și un coș care există.
		if (!Array.isArray(b.buckets) || b.buckets.length < 2) return null;
		for (const bucket of b.buckets) {
			if (!bucket || typeof bucket !== "object") return null;
			const label = (bucket as { label?: unknown }).label;
			if (typeof label !== "string" || !label.trim()) return null;
		}
		if (!Array.isArray(b.rounds) || b.rounds.length === 0) return null;
		for (const r of b.rounds) {
			if (!r || typeof r !== "object") return null;
			const cards = (r as { cards?: unknown }).cards;
			if (!Array.isArray(cards) || cards.length === 0) return null;
			for (const c of cards) {
				if (!c || typeof c !== "object") return null;
				const cc = c as { img?: unknown; text?: unknown; bucket?: unknown };
				if (typeof cc.img !== "number" && typeof cc.text !== "string") return null;
				if (typeof cc.bucket !== "number" || !Number.isInteger(cc.bucket)) return null;
				if (cc.bucket < 0 || cc.bucket >= b.buckets.length) return null;
			}
		}
	} else {
		if (typeof b.map !== "number") return null;
		const list = b.kind === "harta-quiz" ? b.points : b.targets;
		if (!Array.isArray(list) || list.length === 0) return null;
		// `rounds` (optional, harta-quiz) lists the point `n`s of each authored
		// round, e.g. [[1,4,7],[2,5,8]] — a point may return in several rounds.
		// It wins over `draw`; drop it whole unless it is a non-empty array of
		// non-empty integer arrays.
		if (b.kind === "harta-quiz" && "rounds" in b) {
			const ok =
				Array.isArray(b.rounds) &&
				b.rounds.length > 0 &&
				b.rounds.every((r) => Array.isArray(r) && r.length > 0 && r.every((n) => typeof n === "number" && Number.isInteger(n)));
			if (!ok) delete b.rounds;
		}
		// `maps` (optional, harta-quiz) dă fiecărei runde harta ei de bază:
		// `maps[i]` e indexul assetului pentru runda `i`, iar unde lipsește se
		// cade pe `map`. Așa o rundă poate întreba „ce fluviu străbate câmpia
		// asta?" pe harta câmpiilor, iar următoarea invers, pe harta fluviilor.
		// Se aruncă întreg dacă nu e o listă de indecși întregi nenegativi.
		if (b.kind === "harta-quiz" && "maps" in b) {
			const ok =
				Array.isArray(b.maps) &&
				b.maps.length > 0 &&
				b.maps.every((m) => typeof m === "number" && Number.isInteger(m) && m >= 0);
			if (!ok) delete b.maps;
		}
		// `draw` is optional on harta-quiz; ignore anything that isn't a
		// positive integer so a malformed value can't reach the engine.
		if (b.kind === "harta-quiz" && "draw" in b) {
			if (!(typeof b.draw === "number" && Number.isInteger(b.draw) && b.draw > 0)) {
				delete b.draw;
			}
		}
		// `reveal: "below"` (optional, plaseaza-pe-harta) shows the selected label
		// enlarged under the map instead of as an on-map thumbnail; drop bad values.
		if (b.kind === "plaseaza-pe-harta" && "reveal" in b && b.reveal !== "below") {
			delete b.reveal;
		}
		// `rounds` (optional, plaseaza-pe-harta) împarte țintele în runde jucate
		// una după alta, listând `id`-urile fiecărei runde — ex. [["sahara"],
		// ["taiga"]]. Fără el, toate țintele se joacă deodată. Se aruncă întreg
		// dacă nu e o listă nevidă de liste nevide de șiruri.
		if (b.kind === "plaseaza-pe-harta" && "rounds" in b) {
			const ok =
				Array.isArray(b.rounds) &&
				b.rounds.length > 0 &&
				b.rounds.every((r) => Array.isArray(r) && r.length > 0 && r.every((id) => typeof id === "string" && id !== ""));
			if (!ok) delete b.rounds;
		}
	}
	return data as GameBody;
}

/** Fisher–Yates pe o copie; inputul rămâne neatins. */
export function shuffle<T>(arr: T[]): T[] {
	const out = [...arr];
	for (let i = out.length - 1; i > 0; i--) {
		const j = Math.floor(Math.random() * (i + 1));
		[out[i], out[j]] = [out[j], out[i]];
	}
	return out;
}

/** Fisher–Yates determinist (mulberry32): același `seed` ⇒ aceeași ordine.
 *  Motoarele îl folosesc ca SSR și clientul să producă identic prima
 *  redare (fără `Math.random` la render ⇒ fără hydration mismatch);
 *  „Joacă din nou" schimbă seed-ul ca să re-amestece. */
export function shuffleSeeded<T>(arr: T[], seed: number): T[] {
	const out = [...arr];
	let s = seed >>> 0;
	const rand = () => {
		s = (s + 0x6d2b79f5) | 0;
		let t = Math.imul(s ^ (s >>> 15), 1 | s);
		t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
		return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
	};
	for (let i = out.length - 1; i > 0; i--) {
		const j = Math.floor(rand() * (i + 1));
		[out[i], out[j]] = [out[j], out[i]];
	}
	return out;
}

/** Împarte o listă (deja ordonată — de regulă rezultatul unui shuffle
 *  seedat) în runde consecutive de mărime `size`. Ultima rundă păstrează tot
 *  ce rămâne (poate fi mai mică decât `size`, dar niciodată goală dacă
 *  `items` e nevidă). `size` lipsă/invalid/≥ lungimea listei ⇒ o singură
 *  rundă cu toate elementele — comportamentul „harta-quiz" fără `draw`. */
export function chunkPoints<T>(items: T[], size: number | undefined): T[][] {
	if (items.length === 0) return [];
	const valid = typeof size === "number" && Number.isInteger(size) && size > 0;
	if (!valid || size >= items.length) return [items];
	const chunks: T[][] = [];
	for (let i = 0; i < items.length; i += size) chunks.push(items.slice(i, i + size));
	return chunks;
}

/** Reașază `other` (o permutare a acelorași indici ca `base`) astfel încât
 *  niciun element să nu rămână pe aceeași poziție ca în `base`. La jocurile de
 *  asociere asta garantează că răspunsul corect nu ajunge niciodată exact în
 *  dreptul / dedesubtul perechii lui — altfel elevul îl ghicește din poziție.
 *  Cu un singur element nu există derajament; lista se întoarce neschimbată. */
export function derangeAgainst(base: number[], other: number[]): number[] {
	const out = [...other];
	for (let i = 0; i < out.length; i++) {
		if (out[i] !== base[i]) continue;
		// Schimbăm cu prima poziție j care nu recreează o coincidență: după swap
		// out[j] devine base[i] (≠ base[j], indicii fiind unici), iar out[i]
		// devine vechiul out[j] — deci e destul ca acela să nu fie base[i].
		const j = out.findIndex((v, k) => k !== i && v !== base[i]);
		if (j === -1) continue;
		[out[i], out[j]] = [out[j], out[i]];
	}
	return out;
}

/** Rundele unui „harta-quiz": fie cele scrise în conținut (`rounds`, liste de
 *  `n`-uri — un punct poate reveni în mai multe runde), fie, în lipsa lor,
 *  bucăți consecutive de `draw` din lista amestecată. Componența unei runde
 *  autorate rămâne fixă; doar ordinea din interiorul ei se reamestecă la alt
 *  `seed` („Joacă din nou"). `n`-urile necunoscute sunt ignorate. */
export function quizRounds(points: MapPoint[], rounds: number[][] | undefined, draw: number | undefined, seed: number): MapPoint[][] {
	if (rounds && rounds.length > 0) {
		const byN = new Map(points.map((p) => [p.n, p]));
		return rounds
			.map((ns, i) => shuffleSeeded(ns.map((n) => byN.get(n)).filter((p): p is MapPoint => p !== undefined), seed + i))
			.filter((r) => r.length > 0);
	}
	return chunkPoints(shuffleSeeded(points, seed), draw);
}

/** Rundele unui „plaseaza-pe-harta": listele de `id`-uri scrise în conținut,
 *  păstrate în ordinea autorată și curățate de țintele care nu există.
 *  Fără `rounds` — sau dacă nicio rundă nu supraviețuiește curățării — toate
 *  țintele se joacă într-o singură rundă, ca înainte. */
export function placeRounds(targets: MapTarget[], rounds: string[][] | undefined): MapTarget[][] {
	if (!rounds || rounds.length === 0) return [targets];
	const byId = new Map(targets.map((t) => [t.id, t]));
	const out = rounds
		.map((ids) => ids.map((id) => byId.get(id)).filter((t): t is MapTarget => t !== undefined))
		.filter((r) => r.length > 0);
	return out.length > 0 ? out : [targets];
}

/** Renumerotează bulinele unei runde 1..N, în ordinea primită (stabilă).
 *  Numărul afișat pe bulină e locul ei în rundă, nu `n`-ul original din
 *  JSON — altfel rundele ar arăta numere discontinue (ex. 4, 19, 31). */
export function renumberPoints(points: MapPoint[]): MapPoint[] {
	return points.map((p, i) => ({ ...p, n: i + 1 }));
}

/** Alege determinist indexul variantei pentru un seed dat.
 *  `seed` diferit ⇒ posibil altă variantă („Joacă din nou"). */
export function pickMatrixVariant(variants: MatrixVariant[], seed: number): number {
	return (((seed % variants.length) + variants.length) % variants.length) | 0;
}

/** Banca de cuvinte = textele celulelor NEfixate, amestecate determinist.
 *  Duplicatele sunt permise intenționat (nu se elimină). */
export function matrixBank(variant: MatrixVariant, seed: number): string[] {
	const blanks: string[] = [];
	for (const row of variant.rows) for (const cell of row) if (!cell.given) blanks.push(cell.text);
	return shuffleSeeded(blanks, seed);
}

export type GameAsset = { id: string; idx: number };

/** URL-ul streamabil pentru un asset referit prin idx în body, sau null. */
export function assetSrc(assets: GameAsset[], idx: number | undefined): string | null {
	if (idx === undefined) return null;
	const a = assets.find((x) => x.idx === idx);
	return a ? `/media/${a.id}` : null;
}
