# SEO Strategy — geocatedra.com

Compiled 2026-09-08 by 4 parallel research subagents (keyword research + competitor
deep-dive, technical SEO/schema, on-page/E-E-A-T, backlinks/authority) plus synthesis.
Context at the time: `geocatedra.com` bought 2026-09-07 (one day old, zero backlinks,
zero ranking history). `catedra-liber` is the public, no-login instance that's actually
indexable; the classes instance (`catedra`) is gated by design and irrelevant to SEO.

**Reality check, stated up front so it doesn't get lost:** no one can promise "#1 for any
keyword" — a one-day-old domain with zero backlinks sits in Google's trust-building period
regardless of on-page quality. The realistic target is: beat **toporopa.eu** broadly (it has
zero Romanian-curriculum content) and beat **geogra.org** specifically on the intersections
it doesn't cover (teacher pedagogy, curriculum-tied MCQ tests, grade-specific long-tail)
within ~90 days; the harder head term "jocuri geografie" is a 6–12 month campaign.

## Competitors (real, checked against actual search results)

- **geogra.org** — real Romanian company (Mureșan Alexandru PFA), native RO copy,
  curriculum-aware (BAC/Evaluare Națională framing), free accounts + leaderboard. **But: one
  single game mechanic repeated ~23 times** (click-on-blank-map: 9 world, 8 Europe, 6
  Romania), no teacher content, no MCQ test bank. Est. 100–250 indexed pages. **This is the
  competitor to beat.**
- **toporopa.eu** — 15-language template site, Romanian is a thin machine-style translation
  layer, content is EU-centric (capitals/flags/currencies) — **zero Romania-curriculum
  content** (no relief units, no județe, nothing tied to the Romanian syllabus). Same single
  click-on-map mechanic, no variation. Est. 200+ indexed pages but thin/duplicated across
  languages. Weakest of the two, easiest to displace on anything curriculum-specific.
- **Your structural advantage**: 4 distinct game engines (not 1) — hartă-quiz, asociere,
  ordonare, plasează-pe-hartă — plus a full MCQ practice bank plus a teacher pedagogy
  library (scheme de lecție, ghid metodologic, proiecte, studii de caz Dobrogea,
  teste-model). **Neither competitor has teacher content at all.**

## 90-day roadmap

### Immediate (Days 1–30) — go live, don't leak the old host
1. Bind `geocatedra.com` as a **Cloudflare Custom Domain** on the Worker (not Pages, not
   Routes) → add `www` redirect (301, pick apex as canonical) → TLS Full-strict → HSTS with
   a short `max-age` first, raise later. **DNS change — needs explicit sign-off on which env
   (`liber` vs `clase`) gets the apex before anyone touches this.**
2. Verify `robots.txt`/`sitemap.xml` flip to the real policy on the new host (`curl` check);
   confirm `*.workers.dev` still shows `Disallow: /`.
3. Only after step 2 passes: Search Console **domain property** verification (DNS TXT at
   Namecheap, covers apex+www+future subdomains) + submit `sitemap.xml`.
4. Enable Cloudflare Web Analytics (`CF_BEACON_TOKEN`, `liber` env only). **This flips the
   live `/confidentialitate` and `/cookie-uri` text from conditional to active — needs
   explicit owner confirmation, it's a legal-text trigger, not just a config flag.**
5. Add `FAQPage` JSON-LD to `/intrebari-frecvente` and `LearningResource` JSON-LD to
   material pages (specs below) — no UI change, immediate schema coverage.
6. **Update the ISJ Constanța geography page** (isjcta.ro/geografie/) — the owner may
   already be listed there as a resource coordinator ("Prof. Liliana Necula"); ask them to
   add/refresh the link. One email, not cold outreach.
7. Audit `/pedagogie/:collection` and game-list loaders for the same over-fetch bug `/elevi`
   had before the fix (466KB → 147KB) — Core Web Vitals compounds with everything else.

### Medium-Term (Days 31–60) — content on open ground
8. Publish/optimize pages for the uncontested long-tail cluster: per-grade "jocuri
   geografie clasa a X-a", "materiale geografie clasa a X-a", "studiu de caz Dobrogea
   geografie" — near-zero competition, content already built.
9. Add breadcrumbs + related-material rail + shelf cross-links (spec below) — turns 5
   isolated pedagogy shelves into an internally-linked mesh; matters more than backlinks
   at this stage.
