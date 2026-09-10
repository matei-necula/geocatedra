# Public Launch Runbook — domain, public-site stack, security, monetization

**Written:** 2026-08-18. **Romanian version:** `docs/08-runbook-lansare-publica.md`
**Audience:** whoever does the work (owner, or a Claude session). The Romanian version is the
one written for the non-technical admin.

This runbook takes the platform from `*.workers.dev` to a real, public, indexed website on a
domain you own — and then answers the money question honestly.

> **Read Part 0 first. It is blocking.** Do not point a domain at the app until it is done.

---

## Part 0 — Pre-flight (BLOCKING)

A `*.workers.dev` URL nobody knows is a different risk profile from a branded domain you hand
to schools. Close these before launch.

### 0.1 Upgrade react-router — the highest-priority item in this document

`react-router@7.9.6` is subject to **13 published advisories**, including:

- CSRF in Action/Server Action request processing — `GHSA-h5cw-625j-3rxh`
- Unauthenticated RCE via vendored turbo-stream deserialization — `GHSA-49rj-9fvp-4h2h`
- Unauthenticated DoS via inefficient route matching — `GHSA-chx6-hx7r-mcp5`
- Several open-redirect → XSS variants — `GHSA-2w69-qvjg-hvjx`, `GHSA-jjmj-jmhj-qwj2`, `GHSA-2j2x-hqr9-3h42`

```bash
cd app
npm audit --omit=dev          # confirm the finding before and after
# bump react-router and @react-router/dev to 7.18.2
npm install
npm run typecheck && npm test && npx wrangler deploy --dry-run
npm audit --omit=dev          # expect: found 0 vulnerabilities
```

**Stay on the v7 line (7.18.2).** `8.3.0` exists but is a major version bump with its own
migration. Never combine a security fix with a framework migration.

- [x] Upgraded to 7.18.2; re-verified 2026-08-20: `npm audit --omit=dev` → **0 vulnerabilities**

### 0.2 Rate-limit the practice endpoint

`routes/exerseaza.tsx` has no rate limiting at all, while every other sensitive endpoint has it.
Two concrete abuses: **nickname squatting** (a script claims every plausible nickname in a class,
so real pupils cannot pick one) and **unthrottled answer-checking**.

Follow the existing pattern — `lib/ratelimit.ts` plus a new `unsafe.bindings` entry in
`wrangler.json`, keyed `practice:${clientIp(request)}`. Keep the limit generous enough that a fast
pupil is never blocked; keep nickname-claim tight. The limiter **must stay fail-open** — a missing
binding must never lock a class out of practice.

- [x] `PRACTICE_LIMITER` + `NICK_LIMITER` wired, keyed on the session watermark (not IP — a whole class shares one school IP)

### 0.3 Stop leaking verification tokens into production logs

`lib/email.ts` logs the full verification link — which embeds a live 24-hour HMAC token — whenever
`RESEND_API_KEY` is missing. The condition is *"no API key"*, not *"is dev"*, and `wrangler.json`
sets `observability.enabled: true`. It is latent today only because `REQUIRE_EMAIL_VERIFICATION`
defaults to `"false"`. Flip that flag before setting the Resend key and you write working auth
tokens into production logs.

Gate the log on `import.meta.env.DEV`, and fail loudly in production instead — mirroring the
fail-closed pattern already used in `lib/env.ts:17-22`.

- [x] Log gated on DEV; prod-without-key returns an error and logs a token-free message

### 0.4 Make logout a POST

`routes/logout.tsx` is a `loader` (GET), so `<img src="https://yoursite/iesire">` on any page
force-logs-out your users. Convert it to a POST `action` and switch every call site to a
`<Form method="post">`, keeping the existing Romanian label and styling.

- [x] `/iesire` is a POST action; GET redirects home without touching cookies

### 0.5 Add a deploy gate

`npm run deploy` is currently `react-router build && wrangler deploy` — no typecheck, no tests,
and **there is no CI in this repo**. One bad edit ships straight to the public site.

```json
"deploy": "npm run typecheck && npm test && react-router build && wrangler deploy"
```

- [x] `deploy` runs `typecheck` + `test` before `build && wrangler deploy`

