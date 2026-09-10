# ADR-0003: Subject-Agnostic Architecture (geography = instance #1)

- **Status:** Proposed
- **Date:** 2026-06-25

## Context

Geography is the first instance of a reusable product. The owner must be able to spin up a new
subject (e.g. biology) by creating a new instance from a template and swapping config + content,
without rewriting code. A reviewer should `grep -ri geograph` and find nothing outside
config/content (§10).

## Decision

1. **Reusable artifact = the codebase as a Git template repository.** "Redoing" the site =
   create a new project from the template, not copy-paste.
2. **Config-driven:** a single `subject.config` (+ locale files + seed data) drives subject name,
   labels/terminology, branding (name, colors, logo, fonts), grade range, taxonomy, enabled
   material types, theme presets, and all user-facing strings. Application code reads config;
   it contains **zero** literal references to "geography."
3. **Engine vs. content separation:** engine = roles, tokens, payments, access control, AI, UI,
   theming. Content = materials, taxonomy, sample/real data. Swapping content never touches engine.
4. **`new-subject` setup skill** (Phase 8): copy template → apply new `subject.config` → clear
   geography content → seed empty taxonomy.

## Acceptance test (Phase 8)

Generate a blank **biology shell** from the template with biology branding/taxonomy and **no
geography remnants**; confirm `grep -ri geograph` is clean outside config/content.

## Consequences

- Theming (fonts/colors) is wired into `subject.config` so each instance can look different and
  the owner can tweak without code changes (also satisfies §11's themeable requirement).
- Continuous discipline every phase (not a Phase-8 retrofit): no subject literals in engine code.