10. Add an "Despre autoare" page (real name, years teaching, credentials) — the highest-
    leverage E-E-A-T signal available for a solo-teacher site, currently missing entirely.
11. Share the pedagogy library once, with real context, in the "PROFESORI DE GEOGRAFIE"
    Facebook group; submit to DigitalEdu and RED Digitală (OER directories).

### Authority (Days 61–90) — once there's real traffic to point to
12. Submit to didactic.ro's external-resource listing; pitch GEOGRAFILIA
    (geografilia.blogspot.com) for a future "aplicații digitale gratuite" roundup.
13. Pitch Edupedu.ro a short "teacher builds free geography platform" story — only once
    there are real usage numbers to cite.
14. Prep the **Bacalaureat content cluster** ("teste geografie bacalaureat 2027") for an
    **April publish** with the year in title/URL, refreshed yearly — highest-volume
    seasonal spike, needs a running start (profesorjitaruionel.com wins this yearly by
    updating the year).
15. Decide explicitly on the one flagged exception: a single free downloadable blank
    outline map of Romania as deliberate link-bait. **This contradicts the current
    no-download/anti-piracy policy on purpose — owner sign-off required, not assumed.**

## Keyword table (25+ queries, intent/tier/notes)

| Query | Intent | Tier | Notes |
|---|---|---|---|
| jocuri geografie online gratis | Info/Nav | High | Crowded: Pomu, Wordwall, Geogra.org, Profu' de Geogra, PurposeGames. Hard head term. |
| jocuri geografie clasa a 5-9-a | Info | Med | Grade-modified long-tail, thinner competition than the bare head term. Best entry point. |
| harta interactivă geografie România | Info/Nav | Med | Profu' de Geogra + Geogra.org own it; plaseaza-pe-harta/harta-quiz engines map directly. |
| joc harta județelor României | Info | Med | Niche, low competition beyond the 2 incumbents. |
| materiale geografie clasa a 9-a | Info | Med-High | Dominated by scanned PDFs (Scribd, Academia.edu) — a real hub beats scans on UX. |
| materiale geografie clasa a 5-8-a | Info | Med | Same pattern; didactic.ro + Mărculeț fișe dominate, all static PDF. |
| fișe de lucru geografie clasa a 5-a | Info | Med | didactic.ro + workbooks rank; good Image Pack target. |
| teste geografie bacalaureat rezolvate | Info/Trans | High | Heavily contested, seasonal spike Feb–June. |
| subiecte bacalaureat geografie 2027 | Nav | High | Year-in-query pattern — must republish yearly. |
| grile geografie bacalaureat online | Trans | Med | Direct incumbent: Gabriel's "GeoBac". |
| test geografie clasa a 9-a online gratis | Trans | Low-Med | Thin competition, exerseaza engine is a near-perfect match. |
| exerciții geografie online cu răspuns | Info | Low | Low competition, good intent match for /exerseaza. |
| schema de lecție geografie exemplu | Info | Med | Old static docs dominate, no interactive UX incumbent. |
| proiect de lecție geografie liceu | Info | Med | Per-grade proiect pages (10 already built) can target long-tail variants. |
| ghid metodologic geografie profesor | Info | Med | geo-sgr.ro, didactic.ro rank; institutional tone needed. |
| cum să predai geografia prin jocuri | Info | Low-Med | edict.ro/didactic.ro own this; a methodology article citing your own engine fits naturally. |
| jocuri didactice geografie gimnaziu | Info | Med | edict.ro is the strongest single incumbent. |
| studiu de caz Dobrogea geografie | Info | **Low** | Very thin SERP — easy win, direct content match (4 case studies built). |
| studii de caz geografie clasa a 9-a | Info | **Low** | Same cluster, low competition, strong content match. |
| olimpiada de geografie subiecte | Info/Nav | High | Official sources dominate — compete on "cum te pregătești" angle instead. |
| pregătire olimpiada geografie clasa a 9-a | Info | Med | Thinner than bare "subiecte"; realistic prep-guide target. |
| evaluare națională geografie | Nav | — | **Drop** — geography isn't an Evaluare Națională subject, false seasonal signal. |
| ce este geografia fizică | Info | Low-Med | Wikipedia RO dominates definition intent; good Featured Snippet target with a tight 40-60 word definition. |
| geografie clasa a 9-a materiale programa nouă | Info | **Low** | Matches the site's own recent grades-10-12 fix; near-zero dedicated competition. |
| joc plasare pe hartă geografie | Info | **Low** | No dedicated competitor found for this specific mechanic name. |
| test inițial geografie clasa a 9-a | Info | Low | Knowunity is the only real incumbent; thin field. |
| manual geografie clasa a 9-a pdf | Info/Trans | High | Piracy-adjacent SERP (Scribd/Academia.edu/Archive.org) — probably not worth chasing. |
| geografie clasa a 10-12-a materiale | Info | Med | Less didactic.ro depth for liceu than gimnaziu — opportunity. |
| joc asociere geografie (relief, clima) | Info | Low | Wordwall owns generic templates, but Romanian-curriculum-specific content is thin. |
| resurse geografie profesor gimnaziu | Info | Med | didactic.ro dominant; grade+topic long-tails under it are open. |
| întrebări frecvente geografie clasa a 9-a | Info | **Low** | Matches `/intrebari-frecvente`; essentially uncontested as phrased. |
| rebus geografic clasa a 5-a | Info | Low | Niche but real, easy content, low competition. |