### 0.6 Back up D1 — there are no backups today

A public site makes this matter. D1 has Time Travel for point-in-time restore, but hold your own
copy too.

```bash
cd app
npx wrangler d1 export catedra --remote --output "backup-$(date +%Y-%m-%d).sql"
```

Do this before every schema migration, and on a monthly reminder. Store it somewhere that is not
this laptop — the content represents months of work.

- [x] First backup taken 2026-08-20 → `backups/catedra-2026-08-20.sql` (873 KB, 1878 rows). `backups/` is gitignored — it holds PBKDF2 password hashes and hashed class tokens. **Still on this laptop only: copy it somewhere else.**

### 0.7 CSP nonce (optional, not launch-blocking)

CSP carries `script-src 'unsafe-inline'` (`lib/headers.ts:8`) because `root.tsx` injects theme CSS
and the no-flash script inline. The audit found **no user-input-fed XSS sink** today, so this is
defense-in-depth rather than an open hole. Move to a per-request nonce when convenient.

- [ ] (Optional) nonce-based CSP, `'unsafe-inline'` dropped from `script-src`

---

## Part 1 — Choose the name, then buy the domain

### 1.1 The naming decision

"Catedra" is a placeholder per `CLAUDE.md`, and it is **not cheaply available**: `catedra.com` is
a live company and `catedra.ro` is held by a squatter. The name has to be settled before buying.

**The architectural tension, stated plainly:** the engine is deliberately subject-agnostic —
geography is instance #1, not the only one. A domain like `lectiadegeografie.com` wins Romanian
search traffic *now* but bakes the subject into the brand. A neutral domain protects the
architecture but ranks for nothing.

**Recommendation: buy the geography domain now.** It matches what actually exists, and Romanian
search traffic is the only realistic route to an audience beyond your own classes. If a second
subject ever ships, buy a platform domain then — another `.com` is $10.44/year, not an
architectural crisis.

