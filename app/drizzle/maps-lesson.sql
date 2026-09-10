-- Pământul – reprezentarea pe hărți: lecție scrisă, clasa a 9-a
INSERT INTO materials (id, grade_id, topic_slug, type, library, slug, position, status, is_teaser, created_at, updated_at) VALUES ('f17c6527-954c-47fd-a459-6ca3932cbe9e','9','geografie-fizica','scris','student','pamantul-reprezentare-harti',7,'published',0,1783200000000,1783200000000);
INSERT INTO material_translations (material_id, locale, title, description, body) VALUES ('f17c6527-954c-47fd-a459-6ca3932cbe9e','ro','Pământul – reprezentarea pe hărți','Proiecțiile cartografice și deformările lor, caracteristicile și conținutul hărții (scara, coordonatele geografice, planimetria și altimetria), tipurile de hărți, reprezentarea reliefului prin curbe de nivel pe harta topografică și tehnologiile moderne (GIS, teledetecție, GPS).','# Pământul – reprezentarea pe hărți

Pământul are o suprafață curbă (aproape sferică), iar hârtia este plană. Problema de bază a cartografiei este tocmai aceasta: o suprafață curbă nu poate fi întinsă pe un plan fără să o deformăm. De aceea, orice hartă conține, inevitabil, un anumit tip de deformare. În această lecție vedem cum se rezolvă această problemă (proiecțiile cartografice), ce este de fapt o hartă, ce conține ea și cum se reprezintă relieful.

# Proiecțiile cartografice

O **proiecție cartografică** este un procedeu matematic prin care rețeaua de meridiane și paralele de pe glob (suprafață curbă) este transpusă pe o suprafață plană. După suprafața pe care se face „desfășurarea", proiecțiile principale sunt:

- **Proiecția cilindrică** — rețeaua este proiectată pe un cilindru care înfășoară globul, apoi cilindrul este desfășurat în plan. Meridianele și paralele apar ca linii drepte care se intersectează în unghi drept. Este fidelă în apropierea Ecuatorului, dar deformează tot mai mult spre poli (suprafețele polare apar mult mărite). Cea mai cunoscută este proiecția Mercator, foarte utilă la **navigație**.
- **Proiecția conică** — rețeaua este proiectată pe un con așezat peste glob. Redă bine **latitudinile medii**, de aceea se folosește des pentru continente sau țări din emisfera nordică (de exemplu Europa).
- **Proiecția azimutală (plană)** — rețeaua este proiectată pe un plan tangent la glob într-un punct. Se potrivește mai ales pentru **regiunile polare**.
- **Proiecția întreruptă și proiecția Robinson** — proiecții „de compromis" pentru harta întregii lumi: proiecția întreruptă „taie" oceanele pentru a reduce deformarea continentelor, iar proiecția Robinson echilibrează deformările astfel încât planiglobul să arate cât mai natural.

# Deformările

Nicio proiecție nu poate păstra, în același timp, toate proprietățile suprafeței reale. La transpunerea în plan se deformează cel puțin una dintre:

- **suprafețele** (raportul dintre arii);
- **distanțele**;
- **unghiurile** dintre meridiane și paralele (deci forma).

De aceea proiecțiile se aleg în funcție de scop: unele păstrează corect **unghiurile/forma** (proiecții conforme, bune la navigație), altele păstrează corect **suprafețele** (proiecții echivalente, bune pentru compararea întinderilor), iar altele păstrează corect **distanțele** pe anumite direcții (proiecții echidistante). Alegerea proiecției înseamnă, practic, a decide *ce deformare accepți*.

# Caracteristicile hărții

Harta este o reprezentare a suprafeței terestre cu patru însușiri de bază:

- **Micșorată** — realitatea este redusă după un raport numit **scară** (scara de proporție / scara hărții).
- **Convențională** — obiectele sunt redate prin **semne convenționale**, explicate în **legendă**.
- **Generalizată** — prin micșorare se pierd detaliile mărunte; se păstrează doar ce este important.
- **Selectivă** — fiecare hartă arată doar anumite elemente, în funcție de scopul ei (de aici tipurile de hărți).

# Conținutul hărții

Orice hartă cuprinde câteva elemente obligatorii:

- **Titlul** — spune ce reprezintă harta.
- **Scara** — raportul de micșorare. Poate fi: **numerică** (de exemplu 1 : 100 000), **grafică** (o riglă gradată) sau **directă** (exprimată în cuvinte).
- **Coordonatele geografice**, care alcătuiesc **rețeaua cartografică** (rețeaua de meridiane și paralele):
  - **Latitudinea** — se măsoară pe meridiane, iar liniile ei sunt **paralelele**; se exprimă în grade (°), minute (′) și secunde (″), unde 1° = 60′ și 1′ = 60″. Are valori între **0° (la Ecuator)** și **90° (la poli)** și poate fi **nordică (N)** sau **sudică (S)**.
  - **Longitudinea** — se măsoară pe **meridiane**; se exprimă tot în grade, minute și secunde. Are valori între **0° (la meridianul de origine, Greenwich)** și **180° (la antemeridian)** și poate fi **estică (E)** sau **vestică (V)**.
- **Elemente de planimetrie** (situate „în plan", fără altitudine): ape, așezări, căi de comunicație etc.
- **Elemente de altimetrie** (legate de înălțime): puncte/cote de altitudine, **curbe de nivel**, **curbe batimetrice** (de adâncime), hașuri, **tente de culoare** și **trepte hipsometrice** (intervale de altitudine redate prin culori).
- **Legenda** — „dicționarul" hărții, care explică semnele convenționale.

# Tipurile de hărți

Hărțile se clasifică după mai multe criterii:

- **După scară:** hărți la scară **mare** (numărul scării este mic, de exemplu 1 : 20 000 — arată un teritoriu mic, cu multe detalii), la scară **mijlocie** (de exemplu 1 : 200 000) și la scară **mică** (numărul scării este mare, de exemplu 1 : 2 000 000 — arată un teritoriu întins, cu puține detalii).
- **După conținut:** generale sau speciale (fizice, economice etc.).
- **După mărimea teritoriului:** planiglob, emisfere, continente, țări, hărți topografice (ale unor suprafețe restrânse) și planuri.
- **După destinație:** de navigație, militare, școlare, turistice etc.
- **Hărți electronice** (digitale).

Reține „paradoxul" scării: cu cât **numărul de la numitor este mai mic**, cu atât **scara este mai mare** și detaliile mai multe. La 1 : 20 000, un centimetru pe hartă înseamnă 200 m în realitate; la 1 : 2 000 000, același centimetru înseamnă 20 km.

# Reprezentarea reliefului pe harta topografică

**Harta topografică** este o hartă la scară mare (de la 1 : 20 000 până la 1 : 200 000), pe care relieful este reprezentat prin **curbe de nivel**.

**Curbele de nivel** sunt linii care unesc puncte cu **aceeași altitudine**. Proprietățile lor:

- orice punct de pe o curbă de nivel are aceeași altitudine;
- ele separă punctele mai înalte de cele mai joase;
- toate curbele de nivel se închid, undeva, pe suprafața terestră;
- **nu se intersectează** niciodată (dacă s-ar intersecta, un punct ar avea două altitudini diferite, ceea ce este imposibil);
- dacă valoarea curbelor **crește spre interior**, forma de relief este **pozitivă** (deal, munte); dacă valoarea **scade spre interior**, forma de relief este **negativă** (depresiune, vale);
- distanța pe verticală (în metri) dintre două curbe succesive se numește **echidistanță** și este constantă pe aceeași hartă;
- de obicei fiecare a cincea curbă este o **curbă principală**, mai groasă, având înscrisă altitudinea;
- **cu cât curbele sunt mai dese, cu atât panta este mai abruptă**; cu cât sunt mai rare, cu atât panta este mai lină.

După altitudine deosebim trei mari **trepte de relief**: **0–200 m** (treapta câmpiilor), **200–800 m** (treapta dealurilor și podișurilor) și **peste 800–1000 m** (treapta munților).

# Tehnologii moderne de reprezentare

Astăzi, harta clasică este completată de sisteme digitale:

- **GIS (Sistem Informațional Geografic)** — un sistem care utilizează și integrează tehnologii computerizate; organizează informația geografică pe **straturi de date** (straturi de hărți) care pot fi suprapuse și analizate împreună.
- **Modelul numeric al terenului (MNT / MNAT / DEM)** — o reprezentare digitală a reliefului, în care fiecărui punct îi este asociată altitudinea.
- **Teledetecția** — metoda științifică prin care aparatura plasată pe **sateliții artificiali** captează radiațiile emise sau reflectate diferit de obiectele de pe scoarța terestră, obținând **imagini satelitare**. Se folosește la explorarea resurselor naturale, topografie și cartografie, agricultură, monitorizarea mediului, aplicații militare, monitorizarea traficului aerian și naval etc.
- **GPS (Global Positioning System — sistemul de poziționare globală)** — un sistem bazat pe sateliți, care furnizează **coordonatele geografice**, altitudinea, direcția de mișcare și viteza. Se folosește în topografie, la orientarea în spațiu și la monitorizarea traficului.');
