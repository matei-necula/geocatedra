# ADR-0009 — Instanța liberă capătă temă proprie („Cobalt")

**Data:** 2026-09-05
**Stare:** implementat
**Context:** ADR-0008 (instanța liberă), ADR-0007 (tema „Mediteran")
**Spec:** `docs/superpowers/specs/2026-09-05-redesign-liber-cobalt-design.md`
**Revenire:** `docs/ROLLBACK-cobalt.md`

## Context

Situl liber (`catedra-liber`) e **singura suprafață publică a proiectului**. Un vizitator
ajunge pe el de pe Google sau dintr-un link primit, fără cont și fără cod. Până acum arăta:
un titlu, un subtitlu, două dreptunghiuri goale, un subsol juridic. Nimic din bibliotecă nu
se vedea până nu apăsai pe ceva, iar identitatea era împrumutată de la instanța cu clase.

## Decizie

Instanța liberă primește identitate proprie — paletă, tipografie, siglă, fotografie — și
suprafețele de răsfoire capătă imagini.

**Aterizarea temei nu cere nicio ramificație nouă.** `themeLiber` era deja declarat în
`config/types.ts`, ales de `themeFor()` și acoperit de teste — dar niciodată definit. Paleta
intră ca obiect în config; instanța cu clase se randează neschimbată, iar componentele nu
capătă niciun `if (mode === "liber")`, pentru că citesc numai custom properties.

### Paleta

| | light | dark |
|---|---|---|
| fundal | `#F0EDE6` | `#111726` |
| suprafață | `#FFFFFF` | `#1B2334` |
| cerneală | `#10162B` | `#E8ECF6` |
| primar | `#1B3FBF` | `#6E8FF5` |
| accent | `#FF6A4D` | `#FF8368` |

*Fundalurile au fost corectate după prima revizuire — vezi „Completare" mai jos. Valorile
exacte sunt verificate de `lib/contrast.test.ts`, nu de tabelul ăsta.*

**Două jetoane noi ies din calculul de contrast, nu din gust.**

`on-primary` / `on-accent` există pentru că textul de pe umpluturile de temă **nu e mereu
alb**. Coralul `#FF6A4D` dă **2,64:1** pe hârtie — sub pragul de text (4,5) și sub cel de
element non-text (3,0) — deci e umplere cu text `ink` (6,33:1); coral ca *text* se face cu
`accent-strong` (valoarea exactă în „Completare"). În modul întunecat, alb pe primarul `#6E8FF5` dă **3,04:1**;
varianta „închidem primarul ca să treacă albul" a fost verificată și **respinsă**, pentru că
`#3557D4` cade la 3,12:1 față de fundal, adică butonul dispare din pagină. Pe tema cu clase
ambele jetoane sunt albe — exact `text-white`-ul scris până acum de mână în 47 de locuri.

### Tipografia

Instrument Serif (titluri) + Public Sans (text), găzduite local ca Inter și Spectral
(runbook 4.7). **Instrument Serif publică doar 400 și 400 cursiv — nu există bold.** Regula
globală `h1,h2,h3,h4` ar fi trimis subtitlurile de 1,05–1,2rem pe un serif subțire, prăbușind
ierarhia în lecțiile lungi; de aceea `h3`/`h4` pleacă pe jetonul opțional `headingUi`, cu
rezervă pe fontul de titlu. Aditiv: tema cu clase nu-l definește și rămâne neschimbată.

### Sigla

Marca „glob" (disc tăiat de meridian și ecuator) înlocuiește pătratul cu literă, **pe ambele
situri** — e același brand. Icoanele se generează în **două seturi**, aceeași marcă în paleta
fiecărei instanțe, alese în `links()` din `root.tsx` după `BUILD_SITE_MODE`: `public/` e
servit de amândouă desfășurările, deci un singur set ar fi lăsat un sit cu favicon din paleta
celuilalt.

### Fotografiile

Doar **domeniu public sau CC0**, aceeași ștachetă ca la jocuri, aduse și verificate de
`scripts/fetch-photos.mjs`, proveniența în `content/site/SOURCES.md`. Găzduite în
`app/public/img/`, **nu** în R2 — R2 se servește prin `/media/:id`, traseul cu control de
acces, unde o poză decorativă n-are ce căuta.

Filtrul de licență **nu e suficient**: a scos, perfect legal, o pictură din Primul Război
Mondial cu un aerodrom bombardat (pentru ușa „profesori" a unui sit școlar) și o fotografie
alb-negru din anii '30. De aceea scriptul filtrează și **subiectul**, și **culoarea**.

### Miniaturile

`/media/:id?t` servește o variantă de 400px generată în R2 de `scripts/gen-thumbs.mjs`.
Fără ea, `/elevi` ar fi tras ~60 de imagini la mărime naturală (media 85 kB, maximul 915 kB)
— vreo 5 MB pe o pagină deschisă de pe telefon. Redimensionarea în Worker nu e posibilă
(sharp nu rulează acolo; Image Resizing de la Cloudflare e plătit, iar proiectul e pe
„gratuit întâi"). **Podeaua de acces e neatinsă:** `?t` se evaluează după toate verificările
și doar alege altă cheie R2; dacă miniatura lipsește, se servește originalul.

### Mișcarea

`motion/mini` (doar WAAPI), **măsurat**: bază 151,4 kB gzip, cu `animate` din pachetul
complet 173,2 kB (**+21,7 kB, peste pragul de +15 kB**), cu `motion/mini` 154,5 kB
(**+3,0 kB**). Tranzițiile între pagini rămân pe View Transitions — nu se dublează.

Apariția la scroll **nu ascunde niciodată ce e deja pe ecran**: nici `IntersectionObserver`,
nici `setTimeout` nu rulează normal într-o filă de fundal, iar „deschide în filă nouă" e
felul obișnuit de a deschide linkuri — fără regula asta, jumătate din pagina de start rămânea
invizibilă. Ascunderea se aplică din JavaScript, deci fără JS conținutul se vede.

## Completare (2026-09-05, după prima revizuire a proprietarei)

**Contrastele temei cu clase, reparate.** Testul introdus odată cu Cobalt a găsit patru
perechi sub prag, live de luni de zile: alb pe butonul teracotă 2,95:1, `accent-strong` ca
text 3,92:1, iar în mod întunecat alb pe butonul primar 3,07:1 și pe cel accent 2,40:1. Toate
trec acum. Cerneala temei pe teracotă dădea 4,44:1 — tot sub prag — deci `on-accent` e cu o
idee mai închis decât `ink` (`#1D2C33`, 4,87:1), nu egal cu el.

**Fundalul avea o problemă de adâncime, nu de nuanță.** `#F6F7FB` stătea la 6,9% sub alb:
fundalul și suprafața cardurilor difereau cu aproape nimic, deci cardurile nu se citeau ca
niște carduri și pagina părea plată și strident de deschisă. Acum e pergament cald `#F0EDE6`,
la 15,2% sub alb — separarea se vede fără nicio umbră în plus. În mod întunecat, `#0B1020`
era aproape negru; ridicat la `#111726`, cu suprafața cu 48% mai deschisă decât fundalul.

**Textura e globală.** `SiteBackdrop`, randat o dată din `root.tsx`, desenează curbe de nivel
și cercuri de hartă în culorile temei active — deci cobalt pe instanța liberă, azuriu pe cea
cu clase, fără nicio ramificație. Fiind `fixed`, acoperă toată derularea și toate rutele.
Vechea `ContourField` era legată de eroul fiecărei pagini, deci o pagină care uita s-o pună
rămânea goală, iar una lungă avea motiv doar în primul ecran; a devenit cod mort și a fost
scoasă, împreună cu animația ei (un strat care se mișcă permanent în spatele textului
obosește la citit, iar aici se citesc lecții).

**Capcana care a ținut textura invizibilă:** `SiteBackdrop` e copil al lui `body` cu
`z-index: -10`, iar un copil cu z negativ se desenează **sub fundalul propriu al părintelui**.
Cu `body` opac, textura exista în DOM, avea dimensiuni corecte și nu se vedea deloc. Culoarea
de fundal a trecut pe `html`, iar `body` a rămas transparent.

## Consecințe

- Cele două situri arată acum **diferit, intenționat**: cel public e Cobalt, cel cu clase
  rămâne Mediteran. Sunt aceeași marcă, două palete.
- Schimbările de **structură** (miniaturi, filtre lipicioase, antet unificat) sunt pe cod
  partajat, deci apar și pe situl cu clase — în paleta lui. Cere **ambele** deploy-uri.
- `scripts/gen-thumbs.mjs` trebuie rulat după ce se adaugă materiale noi cu imagini. Nu e
  obligatoriu: fără el se servește originalul, doar mai mare.
- Constantele din `scripts/gen-icons.mjs` rămân oglindite manual după `subject.ts` — acum
  pentru **două** teme.

## Alternative respinse

- **Aceeași temă pe ambele situri** — ar fi lăsat singura suprafață publică fără identitate.
- **Redesign și pe adminul/zona profesorului** — muncă de câteva ori mai mare și risc de
  regresie în zone care funcționează; nu servește vizitatorul public.
- **Cloudflare Image Resizing** pentru miniaturi — plătit; contravine regulii „gratuit întâi".
- **Un singur set de icoane** — ar fi lăsat un sit cu favicon din paleta celuilalt.
- **`motion` complet**, pentru spring physics — +21,7 kB, peste bugetul stabilit în spec.