Candidates that returned no nameservers on a DNS pre-check (**not proof they are unregistered** —
verify each in Cloudflare's registrar search):

| Kind | Candidates |
|---|---|
| Descriptive, best SEO | `lectiadegeografie.com` · `invatgeografie.com` · `geografieinteractiva.com` · `catedradegeografie.com` |
| Personal, warm | `profadegeografie.com` · `geografiealtfel.com` |
| Evocative | `curbedenivel.com` (matches your `motif: "contours"`) · `rozavanturilor.com` · `orizontgeografic.com` |
| Subject-agnostic | `tablaverde.com` · `cretasitabla.com` |

Test each against: can she say it over the phone to a parent without spelling it? Does it survive
being read aloud in a classroom? Is it short enough to write on a whiteboard?

- [ ] Name chosen and confirmed available in Cloudflare's own search

### 1.2 Buy it

Cloudflare Registrar sells **at cost with zero markup** — `.com` is **$10.44/year**, the same at
renewal (no first-year promo trap), with **WHOIS privacy free and on by default**.

> **Note:** Cloudflare Registrar does **not** support `.ro`. A `.ro` must come from a
> ROTLD-accredited registrar (EUReg.ro ≈ €9/yr, ID required) with nameservers pointed at
> Cloudflare — two vendors, two renewal dates. That is why this runbook is `.com`-only.

1. Cloudflare dashboard → **Domain Registration → Register Domains**
2. Search the chosen name, add to cart, pay
3. The zone is created automatically and already uses Cloudflare nameservers
4. **Turn auto-renew ON**, and check the card on file does not expire before the domain does

**If renewal fails:** grace period days 1–30 (site still resolves) → suspension days 31–40 →
redemption days 41–70 (restorable, with a fee) → deleted days 71–75. Put the renewal date in a
calendar with a two-week warning.

- [ ] Domain purchased, auto-renew on, renewal date in a calendar

---

## Part 2 — Point the domain at the Worker

**This app is a Worker, not Cloudflare Pages** (`wrangler.json` → `main: ./workers/app.ts`).
Ignore every Pages tutorial you find.

### 2.1 Custom Domain, not Route

Use **Custom Domains**. The Worker *is* the origin, so Cloudflare creates the DNS record and
issues the TLS certificate automatically. **Routes** are for putting a Worker in front of a
*different* origin — not your situation.

Dashboard → **Workers & Pages → `catedra` → Settings → Domains & Routes → Add → Custom Domain**

Add both `yourdomain.com` and `www.yourdomain.com`. Certificate issuance is automatic (Universal
SSL) and usually completes within minutes.

- [ ] Apex and www both resolve to the Worker over HTTPS

### 2.2 Redirect www → apex

Pick one canonical host (apex recommended) and redirect the other, so search engines do not index
two copies of every page.

Dashboard → **Rules → Redirect Rules**: if hostname equals `www.yourdomain.com`, dynamic redirect
to `concat("https://yourdomain.com", http.request.uri.path)`, status **301**, preserve query string.

> **Verify it actually fires.** There are reports of custom Redirect Rules not executing on the
> Free plan while Cloudflare's own automatic www handling does. Test it:
> ```bash
> curl -sI https://www.yourdomain.com/termeni
> ```
> Confirm a `301` with the correct `location:` header.

- [ ] `curl -sI` confirms the 301

### 2.3 TLS settings

Dashboard → **SSL/TLS**:

| Setting | Value | Why |
|---|---|---|
| Encryption mode | **Full (strict)** | Trivial here — the Worker is the origin, no origin cert to manage |
| Always Use HTTPS | **On** | Removes any `http://` entry point |
| Minimum TLS Version | **TLS 1.2** | 1.0/1.1 are deprecated and broken |
| HSTS | **On**, max-age 6–12 months, include subdomains | The app already sends HSTS from `lib/headers.ts`; enabling at the edge covers non-app responses too |

**Certificate rotation: there is nothing to do.** Universal SSL renews automatically. To verify at
any time:

```bash
echo | openssl s_client -servername yourdomain.com -connect yourdomain.com:443 2>/dev/null \
  | openssl x509 -noout -dates -issuer
```

> **Enable HSTS only once you are certain the site stays on HTTPS permanently.** Browsers cache the
> directive for the full max-age and you cannot retract it quickly. Start with a short max-age and
> raise it after a week of clean operation.

- [ ] All four TLS settings applied, certificate verified

---

## Part 3 — Edge security and secret management

### 3.1 Free-tier Cloudflare protections

| Feature | Free? | Use it? |
|---|---|---|
| Bot Fight Mode | Yes | Yes — watch for false positives on uptime monitors |
| Turnstile (CAPTCHA) | Yes, generous free tier | **Yes — see 3.2** |
| Rate Limiting Rules | Yes, but **only 2 rules, 1-minute window** | Yes, as a second layer in front of the app's own limiters |
| Universal SSL | Yes | Already on |
| **WAF managed / OWASP ruleset** | **No — Pro only** | **You will not have this.** Do not plan around it |

Spend the two free rate-limit rules on `/intra` (class-token entry) and `/admin/login`.

### 3.2 Turnstile on the login forms — the one real gap left

Class tokens are `PREFIX-GRADE-XXXX`, with roughly 20 bits of entropy in the random part. That is
a deliberate trade-off (a pupil has to type it), defended by per-IP rate limiting. But **per-IP
limits do not stop a distributed attempt** spread across many IPs.

Add Cloudflare Turnstile to `/intra`, `/admin/login` and `/profesor/login`. It is free, invisible
in the common case, and it is the correct answer to distributed guessing.

This adds `challenges.cloudflare.com` to `script-src`/`frame-src` in `lib/headers.ts` — the only
third-party script worth accepting.

- [x] Code shipped 2026-08-20 on `/intra`, `/admin/login`, `/profesor/login` — **inactive until keys are set**. No-op while `TURNSTILE_SITE_KEY`/`TURNSTILE_SECRET_KEY` are empty; once both are set it is mandatory and fails closed (invalid token *and* siteverify network error both block). CSP already allows `challenges.cloudflare.com`. Setup: `docs/run-guide.md`

### 3.3 Secret management and rotation

Three secrets, all already fail-closed in production (`lib/env.ts:17-22` throws when one is
missing — this is correct behaviour and must not be "fixed"):

```bash
cd app
npx wrangler secret put SESSION_SECRET     # long random string, 32+ bytes
npx wrangler secret put ADMIN_PASSWORD     # strong and unique
npx wrangler secret put SIGNUP_PASSWORD    # teacher signup access code
npx wrangler secret list                   # confirm all three exist in production
```

Generate values with `openssl rand -base64 48`.

**Rotation policy:**

| Secret | Rotate when | Effect |
|---|---|---|
| `SESSION_SECRET` | Yearly, or **immediately on suspected compromise** | **Invalidates every session instantly** — admin, teachers and pupils all logged out. This is your emergency "log everyone out" lever |
| `ADMIN_PASSWORD` | Yearly, or after any shared-device or leak concern | Admin logs in again |
| `SIGNUP_PASSWORD` | Every school year | Stops last year's code circulating among teachers |

Never commit secrets. `.dev.vars` is local-only and must stay gitignored — verify with
`git check-ignore -v app/.dev.vars`.

- [x] Verified 2026-08-20 — all five secrets present in production (`wrangler secret list`). Values are unreadable by design, so **confirm `ADMIN_PASSWORD` is not still `admin`**. Rotation dates: still to be put in a calendar

### 3.4 Already solid — do not "fix" these

A full audit confirmed these are correct. Leave them alone:

- Class tokens hashed at rest, and **revocation reaches already-issued cookies** because
  `guard.ts:52-66` re-validates against the database on every request
- `owner_id` isolation enforced on every teacher-scoped table — no IDOR found anywhere
- No SQL injection surface (all Drizzle templates parameterized)
- No exploitable XSS sink — the only two `dangerouslySetInnerHTML` uses are config-fed
- `/media/:id` re-checks visibility per request and forces SVG to download rather than render
- `InteractiveApp.tsx` sandbox is `allow-scripts` **without** `allow-same-origin` — correct
- PBKDF2 at 310,000 iterations for teacher passwords
- `SameSite=Lax` is an adequate CSRF baseline given every mutation is a POST form

---

## Part 4 — The public-website stack

Everything below is missing today unless noted.

### 4.1 Favicons and app icons

`public/favicon.ico` exists but **nothing links to it**; the live favicon is an inline SVG data-URI
generated in `root.tsx:16-20`. Clever, but it gives no maskable icon, no Apple touch icon, and no
PWA identity.

Generate from the logo mark, place in `app/public/`, reference from `root.tsx` `links()`:

```
favicon.ico            32x32 + 16x16 multi-resolution
icon.svg               the scalable one
apple-touch-icon.png   180x180
icon-192.png           192x192   (manifest)
icon-512.png           512x512   (manifest, maskable)
og-image.png           1200x630  (social preview)
```

- [x] `icon.svg`, multi-res `favicon.ico`, `apple-touch-icon.png`, `icon-192/512.png` (512 maskable), `og-image.png` (1200×630, diacritics verified) + `site.webmanifest`, all linked from `root.tsx`. Regenerate with `app/scripts/gen-icons.mjs`

### 4.2 Meta, Open Graph, canonical

Only `home.tsx:8-13` has a description; **no route anywhere sets `og:*`, `twitter:*`, or a
canonical link**. Every link shared in a WhatsApp teachers' group currently previews as a bare URL.

Build one shared helper (`app/lib/seo.ts`) taking title/description/path/image and returning the
full meta array: title, description, canonical, `og:title`, `og:description`, `og:image`,
`og:type`, `og:locale` = `ro_RO`, `twitter:card` = `summary_large_image`. Source `siteName` from
`subject.config` so it stays subject-agnostic.

Apply to public routes: `/`, `/confidentialitate`, `/termeni`, `/cookie-uri`, `/info/:role`, and
any public lesson pages you add.

**Mark private routes `noindex`:** all of `/admin/*`, `/profesor/*`, `/clasa/*`, plus `/intra`.
They are already access-controlled; `noindex` merely keeps them out of results.

- [x] `app/lib/seo.ts` (+14 tests) applied to all 42 routes: 5 public get the full block, 33 private get `noindex, nofollow`. Origin derived per-request — **no domain hardcoded anywhere**

### 4.3 robots.txt

`app/public/robots.txt`:

```
User-agent: *
Allow: /
Disallow: /admin
Disallow: /profesor
Disallow: /clasa
Disallow: /media
Disallow: /intra

Sitemap: https://yourdomain.com/sitemap.xml
```

- [x] Shipped as a **route**, not a static file, since the domain doesn't exist yet — the `Sitemap:` line is built from the request. Host-aware: `*.workers.dev` and localhost get `Disallow: /` so the throwaway host can't be indexed; a custom domain automatically gets the real policy

### 4.4 sitemap.xml — generate it, do not hand-write it

**Make it a route, not a static file.** A static sitemap goes stale the moment she publishes a
lesson, and nobody will remember to update it.

Add `app/app/routes/sitemap[.]xml.tsx` with a `loader` that queries D1 for published, public
materials and emits XML with `Content-Type: application/xml`. Include only genuinely public URLs —
never gated `/clasa/*` pages. Cache with `Cache-Control: public, max-age=3600`.

- [x] `/sitemap.xml` route, 6 URLs — `/`, `/confidentialitate`, `/termeni`, `/cookie-uri`, `/info/public`, `/info/teachers`. **No material URLs**: `entitlement.ts` models a `public` viewer but no route ever constructs one, so no lesson is reachable anonymously (see the note below)

> ### ⚠️ The finding that undercuts this whole Part: there is no public content
>
> Traced during the 2026-08-20 implementation pass. `lib/entitlement.ts` defines a
> `role: "public"` viewer and materials carry an `isTeaser` flag — but **no route ever constructs
> that viewer**. `resolveViewer()` only ever returns `admin`/`teacher`/`student`/`none`, and
> `routes/material.tsx` requires `isAdmin || isStudent` or redirects to `/intra`.
>
> So today an anonymous visitor can reach exactly six pages: the home page, three legal pages and
> two "coming soon" placeholders. **Every lesson, game and exercise is behind a token.**
>
> What this means, plainly: the SEO stack now in place (meta, Open Graph, sitemap, JSON-LD) is
> correct and worth having — a link shared in a teachers' WhatsApp group now previews properly,
> which is real value. But **it cannot win search traffic, because there is nothing indexable to
> rank.** Part 5's "watch the Romanian queries you appear for" will show approximately nothing,
> and Part 6's ad-revenue table is moot at 0 public pageviews.
>
> Buying a domain does not change this. If the goal is an audience beyond her own classes, the
> next real step is a **product decision, not a technical one**: publish some genuine public
> content — a handful of full lessons, or wire up the teaser path that the data model already
> anticipates. That is a spec-and-plan sized piece of work, deliberately not started here.


### 4.5 Structured data

Add JSON-LD (`application/ld+json`) to the home page: `EducationalOrganization`, or `WebSite` plus
`SearchAction`. This is what earns a richer Google result. Source values from `subject.config`.

- [x] `WebSite` + `EducationalOrganization` on the home page, all values from `subject.config`. **Not yet run through Google's Rich Results Test** — that needs a public URL, so do it after the domain is live

### 4.6 security.txt

`app/public/.well-known/security.txt`, so a researcher who finds a bug can reach you rather than
disclosing publicly:

```
Contact: mailto:you@yourdomain.com
Expires: 2027-08-18T00:00:00.000Z
Preferred-Languages: ro, en
```

- [ ] **Deferred by decision (2026-08-20)** — publishing a contact address needs a domain mailbox; revisit with the domain

### 4.7 Self-host the fonts — GDPR and performance in one change

`root.tsx:21-26` loads Inter and Spectral from `fonts.googleapis.com`. **Every visitor's browser
hands their IP address to Google before first paint**, without consent — a well-known GDPR grey
area, and the *only* external request the app makes.

Download the `.woff2` files into `app/public/fonts/`, add `@font-face` rules to `app.css`, remove
the two `<link>`s from `root.tsx`, then delete the two Google exceptions from the CSP in
`lib/headers.ts`. Result: no third-party leak, one fewer DNS+TLS round trip, and a strictly tighter
CSP.

- [x] 12 woff2 files in `public/fonts/` (Inter variable + Spectral static, `latin` **and** `latin-ext` for Romanian diacritics); both Google exceptions dropped from the CSP. **Zero third-party requests remain**

### 4.8 Prerender the static public pages

`react-router.config.ts` has `ssr: true` and no `prerender`, so the home page and legal pages are
server-rendered on *every* request despite being identical for everyone.

```ts
prerender: ["/", "/confidentialitate", "/termeni", "/cookie-uri"],
```

- [ ] **Backed out — incompatible with this stack.** `@react-router/dev`'s prerender step runs the compiled worker bundle in plain Node, which has no `globalThis.Cloudflare`, so the build dies with `Cannot read properties of undefined (reading 'compatibilityFlags')`. Reproduced independently. Revisit after a `@react-router/dev` or `@cloudflare/vite-plugin` upgrade; the pages are cheap to SSR meanwhile

### 4.9 Cache headers

`/media/:id` is already correct (`private, max-age=300` — right for gated content). Add
`app/public/_headers` for long-lived immutable caching of hashed build assets, and consider a short
public cache on the prerendered pages.

- [x] `app/public/_headers` — `/assets/*` and `/fonts/*` at `max-age=31536000, immutable`

---

## Part 5 — Google Search Console and analytics

### 5.1 Search Console

1. [search.google.com/search-console](https://search.google.com/search-console) → Add property
2. Choose **Domain property** — verification is a DNS TXT record, and you own the DNS
3. Cloudflare → DNS → add the TXT record → back to Google → Verify
4. Submit `https://yourdomain.com/sitemap.xml`
5. **URL Inspection → Request Indexing** on the home page to prime it

Expect nothing for 1–2 weeks. Then watch **Coverage** for errors and **Performance** for the
Romanian queries you actually appear for.

Optional: Bing Webmaster Tools imports directly from Search Console in two clicks. Worth doing.

- [ ] Verified, sitemap submitted, home page indexed

### 5.2 Analytics — Cloudflare Web Analytics, not GA4

**This matters more than it looks.** The site currently needs **no cookie banner**, because it sets
only strictly-necessary cookies (documented in `docs/privacy-compliance.md`). Adding GA4 would force
a consent banner onto every page, require loosening the CSP for Google's scripts, and hand visitor
data to a third party — on a site used by children.

**Cloudflare Web Analytics** is free, cookieless, needs no consent banner, and is a dashboard toggle
on a zone you already own.

Keep the internal `lib/viewstats.ts` for what it does well — aggregate per-material, per-class,
per-day counters with no identity. It answers "which lesson is actually used", which no external
analytics tool can, because that content is gated.

- [ ] Cloudflare Web Analytics enabled; no cookie banner introduced

---

## Part 6 — Money: the honest verdict

You asked for the real numbers. Here they are, and they are not the ones you were hoping for.

### 6.1 Why banner ads will not work

**The scale is wrong by an order of magnitude.** Romanian-language traffic earns roughly **$2 RPM**
(per 1,000 pageviews). The "$15–30 education RPM" figures online are for English-language, US/UK
audiences and are irrelevant here. And because your audience is minors, you would be restricted to
**non-personalized** ads, which earn a fraction of that again.

| Monthly pageviews | Realistic monthly revenue |
|---|---|
| 500 | **under €1** |
| 5,000 | **€7–10** |
| 50,000 | €75–100 |

**AdSense does not pay out until the balance reaches $100.** At a few thousand pageviews a month
that takes **over a year** to accumulate — assuming it ever does.

**The legal position is worse than the revenue position.** Three things stack up:

- Google's **TFAT** age signal (live since May 2026) strips ad personalization from any user its
  systems judge to be a minor — and this site is unambiguously, by design, for ages 11–18.
- **DSA Article 28** bans profiling-based advertising to minors for in-scope platforms.
- **Romania's "Legea Majoratului Digital"** passed the Senate in October 2025, aimed squarely at
  under-16s, with fines of 0.1–0.4% of turnover. **Its current status is unconfirmed and must be
  checked before any ad code ships** — this law was written for sites exactly like this one.

### 6.2 Why video pre-roll is dead on arrival

- Google **closed AdSense for Video to new publishers in 2022**.
- Google Ad Manager's video product expects volumes in the **millions of impressions per month**.
- The networks that *would* accept a site this size (Adsterra, PropellerAds) serve pop-unders and
  adult-adjacent inventory. **Disqualifying in front of children, at any price.**

Drop the idea. A pre-roll before a lesson would also be the single most resented thing on the site —
for roughly €0.30 a month.

### 6.3 What to do instead — ranked

**1. Self-hosted promo slots — build this one.**

Your own sponsor banners and affiliate links, stored in D1 and rendered like any other content. A
`promos` table (image asset, link, alt text, placement, active dates, optional grade scope) and a
small `<PromoSlot>` component.

Why this is the right answer for *this* codebase:

- **No third-party scripts** — CSP stays tight, no ad-tech in the page
- **No cookies → no consent banner** → the privacy posture in `docs/privacy-compliance.md` survives intact
- **No profiling** → the DSA and Romanian minor-advertising problem never arises
- Subject-agnostic, like the rest of the engine
- You control exactly what a child sees — which, on a school site, is the entire point
- It also becomes the delivery mechanism for options 3 and 4 below

**2. Donations.** A Revolut donation link or Buy Me a Coffee, in the footer and on teacher pages.
Aimed at parents and fellow teachers — adults — so no ads-to-minors question arises at all.
Near-zero setup, and realistically the fastest path to actual money at your size.

**3. The paid teacher tier — already Phase 3 on your roadmap.** Teachers and schools paying for the
pedagogy library is real, proportionate revenue from adults who chose to pay. This is the
sustainable model for EdTech serving minors, and you have already designed for it.

**4. eMAG affiliate via Profitshare** (3% commission). Atlases, maps and books next to the lesson
that needs them — genuinely useful, low-friction, delivered through the promo slots from option 1.
Set expectations at "a few euros", not an income stream.

**5. Direct sponsorship from Romanian educational publishers** (Litera, Editura Art, Cărturești).
Requires manual outreach and cannot be switched on — but a geography teaching site with a real
following is a plausible target, and it pays far better per impression than programmatic ever will.

**6. AdSense — documented, not recommended.** Revisit only if public pageviews pass ~20,000/month,
and then only under hard constraints: public/logged-out pages **only**, never on `/clasa/*` where
the pupils are; honest TFAT age tagging; a Google-certified CMP with Consent Mode v2; CSP loosened
for Google's scripts; and a kill switch. Check the Romanian law's status first.

### 6.4 Taxes — the shape (talk to an accountant)

- AdSense and affiliate money from abroad is foreign-source income, declared on the **Declarația
  Unică (D212)**, due **25 May** for the previous year.
- Income tax **10%**.
- **CASS** only applies above 6 minimum gross wages per year (**≈24,300 lei for 2026**). At the
  revenue levels above you stay well under it.
- **Registering a PFA is almost certainly not worth it** at a few hundred euros a year. Revisit if
  the teacher tier produces real recurring revenue.

*Not tax advice. Confirm with an accountant before declaring anything.*

---

## Part 7 — Ongoing operations

| Cadence | Task |
|---|---|
| **Monthly** | `npm audit --omit=dev`; D1 backup export; skim Search Console Coverage |
| **Quarterly** | Review Cloudflare Analytics; check Turnstile and Bot Fight false positives |
| **Each school year** | Rotate `SIGNUP_PASSWORD`; regenerate class tokens (they expire 15 June anyway) |
| **Yearly** | Rotate `SESSION_SECRET` and `ADMIN_PASSWORD`; renew `security.txt` `Expires`; confirm domain auto-renew and card validity |
| **Before every migration** | D1 export first |

**If something breaks:** Cloudflare dashboard → Workers → Logs (observability is already enabled).

**If you suspect a compromise:** rotate `SESSION_SECRET` immediately — that logs out every session
everywhere — then rotate `ADMIN_PASSWORD` and revoke class tokens from `/admin`.

### Costs after this runbook

| Item | Cost |
|---|---|
| Domain (`.com`, Cloudflare Registrar, at cost) | **$10.44/year** |
| Everything else (Workers, D1, R2, KV, Turnstile, Web Analytics, Universal SSL) | **$0** |

Update `docs/costs.md` when the domain is bought — it currently states $0/month.