### Seasonal calendar
- **June** (Bacalaureat/Evaluare Națională window): massive spike on bac-test queries.
  Publish/refresh by **April**, keep the year in title/H1.
- **September** (start of year): spike on "materiale geografie clasa a X", "planificare
  geografie".
- **February–March** (Olimpiada de Geografie, faza județeană): spike on prep queries —
  publish a prep-guide by January.
- **December/June** (semester exams): generic "teste geografie clasa a X" spikes.
- Geography has **no Evaluare Națională component** — don't build for that false signal.

### Featured Snippet / PAA / Image Pack targets
- Definition queries ("ce este geografia fizică") → a tight 40-60 word definition paragraph.
- "Cum se predă geografia prin jocuri" → PAA-friendly FAQ block, one Q per game engine.
- Schema de lecție pages → PAA magnet if pages carry a visible objectives/steps table
  (needs a crawlable HTML summary, not just page-book images).
- Map/relief/climate diagrams → Image Pack is realistic since the generated maps/climograms
  are original CC0 images (unlike competitors' old scans) — needs descriptive alt text +
  a standalone image landing page (game images aren't currently indexable as standalone
  assets).

## Technical SEO spec

### Domain go-live order (strict — don't skip ahead)
1. Cloudflare Custom Domain (Worker, not Pages/Routes) → DNS + cert auto-provisioned.
2. `www` redirect (301) to apex, or a second Custom Domain — pick one canonical host.
3. TLS Full (strict), Always Use HTTPS, HSTS short `max-age` first, raise after a clean day.
   **Don't preload HSTS on day 1 — essentially non-reversible for months.**
4. Re-verify `robots.txt`/`sitemap.xml` real policy on the new host; confirm `workers.dev`
   still disallows.
5. Search Console domain property (DNS TXT), verify.
6. Submit sitemap — only after step 4, otherwise false "blocked by robots.txt" errors linger.
7. `CF_BEACON_TOKEN` secret on `liber` env, redeploy — last, flips privacy-policy claims live.

### JSON-LD — student/teacher material page
```html
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "LearningResource",
  "name": "Relieful României — Câmpia Română",
  "description": "Lecție despre formarea și caracteristicile Câmpiei Române.",
  "url": "https://geocatedra.com/elevi/9/m/campia-romana",
  "learningResourceType": "Lecție",
  "educationalLevel": "Clasa a IX-a",
  "inLanguage": "ro",
  "isAccessibleForFree": true,
  "audience": { "@type": "EducationalAudience", "educationalRole": "student" },
  "provider": { "@type": "EducationalOrganization", "name": "Geo-catedra", "url": "https://geocatedra.com" },
  "about": { "@type": "Thing", "name": "Geografia României" }
}
</script>
```
Teacher pedagogy page: same shape, `educationalRole: "teacher"`, `learningResourceType:
"Schemă de lecție"`, add `isPartOf: { "@type": "Collection", "name": "Scheme de lecție" }`.

### MCQ practice pages — pragmatic approach
Schema.org has no first-class `Quiz` type — don't invent one. Mark the page as
`LearningResource` with `interactivityType: "active"`, `learningResourceType: "Practice
test"`. **Do not** emit per-question `Question`/`acceptedAnswer` JSON-LD — correct answers
must never reach the client (existing invariant in `lib/questions.ts`); markup would either
leak answers in page source or require a fake accepted-answer, both wrong.

### FAQPage — `/intrebari-frecvente`
```html
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": [
    { "@type": "Question", "name": "…", "acceptedAnswer": { "@type": "Answer", "text": "…" } }
  ]
}
</script>
```
Generate from the same array that renders the visible FAQ list — single source of truth,
never hand-duplicate text.

### Internal linking (no URL changes)
- Breadcrumbs on every material/game page: `Acasă → Elevi → Clasa {gradeId} → {titlu}` and
  `Acasă → Pedagogie → {collection} → {titlu}`.
- Related-material rail on `/elevi/:gradeId/m/:slug`: 3-4 links within the same `topic_slug`,
  reuse the already-slimmed 7-field projection, don't add a new fat query.
- Shelf cross-links on `/pedagogie/:collection`: link each lesson-scheme to its paired
  methodology guide (already 1:1 per programă) and to the matching student material.
- Grade hub → link out to `/exerseaza` and inline games, not just static materials.
- FAQ answers that reference "cum găsesc materiale" → deep-link to `/elevi` and `/pedagogie`.

### Core Web Vitals — next steps beyond the `/elevi` fix
1. Audit `/pedagogie/:collection` and game-list loaders for the same over-fetch pattern
   (full `MaterialView`/game JSON body leaking into list views).
2. Explicit `width`/`height` (or `aspect-ratio`) + `?t` thumbnail on every list/card image —
   kills CLS, cuts payload. Likely recurring in teacher shelf cards and game-selection grids.
3. Homepage hero LCP: `<link rel="preload" as="image">` on hero photos (extend the existing
   font-preload pattern), served at actual rendered size, not full mockup-crop resolution.

## On-page blueprint

### Title tag formulas (fit the existing `${title} — Geo-catedra` suffix)
- Grade library: `Geografie clasa a 9-a — materiale, jocuri și teste — Geo-catedra`
- Material page: `{Titlu lecție} — clasa a {N} — Geo-catedra`
- Game page: `{Titlu joc} — joc interactiv de geografie — Geo-catedra`
- Pedagogy shelf: `{Nume raft} — resurse pentru profesorii de geografie — Geo-catedra`
- FAQ: `Întrebări frecvente — Geo-catedra`

### Meta description formulas (~150-160 chars, warm plain tone per project voice rules)
- Grade library: „Lecții, jocuri și teste de geografie pentru clasa a 9-a, gratuite și fără
  cont. Alege un capitol și învață în ritmul tău."
- Material: „{Titlu} explicat simplu, cu imagini și exemple, pentru clasa a {N}. Citește
  lecția și testează-te apoi cu întrebări din capitol."
- Game: „Joacă {titlu joc} și exersează {tema}, direct în browser, fără descărcare."
- Pedagogy shelf: „{Nume raft} pentru ora de geografie, pregătite de o profesoară cu
  experiență la clasă."
- FAQ: „Răspunsuri clare la întrebările frecvente despre Geo-catedra: ce conține, cum se
  folosește și pentru cine e gândit site-ul."

### Heading structure — material page (page-book format, no long-form body)
H1 = title. H2 „Despre ce e vorba" (2-3 sentences, the one real indexable text block besides
the title — put keywords here). H2 „Răsfoiește lecția" (wraps the page-book; each page image
needs a descriptive `alt`, not "pagina 3"). H2 „Testează-te" (CTA to Exersează). Optional H2
„Alte lecții din acest capitol" (H3 per related title).

