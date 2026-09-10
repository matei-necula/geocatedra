# Fotografiile cardurilor de material — proveniență

**Nu edita cu `app/scripts/fetch-card-photos.mjs`** — scriptul există și rulează (caută pe
Wikimedia Commons, PD/CC0), dar cele patru fișiere `card-*-640.*` folosite ACUM **nu vin de
la el**. Sunt decupate manual dintr-o imagine generată de Gemini (AI), la cererea explicită a
proprietarei, care a acceptat cunoscând abaterea de la regula obișnuită a site-ului (mai jos).

## Excepție asumată de la regula „doar PD/CC0"

Toate celelalte fotografii de decor ale sitului (`content/site/SOURCES.md`) sunt strict domeniu
public sau CC0 — regulă explicită, pentru că subsolul sitului invocă Legea 8/1996 pe materialele
autoarei, iar surse „gratis de folosit" ca Unsplash/Pexels au fost respinse ca prea slabe ca
proveniență.

Aceste patru imagini **nu respectă regula**: sunt decupate dintr-o imagine generată cu Gemini
(unealtă AI a Google), nu o fotografie — drepturile depind de termenii de utilizare Google
Gemini/Imagen, nu de domeniul public, și nu există un fișier-sursă de proveniență de citat aici
ca la restul imaginilor. Decizia a fost a proprietarei, luată în cunoștință de cauză
(2026-09-08) — dacă site-ul devine vreodată subiect de audit de licențiere media, astea sunt
primele de verificat/înlocuit.

Fișierele stau în `app/public/img/`, nu în R2 — sunt decor, nu conținut cu control de acces.

## Ce arată fiecare

O singură fotografie per categorie (`scris`/`foto`/`joc`/`question`), refolosită pe toate
cardurile acelei categorii — vezi `CATEGORY_PHOTO` din `app/lib/card-art.ts`.

| categorie | conținut |
|---|---|
| `card-scris` | atlas deschis + pană de scris, pe un birou de lemn |
| `card-foto` | munți (Dolomiți) + aparat foto cu teleobiectiv |
| `card-joc` | hartă-puzzle de lemn + busolă |
| `card-question` | glob terestru + fișă de exerciții + pix |

Decupate manual (`sharp`, extract + resize cover) din imaginea sursă, ca să elimine pictograma
mică din colțul fiecărui card al imaginii originale — cerință explicită. Sursa originală (fișier
local, neîncărcat în repo): `Gemini_Generated_Image_fvv6nfvv6nfvv6nf.jfif`.

## Mărimi generate

O singură lățime, 640×360 (16:9), decupată din centru.

- `card-scris-640.avif` / `.webp`
- `card-foto-640.avif` / `.webp`
- `card-joc-640.avif` / `.webp`
- `card-question-640.avif` / `.webp`
