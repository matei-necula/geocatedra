import { describe, expect, it } from "vitest";
import { compileGame, validateGame, bodyToEditor, type MatchState, type OrderState, type PlaceState, type MapQuizState, type MatrixState, type GrilaState, type SortareState } from "./game-editor";
import type { GameBody } from "./games";

describe("compileGame asociere", () => {
  it("builds rounds and assigns idx per image in traversal order", () => {
    const state: MatchState<string> = {
      kind: "asociere",
      rounds: [{ title: "R1", pairs: [
        { left: { text: "A", img: { t: "imgA" } }, right: { text: "1", img: null }, group: "g0" },
        { left: { text: "B", img: null }, right: { text: "2", img: { t: "imgB" } }, group: "g1" },
      ] }],
    };
    const { body, plan } = compileGame(state);
    expect(body).toEqual({
      kind: "asociere",
      rounds: [{ title: "R1", pairs: [
        { left: { text: "A", img: 0 }, right: { text: "1" }, group: "g0" },
        { left: { text: "B" }, right: { text: "2", img: 1 }, group: "g1" },
      ] }],
    });
    expect(plan).toEqual([{ idx: 0, image: "imgA" }, { idx: 1, image: "imgB" }]);
  });
});

describe("compileGame ordonare", () => {
  it("derives order from array position (1-based)", () => {
    const state: OrderState<string> = {
      kind: "ordonare",
      rounds: [{ title: "R", startLabel: "s", endLabel: "e", cards: [
        { label: "first", img: null }, { label: "second", img: { t: "i" } },
      ] }],
    };
    const { body, plan } = compileGame(state);
    expect(body).toEqual({
      kind: "ordonare",
      rounds: [{ title: "R", startLabel: "s", endLabel: "e", cards: [
        { label: "first", order: 1 }, { label: "second", order: 2, img: 0 },
      ] }],
    });
    expect(plan).toEqual([{ idx: 0, image: "i" }]);
  });
});

describe("compileGame plaseaza-pe-harta", () => {
  it("map is idx 0, targets keep id/x/y/label and optional img", () => {
    const state: PlaceState<string> = {
      kind: "plaseaza-pe-harta",
      map: { t: "worldmap" },
      targets: [
        { id: "t1", x: 10.5, y: 20, label: "Amazon", img: { t: "climo1" } },
        { id: "t2", x: 30, y: 40, label: "Sahara", img: null },
      ],
    };
    const { body, plan } = compileGame(state);
    expect(body).toEqual({
      kind: "plaseaza-pe-harta",
      map: 0,
      targets: [
        { id: "t1", x: 10.5, y: 20, label: "Amazon", img: 1 },
        { id: "t2", x: 30, y: 40, label: "Sahara" },
      ],
    });
    expect(plan).toEqual([{ idx: 0, image: "worldmap" }, { idx: 1, image: "climo1" }]);
  });
});

describe("compileGame harta-quiz", () => {
  it("map idx 0, points get n from position", () => {
    const state: MapQuizState<string> = {
      kind: "harta-quiz",
      map: { t: "rivers" },
      points: [ { x: 1, y: 2, name: "Nil" }, { x: 3, y: 4, name: "Congo" } ],
    };
    const { body } = compileGame(state);
    expect(body).toEqual({
      kind: "harta-quiz", map: 0,
      points: [ { n: 1, x: 1, y: 2, name: "Nil" }, { n: 2, x: 3, y: 4, name: "Congo" } ],
    });
  });
});

describe("validateGame", () => {
  it("flags too-few pairs and empty group", () => {
    const body: GameBody = { kind: "asociere", rounds: [{ pairs: [{ left: { text: "a" }, right: { text: "b" }, group: "" }] }] };
    expect(validateGame(body)).toEqual([
      "Runda 1: adaugă cel puțin 2 perechi.",
      "Runda 1, perechea 1: alege un grup.",
    ]);
  });
  it("passes a valid ordonare", () => {
    const body: GameBody = { kind: "ordonare", rounds: [{ title: "R", cards: [ { label: "a", order: 1 }, { label: "b", order: 2 } ] }] };
    expect(validateGame(body)).toEqual([]);
  });
  it("passes an ordonare card with an empty label as long as it has an image", () => {
    const body: GameBody = { kind: "ordonare", rounds: [{ title: "R", cards: [ { label: "", img: 0, order: 1 }, { label: "", img: 1, order: 2 } ] }] };
    expect(validateGame(body)).toEqual([]);
  });
  it("flags an ordonare card with neither label nor image", () => {
    const body: GameBody = { kind: "ordonare", rounds: [{ title: "R", cards: [ { label: "", order: 1 }, { label: "b", order: 2 } ] }] };
    expect(validateGame(body)).toEqual(["Runda 1, cardul 1: adaugă text sau imagine."]);
  });
  it("requires a map image and named points", () => {
    const body = { kind: "harta-quiz", map: 0, points: [{ n: 1, x: 1, y: 2, name: "" }] } as GameBody;
    // map idx 0 exists only if an image occupies it; here we simulate missing map via a sentinel:
    expect(validateGame({ ...body, map: -1 } as GameBody)).toContain("Încarcă o imagine de hartă.");
    expect(validateGame(body)).toContain("Punctul 1: adaugă un nume.");
  });
});