### Pedagogy shelf listing page
H1 = shelf name. H2 „Ce găsești aici" (short format explainer). H2 per grouping (usually
grade) with material links below — H3 per title only if the list is short, otherwise plain
semantic links to avoid flattening the hierarchy.

### E-E-A-T blueprint
- **„Despre autoare" page** (footer link, every page): real name, years teaching, grades
  taught, optionally a photo — strongest Experience/Expertise signal available.
- Signature on each pedagogy shelf: „pregătit de {nume}, profesoară de geografie".
- Explicit curriculum-year alignment on library pages ("conform programei 2024") —
  freshness signal, cheap to maintain.
- A short „Surse" list on lessons with factual claims (extends the existing
  `content/*/SOURCES.md` image-provenance principle to text).
- A short, honest explanation of why materials aren't downloadable (framed as protecting
  the work, not a legal disclaimer) — builds trust through transparency.
- Fill in `contactEmail` (currently empty) — a site with no visible contact path scores
  lower on Trust, both algorithmically and to a human reviewer.

### 3 worked examples
- **Homepage**: `Geo-catedra — lecții, jocuri și teste de geografie, gratuit` /
  „Geografie pentru clasele 5-12, explicată simplu: lecții, jocuri interactive și teste,
  gratuite și fără cont. Învață în ritmul tău, oricând."
