# ADR-0006: Admin (Teacher/Owner) Access

- **Status:** Accepted — **password** to a hidden admin URL (owner revised 2026-06-25; passkey dropped)
- **Date:** 2026-06-25

## Context

Your mother is the **admin**: she adds/edits all content and generates the class tokens. You
asked for "a master token, an admin account, or a better way." Admin access is **much** higher
stakes than a student token — a leaked admin credential means someone can edit content and mint
tokens. So the bar is higher, but it must still be dead-simple for a non-technical person.

## Why a "master token" alone is risky

A single shared string that grants full admin is convenient but dangerous: if it's ever seen
(over her shoulder, in a screenshot, in a synced note), an outsider gets full control with no
trace of *who*. We can do better without making her life harder.

## Options

| Option | How she logs in | Security | Cost / deps | Friction |
|---|---|---|---|---|
| **Passkey (recommended)** | Tap with Face ID / fingerprint / device PIN on her phone or laptop | Very strong (phishing-proof, nothing to steal/remember) | Free, **no email needed** | One-time setup; then one tap |
| **Magic link** | Enter email → click a link we send her | Strong | Needs an email service (free tier; small setup) | Wait for email each login |
| **Password + recovery** | Email + password | OK if strong; reset needs email | Free | Must remember a password |
| **Master token** *(not recommended)* | Paste one secret string | Weak if leaked; no per-person trace | Free | Easy but risky |

## Decision (revised 2026-06-25)

Passkey was initially chosen but the owner **revised to a password**, because she logs in from
**several devices** and a single password works everywhere with **zero per-device setup** —
simpler for a non-technical admin. Passkey is dropped (not deferred).

**A single admin account secured by a password**, entering via a **hidden admin URL** (`/admin`,
no public link — see below). To keep this acceptably safe given a password is weaker than a
passkey, the mitigations are:

- **Hidden entrance:** no admin link on the public landing page; students/public never see it.
- **Strong production password:** set a long, unique `ADMIN_PASSWORD` via `wrangler secret put`
  (the dev default `admin` is local-only and must NOT ship).
- **Signed, expiring sessions** (HMAC cookie, 8h) — already implemented.
- Same password works on all her devices (phone + laptop), no setup per device.

Trade-off accepted: a password can be shoulder-surfed or reused; it lacks a passkey's
phishing resistance. Acceptable for a single admin behind a hidden URL. Revisit if the admin
surface ever widens.

## Seeding / changing the password

`ADMIN_PASSWORD` is a Cloudflare secret (local: `app/.dev.vars`; prod: `wrangler secret put
ADMIN_PASSWORD`). No password is hardcoded in application code. Changing it is a one-line secret
update.

## Consequences

- Dead-simple for a non-technical owner across multiple devices.
- If stronger auth is ever wanted later (passkey/magic-link), the `role='admin'` account model
  already in place supports adding it without a rewrite.