describe("bodyToEditor round-trips", () => {
  it("asociere compile→body→editor→compile is stable", () => {
    const body: GameBody = { kind: "asociere", rounds: [{ title: "R1", pairs: [
      { left: { text: "A", img: 0 }, right: { text: "1" }, group: "g0" },
    ] }] };
    const state = bodyToEditor<string>(body, (idx) => `asset${idx}`);
    expect(compileGame(state).body).toEqual(body);
  });
  it("asociere round-trip preserves imageFit:\"contain\"", () => {
    const body: GameBody = { kind: "asociere", imageFit: "contain", rounds: [{ title: "R1", pairs: [
      { left: { img: 0 }, right: { text: "1" }, group: "g0" },
    ] }] };
    const state = bodyToEditor<string>(body, (idx) => `asset${idx}`);
    expect((state as MatchState<string>).imageFit).toBe("contain");
    expect(compileGame(state).body).toEqual(body);
  });
  it("ordonare round-trip preserves imageFit:\"contain\"", () => {
    const body: GameBody = { kind: "ordonare", imageFit: "contain", rounds: [{ title: "R1", cards: [
      { label: "a", order: 1, img: 0 }, { label: "b", order: 2 },
    ] }] };
    const state = bodyToEditor<string>(body, (idx) => `asset${idx}`);
    expect((state as OrderState<string>).imageFit).toBe("contain");
    expect(compileGame(state).body).toEqual(body);
  });
  it("asociere round-trip preserves layout:\"rows\"", () => {
    const body: GameBody = { kind: "asociere", layout: "rows", rounds: [{ pairs: [
      { left: { img: 0 }, right: { text: "1" }, group: "g0" },
      { left: { img: 1 }, right: { text: "2" }, group: "g1" },
    ] }] };
    const state = bodyToEditor<string>(body, (idx) => `asset${idx}`);
    expect((state as MatchState<string>).layout).toBe("rows");
    expect(compileGame(state).body).toEqual(body);
  });
  it("harta-quiz round-trip preserves authored rounds", () => {
    const body: GameBody = { kind: "harta-quiz", map: 0, rounds: [[1, 2], [2, 1]], points: [
      { n: 1, x: 1, y: 2, name: "Nil" }, { n: 2, x: 3, y: 4, name: "Congo" },
    ] };
    const state = bodyToEditor<string>(body, (idx) => `asset${idx}`);
    expect((state as MapQuizState<string>).rounds).toEqual([[1, 2], [2, 1]]);
    expect(compileGame(state).body).toEqual(body);
  });
  it("plaseaza-pe-harta round-trip preserves reveal:\"below\"", () => {
    const body: GameBody = { kind: "plaseaza-pe-harta", map: 0, reveal: "below", targets: [
      { id: "t", x: 1, y: 2, label: "l", img: 1 },
    ] };
    const state = bodyToEditor<string>(body, (idx) => `asset${idx}`);
    expect(compileGame(state).body).toEqual(body);
  });
  it("harta-quiz round-trip preserves draw", () => {
    const body: GameBody = { kind: "harta-quiz", map: 0, draw: 12, points: [
      { n: 1, x: 1, y: 2, name: "Nil" }, { n: 2, x: 3, y: 4, name: "Congo" },
    ] };
    const state = bodyToEditor<string>(body, (idx) => `asset${idx}`);
    expect((state as MapQuizState<string>).draw).toBe(12);
    expect(compileGame(state).body).toEqual(body);
  });
  it("harta-quiz without draw stays without draw", () => {
    const body: GameBody = { kind: "harta-quiz", map: 0, points: [{ n: 1, x: 1, y: 2, name: "Nil" }] };
    const state = bodyToEditor<string>(body, (idx) => `asset${idx}`);
    const compiled = compileGame(state).body;
    expect(compiled).toEqual(body);
    expect(compiled).not.toHaveProperty("draw");
  });
  it("ordonare compile→body→editor→compile preserves an image-only card with an empty label", () => {
    const body: GameBody = { kind: "ordonare", rounds: [{ title: "R1", cards: [
      { label: "", img: 0, order: 1 },
      { label: "text card", order: 2 },
    ] }] };
    const state = bodyToEditor<string>(body, (idx) => `asset${idx}`);
    expect(compileGame(state).body).toEqual(body);
  });
  it("matrice compile→body→editor→compile is stable (given emis doar când e true)", () => {
    const body: GameBody = { kind: "matrice", variants: [
      { rows: [
        [{ text: "Continente" }, { text: "AMERICA", given: true }],
        [{ text: "Fluvii" }, { text: "Volga" }],
      ] },
    ] };
    const state = bodyToEditor<string>(body, (idx) => `asset${idx}`);
    // editorul completează given:false pe celulele libere...
    expect((state as MatrixState).variants[0].rows[0][0]).toEqual({ text: "Continente", given: false });
    // ...dar compilarea îl elide, deci body-ul e identic (fără mângâlire).
    expect(compileGame(state).body).toEqual(body);
  });
});

