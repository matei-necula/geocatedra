import type { GameBody, GrilaRound, ImageFit, MatchRound, OrderRound } from "./games";

// Shared contract types
export type Img<T> = { t: T } | null;

export type MatchSideState<T> = { text?: string; label?: string; img: Img<T> };
export type MatchPairState<T> = { left: MatchSideState<T>; right: MatchSideState<T>; group: string };
export type MatchState<T> = { kind: "asociere"; rounds: { title?: string; pairs: MatchPairState<T>[]; layout?: "rows" }[]; imageFit?: ImageFit; layout?: "rows" };

export type OrderCardState<T> = { label: string; img: Img<T> };
export type OrderState<T> = { kind: "ordonare"; rounds: { title: string; startLabel?: string; endLabel?: string; cards: OrderCardState<T>[] }[]; imageFit?: ImageFit };

export type PlaceTargetState<T> = { id: string; x: number; y: number; label: string; img: Img<T> };
export type PlaceState<T> = { kind: "plaseaza-pe-harta"; map: Img<T>; targets: PlaceTargetState<T>[]; reveal?: "below" };

export type MapQuizPointState = { id?: string; x: number; y: number; name: string };
// `maps` (hărți per rundă) nu se poate încă AUTORA din interfață — se scrie din
// content/games. Îl purtăm totuși prin stare ca `Img<T>[]`, nu ca indecși bruți,
// ca o salvare din admin să nu-l piardă și ca renumerotarea assetelor să-l ducă
// la assetul corect, nu la un index rămas din altă ordine.
export type MapQuizState<T> = { kind: "harta-quiz"; map: Img<T>; maps?: Img<T>[]; points: MapQuizPointState[]; draw?: number; rounds?: number[][] };

// Matrice: fără imagini, deci starea nu depinde de T.
export type MatrixCellState = { text: string; given: boolean };
export type MatrixVariantState = { rows: MatrixCellState[][] };
export type MatrixState = { kind: "matrice"; variants: MatrixVariantState[] };

export type GrilaQuestionState<T> = { img: Img<T>; text: string; hint?: string; options: string[]; answer: number; why?: string[] };
export type GrilaRoundState<T> = { title?: string; questions: GrilaQuestionState<T>[] };
export type GrilaState<T> = { kind: "grila"; rounds: GrilaRoundState<T>[] };

export type SortCardState<T> = { img: Img<T>; text: string; bucket: number };
export type SortRoundState<T> = { title?: string; cards: SortCardState<T>[] };
export type SortareState<T> = { kind: "sortare"; buckets: { label: string }[]; rounds: SortRoundState<T>[] };

export type GameEditorState<T> = MatchState<T> | OrderState<T> | PlaceState<T> | MapQuizState<T> | MatrixState | GrilaState<T> | SortareState<T>;

// One entry per image that has content, in deterministic traversal order.
export type PlanSlot<T> = { idx: number; image: T };

export type Compiled<T> = { body: GameBody; plan: PlanSlot<T>[] };

class IdxAllocator<T> {
  readonly plan: PlanSlot<T>[] = [];
  take(img: Img<T>): number | undefined {
    if (!img) return undefined;
    const idx = this.plan.length;
    this.plan.push({ idx, image: img.t });
    return idx;
  }
}

// omit an image field entirely when undefined, matching parseGameBody expectations
function side<T>(s: MatchSideState<T>, a: IdxAllocator<T>) {
  const img = a.take(s.img);
  return { ...(s.text !== undefined ? { text: s.text } : {}), ...(s.label !== undefined ? { label: s.label } : {}), ...(img !== undefined ? { img } : {}) };
}

