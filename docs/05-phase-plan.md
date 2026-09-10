# Phase Plan & Checkpoints

Status: **Phase 0 in progress.** Each phase ends at a **gate** where I summarize done/next/needs.

| Phase | Goal | Gate / your decision |
|---|---|---|
| **0 — Discovery & architecture** *(now)* | All `/docs` deliverables; validate Cloudflare; cost estimate | **You approve before any code.** Also confirm: web framework (ADR-0004), engine name |
| **1 — Foundation + Student experience** *(priority #1)* | Scaffold, role routing, library data model, admin token generator, full **token → grade** flow with server-side enforcement + watermark, on **sample content** | **Sub-gate:** pick 1 of 2–4 design directions (fonts+palette+mood) before visuals lock |
| **2 — Admin content management** | Plain-Romanian tools for her to add/organize materials; **ingest skill per material type** | Review the admin UX on sample content |
| **3 — Teacher accounts + payments** | Subscriptions, two library sections, view-only/no-download | Confirm pricing + Netopia (currently TBD) |
| **4 — Public + payments** | Locked catalog, teasers, subscription + pay-per-material | Confirm public pricing (TBD) |
| **5 — AI: teaching-structure generator** *(deferred per your call)* | Retrieval over her catalog | Confirm AI provider + privacy (TBD) |
| **6 — AI: exam generator** *(deferred, separate)* | Grounded on her real exams | Confirm approach + privacy (TBD) |
| **7 — Content loading** *(last)* | Replace placeholders with real materials; turn on **video streaming** | Approve video cost (Cloudflare Stream) before enabling |
| **8 — Templatize for reuse** | "New subject" setup skill + guide; prove with a **blank biology shell**, no geography remnants | Accept the reusability demo |

## Ordering notes (justifying deltas from the brief)

- **Design-direction choice** is an explicit **sub-gate inside Phase 1**, before visuals lock.
- **Subject-agnostic discipline is continuous**, not a Phase-8 retrofit: every phase keeps
  geography out of engine code, so Phase 8 is *proof + setup skill*, not a rewrite.
- **AI (5–6) and video (within 7) are deferred** per your instruction; they're independent and
  slot in without blocking the student/teacher/public path.

## Definition of done for Phase 0 (tracking)

- [x] Plain-language overview (`00`)
- [x] Architecture + stack + Cloudflare validation (`01`)
- [x] Data model + i18n/subject-agnostic readiness (`02`)
- [x] Role × permission × material matrix (`03`)
- [x] Honest anti-piracy strategy (`04`)
- [x] Phase plan with checkpoints (`05`)
- [x] Planned skills list (`06`)
- [x] Open-questions answers + remaining TBD (`07`)
- [x] Cost ledger (`costs.md`)
- [x] ADRs: hosting, i18n, subject-agnostic, framework, token model (`adr/`)
- [ ] **Your approval to start Phase 1** ← the gate
