# ADR-0007: Visual Theme (default for the geography instance)

- **Status:** Accepted (owner choice, 2026-06-25)
- **Date:** 2026-06-25

## Context

Per §11, the owner chose the look from previews rather than having it imposed. The theme must
be wired into `subject.config` so it is tweakable later and swappable per future subject.

## Decision

A custom blend the owner selected:

- **Heading font:** `Spectral` (serif) — from direction #10 "Mediteran"
- **Body/text font:** `Inter` (sans-serif) — from direction #1 "Atlas"
- **Palette:** "Mediteran" (warm, welcoming)

| Token | Value | Role |
|---|---|---|
| `--color-bg` | `#FDF6EC` | warm cream background |
| `--color-surface` | `#FFFFFF` | cards/surfaces |
| `--color-ink` | `#22333B` | primary text (deep teal-slate) |
| `--color-muted` | `#5C6B73` | secondary text |
| `--color-primary` | `#2A6F97` | azure — primary actions/links |
| `--color-accent` | `#E07A5F` | terracotta — accents/highlights |
| `--color-highlight` | `#F2CC8F` | sand — soft highlights/badges |
| `--color-border` | `#22333B1f` | hairline borders |
| `--font-heading` | `'Spectral', serif` | headings |
| `--font-body` | `'Inter', system-ui, sans-serif` | body |

**Mood:** calm, warm, welcoming — credible for teachers/public yet friendly for students.

## Implementation

- These become CSS custom properties driven by `subject.config.theme`. No color/font literal in
  components — they read the tokens. (Satisfies §10 themeability + §11.)
- Fonts loaded via self-hosted or Google Fonts; `Inter` and `Spectral` only.
- A future subject instance overrides `theme` in its own `subject.config`.

## Consequences

- One source of truth for the look; owner can tweak tokens without touching components.
- Reduced-motion and contrast handled at the design-system layer (§11 accessibility).
