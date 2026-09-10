# ADR-0002: i18n Readiness (Romanian now, English additive later)

- **Status:** Proposed
- **Date:** 2026-06-25

## Context

Launch is Romanian-only. English is a planned future phase and is **not** a locale switch:
the educational materials themselves must be translated with pedagogical accuracy. We must
architect for it now so adding English is additive, not a rewrite (§7.0).

## Decision

Separate **content text** from **presentation**, and key all human-readable text by `locale`:

- **Content text** (titles, bodies, taxonomy labels) → `*_translation` tables keyed by `locale`.
- **UI strings** → locale message files (e.g. `ro.json`), never hardcoded in components.
- **Assets** may be locale-specific (`material_asset.locale`) or locale-agnostic (null).
- Launch seeds `ro`. Adding `en` = insert `en` translation rows + an `en.json` + (real work)
  human-reviewed content translation. No schema change.

## Consequences

- Every render path resolves text by active locale, defaulting to `ro`.
- The English content effort is treated as a real translation workload (AI draft + human review),
  scheduled as its own future phase — not part of launch.
- A material with no translation in the active locale falls back to `ro` (never blank).