describe("validateGame draw", () => {
  const pts = [{ n: 1, x: 1, y: 2, name: "Nil" }, { n: 2, x: 3, y: 4, name: "Congo" }];
  it("accepts a valid draw", () => {
    expect(validateGame({ kind: "harta-quiz", map: 0, draw: 2, points: pts } as GameBody)).toEqual([]);
  });
  it("flags draw below 2 or non-integer", () => {
    expect(validateGame({ kind: "harta-quiz", map: 0, draw: 1, points: pts } as GameBody)).toContain(
      "Câte puncte pe rundă: pune un număr întreg de cel puțin 2 (sau lasă gol pentru toate).",
    );
    expect(validateGame({ kind: "harta-quiz", map: 0, draw: 2.5, points: pts } as GameBody)).toHaveLength(1);
  });
  it("does not flag draw larger than point count (clamped at use site)", () => {
    expect(validateGame({ kind: "harta-quiz", map: 0, draw: 99, points: pts } as GameBody)).toEqual([]);
  });
});

describe("compileGame matrice", () => {
  it("emite given doar când e true, fără imagini în plan", () => {
    const state: MatrixState = { kind: "matrice", variants: [
      { rows: [[{ text: "a", given: true }, { text: "b", given: false }]] },
    ] };
    const { body, plan } = compileGame(state);
    expect(body).toEqual({ kind: "matrice", variants: [{ rows: [[{ text: "a", given: true }, { text: "b" }]] }] });
    expect(plan).toEqual([]);
  });
});

describe("compileGame grila", () => {
  it("builds rounds/questions and assigns idx per image in traversal order, omitting empty text", () => {
    const state: GrilaState<string> = {
      kind: "grila",
      rounds: [{ title: "Runda 1", questions: [
        { img: { t: "sol1" }, text: "Ce sol e acesta?", options: ["Cernoziom", "Podzol"], answer: 1 },
        { img: null, text: "", options: ["a", "b"], answer: 0 },
      ] }],
    };
    const { body, plan } = compileGame(state);
    expect(body).toEqual({
      kind: "grila",
      rounds: [{ title: "Runda 1", questions: [
        { img: 0, text: "Ce sol e acesta?", options: ["Cernoziom", "Podzol"], answer: 1 },
        { options: ["a", "b"], answer: 0 },
      ] }],
    });
    expect(plan).toEqual([{ idx: 0, image: "sol1" }]);
  });
});

