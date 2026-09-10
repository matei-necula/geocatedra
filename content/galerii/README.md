# Galerii foto — imagini gata de ingest

Aici stau imaginile finale (WebP) ale galeriilor `foto`, în ordinea în care
apar pe site, plus `manifest.json`-ul cu legendele. Sursele brute (planșele
primite de la doamna profesoară) NU sunt în repo — stau în
`Downloads/imagini pentru site/`.

## Cum se înlocuiește o galerie

```bash
cd app
# 1) pregătește imaginile (taie marginile albe, redimensionează, scrie WebP)
node scripts/prep-gallery.mjs ../content/galerii/<x>     # citește <x>/prep.json
# 1b) pentru planșe-colaj care trebuie tăiate în panouri (galeria Universul)
node scripts/slice-universul.mjs ../content/galerii/universul
# 2) verifică dintr-o privire ordinea și decupajele
node scripts/contact-sheet.mjs ../content/galerii/universul /tmp/sheet.jpg 4 380
# 3) probă fără efecte
node scripts/replace-gallery.mjs ../content/galerii/<x>/manifest.json --target remote --dry
# 4) pe bune, cu copie de siguranță a pozelor vechi
node scripts/replace-gallery.mjs ../content/galerii/<x>/manifest.json \
  --target remote --backup ~/Downloads/backup-galerii-<x>
```

`replace-gallery.mjs` găsește materialul după `(gradeId, topicSlug, slug)`,
descarcă pozele vechi în folderul de backup, urcă pozele noi cu `idx` 0..N-1,
rescrie `captions` din body și abia apoi șterge obiectele R2 vechi.

## `universul/` (clasa a 9-a)

- `a*` → galeria „Universul — galerie foto” (`universul-partea-1`)
- `b*` → galeria „Sistemul Solar — galerie foto” (`universul-partea-2`)

