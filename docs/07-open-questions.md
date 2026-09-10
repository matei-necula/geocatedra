# Open Questions — answers & remaining TBD

## §7.0 Locked (build around; do not re-ask)

Romanian-only at launch; English = future *content-translation* phase (i18n-ready now);
Cloudflare-first (validated, see `01`); free-first / flag-and-ask before paid; subject-agnostic.

## §7.1 — Answered (this session, 2026-06-25)

| # | Question | Answer |
|---|---|---|
| 1 | Scale | **≤30 students concurrently** in first stage; post-launch unknown |
| 2 | Web or mobile | **Web only** at launch |
| 3 | Token model | **One shared token per class**, unlocks **the class's whole grade**, expires **15 June** (end of school year) |
| 4 | Student data | **Token only** — no student accounts, no student PII |
| 5 | Legal entity / data controller | **The teacher (your mother) personally** |
| 6 | Payment provider | **Netopia** (preferred) — **deferred**, decided after the student section. **TBD** |
| 7 | Pricing | **TBD / placeholders**, marked clearly |
| 8 | AI provider & privacy | **Deferred to the end**, kept separate — **TBD** |
| 9 | Maintenance | **The teacher**, with **occasional help from you** |
| 10 | Video streaming | **Deferred to the end** |

## Remaining TBD (do not block Phase 1; revisit at their phase)

- **Pricing numbers** for teacher / teacher-pedagogy / public sub / pay-per-material → Phase 3–4.
- **Netopia** account, RON currency, invoicing/VAT, Romanian tax handling → Phase 3.
- **AI provider + whether her materials may go to a third-party API** → Phase 5–6.
- **Video cost approval** (Cloudflare Stream) → Phase 7.
- **GDPR posture** for teacher/public accounts (data controller = your mother personally) →
  needs a simple privacy policy + minimal-data design before accounts go live (Phase 3).

## Decisions I need at the Phase 0 gate (before any code)

1. **Approve the architecture & Phase 1 start.**
2. **Web framework** — I recommend **SvelteKit** (lean, great Cloudflare fit, low maintenance);
   alternative is a React stack (Remix/Astro) if you/your helper prefer React. (ADR-0004.)
3. **Engine name** — "Catedra" is a working placeholder; keep or rename.
