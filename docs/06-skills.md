# Skills (repeatable, owner-triggerable)

Per §0.6 and §10.4, recurring work becomes a documented skill/command so a non-technical
owner can trigger it. This is the **plan**; skills are authored in the phase that needs them.

| Skill | Triggered when | Inputs | Output | Phase |
|---|---|---|---|---|
| **ingest-material** | Adding any material to the library | type, grade, topic, title (ro), files | Validated material row + assets in R2, draft status | 2 |
| **add-material-type** | A new material type is needed | type key, label, renderer, ingest schema | Config entry + renderer stub + ingest schema; no schema migration | 2 |
| **generate-class-token** | She starts a class for the year | grade, class label | A shared token + printable handout for the class | 1 (UI) / skill 2 |
| **scaffold-role-page** | Adding a new role-gated page | role(s), route, data needs | Page wired to the server-side entitlement resolver | 1–4 |
| **new-subject** | Spinning up a new subject instance (e.g. biology) | new `subject.config`, branding/theme | Fresh instance from template, geography content cleared, empty taxonomy seeded | 8 |
| **seed-sample-content** | Need placeholder content covering every type | grade range | Sample materials of every enabled type for demo/QA | 1 |

Each skill, when authored, gets: a clear name, documented inputs/outputs, and an entry here.
Owner-facing skills (`ingest-material`, `generate-class-token`, `new-subject`) get
plain-Romanian prompts and a short how-to in `docs/new-subject-guide.md` (written in Phase 8).

## Implemented

### `generate-class-token` (Phase 1) ✅
In-app: **/admin → Tokenuri** → pick grade + label → token shown once + printable handout.

### `ingest-material` (Phase 2) ✅
Two paths:
- **Everyday (your mom):** **/admin → Materiale → Adaugă material** — a Romanian form per type
  (no JSON). See `docs/ghid-materiale.md`.
- **Bulk/programmatic:** `app/scripts/ingest.mjs <materials.json>` → writes `drizzle/ingest.sql`
  → apply with `npx wrangler d1 execute catedra --local --file ./drizzle/ingest.sql`.
  Each item: `{ gradeId, topicSlug, type, library?, title, description?, body, status?, isTeaser?, position? }`
  (`body` is a string for `scris`, or an object for `joc`/`examen`/`foto`/`prezentare`).

### `seed-sample-content` (Phase 1) ✅
`app/scripts/seed.mjs` → sample materials covering every type + the demo token.

### `ingest-games` (Jocuri interactive) ✅
Ingestează jocuri (`joc` cu body `kind`) cu imagini, în D1 + R2, local sau remote.

- **Format folder-joc:** `content/games/<nume>/game.json` + fișierele de imagine listate.
  `game.json`: `{ gradeId, topicSlug, slug, title, description?, position?, status?,
  assets: ["a.png", ...], body: { kind, ... } }`. **Convenție:** `body` referă imaginile
  prin **indexul din `assets`** (idx-ul assetului în DB = poziția în listă; `map`/`img` = acel index).
- **Rulare:** `node app/scripts/ingest-games.mjs <folder...> --target local|remote`
  → scrie `drizzle/ingest-games.sql`, urcă binarele în R2 (`--local`/`--remote`), apoi:
  `npx wrangler d1 execute catedra --<target> --file ./drizzle/ingest-games.sql`.
  Idempotent: șterge întâi materialul cu același (grade, topic, slug).
- **Imagini generate:** `content/games/gen/*.mjs` (hărți echirectangulare, climograme, stele) +
  `app/scripts/rasterize.mjs <dir> [width]` (SVG→PNG, fiindcă media.tsx nu servește SVG).
  `content/games/gen/picker.html` = unealtă de citit coordonate `x%,y%` pe hărți.
- **Reguli imagini:** doar Public Domain / CC0; proveniență în `content/games/SOURCES.md`.