describe("sortare", () => {
  it("compileGame emite coșuri, carduri și idx pentru imagini", () => {
    const state: SortareState<string> = {
      kind: "sortare",
      buckets: [{ label: "Rotație" }, { label: "Revoluție" }],
      rounds: [{ title: "Runda 1", cards: [
        { img: { t: "rot1" }, text: "Alternanța zi-noapte", bucket: 0 },
        { img: null, text: "Anotimpurile", bucket: 1 },
      ] }],
    };
    const { body, plan } = compileGame(state);
    expect(body).toEqual({
      kind: "sortare",
      buckets: [{ label: "Rotație" }, { label: "Revoluție" }],
      rounds: [{ title: "Runda 1", cards: [
        { img: 0, text: "Alternanța zi-noapte", bucket: 0 },
        { text: "Anotimpurile", bucket: 1 },
      ] }],
    });
    expect(plan).toEqual([{ idx: 0, image: "rot1" }]);
  });
  it("validateGame semnalează coș fără etichetă, rundă goală și card gol", () => {
    const noLabel: GameBody = { kind: "sortare", buckets: [{ label: "A" }, { label: " " }], rounds: [{ cards: [{ text: "x", bucket: 0 }] }] };
    expect(validateGame(noLabel)).toContain("Categoria 2: adaugă o etichetă.");
    const empty: GameBody = { kind: "sortare", buckets: [{ label: "A" }, { label: "B" }], rounds: [{ cards: [] }] };
    expect(validateGame(empty)).toContain("Runda 1: adaugă cel puțin un cartonaș.");
    const blank: GameBody = { kind: "sortare", buckets: [{ label: "A" }, { label: "B" }], rounds: [{ cards: [{ bucket: 0 }] }] };
    expect(validateGame(blank)).toContain("Runda 1, cartonașul 1: adaugă text sau imagine.");
  });
  it("validateGame semnalează o categorie în care nu ajunge niciun cartonaș", () => {
    const body: GameBody = { kind: "sortare", buckets: [{ label: "A" }, { label: "B" }], rounds: [{ cards: [{ text: "x", bucket: 0 }] }] };
    expect(validateGame(body)).toContain("Categoria „B”: nu are niciun cartonaș.");
  });
  it("bodyToEditor round-trip păstrează coșurile și cardurile", () => {
    const body: GameBody = { kind: "sortare", buckets: [{ label: "A" }, { label: "B" }], rounds: [{ cards: [
      { img: 0, bucket: 1 }, { text: "y", bucket: 0 },
    ] }] };
    const state = bodyToEditor<string>(body, (idx) => `asset${idx}`);
    expect((state as SortareState<string>).buckets).toEqual([{ label: "A" }, { label: "B" }]);
    expect(compileGame(state).body).toEqual(body);
  });
});

describe("compileGame grila hint", () => {
  it("emite `hint` doar când are conținut", () => {
    const state: GrilaState<string> = {
      kind: "grila",
      rounds: [{ questions: [
        { img: null, text: "q1", hint: "un indiciu", options: ["a", "b"], answer: 0 },
        { img: null, text: "q2", hint: "   ", options: ["a", "b"], answer: 1 },
      ] }],
    };
    const { body } = compileGame(state);
    expect(body).toEqual({ kind: "grila", rounds: [{ questions: [
      { text: "q1", hint: "un indiciu", options: ["a", "b"], answer: 0 },
      { text: "q2", options: ["a", "b"], answer: 1 },
    ] }] });
  });
  it("round-trip păstrează hint-ul", () => {
    const body: GameBody = { kind: "grila", rounds: [{ questions: [
      { img: 0, hint: "Sub pădurea de conifere.", options: ["a", "b"], answer: 0 },
    ] }] };
    const state = bodyToEditor<string>(body, (idx) => `asset${idx}`);
    expect((state as GrilaState<string>).rounds[0].questions[0].hint).toBe("Sub pădurea de conifere.");
    expect(compileGame(state).body).toEqual(body);
  });
});

describe("validateGame grila", () => {
  it("acceptă o grilă validă", () => {
    const body: GameBody = { kind: "grila", rounds: [{ questions: [
      { img: 0, options: ["a", "b"], answer: 0 },
    ] }] };
    expect(validateGame(body)).toEqual([]);
  });
  it("semnalează rundă fără întrebări", () => {
    const body: GameBody = { kind: "grila", rounds: [{ questions: [] }] };
    expect(validateGame(body)).toEqual(["Runda 1: adaugă cel puțin o întrebare."]);
  });
  it("semnalează întrebare fără imagine și fără text", () => {
    const body: GameBody = { kind: "grila", rounds: [{ questions: [{ options: ["a", "b"], answer: 0 }] }] };
    expect(validateGame(body)).toContain("Runda 1, întrebarea 1: adaugă o imagine sau un text.");
  });
  it("semnalează mai puțin de 2 variante", () => {
    const body: GameBody = { kind: "grila", rounds: [{ questions: [{ text: "q", options: ["a"], answer: 0 }] }] };
    expect(validateGame(body)).toContain("Runda 1, întrebarea 1: adaugă cel puțin 2 variante.");
  });
  it("semnalează o variantă goală", () => {
    const body: GameBody = { kind: "grila", rounds: [{ questions: [{ text: "q", options: ["a", ""], answer: 0 }] }] };
    expect(validateGame(body)).toContain("Runda 1, întrebarea 1: completează toate variantele.");
  });
  it("semnalează answer în afara intervalului", () => {
    const body: GameBody = { kind: "grila", rounds: [{ questions: [{ text: "q", options: ["a", "b"], answer: 5 }] }] };
    expect(validateGame(body)).toContain("Runda 1, întrebarea 1: alege răspunsul corect.");
  });
});