export function compileGame<T>(state: GameEditorState<T>): Compiled<T> {
  const a = new IdxAllocator<T>();
  let body: GameBody;
  switch (state.kind) {
    case "asociere":
      body = { kind: "asociere", rounds: state.rounds.map((r) => ({
        ...(r.title !== undefined ? { title: r.title } : {}),
        pairs: r.pairs.map((p) => ({ left: side(p.left, a), right: side(p.right, a), group: p.group })),
        ...(r.layout !== undefined ? { layout: r.layout } : {}),
      })) as MatchRound[], ...(state.imageFit !== undefined ? { imageFit: state.imageFit } : {}), ...(state.layout !== undefined ? { layout: state.layout } : {}) };
      break;
    case "ordonare":
      body = { kind: "ordonare", rounds: state.rounds.map((r) => ({
        title: r.title,
        ...(r.startLabel !== undefined ? { startLabel: r.startLabel } : {}),
        ...(r.endLabel !== undefined ? { endLabel: r.endLabel } : {}),
        cards: r.cards.map((c, i) => { const img = a.take(c.img); return { label: c.label, order: i + 1, ...(img !== undefined ? { img } : {}) }; }),
      })) as OrderRound[], ...(state.imageFit !== undefined ? { imageFit: state.imageFit } : {}) };
      break;
    case "plaseaza-pe-harta": {
      const map = a.take(state.map);
      body = { kind: "plaseaza-pe-harta", map: map ?? -1, targets: state.targets.map((t) => {
        const img = a.take(t.img);
        return { id: t.id, x: t.x, y: t.y, label: t.label, ...(img !== undefined ? { img } : {}) };
      }), ...(state.reveal !== undefined ? { reveal: state.reveal } : {}) };
      break;
    }
    case "harta-quiz": {
      const map = a.take(state.map);
      const maps = state.maps?.map((m) => a.take(m)).filter((m): m is number => m !== undefined);
      body = {
        kind: "harta-quiz",
        map: map ?? -1,
        ...(maps !== undefined && maps.length > 0 ? { maps } : {}),
        points: state.points.map((p, i) => ({ n: i + 1, x: p.x, y: p.y, name: p.name })),
        ...(state.draw !== undefined ? { draw: state.draw } : {}),
        ...(state.rounds !== undefined ? { rounds: state.rounds } : {}),
      };
      break;
    }
    case "matrice":
      // fără imagini: plan rămâne gol. `given` se emite doar când e true.
      body = { kind: "matrice", variants: state.variants.map((v) => ({
        rows: v.rows.map((row) => row.map((c) => ({ text: c.text, ...(c.given ? { given: true } : {}) }))),
      })) };
      break;
    case "grila":
      body = { kind: "grila", rounds: state.rounds.map((r) => ({
        ...(r.title !== undefined ? { title: r.title } : {}),
        questions: r.questions.map((q) => {
          const img = a.take(q.img);
          return {
            ...(img !== undefined ? { img } : {}),
            ...(q.text.trim() ? { text: q.text } : {}),
            ...(q.hint?.trim() ? { hint: q.hint } : {}),
            options: q.options,
            answer: q.answer,
            // Explicațiile se emit doar dacă măcar una are conținut, aliniate
            // la variante (câmpurile lăsate goale rămân goale).
            ...(q.why?.some((w) => w.trim())
              ? { why: q.options.map((_, i) => (q.why?.[i]?.trim() ? (q.why[i] as string) : "")) }
              : {}),
          };
        }),
      })) as GrilaRound[] };
      break;
    case "sortare":
      body = { kind: "sortare", buckets: state.buckets.map((x) => ({ label: x.label })), rounds: state.rounds.map((r) => ({
        ...(r.title !== undefined ? { title: r.title } : {}),
        cards: r.cards.map((c) => {
          const img = a.take(c.img);
          return {
            ...(img !== undefined ? { img } : {}),
            ...(c.text.trim() ? { text: c.text } : {}),
            bucket: c.bucket,
          };
        }),
      })) };
      break;
    default:
      throw new Error(`compileGame: kind necunoscut`);
  }
  return { body, plan: a.plan };
}

function hasContent(s: { text?: string; label?: string; img?: number }): boolean {
  return Boolean((s.text && s.text.trim()) || (s.label && s.label.trim()) || s.img !== undefined);
}

