# ADR-0005: Student Token Access Model

- **Status:** Confirmed by owner (2026-06-25)
- **Date:** 2026-06-25

## Context

Students are minors; minimizing their data is required. The owner defined how a class runs.

## Decision

- **One shared token per class.** All students in a class use the same string.
- **Scope = the class's whole grade.** Entering the token lands the student in their grade and
  lets them browse **only** that grade's student-library materials; everything else is HIDDEN
  server-side.
- **Validity:** from issue until **15 June** (end of the Romanian school year).
- **Token-only:** no student accounts, no student PII whatsoever.
- **Storage:** we store a **hash** of the token, never plaintext. The scope is modeled as
  `scope_type='grade'` but the column allows `material`/`topic` later **without migration**.

## Honest trade-off (recorded, accepted)

A single long-lived shared string is the **biggest piracy risk**. We do not pretend to prevent
capture (see `04-anti-piracy.md`). We mitigate with:

- **Server-side scope re-check on every request** + short-lived signed sessions (KV).
- **Per-session visible watermark** carrying a class/session code → leaks are traceable.
- **One-click regenerate/revoke** so a suspected-leaked token can be rotated per term instantly
  (old sessions die server-side).

## Consequences

- Simple for the teacher to run (one string per class, once a year).
- The watermark + rotation are the realistic deterrents; enforcement is server-side, always.
