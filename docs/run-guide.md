# Run guide (local)

## Start the site

```bash
cd app
npm install          # first time only
npm run dev          # http://localhost:5173
```

The dev server has hot reload — edits to files under `app/app/` show instantly.

## Try it (sample content is already seeded)

- **Landing:** http://localhost:5173 — the three doors (Elevi / Profesori / Public).
- **Student:** click **Elevi** → enter token **`GEO-9-DEMO`** → lands in Clasa a 9-a, browse only
  that grade. Open any material (every type renders; note the faint watermark on the content).
  Trying another grade's URL bounces you back to your own grade.
- **Admin:** go to http://localhost:5173/admin → password **`admin`** (interim; passkey is next).
  Generate a class token, see it once, print the handout, revoke tokens.

## Reset / reseed sample data

```bash
cd app
npx wrangler d1 migrations apply catedra --local      # ensure tables exist
node scripts/seed.mjs                                  # regenerate drizzle/seed.sql
npx wrangler d1 execute catedra --local --file ./drizzle/seed.sql
```

## Checks

```bash
cd app
npx tsc -b           # typecheck
npm run build        # production build
```

## Secrets

Local secrets live in `app/.dev.vars` (gitignored): `SESSION_SECRET`, `ADMIN_PASSWORD`.
For production set them with `wrangler secret put SESSION_SECRET` etc., and create a real D1 DB
with `wrangler d1 create catedra` (paste its id into `wrangler.json`).

### Email (teacher verification) — Resend

Verification email is sent through [Resend](https://resend.com). **If `RESEND_API_KEY` is
unset, no email is sent** — the verify link is logged to the console and shown on the teacher
dashboard instead, so local dev needs no setup.

To send real email (prod, or to test locally):

1. Create a free Resend account (free tier ~3,000 emails/month, $0).
2. Copy an API key (`re_...`).
3. Set the secrets:
   ```bash
   cd app
   npx wrangler secret put RESEND_API_KEY      # paste the re_... key
   npx wrangler secret put EMAIL_FROM          # e.g. Catedra <onboarding@resend.dev>
   ```
   Locally, instead uncomment `RESEND_API_KEY` / `EMAIL_FROM` in `.dev.vars`.

`EMAIL_FROM` defaults to `Catedra <onboarding@resend.dev>` (Resend's shared test sender) if
unset. For good deliverability, verify your own domain in Resend and use an address on it
(e.g. `Catedra <noreply@your-domain.ro>`) — the shared sender has lower limits and weaker
inbox placement. If Resend rejects a send, registration still succeeds and the dashboard shows
a "couldn't send, try again" notice with a working Resend.

**Important Resend limit:** the shared `onboarding@resend.dev` sender can **only deliver to the
email you signed up to Resend with**. To email anyone else (real teachers) you MUST verify your
own domain and set `EMAIL_FROM` to an address on it. There is no free way around this.

### Turning email verification on/off

Because the platform currently has no verified sending domain, **email verification is OFF in
production** via the var `REQUIRE_EMAIL_VERIFICATION="false"` (in `wrangler.json`). With it off,
new teacher accounts are activated immediately on registration — no email is sent, no banner, no
gate. To turn verification back **on** once a real sending domain is configured in Resend:

1. In `wrangler.json`, set `"REQUIRE_EMAIL_VERIFICATION": "true"`.
2. Make sure `RESEND_API_KEY` + a domain-verified `EMAIL_FROM` are set.
3. `npm run build` then `npx wrangler deploy`.

Locally, set `REQUIRE_EMAIL_VERIFICATION="true"` in `.dev.vars` to test the full verify flow
(the link is logged to the console / shown on the dashboard when no `RESEND_API_KEY` is set).

### Cloudflare Turnstile (protecție împotriva ghicirii tokenurilor/parolelor)

Cele trei formulare de autentificare (`/intra` — elevi, `/admin/login`, `/profesor/login`) pot
afișa un widget Cloudflare Turnstile ("nu sunt robot", de obicei invizibil) înainte de a verifica
tokenul/parola. **Cât timp cheile de mai jos nu sunt setate, widgetul nu apare deloc și
autentificarea funcționează exact ca acum** — e dezactivat din oficiu (vezi `app/lib/turnstile.ts`).

Pentru a-l activa:

1. În [dashboard-ul Cloudflare](https://dash.cloudflare.com/) → **Turnstile** → creează un widget
   nou (tip *Managed*, domeniul site-ului). Vei primi două chei: una **publică** (site key) și una
   **secretă**.
2. Cheia publică se pune ca variabilă în `wrangler.json`, în `vars`:
   ```json
   "TURNSTILE_SITE_KEY": "0x4AAAAAAA..."
   ```
   apoi `npm run build && npx wrangler deploy`. (Local, pune-o direct în `.dev.vars`:
   `TURNSTILE_SITE_KEY="0x4AAAAAAA..."` — o valoare acolo o suprascrie pe cea din `wrangler.json`.)
3. Cheia secretă **nu** se pune în `wrangler.json` (fișier care ajunge în git) — se setează ca
   secret:
   ```bash
   cd app
   npx wrangler secret put TURNSTILE_SECRET_KEY
   ```
   Local, pune-o (necriptată, e doar pentru dev) tot în `.dev.vars`:
   `TURNSTILE_SECRET_KEY="0x4AAAAAAA..."`.

Verificarea devine obligatorie abia când **ambele** chei sunt setate; dacă lipsește oricare
dintre ele, comportamentul rămâne cel de azi (fără widget, fără verificare). O eroare de rețea
către Cloudflare la verificare este tratată ca eșec (mesaj prietenos, încearcă din nou) — nu
lasă autentificarea să treacă necontrolat.
