# Catedra

**A hosted teaching platform for the Romanian school curriculum.**
Live at **[geocatedra.com](https://geocatedra.com)**.

Catedra is a subject-agnostic teaching engine. Geography for grades 5 to 12 is
its first instance, not its only possible one: the subject lives entirely in
configuration and content, never in the engine code.

It runs in production today, administered daily by a geography teacher who is
not a developer.

---

## What it does

**Two sites, one codebase, one database.**

| | Free site | Site with classes |
|---|---|---|
| Audience | Anyone, no account | A teacher's own students |
| Access | Open | One shared class token |
| Materials, images, questions | Yes | Yes |
| Homework, results, statistics, announcements | — | Yes |
| Teacher accounts | — | Yes |

Publishing a material from the admin console pushes it to the public internet in
one click, on both sites, with no deployment.

**For students**
- A library of lessons, galleries, documents and interactive material, organised by grade and chapter.
- *Exersează*, a multiple-choice practice engine that draws randomised tests, offers costed hints, and reports mistakes back for review.
- Interactive games built on a reusable engine: matching, ordering, contour-line relief, map work.
- Mind maps per topic.

**For the teacher**
- Material authoring with a friendly editor per material type, and a draft/publish workflow.
- Image and PDF upload straight to object storage, streamed back only after an access check.
- A question bank with per-question and per-chapter statistics.
- Class tokens: one click to generate, regenerate or revoke.
- Homework, announcements and per-student results, with anonymous-friendly analytics.

Every interface string is in Romanian, written plainly, because the daily
administrator is not technical.

---

## How it is built

| Layer | Choice |
|---|---|
| Framework | React Router v7 on Cloudflare Workers |
| Database | Cloudflare D1 (SQLite) via Drizzle ORM |
| Object storage | Cloudflare R2, access-controlled |
| Sessions | Cloudflare KV |
| Language | TypeScript |
| Auth | Custom, in the Worker |

Running cost: currently zero per month, by deliberate design. Every choice
defaults to a free tier, and anything paid is flagged before it is adopted.

## Design rules the code has to satisfy

- **Access control is server-side, always.** Whether a role may see or stream a material is decided in the Worker. Never by hiding a button.
- **No student accounts and no student personal data.** Students enter with a shared class token that expires at the end of the school year and is hashed at rest. The practice feature stores a self-chosen nickname and a score, nothing else.
- **Subject-agnostic.** Grep the engine for "geography" and you should find hits only in configuration and content.
- **Internationalisation-ready.** No user-facing string is hardcoded. Content text is stored per locale; interface strings live in message files. Romanian is the launch locale.
- **Correct answers never reach the client.** A practice test sends the drawn question set signed, and grades on the server.

## Repository layout

```
app/       the application: routes, engine, database schema, Worker entry
content/   subject content: galleries, games, interactive material, pedagogy
docs/      architecture, data model, permissions matrix, decision records
assets/    reference images
```

Architecture decisions are recorded as ADRs under `docs/adr/`, with the running
decision log in `docs/DECISIONS.md`.

## Authorship

The application code was written by AI coding agents under my direction. I own
the product and everything around the code: the architecture and the constraints
above, the Cloudflare account, DNS and domain, the D1 database, R2 storage and
KV bindings, both deployment pipelines, search indexing, the content workflow,
and the day-to-day operation of a live site. I state this plainly rather than
present the source as hand-written by me.

---

**Matei Necula** · Bucharest, Romania
[LinkedIn](https://linkedin.com/in/matei-necula) · [GitHub](https://github.com/matei-necula)