export function validateGame(body: GameBody): string[] {
  const e: string[] = [];
  if (body.kind === "matrice") {
    if (body.variants.length === 0) e.push("Adaugă cel puțin o variantă.");
    body.variants.forEach((v, vi) => {
      const cols = v.rows[0]?.length ?? 0;
      if (v.rows.length === 0 || cols === 0) {
        e.push(`Varianta ${vi + 1}: adaugă rânduri și coloane.`);
        return;
      }
      let blanks = 0;
      v.rows.forEach((row, ri) => {
        if (row.length !== cols) e.push(`Varianta ${vi + 1}, rândul ${ri + 1}: are alt număr de coloane.`);
        row.forEach((c, ci) => {
          if (!c.text.trim()) e.push(`Varianta ${vi + 1}, rândul ${ri + 1}, coloana ${ci + 1}: completează textul.`);
          if (!c.given) blanks++;
        });
      });
      if (blanks < 1) e.push(`Varianta ${vi + 1}: lasă cel puțin o celulă de completat (nefixată).`);
    });
    return e;
  }
  if (body.kind === "asociere" || body.kind === "ordonare") {
    body.rounds.forEach((r, ri) => {
      const list = body.kind === "asociere" ? (r as MatchRound).pairs : (r as OrderRound).cards;
      const min = 2;
      if (list.length < min) e.push(`Runda ${ri + 1}: adaugă cel puțin ${min} ${body.kind === "asociere" ? "perechi" : "carduri"}.`);
      if (body.kind === "asociere") (r as MatchRound).pairs.forEach((p, pi) => {
        if (!p.group.trim()) e.push(`Runda ${ri + 1}, perechea ${pi + 1}: alege un grup.`);
        if (!hasContent(p.left)) e.push(`Runda ${ri + 1}, perechea ${pi + 1}: completează partea stângă.`);
        if (!hasContent(p.right)) e.push(`Runda ${ri + 1}, perechea ${pi + 1}: completează partea dreaptă.`);
      });
      if (body.kind === "ordonare") (r as OrderRound).cards.forEach((c, ci) => {
        if (!c.label.trim() && c.img === undefined) e.push(`Runda ${ri + 1}, cardul ${ci + 1}: adaugă text sau imagine.`);
      });
    });
  } else if (body.kind === "grila") {
    if (body.rounds.length === 0) e.push("Adaugă cel puțin o rundă.");
    body.rounds.forEach((r, ri) => {
      if (r.questions.length === 0) {
        e.push(`Runda ${ri + 1}: adaugă cel puțin o întrebare.`);
        return;
      }
      r.questions.forEach((q, qi) => {
        const hasText = typeof q.text === "string" && q.text.trim() !== "";
        const hasImg = q.img !== undefined;
        if (!hasImg && !hasText) e.push(`Runda ${ri + 1}, întrebarea ${qi + 1}: adaugă o imagine sau un text.`);
        if (q.options.length < 2) e.push(`Runda ${ri + 1}, întrebarea ${qi + 1}: adaugă cel puțin 2 variante.`);
        if (q.options.some((o) => !o.trim())) e.push(`Runda ${ri + 1}, întrebarea ${qi + 1}: completează toate variantele.`);
        if (!(Number.isInteger(q.answer) && q.answer >= 0 && q.answer < q.options.length)) {
          e.push(`Runda ${ri + 1}, întrebarea ${qi + 1}: alege răspunsul corect.`);
        }
      });
    });
  } else if (body.kind === "sortare") {
    if (body.buckets.length < 2) e.push("Adaugă cel puțin două categorii.");
    body.buckets.forEach((b, bi) => {
      if (!b.label.trim()) e.push(`Categoria ${bi + 1}: adaugă o etichetă.`);
    });
    if (body.rounds.length === 0) e.push("Adaugă cel puțin o rundă.");
    body.rounds.forEach((r, ri) => {
      if (r.cards.length === 0) {
        e.push(`Runda ${ri + 1}: adaugă cel puțin un cartonaș.`);
        return;
      }
      r.cards.forEach((c, ci) => {
        const hasText = typeof c.text === "string" && c.text.trim() !== "";
        if (c.img === undefined && !hasText) e.push(`Runda ${ri + 1}, cartonașul ${ci + 1}: adaugă text sau imagine.`);
        if (!(Number.isInteger(c.bucket) && c.bucket >= 0 && c.bucket < body.buckets.length)) {
          e.push(`Runda ${ri + 1}, cartonașul ${ci + 1}: alege o categorie.`);
        }
      });
    });
    // O categorie fără niciun cartonaș face jocul derutant: elevul o vede, dar
    // nu o poate folosi niciodată.
    const used = new Set(body.rounds.flatMap((r) => r.cards.map((c) => c.bucket)));
    body.buckets.forEach((b, bi) => {
      if (b.label.trim() && !used.has(bi)) e.push(`Categoria „${b.label.trim()}”: nu are niciun cartonaș.`);
    });
  } else {
    if (body.map < 0) e.push("Încarcă o imagine de hartă.");
    if (body.kind === "plaseaza-pe-harta") {
      if (body.targets.length < 1) e.push("Adaugă cel puțin o țintă pe hartă.");
      body.targets.forEach((t, i) => { if (!t.label.trim()) e.push(`Ținta ${i + 1}: adaugă o etichetă.`); });
    } else {
      if (body.points.length < 1) e.push("Adaugă cel puțin un punct pe hartă.");
      body.points.forEach((p, i) => { if (!p.name.trim()) e.push(`Punctul ${i + 1}: adaugă un nume.`); });
      // `draw` (câte puncte pe rundă) is optional; if set it must be a whole
      // number ≥ 2. A value larger than the point count is not an error — the
      // engine clamps it to all points at use site.
      if (body.draw !== undefined && !(Number.isInteger(body.draw) && body.draw >= 2)) {
        e.push("Câte puncte pe rundă: pune un număr întreg de cel puțin 2 (sau lasă gol pentru toate).");
      }
      // Rundele autorate trimit la puncte prin `n`. Dacă punctele s-au
      // rearanjat/șters în editor, un `n` poate rămâne în gol — mai bine
      // oprim publicarea decât să dispară buline din joc pe tăcute.
      if (body.rounds) {
        const max = body.points.length;
        body.rounds.forEach((r, ri) => {
          const bad = r.filter((n) => n < 1 || n > max);
          if (bad.length) e.push(`Runda ${ri + 1}: trimite la puncte care nu există (${bad.join(", ")}).`);
        });
      }
    }
  }
  return e;
}

