# Surse și licențe — imaginile jocurilor

Aproape toate imaginile folosite în jocuri sunt **Public Domain (PD)** sau **CC0**.
Excepția o fac hărțile proprii ale autoarei (vezi „Hărți proprii ale autoarei"), care sunt
opera ei și rămân sub dreptul ei de autor. Fiecare rând notează fișierul, sursa și licența.

## Harta de bază

| fișier | sursă | licență |
|---|---|---|
| gen/world-base.svg | [File:BlankMap-Equirectangular.svg](https://commons.wikimedia.org/wiki/File:BlankMap-Equirectangular.svg) — Natural Earth (Tom Patterson, Nathaniel Vaughn Kelso) / Bjørn Sandvik | CC0 1.0 (Public Domain) |

Proiecție: **echirectangulară (plate carrée)**, 360×180 → `x% = (lon+180)/360·100`, `y% = (90−lat)/180·100`.

## Hărți și climograme generate (derivate din world-base.svg + date proprii)

Generate cu scripturile din `content/games/gen/` (`climograms.mjs`, `maps.mjs`).
Sunt lucrări derivate ale hărții CC0 de mai sus + desen propriu (CC0).

`soluri-harta/harta-zone-vegetatie.png` — cele 8 areale de vegetație pe o singură hartă,
fundal pentru „Așază solurile pe hartă" (solurile urmează zonele de vegetație). Generată de
`maps.mjs` din aceleași elipse ca hărțile `areal-*` ale jocului „Vegetația și arealul ei".

## Hărți de perete scanate de profesoară (lot 2026-07-24)

Cele 5 hărți-planșă de mai jos sunt **scanuri furnizate de profesoară**, declarate de
proprietar **libere de folosit** (decizie consemnată 2026-07-24). Recomprimate la ≤2000px /
JPEG q80 din scanurile originale înainte de ingest.

| fișier | joc | conținut |
|---|---|---|
| hidro-lacuri/harta-lacuri.jpg | Lacurile lumii pe hartă | „MARILE LACURI" |
| hidro-fluvii/harta-fluvii.jpg | Fluviile lumii pe hartă | „FLUVIILE TERREI" |
| relief-munti/harta-munti.jpg | Munții lumii pe hartă | „MARILE LANȚURI MONTANE" |
| relief-podisuri/harta-podisuri.jpg | Podișurile lumii pe hartă | „MARILE PODIȘURI" |
| relief-campii/harta-campii.jpg | Câmpiile lumii pe hartă | „MARILE CÂMPII" |

## Hărți proprii ale autoarei (lot 2026-08-27)

Hărțile de mai jos **aparțin doamnei profesoare Liliana Necula** — sunt opera ei, nu material
preluat. Nu sunt PD/CC0: dreptul de autor îi aparține integral, în temeiul Legii nr. 8/1996,
iar platforma le folosește cu acordul autoarei. **Nu se redistribuie în afara platformei** și
nu se tratează ca imagini libere la un eventual audit de licențe.

| fișier | joc | conținut |
|---|---|---|
| medii-fluvii-campii/harta-campii.webp | Fluvii și câmpii pe hartă | „MARILE CÂMPII" |
| medii-fluvii-campii/harta-fluvii.webp | Fluvii și câmpii pe hartă | „FLUVIILE TERREI" (decupată) |

Sursa: `CÂMPII.png` și `FLUVII.png`, trimise de autoare. Convertite în WebP la 2000px lățime
(9,1 MB → 0,29 MB), fiindcă jocul încarcă ambele hărți, iar elevii sunt în majoritate pe
telefon. Harta fluviilor e recompusă ca să aibă exact proporția hărții câmpiilor (2000×1105)
și să nu sară caseta jocului între runde: banda cu titlul „FLUVIILE TERREI" (y 0..95 din
original, inclusiv linia chenarului) stă deasupra corpului hărții decupat din y 363..1567.
Se taie astfel doar banda arctică de sus și Oceanul Sudic de jos, iar **titlul autoarei
rămâne pe hartă** — e semnătura ei pe propria lucrare, nu o decorațiune.

> Notă: lotul din 2026-07-24 de mai sus (hărțile de perete) e consemnat drept „scanuri
> furnizate de profesoară, declarate libere de folosit". Pentru cele două hărți din acest lot
> situația e alta și mai puternică: autoarea **este titulara drepturilor**.

## Fotografii

Toate fotografiile sunt **Public Domain** sau **CC0**, verificate pe pagina
`File:` a fiecăreia înainte de descărcare. Proveniența completă (fișier → URL
sursă → licență) este în rapoartele per-folder:

- `sistem-solar-ordine/SOURCES-report.md` — 15 imagini (NASA/USGS PD, Hubble PD)
- `_photos/bio/SOURCES-report.md` — vegetație + animale (USFWS/NPS/NARA PD, câteva CC0)
- `_photos/geo/SOURCES-report.md` — soluri + relief (USDA/USGS PD, o faleză CC0)
- `_photos/bio-animale-2/SOURCES-report.md` — 23 animale noi + 2 imagini de zonă (polar,
  eucalipt) pentru „Vegetația și animalele ei" extins la 30 de animale (lot 2026-07-24, toate CC0)

## Planșele „Relieful minor în imagini" (lot 2026-07-24)

`content/games/relief-minor-planse/rm-*.jpg` (40 de panouri decupate din `plansa-1..4.jpg`) sunt
**furnizate de profesoară, generate AI, libere de utilizat** (decizie a proprietarei, 2026-07-24) —
același regim ca hărțile scanate și colajul universului din același lot.

## Planșele didactice biomuri / plante / faună / soluri (loturile 2026-07-25 și 2026-07-29)

Același regim: **furnizate de profesoară, generate AI, libere de utilizat** (decizie a proprietarei).
Panourile decupate din ele sunt lucrări derivate.

| planșă sursă | conținut | panouri decupate |
|---|---|---|
| `_incoming/2026-07-25/plansa-5.jpg` | biomuri (**înlocuită**, vezi lotul 2026-08-13) | — |
| `_incoming/2026-08-13/plansa-biomuri.jpg` | 10 biomuri, grilă 5×2 | `bio-biom-plante/biom-*.jpg`, `bio-vegetatie-animale/biom-*.jpg`, `bio-vegetatie-areale/biom-*.jpg`, `soluri-vegetatie/biom-*.jpg` |
| `_incoming/2026-07-25/plansa-6.jpg` | plante | `bio-biom-plante/plant-*.jpg` |
| `_incoming/2026-07-25/plansa-7.jpg` | faună | `bio-vegetatie-animale/an-jaguar, an-girafa, an-camila, an-muflon, an-mistret, an-elan, an-ren` (lot 2026-08-12) |
| `_incoming/2026-07-25/plansa-8.jpg` | 8 profiluri de sol | `soluri-profile/sol-1..8-*.jpg`, `soluri-vegetatie/sol-1..8-*.jpg` |
| `_incoming/2026-07-29/plansa-10.jpg` | 5 orizonturi de sol (schițe 3-D) | `soluri-orizonturi/orizont-1..5-*.jpg` |
| `_incoming/2026-08-11/plansa-11.png` | evoluția stelelor, 2×7 etape | `stele-evolutie/`, `stele-evolutie-gigant/` |
| `_incoming/2026-08-11/plansa-20.png` | 12 corpuri din Sistemul Solar | `sistem-solar-ordinea/` |
| `_incoming/2026-08-13/plansa-rotatie.jpg` | 8 consecințe ale rotației | `pamant-rotatie-revolutie/rot-*.jpg` |
| `_incoming/2026-08-13/plansa-revolutie.jpg` | 8 consecințe ale revoluției | `pamant-rotatie-revolutie/rev-*.jpg` |
| `_incoming/2026-08-13/plansa-anotimpuri.jpg` | solstiții/echinocții, 4 cadrane | `pamant-momente/moment-*.jpg` (fără banda cu titlul) |
| `_incoming/2026-08-11/soluri/1..8` | cele 8 profiluri de sol, decupate de profesoară | `soluri-profile/sol-1..8-*.jpg` (fără banda cu numele), `soluri-harta/sol-1..8-*.jpg` (cu numele) |

Detalii per fișier: `soluri-profile/SOURCES-report.md`.

**Atenție la `bio-vegetatie-animale/an-*.jpg`:** numele nu indică o sursă unică. Cele 7 fișiere
listate mai sus sunt decupate din planșa 7 (lot 2026-08-12); **restul `an-*.jpg` sunt fotografii
PD/CC0 descărcate separat de pe Wikimedia Commons**, documentate în
`_photos/bio-animale-2/SOURCES-report.md`. Verifică acolo înainte să presupui proveniența.

### Excepții și decizii de licență

- **`animal-muflon.jpg`** — Commons nu are nicio fotografie de muflon sub PD/CC0
  (toate CC-BY-SA), dar **iNaturalist** are: [obs 165489204](https://www.inaturalist.org/observations/165489204)
  (*Ovis aries musimon*, **CC0**, Justin Philbois, Franța 2023). A înlocuit gravura PD
  din 1887. Găsită filtrând iNaturalist după `photo_license=cc0`.
- **`veg-savana.jpg`** — înlocuită cu o savană Serengeti clasică (salcâm + iarbă aurie),
  [rawpixel #3338750](https://www.rawpixel.com/image/3338750/free-photo-image-savanna-cc0-creative-commons), **CC0**.
- **`veg-tundra.jpg`** — înlocuită cu o tundră montană clară 1024×768,
  [Flickr U.S. Forest Service](https://www.flickr.com/photos/126720625@N05/31354285547), **PDM** (domeniu public federal SUA).
- **terra rossa** — nu există fotografie PD/CC0 a acestui sol (verificat pe Openverse
  CC0/PDM). Rezolvat altfel: din 2026-07-29 jocul „Recunoaște profilul de sol" folosește
  cele **8 profiluri desenate din `plansa-8.jpg`**, terra rossa inclusă; vechile 5 fotografii
  de sol au fost scoase.
- **`veg-mediteranean`** — rămâne cea mai bună opțiune CC0 (maquis cu ceață); căutări noi
  pe Openverse nu au dat o alternativă clar mai bună. Candidat la înlocuire cu poză proprie.

## Desene proprii (CC0) — generate din scripturi

Nu vin din nicio sursă externă; sunt desenate de scripturile din `content/games/gen/`
și rasterizate cu `app/scripts/rasterize.mjs`. Se pot regenera oricând.

| script | ce produce | folosit în |
|---|---|---|
| `gen/climograms.mjs` | 9 climograme | `clima-harta/` |
| `gen/maps.mjs` | hărți compuse din `world-base.svg` (CC0) | `clima-harta/`, `soluri-harta/`, `bio-vegetatie-areale/` |
| `gen/stars.mjs` | diagrame stelare | `univers-evolutie/` |
| `gen/tectonics.mjs` | 4 diagrame-bloc cu margini de plăci | nefolosit din 2026-08-14 (înlocuit de planșa 6) |
| `gen/seasons-map.mjs` | hartă cu paralelele-cheie | `pamant-anotimpuri/harta-anotimpuri.png` |
| `gen/scale-maps.mjs` | hărți cu scară numerică/grafică | `harti-scara/` |
| `gen/topo.mjs` | semne convenționale, curbe de nivel, rețea cartografică | `harti-topografice/` |

## Lotul 2026-08-13

Planșele și harta de referință trimise de profesoară pe 2026-08-13 sunt în
`_incoming/2026-08-13/` (același regim: furnizate de profesoară, generate AI, libere de
utilizat), împreună cu cele două documente `.docx` care descriu jocurile cerute.

- **`plansa-biomuri.jpg`** înlocuiește `plansa-5.jpg` ca sursă a tuturor `biom-*.jpg`:
  10 panouri (ecuatorial, savană, deșert cald, mediteranean, stepă / deșert temperat,
  foioase, taiga, tundră, polar), decupate cu 4 px inset și redimensionate la 800 px.
- **`harta-fluvii-referinta.jpg`** — hartă hidrografică cu denumiri tipărite. Folosită
  **doar ca referință** pentru poziționarea bulinelor; nu este publicată ca imagine de joc,
  fiindcă numele fluviilor (adică răspunsurile) sunt scrise pe ea.
- **`plansa-solstitiu.jpg`** — machetă de escape-room; conține codurile-răspuns tipărite,
  deci nu poate fi folosită ca fundal de joc. Din ea se pot decupa doar elemente izolate.

## Jocul „Harta secretă" (escape-room-ul cu semne convenționale, curbe de nivel și coordonate)

`harti-topografice/*.png` sunt generate de `content/games/gen/topo.mjs` — desen propriu (CC0),
fără nicio sursă externă. Zece imagini:

- `legenda-cota.png`, `legenda-depresiune.png`, `legenda-pestera.png`, `legenda-mlastina.png` —
  patru cartonașe cu câte un singur semn convențional (fără text care ar dezvălui răspunsul).
- `relief-contur-1.png`, `relief-contur-2.png` — fragmente cu curbe de nivel imbricate,
  desenate ca blob-uri asimetrice (dese pe versantul abrupt, rare pe cel lin), cu etichete de
  altitudine și puncte literate A–D.
- `coord-1.png` … `coord-4.png` — rețea cartografică (paralele/meridiane din 15° în 15°) cu
  puncte literate A–D; geometria pinurilor e calculată din lat/long, nu desenată cu ochiul.

Se regenerează oricând cu `node content/games/gen/topo.mjs` urmat de
`node app/scripts/rasterize.mjs content/games/harti-topografice 1600`.

## Jocul „Raliul cartografic" (scara hărții)

`harti-scara/*.png` sunt generate de `content/games/gen/scale-maps.mjs` — lucrare derivată
a hărții CC0 `world-base.svg` (rutele dintre orașe, proiectate într-o fereastră lon/lat
proprie ca textul să fie lizibil) plus desen propriu (CC0) pentru planul de cartier, poteca
montană, cardul de scară și cadrele de comparație. Rasterizate cu `app/scripts/rasterize.mjs`.

## Lotul 2026-08-14

Planșele trimise de profesoară pe 2026-08-14 sunt în `_incoming/2026-08-14/` — același
regim ca loturile anterioare: **furnizate de profesoară, generate AI, libere de utilizat**.
Panourile decupate din ele sunt lucrări derivate. Tăiate cu `app/scripts/slice-panels.mjs`
(unealtă nouă: `detect` găsește benzile grilei, `cut` decupează după o listă de fracții).

| planșă sursă | panouri | unde ajung |
|---|---|---|
| `plansa-3-rotatie.png` | 9 × `rot-*.jpg` (800 px, pătrate) | `pamant-rotatie-revolutie/` |
| `plansa-4-revolutie.png` | 7 × `rev-*.jpg` (800 px) | `pamant-rotatie-revolutie/` |
| `plansa-anotimpuri-noua.jpg` | 4 × `moment-*.jpg` (900 px, raport 2,05) | `pamant-momente/` |
| `plansa-6-margini-placi.jpg` | 4 × `marg-*.jpg` (1000 px, raport 1,55) | `tectonica-arhitect/` |
| `plansa-proiectii.jpg` | 4 × `proj-*.jpg` (900 px, raport 1,6) | `harti-proiectii/` |

Note:

- **`plansa-3-rotatie.png` are 3 casete albe** (și `plansa-4` una) — panouri golite în planșa
  originală. Sunt sărite; din planșa 3 ies 9 panouri, nu 12.
- **`plansa-5-momente.jpg`** (prima variantă a celor patru momente ale anului) **nu se
  folosește**: două dintre cele patru cadrane arată amândouă peisaj de toamnă, deci vara nu
  se poate distinge. A fost înlocuită de `plansa-anotimpuri-noua.jpg`, unde cele patru
  anotimpuri sunt limpezi (lalele / grâu copt / pădure ruginie / zăpadă), în ordinea de
  citire. Fișierul rămâne în `_incoming/` ca urmă a deciziei.
- **`marg-*.jpg` înlocuiesc `marg-*.png`** generate de `gen/tectonics.mjs`. Scriptul rămâne
  în depozit ca rezervă, dar nu mai alimentează niciun joc.
- Cele patru proiecții din `plansa-proiectii.jpg` sunt, în ordinea de citire: Mercator,
  Gall–Peters, Robinson, azimutală polară.

## Lotul 2026-08-15

| planșă sursă | panouri | unde ajung |
|---|---|---|
| `_incoming/2026-08-15/plansa-anotimpuri-peisaje.jpg` | 4 × `moment-*.jpg` (600 px, raport 1,5) | `pamant-momente/` |

Note:

- Planșa e **trimisă de profesoară pe 2026-08-15** (`ANOTIMPURI.jpg`), același regim ca
  loturile anterioare: generată AI, liberă de utilizat; panourile decupate sunt lucrări
  derivate. Tăiate cu `app/scripts/slice-panels.mjs cut` (inset 0,05 ca să cadă rama albă
  din jurul fiecărei fotografii).
- Cadranele, în ordinea de citire: **iarnă** (munți înzăpeziți) / **vară** (plajă) /
  **primăvară** (pajiște înflorită) / **toamnă** (pădure ruginie).
- Planșa are doar 536×360 px, deci panourile ies ~227×151 și sunt mărite la 600 px; ajung
  pentru cartonașele jocului (~112 px pe ecran), dar **nu** pentru afișare mare.
- Înlocuiesc `moment-*.jpg` decupate din `plansa-anotimpuri-noua.jpg` (lotul 2026-08-14),
  unde anotimpurile se citeau mai greu.

## Lotul 2026-08-31 — medii terestre, orizonturi de sol, structura internă

| planșă sursă | panouri | unde ajung |
|---|---|---|
| `Gemini_Generated_Image_lghdtflghdtflghd` (colaj 3×2) | 6 × `.webp` (880 px) | `medii-activitati-umane/` — runda 1 |
| `Gemini_Generated_Image_tsro2ltsro2ltsro` (colaj 3×2) | 6 × `.webp` (880 px) | `medii-activitati-umane/` — runda 2 |
| `oriz sol joc.jpg` (bandă de 6 panouri) | 6 × `orizont-*.webp` (520 px) | `soluri-orizonturi/` |
| `mediile terestre.jfif` | `harta-medii.webp` (1600 px) | `medii-activitati-umane/` |
| `strcut int terra.jfif` | `4-structura-interna.webp` (1800 px) | `galerii/pamantul-caracteristici/` |

Note:

- Toate cele cinci fișiere sunt **trimise de profesoară pe 2026-08-31**, același regim ca
  loturile anterioare: imagini generate AI ori planșe din materialul propriu, declarate
  libere de utilizat; panourile decupate sunt lucrări derivate.
- Colajele au fost tăiate detectând coloanele/rândurile aproape-albe dintre panouri, apoi
  fiecare panou a fost curățat de marginea albă rămasă. Ordinea de citire a colajelor este
  exact ordinea din cerința profesoarei, deci `idx`-urile din `game.json` o urmează.
- **Harta mediilor** păstrează legenda: elevul are nevoie de ea ca să identifice mediul.
  Două observații despre planșa-sursă, nerezolvate pentru că sunt în imagine, nu în cod:
  legenda are **de două ori rândul „MEDIUL DE SAVANĂ"** (cu două nuanțe diferite de
  portocaliu), iar eticheta „…PĂDURILOR DE CONIFERE" e **tăiată de marginea din dreapta**.
- Harta este **decupată la ~55° S**, deci **Antarctica nu apare pe ea**. Ținta polară a
  jocului stă pe **Groenlanda** și este etichetată după mediu („mediul polar glaciar"), nu
  după loc — fotografia cu stațiunea antarctică rămâne un exemplu corect al acelui mediu.
- Poziția fiecărei buline a fost aleasă automat: se caută punctul cel mai „interior" al
  arealului de culoare potrivit (comparat cu paletele decupate din legendă), evitând marea,
  care are aproape aceeași nuanță ca tundra. Verificarea de 5% distanță între bulinele
  aceleiași runde e prinsă în `app/app/lib/game-content.test.ts`.
- `4-structura-interna.webp` **înlocuiește** jumătatea din stânga a vechiului
  `4-structura-densitate.webp`; jumătatea din dreapta (coloana densităților) a fost
  decupată și păstrată separat ca `4b-densitate.webp`, cu legendă proprie.

## Lotul 2026-09-01 — jocurile de medii pe motorul „grilă"

| planșă sursă | panouri | unde ajung |
|---|---|---|
| `Gemini_Generated_Image_a5ftjba5ftjba5ft` (colaj 2×3) | 6 × `.webp` (900 px) | `medii-misiunea-salvare/` |
| `Gemini_Generated_Image_wvb4m9wvb4m9wvb4` (colaj 4×3) | 12 × `.webp` (820 px) | `medii-arhitectul/` |

Ambele colaje sunt **trimise de profesoară pe 2026-09-01**, în același regim ca loturile
anterioare (generate AI, libere de utilizat); panourile decupate sunt lucrări derivate.
Ordinea de citire a colajelor e chiar ordinea din lista de imagini cerute, deci `idx`-urile
din `game.json` o urmează.

**`medii-dosare/` nu conține nicio imagine nouă.** Cele opt „dosare" sunt compuse din
materiale care existau deja în `content/games`, toate CC0/PD, cu proveniența notată mai sus:

- climograme generate cu `gen/climograms.mjs` din `gen/climate-data.mjs` (date proprii, CC0) —
  **fără titlu**, altfel ar fi scris răspunsul chiar pe indiciu; de aceea nu se refolosesc
  fișierele din `clima-harta/`, care au titlul desenat în ele;
- arealele din `bio-vegetatie-areale/` (derivate din harta CC0 `gen/world-base.svg`);
- profilele din `soluri-profile/`;
- plantele din `bio-biom-plante/` și animalele din `bio-vegetatie-animale/`.

Compunerea celor patru indicii într-o singură planșă se face cu scriptul din
`content/games/gen/dosare.py`. Zonele `taiga` și `stepa` existau în `climate-data.mjs`, dar
nu fuseseră niciodată randate — jocul de climograme folosește doar nouă din cele treisprezece.