Nu toate imaginile vin din decupaj: `a01`, `a06`, `a08`, `b00`, `b01` și `b03a`
sunt planșe întregi, doar redimensionate; `a02`–`a05` sunt panouri decupate după
coordonate fixe (`box()`), iar `a07` („Stelele după culoare și mărime") e
compusă de `starsScale()` din chiar imaginile jocului de ordonare
`content/games/sistem-solar-ordine`. Dacă o sursă nu mai e pe disc, scriptul o
sare cu un mesaj și lasă neatins fișierul deja generat din folder.

Panourile `b03`–`b24` sunt decupate din două planșe-colaj
(`componenete sistemul solar.png`, `sateliti, eclipse, meteoriti, cometa.png`)
de `scripts/slice-universul.mjs`: coordonatele grilei sunt fixe în script, iar
marginile albe ale panourilor se taie automat (bounding box pe pixeli ne-albi).

## `atmosfera/` (clasa a 9-a)

Galeria „Atmosfera și caracteristicile climatice". Imaginile se pregătesc cu
`prep-gallery.mjs` din `atmosfera/prep.json` — planșe întregi, cu marginile albe
tăiate automat. Hărțile păstrate din galeria veche (izoterme ianuarie/iulie,
izoterme anuale, izohiete anuale) au fost descărcate din R2 în
`~/Downloads/backup-galerii-atmosfera/pastrate/`, de unde le ia `prep.json`.

## `climatele-terrei/` (clasa a 9-a)

Galeria „Climatele Terrei" alternează hartă de repartiție → climogramă. Hărțile
noi (ecuatorială, musonică, tropical-aridă, subtropicală, temperată,
temperat-rece, subpolară+polară) vin din `~/Downloads`; harta de ansamblu, harta
subecuatorială și toate climogramele s-au păstrat din galeria veche și stau în
`~/Downloads/backup-galerii-climatele/pastrate/`. Climogramele se scriu cu
`"quality": 92`, ca textul lor mărunt să rămână curat.

## `relief-minor/` (clasa a 9-a)

Galeria „Relieful minor" e făcută din patru planșe desenate, tăiate în 40 de
panouri separate. Casetele se detectează automat cu
`scripts/slice-panels.mjs boxes <planșă> --rmax 8` (care le întoarce în ordinea
de citire, pe rânduri), iar coordonatele lor absolute ajung în `prep.json` ca
`box`. Numele și clasificarea pe tip genetic sunt aceleași ca la jocul
`content/games/relief-minor-planse` — panourile de acolo au fost tăiate din
exact aceleași planșe, așa că numele rămân consecvente între galerie și joc.
Ordinea din galerie o dă **lecția scrisă** „Relieful minor", nu ordinea
planșelor: apa curgătoare → gravitațional → glaciar → deșertic → litoral →
petrografic → structural → antropic; și în interiorul fiecărei grupe, ordinea
formelor din tabelul lecției. Tot de acolo vin și numele tipurilor genetice
(pluviodenudare, torențial, glaciar montan/de calotă, fluvio-maritim, carstic,
pe loess, pe roci magmatice).

## `relief-major/` (clasa a 9-a)

Patru planșe, în ordinea în care stăteau imaginile vechi: elementele
morfologice → treptele de relief → formarea munților → peneplena și pediplena.
Fiecare planșă nouă acoperă mai multe imagini vechi (treptele de relief le ia pe
munte/deal/podiș/câmpie, iar ultima ia și peneplena, și pediplena), de aceea
galeria are 4 poze în loc de 9.

## `pamantul-miscari/` (clasa a 9-a)

O singură planșă (`miscari.jfif`), tăiată în cele patru panouri ale ei prin
coordonate fixe în `prep.json`. Ordinea din galerie o dau imaginile vechi:
rotația → forța Coriolis → orbita cu periheliu și afeliu → poziția la solstiții
și echinocții.

## `hidrosfera/` (clasa a 9-a)

Galeria „Hidrosfera" — 13 planșe noi, în ordinea numerotării fișierelor din
`Downloads/` (`1. struct hidrosf` … `12. ghetari`): rezervele de apă →
emisfere → salinitate → proprietăți pe latitudine → valuri → maree → curenți →
ape curgătoare → bazin hidrografic → ape subterane → gheizer → izbuc → ghețari.
Cele două fișiere numerotate `12` (izbucul și ghețarii) stau în ordinea asta:
izbucul ține de apele subterane, ghețarii încheie galeria cu apa în stare solidă.
Planșe întregi, `trim: false` — nu au margini albe de tăiat.

## `soluri/` (clasa a 9-a)

Galeria „Solurile Terrei (pedosfera)" — 8 planșe, tot în ordinea numerotării:
profilul solului → factorii pedogenetici → compoziția → componentele → structura
→ textura → tipurile zonale (două planșe). Galeria a scăzut de la 13 la 8 poze:
planșele noi adună pe una singură ce era împrăștiat pe mai multe.

## `dinamica-litosferei/` (clasa a 9-a)

12 planșe. Două dintre ele nu se urcă așa cum vin din `Downloads/`:

- **Tipurile de erupții** (`1. eruptii vulc.jpg`) scrie „STROBOLIANĂ"; textul e
  rescris în imagine cu `scripts/patch-image-labels.mjs`, după caseta din
  `labels-corectate.json`. (La fel și „DIRCȚIA DE" pe planșa cu unde seismice.)
  Versiunea din 2026-08-26 a planșei a rămas identică, mai puțin titlurile
  „Erupții liniștite" / „Erupții explozive", pe care doamna profesoară le-a scos.
- **Mișcările epirogenetice** (`4. misc epirog.jpg`) avea săgețile verticale puse
  invers: în sus la transgresiune, în jos la regresiune. Transgresiunea vine însă
  din **lăsarea** uscatului, regresiunea din **ridicarea** lui. Cele două săgeți
  roșii sunt întoarse pe loc cu `scripts/flip-image-region.mjs`, după casetele din
  `sageti-epirogenetice.json`. Scriptul nu întoarce pur și simplu dreptunghiul —
  ar aduce cu el și fundalul, care are umbră și vignetare, iar peticul s-ar vedea;
  ia forma cu transparență și reface fundalul de sub ea, rând cu rând.

## `climatele-terrei/` — climogramele (clasa a 9-a)

Cele 12 climograme ale galeriei nu mai sunt infograficele vechi (fișă cu
altitudine, latitudine, cilindru gradat și termometru). Din 2026-09-04 sunt
**decupajul din dreapta al panourilor de vegetație din galeria „Zonele
biogeografice"** — `x 803..1600` din `zonele-biogeografice/*-vegetatie.webp`,
adică exact cartonașul cu graficul, fără fotografie. Zece dintre ele au deja
perechea acolo, cu aceeași stație meteo (Iquitos, Veracruz, Kalgoorlie, Atena,
Taipei, Londra, Aktiubinsk, Iakutsk, Inuvik, McMurdo).

**Musonic (Bangkok)** și **temperat-continental (Moscova)** n-au panou în
Biosfera — acolo nu există zonă biogeografică musonică, iar stepa ține locul
temperat-continentalului. Cele două cartonașe sunt desenate pe un panou-șablon
(`12-subtropicala-umeda` și `16-foioase`) cu:

```bash
cd app && node scripts/draw-climograms.mjs <dir-src> <dir-out> <map.json>
```

Datele vin din `content/games/gen/climate-data.mjs` — aceeași sursă unică
folosită de galeria Biosfera și de jocul `clima-harta`, deci cele trei nu pot
ajunge să spună lucruri diferite despre același climat.

Scriptul merge acum și pe panourile deja publicate (1600×873), nu doar pe
originalele de 2816×1536: coordonatele stau într-un `viewBox`, iar randorul le
scalează singur (raportul e identic). Două capcane rezolvate tot atunci: caseta
de ștergere pornea de la `y=318`, exact prin vârful titlului desenat la rularea
anterioară, și nu acoperea deloc etichetele mm din dreapta — un panou redesenat
cu alt `pmax` rămânea cu cifrele vechi dedesubt (800 peste 320).

Ca o rulare de `prep-gallery.mjs` să nu le înlocuiască la loc cu vechile
infografice, cele 12 intrări **au fost scoase din `prep.json`**; câmpul
`climograme` de acolo spune de ce.

`labels-luni.json` a fost șters odată cu ele: peticea inițialele englezești ale
lunilor (`J` → `I`) pe climograma Kalgoorlie, după casete în pixeli de pe planșa
veche (y≈924, într-o imagine care acum are 873 px înălțime). Cartonașele din
Biosfera au deja inițialele românești, deci fișierul rămăsese nu doar inutil, ci
periculos — o rulare de `patch-image-labels.mjs` cu el ar fi ștampilat litere în
mijlocul graficului nou.