export function bodyToEditor<T>(body: GameBody, imageFor: (idx: number) => T): GameEditorState<T> {
  const img = (idx: number | undefined): Img<T> => (idx === undefined || idx < 0 ? null : { t: imageFor(idx) });
  switch (body.kind) {
    case "asociere":
      return { kind: "asociere", rounds: body.rounds.map((r) => ({ title: r.title, pairs: r.pairs.map((p) => ({
        left: { text: p.left.text, label: p.left.label, img: img(p.left.img) },
        right: { text: p.right.text, label: p.right.label, img: img(p.right.img) },
        group: p.group,
      })), ...(r.layout !== undefined ? { layout: r.layout } : {}) })), ...(body.imageFit !== undefined ? { imageFit: body.imageFit } : {}), ...(body.layout !== undefined ? { layout: body.layout } : {}) };
    case "ordonare":
      return { kind: "ordonare", rounds: body.rounds.map((r) => ({ title: r.title, startLabel: r.startLabel, endLabel: r.endLabel,
        cards: r.cards.map((c) => ({ label: c.label, img: img(c.img) })) })), ...(body.imageFit !== undefined ? { imageFit: body.imageFit } : {}) };
    case "plaseaza-pe-harta":
      return { kind: "plaseaza-pe-harta", map: img(body.map), targets: body.targets.map((t) => ({ id: t.id, x: t.x, y: t.y, label: t.label, img: img(t.img) })), ...(body.reveal !== undefined ? { reveal: body.reveal } : {}) };
    case "harta-quiz":
      return {
        kind: "harta-quiz",
        map: img(body.map),
        ...(body.maps !== undefined ? { maps: body.maps.map((m) => img(m)) } : {}),
        points: body.points.map((p) => ({ x: p.x, y: p.y, name: p.name })),
        ...(body.draw !== undefined ? { draw: body.draw } : {}),
        ...(body.rounds !== undefined ? { rounds: body.rounds } : {}),
      };
    case "matrice":
      return { kind: "matrice", variants: body.variants.map((v) => ({
        rows: v.rows.map((row) => row.map((c) => ({ text: c.text, given: c.given ?? false }))),
      })) };
    case "grila":
      return { kind: "grila", rounds: body.rounds.map((r) => ({
        title: r.title,
        questions: r.questions.map((q) => ({
          img: img(q.img),
          text: q.text ?? "",
          hint: q.hint ?? "",
          options: q.options,
          answer: q.answer,
          why: q.options.map((_, i) => q.why?.[i] ?? ""),
        })),
      })) };
    case "sortare":
      return { kind: "sortare", buckets: body.buckets.map((b) => ({ label: b.label })), rounds: body.rounds.map((r) => ({
        title: r.title,
        cards: r.cards.map((c) => ({ img: img(c.img), text: c.text ?? "", bucket: c.bucket })),
      })) };
  }
}