describe("bodyToEditor grila round-trip", () => {
  it("compile→body→editor→compile is stable (imagine + text)", () => {
    const body: GameBody = { kind: "grila", rounds: [{ title: "Runda 1", questions: [
      { img: 0, text: "Ce sol e acesta?", options: ["Cernoziom", "Podzol", "Laterit"], answer: 2 },
    ] }] };
    const state = bodyToEditor<string>(body, (idx) => `asset${idx}`);
    expect((state as GrilaState<string>).rounds[0].questions[0].text).toBe("Ce sol e acesta?");
    expect(compileGame(state).body).toEqual(body);
  });
  it("compile→body→editor→compile is stable (doar text, fără imagine)", () => {
    const body: GameBody = { kind: "grila", rounds: [{ questions: [
      { text: "Care e capitala?", options: ["a", "b", "c"], answer: 1 },
    ] }] };
    const state = bodyToEditor<string>(body, (idx) => `asset${idx}`);
    expect(compileGame(state).body).toEqual(body);
  });
  it("compile→body→editor→compile is stable (doar imagine, fără text)", () => {
    const body: GameBody = { kind: "grila", rounds: [{ questions: [
      { img: 0, options: ["a", "b"], answer: 0 },
    ] }] };
    const state = bodyToEditor<string>(body, (idx) => `asset${idx}`);
    const q = (state as GrilaState<string>).rounds[0].questions[0];
    expect(q.text).toBe("");
    expect(q.img?.t).toBe("asset0");
    expect(compileGame(state).body).toEqual(body);
  });
});

describe("validateGame matrice", () => {
  it("acceptă o matrice validă", () => {
    const body: GameBody = { kind: "matrice", variants: [
      { rows: [[{ text: "a", given: true }, { text: "b" }]] },
    ] };
    expect(validateGame(body)).toEqual([]);
  });
  it("semnalează text gol", () => {
    const body: GameBody = { kind: "matrice", variants: [
      { rows: [[{ text: "" }, { text: "b" }]] },
    ] };
    expect(validateGame(body)).toContain("Varianta 1, rândul 1, coloana 1: completează textul.");
  });
  it("semnalează lipsa oricărei celule de completat", () => {
    const body: GameBody = { kind: "matrice", variants: [
      { rows: [[{ text: "a", given: true }, { text: "b", given: true }]] },
    ] };
    expect(validateGame(body)).toContain("Varianta 1: lasă cel puțin o celulă de completat (nefixată).");
  });
  it("semnalează grilă nedreptunghiulară", () => {
    const body: GameBody = { kind: "matrice", variants: [
      { rows: [[{ text: "a" }, { text: "b" }], [{ text: "c" }]] },
    ] };
    expect(validateGame(body)).toContain("Varianta 1, rândul 2: are alt număr de coloane.");
  });
});

describe("compileGame grila why", () => {
  it("emite `why` doar când cel puțin o variantă are explicație, aliniat la variante", () => {
    const state: GrilaState<string> = {
      kind: "grila",
      rounds: [{ questions: [
        { img: null, text: "q1", options: ["a", "b"], answer: 0, why: ["greșit fiindcă…", "  "] },
        { img: null, text: "q2", options: ["a", "b"], answer: 1, why: ["", "   "] },
        { img: null, text: "q3", options: ["a", "b"], answer: 0 },
      ] }],
    };
    const { body } = compileGame(state);
    expect(body).toEqual({ kind: "grila", rounds: [{ questions: [
      { text: "q1", options: ["a", "b"], answer: 0, why: ["greșit fiindcă…", ""] },
      { text: "q2", options: ["a", "b"], answer: 1 },
      { text: "q3", options: ["a", "b"], answer: 0 },
    ] }] });
  });
  it("round-trip păstrează explicațiile", () => {
    const body: GameBody = { kind: "grila", rounds: [{ questions: [
      { text: "q", options: ["a", "b"], answer: 1, why: ["Fals, fiindcă…", "Corect!"] },
    ] }] };
    const state = bodyToEditor<string>(body, (idx) => `asset${idx}`);
    expect((state as GrilaState<string>).rounds[0].questions[0].why).toEqual(["Fals, fiindcă…", "Corect!"]);
    expect(compileGame(state).body).toEqual(body);
  });
});
