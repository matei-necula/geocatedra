# Animation & interaction polish — plan

Branch: `polish/animations` (baseline preserved on `main`, commit `8acc47d`).
Chosen via the live showcase (`docs/design/animations-showcase.html`).

## Decisions
- **Page transitions:** Fade + Zoom, via the **View Transitions API** (`viewTransition` on key
  `<Link>`s + `::view-transition-*` CSS). Degrades to instant navigation where unsupported.
- **Entrance:** **staggered cascade** on catalog grids (each child rises with an increasing delay).
- **Hover:** **glow** — a colored ring + tiny lift on interactive cards.
- **Intensity:** **differentiated by role** — student-facing pages get a `motion-playful` wrapper
  (accent-colored, slightly stronger glow + springier easing); teacher/public/admin/landing stay subtle.
- **Accessibility:** everything is wrapped by the existing `prefers-reduced-motion` guard, plus a
  reduced-motion override that disables view transitions. No layout shift, no perf-harming motion.

## Implementation
- `app/app/app.css`: add `.stagger`, `.glow`, `.motion-playful` overrides, and
  `::view-transition-old/new(root)` keyframes (`vt-in` fade+zoom, `vt-out` fade) + reduced-motion off.
- `viewTransition` prop on high-traffic links: landing doors, catalog material cards, the
  "Exersează" CTA, material breadcrumb + prev/next, the site header logo, admin nav tabs.
- `.stagger` on the door grid and the per-topic material grids.
- `.glow` on door cards, material cards, the "Exersează" CTA, and material prev/next cards.
- `motion-playful` wrapper class on student routes: `clasa`, `material`, `exerseaza`, `student.intra`.

## Review / revert
- See it live on the app (http://localhost:5173) on this branch.
- Keep: merge `polish/animations` into `main`.
- Discard: `git checkout main` (baseline is untouched).
