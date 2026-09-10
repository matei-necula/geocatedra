# Conținut — biblioteca de pedagogie

Materialele din rafturile **Scheme de lecție** și **Ghid metodologic** (`/profesor/pedagogie`).
Sursele sunt fișiere `.pptx` ale doamnei profesoare; ele NU stau în repo (sunt materialul ei de
lucru, se schimbă des). Aici păstrăm doar rețeta prin care au ajuns pe site.

## Cum arată pe site

Fiecare material e un **teanc de pagini** care se răsfoiește ca o carte: tip `prezentare`,
body `{"kind":"pagini","count":N}`, iar paginile sunt assets `image` cu `idx` 0..N-1.
Componenta `components/PageBook.tsx` arată o pagină pe ecran, cu săgeți ‹ › și tastele
stânga/dreapta. **Nu există descărcare** — nici PDF, nici `.pptx`. (Imaginile pot fi totuși
salvate cu clic-dreapta; vezi `docs/04-anti-piracy.md` — „fără descărcare" e o alegere de
interfață, nu o protecție.)

## Rețeta (2026-08-17, 12 + 12 materiale, clasa a 9-a)

1. **Uniformizare culori**, cu PowerPoint-ul instalat local, direct peste fișiere
   (fă întâi o copie — scripturile scriu într-un folder de ieșire, tu copiezi peste):

   ```powershell
   ./recolor-scheme.ps1 -Files <schițele> -Bg fundal-cald.png -OutDir <out> -WarmAccents
   ./recolor-ghid.ps1   -Files <ghidurile> -OutDir <out> -Badge
   ```

   - **Schițe:** fundalul cald al schiței „Terra" (extras din `ppt/media/image1.png`) devine
     fundal de slide peste tot, iar formele/textele cu nuanțe **reci** (165°–300°) sunt rotite
     spre teracotă (16°), păstrând saturația și luminozitatea, deci și contrastul.
     Ce e deja cald rămâne neatins. **Limită:** panourile desenate ca imagini (bitmap) nu pot fi
     recolorate fără să strice codul de culori din ele (roșu/verde/portocaliu au înțeles), deci
     rămân reci pe alocuri.
   - **Ghiduri:** coperta era bleumarin închis, restul paginilor crem. Coperta preia culoarea
     paginii a doua **a fiecărui ghid** (nu una impusă: Biosfera folosește `FFFCF5`, restul
     `F8FAFC`), textul deschis devine închis, iar insigna — care e o imagine gândită pentru
     fundal închis — primește o pastilă bleumarin dedesubt, ca să rămână lizibilă.

2. **Paginile**, exportate din PowerPoint la 1600px și trecute în WebP
   (51 MB PNG → 12,5 MB WebP):

   ```powershell
   ./export-pagini.ps1 -SrcDir <folder> -OutRoot <pagini> -Prefix sch   # sau ghi
   ```
   ```bash
   node ../../app/scripts/pptx-pages-to-webp.mjs <pagini>
   ```

   `Export()` taie numele fișierului la primul punct și se încurcă în diacritice, de aceea
   folderele sunt numerotate (`sch01`…`ghi12`) și legătura cu fișierul sursă stă în
   `<prefix>-index.json`.

3. **Ingest** — materiale + `material_assets` + upload R2, apoi SQL-ul în D1:

   ```bash
   cd ../../app
   node scripts/ingest-pages.mjs <manifest.json> --target remote
   npx wrangler d1 execute catedra --remote --file ./drizzle/ingest-pages.sql
   ```

Ingestul e **idempotent** pe `(grade_id, topic_slug, slug)`: rulat din nou, înlocuiește
materialul în loc să-l dubleze. Obiectele R2 ale versiunii vechi rămân însă orfane — ia-le
cheile din D1 **înainte** de ingest și șterge-le după.

## Convenții

- `library='teacher'`, `grade_id='9'`, `topic_slug` = slug-ul raftului din
  `subjectConfig.teacherCollections` (nu o temă din programă).
- Slug-uri prefixate `schema-*` / `ghid-*` — clasa a 9-a are deja `relieful-major`,
  `climatele-terrei` etc. în biblioteca elevilor, iar slug-ul e unic pe clasă.
- Ordinea (`position`) urmează programa, nu numerotarea din numele fișierelor: Biosfera stă
  pe locul **11**, înaintea Solului, ca în lista de teme a clasei a 9-a.

## Retușuri (2026-08-18)

