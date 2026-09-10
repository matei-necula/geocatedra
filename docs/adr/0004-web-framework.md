# ADR-0004: Web Framework

- **Status:** **Accepted — React Router v7 (Remix)** (owner choice, 2026-06-25)
- **Date:** 2026-06-25

## Context

We need a full-stack framework that runs well on Cloudflare Workers/Pages, supports SSR for
server-side access control, has a clean theming/component story for a polished UI (animations,
interactive games, slideshows), and is maintainable given a non-technical owner + occasional
help from you. Framework choice is hard to reverse, so per the contract it is **asked, not
silently chosen.**

## Options

| Option | Pros | Cons |
|---|---|---|
| **SvelteKit** (recommended) | Leanest output, excellent first-class Cloudflare adapter, simple mental model, fast, great DX, low maintenance | Smaller ecosystem than React |
| **Remix / React Router v7** | First-class Workers fit, huge React ecosystem | More boilerplate, heavier |
| **Astro + Hono** | Great for content-heavy sites + islands | Interactive-heavy pages need more wiring |
| **Next.js on Cloudflare** | Most popular | Most friction on Cloudflare; heavier; overkill here |

## Decision (accepted)

**React Router v7 (Remix)** on Cloudflare Workers, **Drizzle ORM** for D1, R2 for assets.
Chosen by the owner for the large React ecosystem and easier maintenance by the owner's helper.
SSR-first gives us the server-side access-control floor; the theming system still plugs into
`subject.config`. Slightly heavier than SvelteKit, which is an accepted trade-off.

## Consequences

- Confirm at the gate. Everything in Phase 1 scaffolds on the chosen framework.
