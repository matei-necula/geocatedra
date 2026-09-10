# Cost Ledger

Policy: **free-first.** Nothing paid is signed up for without flagging it to you first —
what it is, why, the cheapest viable option, and the expected cost.

## Current monthly cost: **$0 / month** — plus one annual cost

The entire **student experience** (Phases 1–2) runs on free tiers. The only money leaving the
account is the domain, billed once a year.

| Item | Cost | Where | Renews |
|---|---|---|---|
| `geocatedra.com` | annual `.com` fee — **confirm the figure on the Namecheap receipt** | **Namecheap**, not Cloudflare | bought 2026-09-07 → **put the renewal date in the calendar, alarm 2 weeks early** |

> Bought at Namecheap, so it does **not** follow the at-cost path in
> `docs/08-runbook-lansare-publica.md` §1.2 (Cloudflare Registrar, $10.44/yr, no first-year
> discount trick). Namecheap's renewal price is normally higher than its first-year price —
> check what year two actually costs before the auto-renew fires. Cloudflare's zone, DNS,
> certificate and Email Routing stay free regardless of who the registrar is; transferring the
> domain to Cloudflare later is possible but not required.

## Free now — with headroom notes

| Item | Plan | Free limit | When we'd outgrow it (≤30 students) |
|---|---|---|---|
| Cloudflare Pages | Free | Generous builds/requests | Not at this scale |
| Cloudflare Workers | Free | 100k requests/day | Far above need |
| Cloudflare D1 | Free | 5 GB, generous reads | Not at this scale |
| Cloudflare R2 | Free | 10 GB storage, **no egress** | When non-video assets exceed ~10 GB. **Now wired** for material images/PDFs (binding `MEDIA`, bucket `catedra-media`) |
| Cloudflare KV | Free | Sufficient for sessions | Not at this scale |
| GitHub | Free | Private repos, Actions minutes | Not at this scale |
| `*.pages.dev` domain | Free | — | Only if you want a custom domain |

## Has a free tier but will likely cost money eventually (flagged early, per §7.0)

| Item | Why needed | Cheapest path first | Likely cost when it starts |
|---|---|---|---|
| **Video hosting/streaming** (Cloudflare Stream) | Pre-recorded video lessons | Defer; use non-video types first | ~$5 / 1,000 min stored + ~$1 / 1,000 min delivered. **First real cost.** Phase 7 |
| **AI API** (assistant + exam generator) | The two AI features | Defer; design retrieval lean | Pay-per-use; small at low volume. Phase 5–6 |
| ~~**Custom domain**~~ | — | — | **Done 2026-09-07: `geocatedra.com`, see the table above.** Moved out of this section; it is no longer a future decision |
| **Email sending** | Teacher/public account flows | Defer; not needed for students | Free tiers exist (e.g. transactional email); revisit Phase 3 |

> **Email *receiving* is already free and needs nothing paid.** `contact@geocatedra.com` is a
> **Cloudflare Email Routing** rule that forwards to the owner's private inbox — no mailbox, no
> storage, no cost. It cannot *send*, which is exactly why it doesn't solve the Phase 3 row above.

## Genuinely paid only when money comes in

| Item | Cost |
|---|---|
| **Payment processing** (Netopia) | Per-transaction fee, only when you actually charge teachers/public. Phase 3+. TBD |

## Next cost decision point

**Phase 7 (video).** Before enabling Cloudflare Stream I'll bring you the projected monthly
figure based on how many video lessons × minutes she expects, and wait for your sign-off.