- **Coperțile ghidurilor** au rămas doar cu titlul și subtitlul: insigna „GHID METODOLOGIC
  GEOGRAFIE" era o imagine gândită pentru fundal închis și devenise ilizibilă pe crem.
  `coperti-fara-insigna.ps1` șterge de pe prima pagină tot ce nu are text.
- **Scheme:** Terra a pierdut pagina 8 și Climatele terestre pagina 2 (ambele despărțitoare de
  secțiune), coperta Hidrosferei a fost înlocuită, iar titlul de la „Alcătuirea litosferei" e
  acum dintr-o singură culoare.
- **Citire:** materialele de tip `prezentare` primesc toată lățimea ecranului, rama se strânge
  pe pagină, iar înălțimea e plafonată la `calc(100vh-21rem)` ca pagina, săgețile și contorul să
  încapă fără derulare. Butonul ⛶ deschide pagina pe tot ecranul.

**De reținut la scripturile PowerShell:** PowerShell 5.1 citește `.ps1` ca ANSI dacă fișierul
n-are BOM, iar căile cu diacritice se strică. Scrie-le ca **UTF-8 cu BOM**.

## Proiecte de lecție (2026-08-26, 10 materiale, 171 de pagini)

Raftul `proiecte-de-lectie` a fost înlocuit în întregime cu versiunile noi ale
doamnei profesoare din `Downloads/PROIECTE DIDACTICE/`. Ordinea de pe raft e
numerotarea fișierelor (1…10), nu ordinea alfabetică pe care o dă `export-pagini.ps1`
— de aceea folderele exportate se leagă de materiale prin `pro-index.json`:
`pro02` e fișierul „10. …Solurile", nu al doilea proiect. Slug-urile vechi au rămas
neschimbate, ca legăturile deja date elevilor și profesorilor să nu se rupă; noul
proiect „Solurile" a primit `proiect-solurile`.

## Studii de caz — Dobrogea (2026-08-26, 5 materiale, 42 de pagini)

Raft nou: `studii-de-caz-dobrogea`, adăugat ca o intrare în
`subjectConfig.teacherCollections` plus două texte de interfață — fără migrare, ca
la „Proiecte de lecție". Patru studii de caz (relief, climă, hidrografie, vegetație
și soluri) plus un **suport de lectură de specialitate**, care vine dintr-un PDF, nu
dintr-un `.pptx`: `scripts/pdf-pages-to-webp.mjs` îl randează cu mupdf în aceeași
convenție de nume (`Slide1.webp`, `Slide2.webp`), așa că intră direct în
`ingest-pages.mjs`. E singurul material din pedagogie randat la 2200px, nu la 1600:
sunt două pagini A4 de text dens, iar la 1600 literele se destramă când pagina e
deschisă pe tot ecranul.

## Corectura textului direct în `.pptx` (2026-08-31)

Paginile de pe site sunt imagini: textul e în pixeli, deci **nu poate fi corectat pe site**.
Corectura se face la sursă, în `.pptx`, iar pagina se re-exportă. Tot lanțul e verificabil:

1. **Găsește** greșeala citind paginile de pe site (sau din `pagini/`).
2. **Repară** în `.pptx` cu `fix-text-pptx.py`:

   ```python
   import fix_text_pptx as fx
   fx.apply(r"...\Studiu de caz_ Clima Dobrogei.pptx",
            [(1, 'vlimatice', 'climatice'),          # (nr. slide, vechi, nou)
             (4, 'fustă', 'fâșie')])
   ```

   PowerPoint sparge des un cuvânt în mai multe `<a:t>` (corectorul ortografic lasă urme:
   `'v'` + `'limatice'`), așa că scriptul lucrează **la nivel de paragraf**, nu de run:
   concatenează runurile, caută acolo, apoi scrie înlocuirea în primul run atins și șterge
   restul potrivirii din următoarele. **Stilurile rămân neatinse** — nu se pierde nici bold,
   nici culoare, nici spațiere. Fișierul original e salvat ca `.pptx.bak`.

3. **Re-exportă** doar prezentările atinse (`export-pagini.ps1`), treci în WebP
   (`pptx-pages-to-webp.mjs`), apoi `ingest-pages.mjs` + SQL-ul în D1.

4. **Verifică** înainte de ingest, comparând pagină cu pagină noul export cu cel de pe site:
   paginile neatinse trebuie să difere cu **sub ~30 px** (zgomot de compresie WebP), iar cele
   corectate cu sute de pixeli. Dacă o pagină pe care n-ai atins-o diferă mult, exportul nu
   reproduce fidel ce e pe site — oprește-te, nu urca.

