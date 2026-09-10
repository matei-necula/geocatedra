# Privacy & compliance notes

> Built to good practice. **Not legal certification.** The named entity, contact, retention
> periods, and final wording need the owner + a lawyer. The `/confidentialitate` and `/termeni`
> pages carry a visible "draft — review with a lawyer" banner until confirmed.

## What personal data the platform holds

- **Admin (the teacher):** email + password (login). Real account.
- **Students:** **none.** They enter with a shared class token (no account, no PII). In
  "Exersează" they choose a **non-identifying nickname/code** — the UI explicitly tells them not
  to use their real name — so practice results are **pseudonymous, not personal data**.
- **Teachers/public (future phases):** account email + payment data, when enabled.

## Cookies

Only **strictly necessary** session cookies: `cat_student`, `cat_admin` (HMAC-signed, httpOnly).
They are essential for login, so under EU ePrivacy rules **no consent banner is required** — they
are disclosed in the privacy policy. **No analytics or tracking cookies.** If analytics are added
later, add a consent mechanism then.

## Data minimization & retention

- Practice stores only a nickname + scores + scope; no real names, no IP logging beyond
  Cloudflare's platform defaults.
- Suggested retention for `practice_attempts`: end of the school year (configurable). Document the
  exact period with the lawyer.
- **Admin control:** `/admin/rezultate` → "Șterge datele de exersare" deletes practice attempts
  (all, or for the selected grade) and the related question stats.

## Pages
- `/confidentialitate` — Privacy Policy (template, placeholders for entity/contact/legal basis).
- `/termeni` — Terms & Conditions (template). Both linked in the site footer.

## Still requires legal sign-off
Lawful basis, exact retention, the controller's identity/contact, and (if real student identities
are ever introduced) parental-consent handling for minors under 16.