- **Grade 7 library**: `Geografie clasa a 7-a — materiale, jocuri și teste — Geo-catedra` /
  „Lecții, jocuri și teste de geografie pentru clasa a 7-a, gratuite și fără cont."
- **FAQ**: `Întrebări frecvente — Geo-catedra` / „Răspunsuri clare la întrebările frecvente
  despre Geo-catedra: ce conține, cum se folosește și pentru cine e gândit site-ul."

## Backlinks / authority (free, ethical only — no budget, no link schemes)

### Real targets found
1. **ISJ Constanța – secțiunea Geografie** (isjcta.ro/geografie/) — may already list the
   owner ("Prof. Liliana Necula") as a resource coordinator. Ask: update/add the link.
2. **PROFESORI DE GEOGRAFIE** (facebook.com/groups/PROFESORIGEOGRAFIE) — share the pedagogy
   library once, with genuine context.
3. **Profu' de geogra'** (facebook.com/profudegeogra, profudegeogra.eu, 51k+ followers) —
   suggest a mutual mention or tool recommendation.
4. **didactic.ro** — submit as an external-resource listing (link-only, fits no-download
   policy — check their submission rules).
5. **GEOGRAFILIA** (geografilia.blogspot.com) — already curates "10 aplicații digitale
   gratuite" roundups; pitch for a future one.
6. **RED Digitală** (red-digitala.ro) — 2025-founded OER platform, explicitly invites
   teacher-authored submissions.
7. **DigitalEdu** (digitaledu.ro/platforme-educationale) — 7000+ link aggregator by subject.
8. **Facultatea de Geografie, Universitatea din București** — low priority, low probability,
   only if a case-study post is genuinely citation-quality.
9. **Edupedu.ro** — pitch a short story once there's real traction (visits/testimonials),
   not on day one.
10. Other county ISJ geography pages — same ask pattern as #1, wherever the owner has
    existing standing.

### Linkable assets that respect the no-download policy
- The playable `plaseaza-pe-harta`/`harta-quiz` pages themselves (rare: playable, not just
  displayed).
- Dobrogea case-study pages — regional specificity + teacher-authored rigor, citable by
  ISJ Constanța and Dobrogea-area schools.
- The FAQ/glossary page — natural "resurse utile" list target.
- The teste-model page — verified, curriculum-ordered, citable reference for teachers
  building their own test banks.

### Flagged exception (owner approval required, not assumed)
One free downloadable blank outline map of Romania (contur mut, no answers) — the single
most-linked asset type in Romanian geography-teacher circles. Deliberately contradicts the
current anti-piracy/no-download policy; would need to be visually/technically distinct from
any paid-model material. **Do not build without explicit sign-off.**

### 90-day outreach sequence (realistic for a solo non-technical teacher)
Month 1: update ISJ Constanța listing → share once in PROFESORI DE GEOGRAFIE → submit to
DigitalEdu. Month 2: submit to RED Digitală → submit to didactic.ro → message GEOGRAFILIA.
Month 3: pitch Edupedu.ro (once there's traffic to cite) → reassess and decide on the
blank-map exception with the owner.

### Explicit warnings
No paid directory listings, no link exchanges, no PBNs, no mass outreach emails, no paid
"guest post" placements — all violate Google's link-scheme guidelines and don't fit a solo
operator. Every tactic above is a single, personal, no-cost ask.

## Open decisions (need the owner, not autonomous action)
- Which Worker/env gets the `geocatedra.com` apex (Custom Domain binding).
- Whether/when to flip `CF_BEACON_TOKEN` on (changes live privacy-policy claims).
- Whether to approve the one blank-map download exception to the no-download policy.