5. **Curăță R2**: `ingest-pages.mjs` înlocuiește rândurile din D1, dar obiectele vechi rămân
   orfane. Ia-le cu `SELECT r2_key` **înainte** de re-ingest și șterge-le după.

**Limită:** materialele care vin din PDF (ex. suportul de lectură) nu se repară așa — acolo
sursa e `.docx`-ul, iar lanțul e Word → PDF → `pdf-pages-to-webp.mjs`.

## Teste-model (2026-09-04, 5 materiale, 51 de pagini)

Raft nou: `teste-model` — teste sumative pentru clasa a 9-a, fiecare cu **matrice de
specificație, subiecte și barem**, în ordinea capitolelor de la elevi (Reprezentarea
spațiului → Pământul corp cosmic → Tectonica și relieful → Atmosfera. Climatele Terrei →
Hidrosfera). Ca la celelalte rafturi, a fost de ajuns o intrare în
`subjectConfig.teacherCollections` plus două texte de interfață.

Sursele stau în `Downloads/teste sumative/`; versiunile primite, necorectate, sunt păstrate
în `_original-necorectat/` de acolo.

### Uniformizarea cromatică (slide-urile 1 și 3)

Prezentările veneau cu paginile 1 (coperta) și 3 (competențele) pe **bleumarin `005088`**,
restul pe **crem `F3F0DF`**. Tot ce trebuia schimbat stă în XML, deci nu e nevoie de
PowerPoint: `warm.py` (în scratchpad, tiparul merită păstrat) schimbă `<p:bg>` pe crem și
recolorează **numai** culorile din `<a:rPr>`/`<a:defRPr>`:

| pe bleumarin | pe crem  | ce e            |
|--------------|----------|-----------------|
| `F3F0DF`     | `005088` | titlurile       |
| `E2E8F0`     | `334155` | subtitlul       |
| `FFFFFF`     | `334155` | corpul de text  |
| `11CAA0`     | `0B6E58` | accentul verde  |

Formele decorative (linia de sub subtitlu, iconițele) rămân neatinse: verdele deschis apare
deja pe crem și în paginile 2 și 4, deci se potrivește. Accentul verde din **text** trebuie
însă închis — `11CAA0` pe `F3F0DF` are contrast 1,9:1, ilizibil.

### Corectura

Cedilele (`ş/ţ` → `ș/ț`) s-au corectat cu un pas separat, direct pe `<a:t>` (75 de apariții).
Restul — 112 înlocuiri la nivel de paragraf cu `fix_text_pptx.py`. **Două capcane:**

1. `fix_paragraph` intră în **buclă infinită** dacă textul nou îl conține pe cel vechi
   (ex. „x" → „a) x"). Verifică `old in new` înainte de a rula.
2. La grile, varianta `a)` e adesea **numerotare automată** de listă, nu text: nu apare în
   `<a:t>`, dar se vede în export. Adăugată de mână, se dublează („a) a) cratere") și textul
   dă pe dinafară. Verifică întotdeauna exportul, nu doar textul.

