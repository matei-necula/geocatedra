# Catedra — Prezentare generală (limbaj simplu)

> *Nume de lucru: "Catedra". Geografia este prima materie; platforma este construită ca să poată fi refolosită și pentru alte materii (ex. biologie) fără rescriere de cod.*

## Ce construim (pe înțelesul tuturor)

O platformă web unde toate materialele de predare stau într-un singur loc, organizate clar, gata de folosit la oră — fără printuri și fără să reiei planul de la zero de fiecare dată.

Pagina principală are **trei uși**:

1. **Elevii** — intră cu o **parolă (token)** primită de la doamna profesoară. Tokenul deschide **doar materialele clasei lor** și nimic altceva. Gratis pentru elevii ei.
2. **Profesorii** (cu plată) — pot vedea materialele și genera tokenuri pentru clasele lor.
3. **Oricine altcineva / public** (cu plată) — vede materialele blocate, cu câteva exemple gratuite.

## Cum funcționează tokenul elevului (varianta aleasă)

- Doamna profesoară apasă un buton și **generează o parolă pentru o clasă**.
- Toți elevii clasei folosesc **aceeași parolă**.
- Parola deschide **toată materia clasei lor** (ex. tot ce ține de clasa a 6-a).
- Parola este valabilă **până la sfârșitul anului școlar (15 iunie)**.
- Elevii **nu au cont** și **nu dau niciun fel de date personale** — doar parola.

## Ce facem acum și ce lăsăm pe mai târziu

**Acum (prioritate #1):** experiența elevului — biblioteca de materiale + intrarea cu token. Totul cu materiale de probă (exemple), nu cu materialele reale.

**Mai târziu (în ordine):** unelte pentru doamna profesoară de a adăuga materiale → conturi de profesor + plăți → public + plăți → funcțiile AI (asistent de structură a lecției, generator de examene) → **abia la final** se încarcă materialele reale → apoi facem platforma refolosibilă pentru alte materii.

## Cât costă

Pentru toată partea de elevi, ținta este **0 lei/lună** (folosim variantele gratuite). Primele costuri reale vor apărea mai târziu, la **video** și la **funcțiile AI**, și **nu plătim nimic fără să te anunțăm întâi** cât costă și de ce.

---

### English note (for the project owner)

This is the plain-language overview intended for the non-technical admin (the teacher).
Technical detail lives in the other `/docs` files: architecture (`01`), data model (`02`),
permissions matrix (`03`), anti-piracy (`04`), phase plan (`05`), skills (`06`),
open questions (`07`), the cost ledger (`costs.md`), and the ADRs under `docs/adr/`.
