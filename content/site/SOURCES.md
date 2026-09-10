# Fotografiile site-ului — proveniență

**Nu edita cu `app/scripts/fetch-photos.mjs`** — scriptul există și rulează (caută pe Wikimedia
Commons, VERIFICĂ PD/CC0), dar cele trei fișiere `erou`/`elevi`/`profesori` folosite ACUM **nu
vin de la el**. Sunt decupate manual dintr-o imagine generată de Gemini (AI), la cererea
explicită a proprietarei (2026-09-08), care a acceptat cunoscând abaterea de la regula obișnuită
(mai jos) — același caz ca la `content/site/SOURCES-carduri.md`.

## Excepție asumată de la regula „doar PD/CC0"

Regula scriptului (necesar în continuare pentru orice fotografie viitoare): **doar domeniu
public sau CC0**, aceeași ca la jocuri (`content/games/SOURCES.md`). Unsplash și Pexels au fost
respinse explicit ca „gratis de folosit", dar nu domeniu public — subsolul site-ului invocă
Legea 8/1996 pe materialele autoarei, deci nicio sursă cu proveniență mai slabă n-are ce căuta
aici, în mod normal.

Cele trei fotografii curente **nu respectă regula**: sunt decupate dintr-o imagine generată cu
Gemini (unealtă AI a Google), nu fotografii — drepturile depind de termenii de utilizare Google
Gemini/Imagen, nu de domeniul public, și nu există fișier-sursă de citat ca proveniență. Dacă
site-ul devine vreodată subiect de audit de licențiere media, astea sunt (împreună cu cele patru
fotografii de pe cardurile de material) primele de verificat/înlocuit cu varianta PD/CC0 pe care
scriptul o poate genera oricând.

Fișierele stau în `app/public/img/`, **nu** în R2: R2 se servește prin `/media/:id`, care
trece prin `resolveVisibility`. O fotografie decorativă n-are ce căuta pe traseul cu control
de acces.

## Ce arată fiecare

| rol în pagină | conținut |
|---|---|
| `erou` | faleză + plajă la malul mării (bara de sus a paginii de start) |
| `elevi` | deltă, vedere aeriană/satelitară |
| `profesori` | sat de munte, vale verde, fără zăpadă |

Decupate manual (`sharp`, extract pe scenă + resize păstrând proporția) din imaginea sursă.
Sursa originală (fișier local, neîncărcat în repo): `Gemini_Generated_Image_x22x4ax22x4ax22x.jfif`.

## Mărimi generate

Fiecare imagine în AVIF și WebP, la 640 / 1280 / 1920 px (`elevi`/`profesori` sunt decupaje mai
mici din sursă — sub 1280 px lățime reală — deci fișierul „-1920" e identic cu „-1280", nu o
variantă mai mare; `withoutEnlargement` din script evită să le mărească artificial).

### `erou`

- `erou-640.avif` — 11 kB
- `erou-640.webp` — 17 kB
- `erou-1280.avif` — 36 kB
- `erou-1280.webp` — 59 kB
- `erou-1920.avif` — 80 kB
- `erou-1920.webp` — 129 kB

### `elevi`

- `elevi-640.avif` — 26 kB
- `elevi-640.webp` — 40 kB
- `elevi-1280.avif` — 91 kB
- `elevi-1280.webp` — 125 kB
- `elevi-1920.avif` — 91 kB (= 1280, vezi mai sus)
- `elevi-1920.webp` — 125 kB (= 1280, vezi mai sus)

### `profesori`

- `profesori-640.avif` — 36 kB
- `profesori-640.webp` — 61 kB
- `profesori-1280.avif` — 138 kB
- `profesori-1280.webp` — 166 kB
- `profesori-1920.avif` — 138 kB (aceeași rezoluție ca 1280, dar comprimare diferită)
- `profesori-1920.webp` — 208 kB (aceeași rezoluție ca 1280, dar comprimare diferită)
