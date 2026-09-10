# Decisions Log

Running record of significant choices. Detailed rationale lives in `docs/adr/`.

| Date | Decision | Status | Ref |
|---|---|---|---|
| 2026-06-25 | Cloudflare-first stack (Pages/Workers/D1/R2/KV); custom auth in Workers, **not** Cloudflare Access | Proposed (Phase 0 gate) | ADR-0001 |
| 2026-06-25 | i18n-ready by translation-table + locale-file separation; `ro` at launch, `en` additive | Proposed | ADR-0002 |
| 2026-06-25 | Subject-agnostic: all subject specifics in `subject.config` + seed data; zero geography in engine | Proposed | ADR-0003 |
| 2026-06-25 | Web framework: **React Router v7 (Remix)** on Cloudflare Workers + Drizzle ORM | Confirmed by owner | ADR-0004 |
| 2026-06-25 | Student token: one shared per class, unlocks whole grade, expires 15 June; token-only, no PII | Confirmed by owner | ADR-0005 |
| 2026-06-25 | AI features + video streaming **deferred** to late phases; AI kept separate | Confirmed by owner | — |
| 2026-06-25 | Payments via **Netopia**, deferred to teacher phase; pricing TBD | Confirmed (provider) / TBD (terms) | — |
| 2026-06-25 | Data controller = the teacher personally | Confirmed by owner | — |
| 2026-06-25 | Visual theme: **Spectral** headings + **Inter** body + "Mediteran" palette (azure/terracotta/sand/cream) | Confirmed by owner | ADR-0007 |
| 2026-06-25 | Admin access: single admin account via **password** to a hidden `/admin` URL (passkey dropped; not a master token) | Confirmed by owner | ADR-0006 |
| 2026-06-25 | Working engine name "Catedra" (placeholder) | Needs confirmation | — |
| 2026-07-21 | Jocuri interactive = tipul de material `joc` cu discriminator `kind` în body JSON; 4 motoare subiect-agnostice (`components/games/`), logică pură testată (`lib/games.ts`) | Implemented | plan 2026-07-21 |
| 2026-07-21 | Assets de joc referiți prin `idx` (nu filename); SVG-urile generate se rasterizează în PNG (media.tsx forțează download pt. SVG); amestecare determinist-seedată (fără hydration mismatch la SSR) | Implemented | — |
| 2026-07-21 | Imagini jocuri: **doar Public Domain / CC0** (NASA/USDA/USGS/CC0), proveniență în `content/games/SOURCES.md` | Implemented | — |
| 2026-08-27 | Instanța liberă (`catedra-liber`): a doua desfășurare a aceluiași cod, publică și gratuită — tabela de rute aleasă la construcție prin `CLOUDFLARE_ENV` (rutele de admin/profesor absente din bundle-ul liber, nu doar blocate), rol nou `liber` adăugat în `Viewer`/`resolveVisibility` (nicio verificare existentă scoasă), D1 și R2 partajate cu instanța cu clase. Publicarea întregii biblioteci de pedagogie gratis e o decizie a proprietarei, asumată ca practic ireversibilă | Implemented | ADR-0008 |
| 2026-09-05 | Instanța liberă capătă temă proprie **„Cobalt"** (paletă + Instrument Serif/Public Sans + marca „glob" + fotografii PD/CC0), prin `themeLiber` — soclu care exista deja în types și era testat, dar nedefinit. Jetoane noi `on-primary`/`on-accent` (coralul dă 2,64:1 pe hârtie, deci e umplere, nu text) și `headingUi` (Instrument Serif n-are bold). Miniaturi de 400px în R2 prin `/media/:id?t`, cu podeaua de acces neatinsă. `motion/mini` la +3,0 kB gzip, măsurat (pachetul complet dădea +21,7 kB, peste prag) | Implemented | ADR-0009 |
| 2026-09-06 | **Păreri publice** pe instanța liberă (`/pareri`): prima cale de scriere publică din proiect. Trimite → `pending` → admina aprobă din `/admin/pareri` (rută în `claseOnly`, baza fiind comună) → apare public fără deploy. Podeaua: loaderul filtrează `approved` în SQL, iar inserarea scrie literal `status: "pending"` — câmpul nu se citește niciodată din formular (verificat cu un POST care falsifică `status=approved`). Fără email, fără IP, fără cookie: nimic de șters la cerere, nimic care identifică un minor. Apărări: `REVIEW_LIMITER` (3/60s), honeypot, Turnstile (inert cât timp cheile lipsesc) | Implemented | spec 2026-09-05-pareri-publice |
| 2026-09-06 | **Capitole pliante** pe `/elevi`, prin prop `collapsible` **oprit implicit** — `/clasa/:gradeId` rămâne neatins. `<details>`/`<summary>` native (tastatură + cititoare de ecran gratis, cardurile rămân în DOM pentru crawlere). Starea se sincronizează pe `onClick`+`preventDefault`, NU pe `onToggle`: Chrome emite `toggle` și când `open` se schimbă din cod, deci capitolele deschise forțat de filtru rămâneau blocate deschise după golirea căutării | Implemented | — |
| 2026-09-06 | **Accesibilitate, minimul necesar**: link „Sari la conținut" în antetul instanței libere + `<main id="continut" tabIndex={-1}>` pe toate paginile ei (singura nereușită de nivel A găsită de audit — restul era deja în regulă: `:focus-visible`, `prefers-reduced-motion`, `alt` peste tot, `aria-label` pe controalele fără text, un `h1` pe pagină). Linkul NU e în `SiteHeader`: paginile sitului cu clase n-au încă ținta, iar un link de salt care nu aterizează e mai rău decât niciunul | Implemented | — |