Greșeli de fond găsite (nu se văd citind doar textul — trebuie privite pozele):
blocdiagramele de vulcanism erau **inversate** în barem (a = subducție, nu rift); baremul
dădea „ecuatorial" la întrebarea despre alizeele permanente (corect: tropical-arid); poziția
a 3-a din schița Sistemului Solar e **Luna**, nu Terra; timpul de mers era calculat cu 4 km
în loc de 40 km; trei din cinci asocieri astronomice erau greșite (eclipsa de Lună descrisă
invers, „diferență altitudinală" scursă din testul de cartografie); totalurile din trei
matrice de specificație nu se potriveau cu celulele; un barem avea șase răspunsuri la cinci
întrebări.

### Hidrograful Congo, refăcut din date reale (2026-09-04)

Graficul primit arăta un debit maxim de ~25 000 m³/s în aprilie și **un singur maxim** —
sub jumătate din realitate. Congo are un **regim bimodal**: bazinul lui e tăiat de Ecuator,
deci primește ploi din două sezoane ploioase decalate, de unde două maxime (decembrie ≈ 58 000
m³/s, principal; aprilie–mai ≈ 42 000, secundar) și două minime (august ≈ 30 000, principal;
martie ≈ 38 000, secundar), cu o medie anuală de ~40 000 m³/s.

`app/scripts/draw-congo-hidrograf.mjs` desenează graficul nou în stilul celui înlocuit (ramă
cu colțuri tăiate, bare gri, titlu + subtitlu), la aceleași proporții 830×549, ca rama din
PowerPoint să-l încadreze identic. Imaginea se schimbă **direct în zip**, peste
`ppt/media/image11.png` — nu e nevoie de PowerPoint. Baremul (pagina 9) a fost actualizat:
maxim decembrie, minim august, iar justificarea zonei climatice se sprijină acum pe regimul
bimodal, nu pe „debit ridicat permanent".

**La re-ingest, R2 rămâne cu orfani:** ia `SELECT r2_key` pentru materialul respectiv
**înainte** de `ingest-pages.mjs` și șterge obiectele după (aici, 11).

### Formatare uniformă în barem (2026-09-04)

Pe câteva slide-uri, răspunsurile din barem apăreau îngroșate sau albastre, iar altele
nu — **urmele înlocuirilor de text**: `fix_text_pptx.py` scrie textul nou în *primul run
atins*, deci un răspuns preia formatarea etichetei („1.", „Sectorul A:") când înlocuirea
trece peste granița dintre runuri. Nu se vede în textul extras — doar în export.

Regula pusă în aplicare: **titulatura rămâne cum e, răspunsul propriu-zis e negru
(`121212`) și fără bold.** Tăietura dintre ele se face cu o listă de tipare
(`1.`, `Sectorul A:`, `Coordonate 1:`, `Justificare:`, `4. Zona:`, `1 → b`…); ce nu se
potrivește e considerat răspuns în întregime. „Răspuns corect:" face parte din **răspuns**,
nu din titulatură — așa e în majoritatea prezentărilor.

Restrângerea la barem se face **geometric**, nu după text: eticheta „Barem…" dă caseta —
dacă e lată cât slide-ul, tot ce e sub ea e barem; dacă e o coloană, doar formele din
coloana ei. Fără asta, filtrul prinde și enunțurile de pe același slide.

Un al doilea pas face același lucru în **coloana de enunț** (doar dezîngroșare, culoarea
rămâne): acolo defectul arată la fel — enunțul întreg îngroșat, deși la frații lui e
îngroșat doar numărul.

**Trei capcane, toate plătite o dată:**

1. Offseturile din `re.finditer` pe un paragraf sunt **relative la paragraf**; dacă le
   folosești ca să tai șirul formei, strici XML-ul. Reconstruiește prin concatenare, nu
   prin indexare încrucișată.
2. În `<a:rPr>`, **ordinea copiilor contează**: `<a:solidFill>` se pune imediat după tagul
   de deschidere, nu înainte de `</a:rPr>` (unde ar cădea după `<a:latin/>`).
3. Varianta `a)` de la grile e adesea **numerotare automată** de listă: nu apare în `<a:t>`,
   dar se vede în export.

Validează XML-ul (`ET.fromstring`) **înainte** de a rescrie `.pptx`-ul — altfel PowerPoint
refuză fișierul abia la export, cu un „could not open the file" fără detalii.

### Zona de clic „(lectură activă)" nu deschidea suportul (2026-09-04)

Trei lucruri, nu unul:

1. **Randarea crăpa după clic.** O zonă de clic duce la alt material fără să demonteze
   teancul: React Router schimbă doar datele, `PageBook` rămâne pe loc — și cu el numărul
   paginii. Studiul de caz are 10 pagini, suportul de lectură are 2: se pleca de la pagina 9,
   `pages[8]` era `undefined` și pagina-țintă afișa „A apărut o problemă". Din afară arăta
   exact ca „linkul nu merge". Regula stă acum în `pageForBook()` (`lib/pagebook.ts`, testată):
   **teanc nou → prima pagină; același teanc → indice mărginit** (vitrina scurtează teancul
   sub același material).
2. **Zona era prea îngustă.** Acoperea doar paranteza „(lectură activă)" (41,3%–59,5%), deși
   omul dă clic pe „Fișa SINELG". Măsurate pe imaginea paginii: „Fișa" 26,2%–30,8%,
   „SINELG" 31,8%–40,8%, „(lectură activă)" 41,8%–59,1%. Zona merge acum de la 25,5% la 60%.
3. **Zona nu se vedea.** Singurul indiciu era `hover`, care pe telefon nu există. Zonele au
   acum un fundal foarte discret și un chenar de 1 px, întărite la hover și la focus.

**De reținut:** o componentă care ține stare (pagina curentă, poziția într-un joc) și e
refolosită de router între două materiale trebuie să-și reseteze starea la schimbarea datelor.
Verifică întotdeauna legătura **prin clic**, nu doar deschizând ținta direct: pe SSR totul pare
în regulă, fiindcă acolo starea pornește de la zero.
