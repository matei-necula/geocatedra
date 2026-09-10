# TODO

## Phase 0 — Discovery & architecture ✅
- [x] Write all Phase 0 docs
- [x] Owner approved architecture + Phase 1 start
- [x] Web framework chosen: React Router v7 (Remix) — ADR-0004
- [x] Admin login chosen: passkey — ADR-0006
- [x] Engine working name "Catedra"

## Phase 1 — Foundation + Student experience
- [x] Design direction chosen: Spectral + Inter + "Mediteran" (ADR-0007)
- [x] Prerequisites installed (Node 24.18.0, npm, git)
- [x] Scaffold — React Router v7 + Cloudflare Workers + Tailwind v4 in `app/`
- [x] D1 binding + Drizzle ORM + migration (R2/KV deferred until video/sessions need them)
- [x] `subject.config` — theme + taxonomy w/ cycles + material types + RO strings (geography = instance #1)
- [x] Data model + migration (materials, translations, access_tokens)
- [x] Server-side entitlement resolver (`lib/entitlement.ts`) — verified blocks cross-grade access
- [x] Admin token generator + management (revoke) + printable handout
- [x] Student flow: token → own grade → browse only that grade (verified end-to-end)
- [x] Per-session watermark stamping on material view
- [x] Sample content covering every material type (video/scris/joc/examen/foto/prezentare)
- [x] Live dev server verified at http://localhost:5173

### Phase 1 — remaining to fully close
- [x] Admin auth method finalized: **password** to hidden `/admin` URL (passkey dropped — ADR-0006)
- [~] `ADMIN_PASSWORD` **există** ca secret în producție (verificat 20.08.2026 cu `wrangler secret list`). Valoarea nu se poate citi — de confirmat de owner că nu e tot `admin`
- [ ] Production D1: `wrangler d1 create` + real `database_id`; secrets via `wrangler secret put`
- [ ] Production R2: `wrangler r2 bucket create catedra-media` (free tier 10 GB, no egress)
- [ ] More sample content for grades 5, 7–12 (only grade 6 is richly populated)

## Phase 2 — Content management ✅
- [x] Admin material CRUD: list (grouped grade→topic), create, edit, delete, draft/publish
- [x] Friendly per-type editors (no JSON): video/scris/joc/examen/foto/prezentare
- [x] Two libraries selectable (student / teacher-pedagogy) + teaser flag
- [x] Tabbed admin shell (Tokenuri / Materiale)
- [x] Server-side guards on all admin material routes; drafts hidden from students (verified)
- [x] `ingest-material` skill — UI + bulk CLI (`scripts/ingest.mjs`); Romanian guide `docs/ghid-materiale.md`
- [x] Image/PDF upload to **R2** per material; access-controlled `/media/:id` streaming (verified: student 200, anonymous 403); delete cleans up R2
- [x] "Fișier / document" material type — upload any PDF/Word/PowerPoint/image/video as-is + title; viewer per type (PDF embed / video player / image / download); 25 MB cap; disallowed types rejected (verified)
- [x] UI polish: favicon, nav progress bar, focus-visible rings, landing backdrop, library counts/footer
- [x] UI polish 2: color-coded type chips (browse/admin/material), material breadcrumb + prev/next within topic, admin dashboard stats row
- [x] Dark mode: auto (prefers-color-scheme) + manual toggle (persisted), no-flash, config-driven `colorsDark` (minor: dark-tune accent chips/badges later)
- [ ] (later) Per-slide images for prezentare; drag-to-reorder within a topic

## Feature — MCQ Practice Exams ("Exersează") ✅
- [x] Spec + plan (`docs/superpowers/specs|plans/2026-06-26-mcq-practice-exams*`)
- [x] DB: questions / question_translations / practice_attempts / question_stats (migration 0002)
- [x] Admin "Întrebări" authoring (CRUD, draft/publish) + reusable QuestionEditor/QuestionForm
- [x] Student "Exersează": nickname → topic/whole-grade → 5/10/20 → random test → score + notă
- [x] Anti-cheat: HMAC-signed question set, correct answers never sent to client (verified)
- [x] Per-nickname results + class aggregates + hardest questions at `/admin/rezultate` + delete-all
- [x] GDPR-minded: non-identifying nickname (no student PII), essential cookies only, privacy/terms pages
- [x] Verified end-to-end (7/7 integration checks)
- [ ] (later) seed sample questions; optional: consolidate `joc` editor onto QuestionEditor

## Phase 3 — Teacher accounts (minus payments) ✅ (localhost)
- [x] `users` table + PBKDF2 password auth (`lib/users.ts`); teacher session cookie
- [x] Open self-registration + login + logout (`/profesor/inregistrare`, `/profesor/login`)
- [x] Teacher dashboard + `TeacherShell` nav; landing "Profesori" door → `/profesor`
- [x] View-only material browse (both libraries: Elevi + Pedagogie), no-download enforcement (`viewOnly`)
- [x] Teacher token generator + management, scoped per-teacher (`access_tokens.issued_by`)
- [x] Verified end-to-end (12/12 integration checks); builds clean
- [x] Email verification flow (`lib/email.ts`): signed link, verify route, unverified banner + resend, token-gen gated on verified (8/8 tests). Dev shows the link on-screen (no provider needed); **prod needs a sender** (`RESEND_API_KEY` secret + `EMAIL_FROM`)
- [ ] **Payments/subscriptions (Netopia) — deferred (the "last touch")**: gate registration/pedagogy on paid tiers; pricing TBD
- [x] Wire a real email provider for production: **Resend** (`lib/email.ts` POSTs to Resend, checks the response, falls back to dev console-log when `RESEND_API_KEY` is unset; HTML email template; failures surface on the dashboard without blocking registration). Setup in `docs/run-guide.md`. To activate in prod: `wrangler secret put RESEND_API_KEY` + `EMAIL_FROM` (free tier $0; verify a domain for deliverability)
- [x] Deploy Phase 3 — **LIVE** at https://catedra.geografie.workers.dev (migrations 0003+0004 applied --remote; all 4 secrets set incl. Resend)
- [x] **Email verification gated behind `REQUIRE_EMAIL_VERIFICATION` flag, OFF in prod** (`wrangler.json`) because `onboarding@resend.dev` can only deliver to the Resend account's own address. New teachers auto-activate. Flip to `"true"` + verified sending domain to re-enable.
- [ ] Get a custom domain → verify it in Resend (and optionally move the site off workers.dev) → turn `REQUIRE_EMAIL_VERIFICATION` back on

## Feature — Classroom tools & polish ✅
- [x] Spec + plan (`docs/superpowers/specs|plans/2026-07-05-classroom-tools-polish*`)
- [x] Migration 0007: announcements / assignments / material_view_stats / attempts.assignment_id
- [x] Anunțuri: admin+teacher authoring, per-class targeting, student card w/ unread dots
- [x] Teme: fixed-set assigned tests on the Exersează engine; first attempt counts; per-temă results
- [x] Admin+teacher library search/filters; „Nou" badges + Noutăți strip (cat_seen cookie)
- [x] Statistici: aggregate per-class view counters + admin/teacher dashboards; privacy note
- [ ] (later) PWA/offline — deferred by design

## Feature — Jocuri interactive (geo-9) ✅
- [x] Spec + plan (`docs/superpowers/specs|plans/2026-07-21-jocuri-interactive*`)
- [x] 4 motoare subiect-agnostice în tipul `joc` prin discriminatorul `kind` (body JSON): `asociere` (atinge-atinge cu linii), `ordonare` (tragere pointer-events), `plaseaza-pe-harta` (etichete trase pe buline + lightbox), `harta-quiz` (moduri găsește/numește). Cod pur testat (`lib/games.ts`, vitest), motoare în `components/games/`
- [x] Amestecare **determinist-seedată** (evită hydration mismatch la SSR; „Joacă din nou" re-amestecă)
- [x] `GameShell` (progres, confetti, reduced-motion), assets referiți prin `idx`; body corupt → fallback `QuizBlock` (niciodată pagină albă)
- [x] Scripturi conținut: `rasterize.mjs` (sharp SVG→PNG), `ingest-games.mjs` (D1 + upload R2, local/remote); generatoare `content/games/gen/` (hartă CC0 echirectangulară, climograme, hărți zone/areal, stele, picker.html)
- [x] 10 jocuri geo-9 (verificate în browser, desktop + 390px). Foto PD/CC0 (NASA/USDA/USGS/CC0), proveniență în `content/games/SOURCES.md`
- [x] Înlocuit 3 imagini slabe cu PD/CC0 mai bune: **muflon** (gravură 1887 → foto iNaturalist CC0), **veg-savana** (munte verde → savană Serengeti rawpixel CC0), **veg-tundra** (348×214 → tundră montană 1024×768 USFS PDM). Aplicat pe prod (R2+D1 remote)
- [ ] (later) Rămân gap-uri de licență: **terra rossa** (niciun profil de sol PD/CC0 — jocul are 5 profiluri) + **veg-mediteranean** (maquis cu ceață, nicio alternativă CC0 clar mai bună) → de adăugat cu imagini proprii

## Feature — Creator de jocuri în admin ✅ (branch `feat/game-creator`)
- [x] Spec + plan (`docs/superpowers/specs|plans/2026-07-23-creator-jocuri*`)
- [x] Nucleu pur testat `lib/game-editor.ts` (vitest): `compileGame` (stare editor → `GameBody` + plan imagini pe `idx`), `bodyToEditor` (dus-întors), `validateGame` (mesaje RO); `lib/imageResize.ts` (micșorare în browser ~1600px)
- [x] Selector „Fel de joc" în `MaterialForm` sub tipul `joc`: Grilă (MCQ existent, neatins) + cele 4 motoare; formularul comută pe `multipart/form-data`, un singur `name="body"`
- [x] Editoare `components/games/editor/`: `ImagePicker` (încărcare/refolosire/micșorare, fără scurgeri blob), `MatchEditor`, `OrderEditor`, `MapPinEditor` (clic=adaugă, tragere=mută, clic=redenumește/șterge), `GameEditor` (dispecer + preview „Joacă" pe motorul real via `resolveSrc`)
- [x] Server `lib/assets.ts`: `uploadAsset(idx)`, `copyAsset` (copie obiect R2, fără referințe încrucișate), `syncGameAssets` (urcă/copiază/renumerotează/curăță după body), `listGameImages` (picker refolosire)
- [x] Rute: `nou`/`$id` trec `reusable`+`initialAssets`; acțiunile parse+`validateGame` (blochează publicarea, ciornă mereu permisă) + **verificare access-control a `src_<idx>` ÎNAINTE de persistare**, apoi `syncGameAssets`; „Duplică" pe rânduri `joc` → `nou?from=id` (clonă independentă, assets copiate)
- [x] Verificat: typecheck curat, vitest 18/18; **runtime end-to-end (curl)** — creare joc `ordonare` (body corect în D1), creare `harta-quiz` cu **upload imagine** (rând `material_assets` idx 0), publicare invalidă **blocată** (0 rânduri persistate)
- [x] Merge în `main` — făcut (branch-ul `feat/game-creator` nu mai există; `lib/game-editor.ts` și `components/games/editor/` sunt pe `main`)
- [ ] Acceptare UI interactivă de către owner (click-through la localhost)

## Lansare publică — Partea 4 (site public) + operațional ✅ (2026-08-20)
Rulat cu patru agenți în paralel pe fișiere disjuncte, apoi verificat cap-coadă local.
Runbook-ul (`docs/08-public-launch-runbook.md` + varianta RO) are acum bifele la zi.

- [x] **Fonturi aduse la noi** (4.7) — 12 fișiere woff2 în `public/fonts/` (Inter variabil + Spectral
  static), cu `latin` **și** `latin-ext` pentru diacritice. Cele două excepții Google au fost scoase
  din CSP. **Site-ul nu mai face nicio cerere către terți** — IP-ul elevilor nu mai ajunge la Google
- [x] **Set de iconițe** (4.1) — `icon.svg`, `favicon.ico` (32+16, container ICO construit de mână,
  fiindcă sharp nu scrie ICO), `apple-touch-icon`, `icon-192/512` (512 maskable), `og-image.png`
  1200×630 cu diacritice verificate vizual, `site.webmanifest`. Regenerabile: `app/scripts/gen-icons.mjs`
- [x] **`lib/seo.ts`** (4.2) — un singur ajutor, testat, aplicat pe **toate cele 42 de rute**: 5 publice
  cu titlu/descriere/canonical/OG/Twitter, 33 private cu `noindex, nofollow`. Adresa absolută se ia
  din cerere la runtime, deci **niciun domeniu scris în cod** — nimic de rescris când se cumpără domeniul
- [x] **JSON-LD** (4.5) pe pagina principală (`WebSite` + `EducationalOrganization`), valorile din `subject.config`
- [x] **`/robots.txt` și `/sitemap.xml` ca rute**, nu fișiere statice (domeniul nu există încă).
  robots e **conștient de gazdă**: pe `*.workers.dev` și localhost dă `Disallow: /`, ca gazda temporară
  să nu ajungă indexată și să rămână o copie veche în Google după mutare
- [x] **`public/_headers`** (4.9) — `/assets/*` și `/fonts/*` la un an, `immutable`
- [x] **Turnstile** (3.2) scris pe cele 3 formulare de intrare, **adormit până se pun cheile**:
  fără chei se comportă exact ca înainte; cu ambele chei devine obligatoriu și **cade închis**
  (și token invalid, și eroare de rețea la siteverify blochează). CSP-ul permite deja `challenges.cloudflare.com`
- [x] **Prima copie de siguranță a bazei** (0.6) — `backups/catedra-2026-08-20.sql` (873 KB, 1878 rânduri).
  `backups/` pus în `.gitignore`: exportul conține hash-uri de parole și de tokenuri
- [x] Verificat: typecheck curat, **228 de teste trec** (era 189), build curat, `wrangler deploy --dry-run` curat,
  plus probe la rulare pe robots/sitemap/meta/fonturi/iconițe

**Două lucruri prinse la verificare, pe care agenții le rataseră:**
- **Două etichete `<title>` pe fiecare pagină** — `root.tsx` avea un `<title>` fix pe lângă cel din
  `<Meta />`. Browserele și motoarele de căutare îl iau pe **primul**, deci fiecare pagină se anunța
  „Catedra", golind de sens toată munca de SEO. Scos din `Layout`, mutat ca `meta` de rezervă în root
- **Cele 3 formulare de intrare rămăseseră fără `noindex`** — cădeau exact în cusătura dintre doi agenți

**Nefăcute, cu motiv:**
- [ ] **Prerender (4.8) — dat înapoi.** Pasul de prerender din `@react-router/dev` rulează bundle-ul
  de worker în Node curat, unde nu există `globalThis.Cloudflare` → build-ul moare cu
  `Cannot read properties of undefined (reading 'compatibilityFlags')`. Reprodus independent. De reîncercat după o actualizare
- [ ] **security.txt (4.6) — amânat prin decizie**: ar publica o adresă de e-mail; se face cu domeniul
- [ ] **Copia de siguranță e încă doar pe laptop** — de dus pe stick/Drive
- [ ] Partea 1, 2 și 5 (nume + domeniu, legare, Search Console, Web Analytics) — **blocate pe alegerea owner-ului**

**⚠️ Constatare mai importantă decât bifele: nu există conținut public.** `lib/entitlement.ts` are un
viewer `public` cu suport de teaser, dar **nicio rută nu-l construiește vreodată**; `material.tsx` cere
`isAdmin || isStudent`. Un vizitator anonim vede 6 pagini. Deci stiva de SEO e corectă și utilă
(linkul trimis pe WhatsApp arată acum ca lumea), **dar nu poate aduce trafic din Google, fiindcă nu e
nimic de indexat.** Următorul pas real e o decizie de conținut, nu una tehnică — de făcut cu spec + plan.

## Backlog (later phases)
- [ ] Public locked catalog + teasers + pay-per-material (Phase 4)
- [ ] AI teaching-structure generator (Phase 5)
- [ ] AI exam generator (Phase 6)
- [ ] Real content + video streaming cost approval (Phase 7)
- [ ] `new-subject` skill + biology shell demo (Phase 8)

## Conținut — Pedagogie: scheme de lecție + ghid metodologic ✅ (2026-08-16)
- [x] 22 de materiale în biblioteca profesorului, clasa a 9-a: 11 scheme de lecție + 11 ghiduri metodologice (perechi 1:1 pe temele programei)
- [x] Sursele `.pptx` convertite în PDF cu PowerPoint (COM, script one-off) — PDF-ul se randează în pagină (iframe), `.pptx`-ul rămâne atașat pentru descărcare/editare
- [x] Script nou `scripts/ingest-docs.mjs` (documente PDF/PPT/DOC ca tip `fisier`): materiale + traduceri + `material_assets` + upload R2, idempotent pe (grade, topic, slug), `--target local|remote`
- [x] Slug-uri prefixate `schema-*` / `ghid-*` — grade 9 avea deja `relieful-major`, `climatele-terrei` etc. în biblioteca elevilor
- [x] `profesor.m.$gradeId.$slug`: `viewOnly` devine `!isTeacherLib` — biblioteca de pedagogie e a profesorului, deci `.pptx`-ul se poate descărca; materialele elevilor rămân fără descărcare
- [x] Aplicat pe prod (R2 + D1 remote) și deployat
- [ ] „Zonele biogeografice" nu are nici schemă, nici ghid — rafturile au 11 poziții, nu 14

## Pedagogie — răsfoire ca o carte + Biosfera ✅ (2026-08-17)
- [x] Tip nou de randare: `prezentare` primește discriminatorul `kind: "pagini"` (tiparul de la jocuri); logică pură testată `lib/pagebook.ts` (6 teste), componentă `components/PageBook.tsx` — o pagină pe ecran, săgeți ‹ ›, taste stânga/dreapta, contor, preîncărcarea paginii următoare, animație de întoarcere care respectă `prefers-reduced-motion`
- [x] **Fără descărcare**: PDF-urile și `.pptx`-urile din prima variantă au fost scoase din materiale și șterse din R2
- [x] Uniformizare cromatică a schițelor: fundalul cald al „Terrei" pe toate, plus rotirea nuanțelor reci (165°–300°) spre teracotă cu păstrarea saturației/luminozității. Ce era deja cald a rămas neatins
- [x] Coperta ghidurilor: din bleumarin închis în culoarea paginii a doua **a fiecărui ghid**, text recolorat, insigna pusă pe pastilă bleumarin ca să rămână lizibilă
- [x] Materiale noi: **schița Biosfera** și **ghidul Biosfera** (poziția 11, înaintea Solului, ca în programă) → 12+12
- [x] 264 de pagini exportate la 1600px și trecute în WebP (51 MB → 12,5 MB); `scripts/ingest-pages.mjs` + `scripts/pptx-pages-to-webp.mjs`; rețeta în `content/pedagogie/README.md`
- [x] Copie de siguranță a `.pptx`-urilor originale în `Downloads/backup-pptx-2026-08-17/` înainte de suprascriere
- [ ] Limită cunoscută: panourile desenate ca **imagini** în schițe rămân reci pe alocuri — recolorarea lor mecanică ar strica codul de culori din interior (roșu/verde/portocaliu au înțeles)

## Retușuri pedagogie + două jocuri ✅ (2026-08-18)
- [x] Schițe: Terra fără pagina 8, Climatele terestre fără pagina 2 (ambele despărțitoare de secțiune), coperta Hidrosferei înlocuită cu cea trimisă, titlul „Alcătuirea litosferei" adus la o singură culoare
- [x] Ghiduri: insigna albastră scoasă de pe toate cele 12 coperți (era o imagine pentru fundal închis, ilizibilă pe crem)
- [x] Citire: materialele răsfoibile primesc toată lățimea (până la 1400px), rama se strânge pe pagină, înălțimea plafonată la `calc(100vh-21rem)` ca totul să încapă fără derulare, plus buton de **ecran complet**
- [x] Joc „Arhitecții reliefului": „riftare" → „fracturare/extensie tectonică" (o singură etichetă vizibilă; „vale de rift" și „Marele Rift African" rămân, sunt termeni consacrați)
- [x] Joc „Rotație sau revoluție": cele 16 cartonașe înlocuite cu panourile din PLANȘA 3 (9, rotație) și PLANȘA 4 (7, revoluție)
- [x] `slice-panels.mjs` are un mod nou **`boxes`**: găsește panourile ca blocuri distincte de pixeli, pentru planșele cu așezare neregulată, unde detecția pe benzi nu funcționează
- [x] Aplicat pe prod (R2 + D1 remote), 166 + 16 obiecte vechi șterse din R2, deployat

## Hărți în galerii + jocuri pentru Atmosferă ✅ (2026-08-18)
- [x] Galeria „Climatele Terrei": harta de ansamblu (poziția 0) înlocuită cu cea trimisă — același obiect R2, format WebP
- [x] Galeria „Zonele biogeografice": harta zonelor de vegetație adăugată ca **prima** imagine (indicii celorlalte decalate cu 1, legenda prinsă în captions)
- [x] Trei jocuri noi la `atmosfera-caracteristici-climatice` (pozițiile 20–22), din `jocuri atmosfera.docx`:
  - **Detectivul climatic** (`ordonare`) — trei lanțuri cauzale: inversiunea termică, seceta litorală dată de un curent rece, ploaia orografică și föhnul
  - **Arhitecții atmosferei** (`sortare`) — fenomene, gaze și regimuri de temperatură pe cele patru straturi
  - **Vânturile planetei** (`asociere`) — fiecare vânt cu direcția și cu vremea pe care o aduce, plus forța Coriolis
- [x] Test nou `lib/game-bodies.test.ts`: **fiecare** `game.json` din `content/games` trebuie să treacă prin `parseGameBody` (38 de jocuri acoperite)
- [ ] Documentul propunea și un **simulator cu glisoare** pentru „Arhitecții atmosferei" (dozezi gazele, praguri, cronometru de criză) și o **dezbatere pe tablă colaborativă** pentru „Summit-ul vânturilor" — niciunul nu are motor. Simulatorul ar fi un motor nou, de făcut cu spec + plan

## Tip nou de material: aplicații interactive ✅ (2026-08-18)
- [x] Tip `interactiv` în `subject.config` + ramură în `MaterialRenderer`; HTML-ul stă în corpul materialului
- [x] `components/InteractiveApp.tsx`: iframe cu **`sandbox="allow-scripts"` fără `allow-same-origin`** — aplicația rulează cu origine opacă, deci nu ajunge la cookie-ul de sesiune, la datele site-ului sau la restul paginii. Verificat în browser: `iframe.contentDocument` e blocat din pagina părinte
- [x] Câmp în formularul de admin („Codul aplicației"), cu avertisment despre ce înseamnă izolarea
- [x] Ambele rute de material dau lățime întreagă tipurilor care au nevoie (`prezentare`, `interactiv`); cartea se strânge pe pagina ei, aplicația ia toată lățimea
- [x] `scripts/ingest-interactive.mjs` (idempotent, căi relative la manifest) — **refuză fișierele care cheamă resurse externe**, fiindcă oricum n-ar merge în sandbox
- [x] Două aplicații publicate: **Înclinarea axei și anotimpurile** (Pământul – mișcări, poz. 23) și **Evadare din centrul Pământului** (Pământul – caracteristici, poz. 21)
- [ ] Limită asumată: aplicațiile nu pot salva scoruri în platformă (n-au acces la origine). Pentru evaluare rămân „Exersează" și temele

## Escape room-ul devine joc obișnuit + simulatorul pe telefon ✅ (2026-08-18)
- [x] „Evadare din centrul Pământului" nu mai e aplicație izolată, ci **joc `grila`** ca oricare altul:
  `content/games/pamant-evadare/game.json`, o rundă cu cele 5 straturi (nucleu intern → Moho). Aceleași
  texte și variante; stratul și adâncimea trec în linia de context a întrebării. Materialul rămâne la
  aceeași adresă — ingestul șterge și rescrie după (clasă, temă, slug), deci tipul devine `joc`
- [x] Motorul grilă primește câmpul opțional **`why`**: explicație pe fiecare variantă (de ce e greșită,
  de ce e cea bună). Când varianta corectă are explicație, jocul **nu mai sare singur** mai departe —
  apare „Mai departe →", ca elevul s-o apuce citită. Fără `why`, comportamentul de dinainte
- [x] `why` merge și prin editorul din admin (câmp sub fiecare variantă), deci o editare din UI nu mai
  pierde explicațiile; teste în `games.test.ts`, `game-editor.test.ts`, `game-content.test.ts`
- [x] Simulatorul „Înclinarea axei și anotimpurile" rescris pe **unități relative**: scena, Soarele și
  Pământul se măsoară din scenă (unități de container, cu măsura din ecran ca rezervă), nu în pixeli
  ficși. Încape tot fără derulare, și pe telefon vertical, și orizontal (două coloane sub 1:1)
- [x] Umbra (partea de noapte) se așază din CSS, nu din JavaScript cu `getBoundingClientRect` —
  nu mai poate rămâne în urmă la rotirea telefonului
- [x] **Ecran complet care merge și pe iPhone**: acolo browserul nu-l dă decât pentru video, așa că
  întindem noi rama peste pagină (portal pe `body`, fiindcă un strat animat cu `transform` ar fi
  „prins" un `position: fixed`). Buton de ieșire în colțul din dreapta-jos al ramei + tasta Esc
- [x] Explicațiile din simulator, aduse la lungimi apropiate: altfel scena sărea vizibil la mutarea cursorului

## Pregătirea lansării publice ✅ (2026-08-18)
Runbook în două limbi: `docs/08-public-launch-runbook.md` (EN) și `docs/08-runbook-lansare-publica.md` (RO).
Acoperă: cumpărarea domeniului `.com` de la Cloudflare Registrar (10,44 $/an — **prima cheltuială
recurentă**), legarea lui de Worker prin **Custom Domain** (nu Pages, nu Routes), TLS/HSTS, Turnstile,
tot ce lipsește unui site public (favicon, og:image, robots, sitemap generat, JSON-LD, security.txt,
fonturi găzduite local), Search Console + Cloudflare Web Analytics, și verdictul despre bani.

**Partea 0 — reparațiile de securitate blocante, făcute și verificate:**
- [x] **react-router 7.9.6 → 7.18.2** — 13 avertizări publicate (CSRF pe acțiuni, RCE neautentificat
  prin turbo-stream, DoS neautentificat, mai multe open-redirect → XSS). `npm audit --omit=dev`:
  **0 vulnerabilități**. Schimbare de rupere prinsă la actualizare: `future.unstable_viteEnvironmentApi`
  s-a stabilizat ca `future.v8_viteEnvironmentApi` (`react-router.config.ts`)
- [x] **Limitare pe „Exersează"** — `PRACTICE_LIMITER` (60/60s) pe `check`/`submit`, `NICK_LIMITER`
  (10/60s) pe `start`/`start-mistakes`/`tema:*`. Cheia **nu e IP-ul**, ci filigranul de sesiune (`wm`):
  o clasă întreagă stă în spatele unui singur IP de școală și s-ar fi blocat singură. Rămâne fail-open
- [x] **`lib/email.ts` nu mai scrie linkul de confirmare în jurnal în producție** — condiția era „nu
  există cheie", nu „suntem în dezvoltare"; linkul conține un token valabil 24h, iar jurnalele de
  producție sunt pornite. Acum: log doar în DEV; în producție fără cheie întoarce `error` (afișat deja
  de UI-ul de retrimitere) și scrie în jurnal un mesaj **fără token**
- [x] **`/iesire` nu mai e GET** — era `loader`, deci `<img src="/iesire">` de pe orice site putea da
  utilizatorul afară din cont. Acum e `action` POST; cele 4 locuri (AdminShell, TeacherShell, clasa,
  profesor) folosesc `<Form method="post">` cu aceleași clase și același text. GET-ul redirectează
  acasă fără să atingă cookie-urile. Verificat la rulare: GET nu trimite **niciun** `Set-Cookie`,
  POST le șterge pe toate trei
- [x] **Plasă de siguranță la publicare** — `deploy` rulează acum `typecheck` și testele înainte de build

Verificat: typecheck curat, **182 de teste trec**, `wrangler deploy --dry-run` cu toate cele patru
limitatoare legate.

**Rămase din runbook (nefăcute):** alegerea numelui + cumpărarea domeniului, Turnstile, tot Partea 4
(favicon/og/robots/sitemap/JSON-LD/security.txt/fonturi locale/prerender), Search Console, Web
Analytics, copiile de siguranță D1, și — dacă se dorește — spațiile proprii de promovare.

## Jocuri noi + inversiunea termică + majuscule la Exersează ✅ (2026-08-18)
- [x] **Evadare din inima Soarelui** (`universul-partea-2`, poz. 22) — escape room `grila` cu `why`, după
  tiparul „Evadare din centrul Pământului": nucleu → zona radiativă → zona convectivă → fotosferă →
  cromosferă → coroană, câte o barieră pe strat
- [x] **Alertă de teren** (`relieful-minor`, poz. 23) — `grila` pe trei cazuri, după tiparul „Alertă
  tectonică": vale glaciară în U, carst, relief eolian; ultima întrebare cere concluzia generală
- [x] **Două jocuri la Climatele Terrei**, ambele pe gândire critică:
  - **Verdict climatic** (poz. 21, `grila`) — dosare de stație meteo fără nume; două stații la aceeași
    latitudine cu climate diferite; deșert cu ceață explicat prin curent oceanic rece
  - **Dovada de la fața locului** (poz. 22, `sortare`) — nicio temperatură, doar urme: cum construiesc
    oamenii, ce spun plantele, ce se vede în peisaj
- [x] **Simulatorul „Înclinarea axei și anotimpurile" a devenit joc** (`grila`, aceeași adresă, poz. 23):
  dosarele A (23,5°), B (0°), C (90°) și D (același unghi, alt punct pe orbită). Păstrează provocările
  simulatorului — inclusiv capcana „vara e cald fiindcă ne apropiem de Soare", combătută cu ianuarie.
  Materialul `interactiv` a fost înlocuit de ingest (același slug); HTML-ul și intrarea din manifest,
  scoase — rămân în istoricul git
- [x] **„Momentele anului pe orbită" reformulat** — nu se înțelegea care e începutul anului. Acum scrie
  explicit „anul calendaristic, de la 1 ianuarie", iar reperele sunt „1 ianuarie" / „31 decembrie".
  Ordinea cartonașelor n-a fost atinsă (era corectă); runda sudică primește un indiciu în plus
- [x] **„Roca și familia ei" → „Matricea rocilor"** (`matrice`, 4 variante, după modelul Matricei
  lacurilor): 6 rânduri (grupele de roci) × 4 coloane (cum se formează / după ce o recunoști / exemple),
  cu alte celule lăsate libere în fiecare rundă
- [x] **Încă două jocuri la Alcătuirea litosferei**, pe situații concrete din natură:
  - **Ancheta pe teren** (poz. 21, `grila`) — statuia de calcar față de cea de granit, două roci din
    aceeași magmă, scoici la 2000 m altitudine
  - **Drumul unei roci** (poz. 22, `ordonare`) — granit → gresie, calcar → marmură, pădure → cărbune
- [x] **Inversiunea termică**, adăugată în lecția Atmosfera (secțiune sub „Temperatura" + punct în „De
  reținut"): cum se produce, Depresiunea Brașov, ceața, poluarea captivă, inversiunea de vegetație
- [x] **Majuscule la Exersează** — 14 rânduri, 50 de variante corectate. Două variante care începeau cu
  „pH" au fost **reformulate**, nu capitalizate (`PH-ul` ar fi fost greșit). Verificat pe remote: 0
  variante mai încep cu literă mică

Aplicat pe **remote** (D1 + R2). SQL-ul păstrat în `app/drizzle/atmo-inversiune.sql` și
`app/drizzle/caps-exerseaza.sql`. Local nu a fost actualizat.

## Echilibrarea variantelor + runde noi ✅ (2026-08-19)
- [x] **Problema semnalată:** varianta corectă era cea mai lungă, deci se ghicea din ochi. La
  „Înclinarea axei" era cea mai lungă la **7 din 8 întrebări (88%)**, față de ~25% cât dă hazardul
- [x] **Unealtă nouă: `app/scripts/check-game-balance.mjs`** — aceleași praguri ca la
  `check-option-balance.mjs` (Exersează): `spread ≤ 30`, `advantage ≤ 5` caractere. Fără argumente
  verifică toate jocurile `grila` din `content/games`; `--strict` iese cu cod de eroare
- [x] **Rescrise, cu variante de lungimi apropiate și 5 runde fiecare:**
  - **Înclinarea axei și anotimpurile** — 88% → **20%**; rundă nouă: planeta cu orbită alungită și axă
    dreaptă (distanța dă sezoane *globale*, nu opuse între emisfere — omoară confuzia cu distanța)
  - **Ancheta pe teren** — 83% → **20%**; anchete noi: casa care crapă pe argilă și fântâna sărată,
    apoi alegerea pietrei pentru o alee cu îngheț-dezgheț și marmura pentru statuie
  - **Alertă de teren** — 56% → **29%**; cazuri noi: faleza care se retrage (plus măsura care atacă
    într-adevăr cauza) și verdictul final, cu morenă sub dune ca dovadă a schimbării climei
  - **Verdict climatic** — 50% → **30%**; **scos cazul cu curentul oceanic rece** (se regăsea în
    „Detectivul climatic"). Stații noi: musonic (anul rupt în două), mediteraneean (frunze cerate) și
    temperat-arid de stepă, plus o rundă de sinteză
- [x] **Evadare din inima Soarelui** — nu fusese cerut, dar avea aceeași hibă (50%) → **0%**
- [x] La „Momentele anului pe orbită" **nu s-a schimbat nimic** — cerință retrasă
- [x] Pe cele 5 jocuri: **22% (11/50)**, 0 întrebări peste praguri. Aplicat pe remote și verificat

**Rămase cu aceeași hibă, neatinse (nu au fost cerute):** `evadare-din-centrul-pamantului` 60% (3
întrebări peste praguri), `alerta-tectonica` 44%, `recunoaste-profilul-de-sol` o întrebare peste prag.

## Echilibrate și cele trei jocuri mai vechi ✅ (2026-08-19)
- [x] **Evadare din centrul Pământului** — 60% → **0%**; cele 3 întrebări peste praguri, rezolvate
  (varianta corectă avea 94 de caractere față de 62 și 70 la o întrebare)
- [x] **Alertă tectonică** — 44% → **19%**; nicio întrebare nu depășea pragurile, doar frecvența era
  prea mare, așa că am lungit câte un distractor la patru întrebări
- [x] **Recunoaște profilul de sol** — o întrebare peste prag („molisol (cernoziom)" 19 caractere față
  de „podzol" 6); variantele au fost aduse la lungimi apropiate
- [x] **Toate jocurile `grila` din proiect**: 103 întrebări, varianta corectă e cea mai lungă în 17
  (**16,5%**, sub hazardul de ~25%), **0 întrebări peste praguri**. Aplicat pe remote și verificat

## Majuscule și în jocuri ✅ (2026-08-19)
- [x] Tot ce alege elevul într-un joc începe acum cu majusculă, pe toate cele 7 motoare: variantele de
  la `grila`, cartonașele de la `ordonare` și `sortare`, ambele coloane de la `asociere`, celulele de
  la `matrice`, etichetele de la `plaseaza-pe-harta` și punctele de la `harta-quiz`
- [x] **205 texte în 15 fișiere.** Înlocuire chirurgicală în text, nu reserializare — altfel 32 de
  fișiere s-ar fi reformatat degeaba. Fiecare fișier a trecut prin verificări înainte de scriere: JSON
  valid, structura neatinsă, iar la `asociere` **partiția pe grupuri păstrată** (la `relief-minor-planse`
  identificatorul de grup e chiar eticheta, deci s-a schimbat odată cu ea — perechile rămân grupate la fel)
- [x] Echilibrul variantelor n-a fost afectat (o majusculă are aceeași lățime): tot 16,5%, 0 depășiri
- [x] Verificat în producție pe toate cele 45 de jocuri: 0 texte mai încep cu literă mică

## Șters jocul duplicat + scanare de orfani ✅ (2026-08-19)
- [x] **Șters** `caracteristicile-pamantului-si-efectele-lor` (id `b1579ab7…`), copia veche a jocului
  „Caracteristicile Pământului și efectele lor". Rămâne `proprietati-si-consecinte`, care are fișier
  sursă în `content/games/pamant-caracteristici-asociere`. Elevii de a IX-a vedeau același joc de două
  ori, la aceeași poziție, iar copia veche avea și o definiție mai slabă la „declinația magnetică"
- [x] **Cauza:** ingestul șterge după (clasă, temă, slug). La o redenumire de slug, rândul vechi rămâne
  în bază fiindcă nimic nu-l mai indică. De reținut la orice redenumire viitoare
- [x] Fără assets în R2 pentru materialul șters, deci n-a rămas nimic orfan acolo
- [x] **Script de restaurare** păstrat: `app/drizzle/restore-joc-duplicat-2026-08-19.sql` (rândul
  complet, cu tot cu corp). Ștergerea în sine: `app/drizzle/delete-joc-duplicat.sql`
- [x] **Scanare completă:** 44 de jocuri în producție, **toate au fișier sursă**, **0 orfani**, **0
  poziții ocupate de două jocuri**. Niciun material `interactiv` rămas (simulatorul a devenit joc)

## Instanța liberă e live ✅ (2026-08-31)
- [x] **`catedra-liber` desfășurat** la `https://catedra-liber.geografie.workers.dev` (Version ID
  `a65953a9-7cf9-494d-861c-ee2688033a0b`). Același cod, același D1 (`catedra`), același bucket
  (`catedra-media`); comutatorul e `CLOUDFLARE_ENV=liber` la construcție
- [x] **Bindingurile confirmate în ieșirea deployului:** `DB (catedra)`, `MEDIA (catedra-media)`,
  `SITE_MODE ("liber")` și **toate cele cinci limitatoare drept `Rate Limit`**, nu „Unsafe Metadata" —
  capcana din 2026-08-20 e evitată
- [x] **Un singur secret pus:** `SESSION_SECRET`. Instanța liberă n-are admin și n-are înregistrare,
  iar `getSecrets` rezolvă leneș, deci nu cere `ADMIN_PASSWORD`/`SIGNUP_PASSWORD`. **Dacă `getSecrets`
  redevine vreodată eager, trebuie puse toate trei**, altfel „Începe testul" dă 500
- [x] **Testul care conta — site-ul vechi n-a fost slăbit.** Înainte de deploy: `/profesor/pedagogie`,
  `/clasa/9`, `/admin` → 302. După deploy: **aceleași 302**. Politica nu s-a scurs între instanțe
- [x] **Adminul nu există pe instanța liberă:** `/admin`, `/admin/login`, `/profesor`,
  `/profesor/login`, `/intra`, `/demo`, `/iesire`, `/clasa/9` → toate **404**
- [x] **Conținutul se vede:** `/`, `/elevi`, `/pedagogie`, un raft, paginile legale, `robots.txt`,
  `sitemap.xml` → 200. Un material → 200; imaginile din R2 se servesc (`image/webp`, 115 kB)
- [x] **Exersează nu scrie nimic:** `practice_attempts` avea 10 rânduri înainte și 10 după
- [x] **Sitemap curat:** zero adrese `/clasa/`, `/admin`, `/profesor`, `/demo`, `/intra`.
  `robots.txt` cere să nu fie indexat cât timp site-ul stă pe `workers.dev`
- [x] **Reparațiile din recenzia finală, verificate pe viu:** legătura „înapoi" din Exersează duce la
  `/elevi` (zero linkuri `/elevi/<id>`, care erau moarte); harta are adresă canonică pe temă
  (`/elevi/9/harta/pamantul-reprezentare-harti`, nu un literal); `?topic=` chiar se aplică
  (temă validă → preselectată; temă inventată → cade pe „Toată clasa", 200, fără eroare)
- [ ] **Rămâne de decis:** domeniu propriu (ca site-ul să poată fi indexat) și dacă instanța cu clase
  se stinge cândva. Vezi `docs/08-runbook-lansare-publica.md`, Partea 8
- [ ] **De cântărit (ADR-0008, urmarea):** `getSecrets` leneș înseamnă că un secret uitat pe instanța
  cu clase strică o singură rută, tăcut, în loc de tot site-ul, zgomotos. De adăugat eventual o
  verificare la pornire a secretelor de care are nevoie fiecare desfășurare

## Redesign „Cobalt" al instanței libere (2026-09-05) ✅

- [x] `themeLiber` definit — paletă cobalt/coral, jetoane `on-primary`/`on-accent`/`headingUi`
- [x] Instrument Serif + Public Sans găzduite local (`scripts/fetch-fonts.mjs`)
- [x] 47 de `text-white` de pe umpluturi de temă mutate pe jetoane
- [x] Antet și subsol unificate între instanțe
- [x] Marca „glob" + două seturi de icoane + manifeste generate
- [x] Fotografii PD/CC0 (`scripts/fetch-photos.mjs`, `content/site/SOURCES.md`)
- [x] Miniaturi de 400px în R2 (`scripts/gen-thumbs.mjs`) + `/media/:id?t`
- [x] Pagina de start, `/elevi`, `/pedagogie` refăcute
- [x] `motion/mini`, măsurat: +3,0 kB gzip
- [x] Teste de contrast (`lib/contrast.test.ts`), 441 de teste verzi
- [x] Desfășurat pe ambele instanțe, assets verificate

- [x] **Contrastele sitului cu clase reparate** (2026-09-05, la cererea proprietarei): cele
  patru perechi sub prag — alb pe butonul teracotă 2,95:1, `accent-strong` ca text 3,92:1, iar
  în modul întunecat alb pe butonul primar 3,07:1 și pe cel accent 2,40:1 — trec acum toate,
  prin jetoanele `on-primary`/`on-accent`. `DATORIE_STIUTA` e goală.
- [x] **Fundal cu adâncime și textură** pe ambele instanțe: pergament cald `#F0EDE6` (era
  `#F6F7FB`, la 6,9% sub alb, deci cardurile nu se separau de pagină), bleumarin `#111726` în
  mod întunecat (era aproape negru), plus `SiteBackdrop` — curbe de nivel pe toată fereastra,
  pe toate rutele.

## SEO — punerea în aplicare a `docs/09-seo-strategy.md` (2026-09-08) ✅

Domeniul, `robots.txt`, sitemapul și baliza erau deja live când s-a scris strategia
(punctele 1–4 din foaia de parcurs). Ce s-a construit acum e restul, tot codul:

- [x] `lib/jsonld.ts` + `components/Breadcrumbs.tsx` — temelia, cu 21 de teste
- [x] `LearningResource` pe materiale (elevi + pedagogie), hărți conceptuale și „Exersează"
- [x] `FAQPage` pe `/intrebari-frecvente`, dintr-o singură sursă cu lista vizibilă
- [x] `BreadcrumbList` + firimituri vizibile pe toate rutele de conținut
- [x] `EducationalOrganization` + `WebSite` + `Person` pe pagina de start
- [x] `/despre` — „Despre autoare", legată din subsolul fiecărei pagini, în sitemap
- [x] Titluri: start, `/elevi` (țintă „clasa a 9-a"), `/exerseaza` (poartă clasa)
- [x] Raft de materiale înrudite, perechea schemă↔ghid, legături între rafturi
- [x] Indexarea binarelor per bibliotecă (`mediaHeaders`), `Disallow: /media` scos
- [x] Cardul de previzualizare refăcut (`scripts/gen-og-options.mjs`)
- [x] `/pedagogie/:raft` nu mai trimite `body` (−43% pe proiecție)
- [x] Desfășurat pe ambele instanțe, assets și antete verificate pe producție

### Rămâne de făcut — acțiuni ale proprietarei, nu de cod

- [x] **Search Console — era deja făcut** (verificat în consolă, 2026-09-09). Proprietate de
      **domeniu** `sc-domain:geocatedra.com`, proprietar verificat Liliana Necula, **0 indicative
      de proprietate nefolosite** (adică jetonul TXT din DNS e chiar cel activ, fără resturi).
      Sitemap trimis pe 7 sept., recitit pe 9 sept., stare *Succes*, **158 de adrese descoperite**.
      **Atenție, strategia greșește aici:** TXT-ul NU e la Namecheap. Nameserverele domeniului
      sunt ale Cloudflare (`yisroel`/`laura.ns.cloudflare.com`), deci DNS-ul se administrează în
      Cloudflare, nu la registrar.
      Indexare cerută manual pentru `/despre` (pagină nouă, încă necunoscută de Google) și pentru
      `/` (titlul și imaginea de previzualizare s-au schimbat azi, iar recitirea grăbește
      împrospătarea rezultatului). Raportul „Indexarea paginilor" încă procesează date — normal
      pentru o proprietate de două zile.
- [ ] **ISJ Constanța** (isjcta.ro/geografie/): un singur e-mail prin care se cere
      adăugarea/actualizarea linkului. Nu e abordare la rece — numele autoarei e probabil
      deja acolo.
- [ ] **PROFESORI DE GEOGRAFIE** (Facebook): o singură postare, cu context real.
- [ ] **DigitalEdu**, apoi **RED Digitală**, apoi **didactic.ro**, apoi **GEOGRAFILIA** —
      câte una pe lună, în ordinea asta.
- [ ] **Edupedu.ro**: abia când există cifre reale de trafic de citat.
- [ ] **Harta contur a României, descărcabilă** — excepția semnalată de strategie de la
      politica „fără descărcare". Cere acordul explicit al proprietarei; NU se construiește
      din proprie inițiativă.

### Termene de calendar — deadline-ul e sezonul, nu terminarea conținutului

- [ ] **Aprilie 2027**: grupul de pagini pentru Bacalaureat, cu ANUL în titlu și în adresă,
      republicat în fiecare an. Vârful de căutări e în iunie; publicat în iunie e prea
      târziu, fiindcă indexarea are nevoie de avans.
- [ ] **Sfârșitul lui august**: conținutul de clasa a 10-a trebuie să fie live ȘI accesat de
      crawler înainte de vârful din septembrie pe „materiale geografie clasa a X-a". Adică
      munca de conținut se face în iulie–august, nu în timpul anului școlar.
- [ ] **Ianuarie**: ghidul de pregătire pentru olimpiadă, înaintea fazei județene din
      februarie–martie.

### Când intră clasa a 10-a — atunci, nu acum

Paginile per clasă (`/elevi/:gradeId`) NU se construiesc înainte de conținut. Azi ar fi o
copie aproape identică a lui `/elevi` (clasa a 9-a e singura cu materie publicată), iar două
adrese care se bat pe aceeași căutare fac mai mult rău decât lipsa uneia. O adresă goală nu
„îmbătrânește" în autoritate — Google fie o scoate, fie o tratează ca duplicat.

Ordinea, când vine momentul: se construiesc `/elevi/:gradeId`, ținta pe clasă se MUTĂ pe ele,
iar `liber.elevi.seo` se lărgește la termenul-umbrelă. `/elevi` nu-și schimbă adresa, deci nu
e nevoie de nicio redirectare.
