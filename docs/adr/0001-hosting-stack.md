# ADR-0001: Hosting & Stack — Cloudflare-first

- **Status:** Proposed (Phase 0 gate)
- **Date:** 2026-06-25

## Context

The owner set Cloudflare Pages as the starting point and the broader Cloudflare stack as the
default to validate, with no budget ceiling but a free-first philosophy. We must confirm
Cloudflare fits the hard parts: server-side access control, (later) video + watermarking,
(later) payments/webhooks, and (later) AI retrieval.

## Decision

Use **Cloudflare Pages** (frontend) + **Workers** (API & all access decisions) + **D1**
(relational data) + **R2** (assets) + **KV** (sessions/hot config). Implement **custom auth in
Workers** rather than Cloudflare Access.

## Rationale

- All current-phase needs fit at **$0/month** (see `costs.md`).
- Workers + D1 is a strong fit for server-side authorization and relational taxonomy.
- R2 has **no egress fees** — good for serving images/PDFs cheaply.
- **Cloudflare Access is the wrong tool here:** it's Zero-Trust SSO for internal apps; our
  students use anonymous shared tokens and teachers/public need subscription gating. Custom
  auth in Workers is the correct fit.

## Flagged limits (not blockers)

- **Video (Stream)** and **AI** are deferred and are the first paid items — each gated on owner
  sign-off at its phase.
- **Long-running work** (bulk import, AI batch) must go to Workers **Queues**/cron, never the
  request path, to respect Worker CPU limits.

## Consequences

- One vendor for hosting/data/edge logic — simpler ops for a non-technical owner.
- If a single piece ever fits Cloudflare poorly, we swap *that piece* (documented in a new ADR),
  not the whole stack.
