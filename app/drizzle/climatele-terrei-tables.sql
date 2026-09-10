-- Lecția „Climatele Terrei" — format tabelar, câte un tabel pentru fiecare
-- zonă de căldură (caldă / temperată / rece), pentru datele caracteristice
-- fiecărui tip de climă (latitudine, TMA, PMA, particularități, vegetație).
-- Se aplică pe rândul existent (1de0f330-...).
UPDATE material_translations SET
description = 'Factorii care hotărăsc clima și cele trei zone climatice ale Pământului — caldă, temperată și rece —, cu tipurile de climă și vegetația fiecăreia, în tabele.',
body = '# Climatele Terrei

**Clima** este regimul mediu, pe mulți ani, al vremii dintr-un loc (temperaturi, precipitații, vânturi). Ea nu este la fel peste tot pe glob, iar felul în care se schimbă de la Ecuator spre poli ne ajută să înțelegem repartiția vegetației, a apelor și a solurilor.

## De ce clima nu este la fel peste tot

Clima depinde de mai mulți **factori climatogeni**:

- **latitudinea (unghiul razelor solare)** — la Ecuator razele cad aproape drept și încălzesc puternic; spre poli cad oblic și încălzesc slab. De aici marea împărțire pe **zone de căldură**;
- **circulația maselor de aer și vânturile permanente** (alizeele, vânturile de vest, vânturile polare, musonii), care aduc aer cald sau rece, umed sau uscat;
- **repartiția uscatului și a apei** — apa se încălzește și se răcește greu, uscatul repede; de aici deosebirea dintre climatele **oceanice** (blânde, umede) și cele **continentale** (cu ierni și veri extreme, mai uscate);
- **curenții oceanici**, care încălzesc sau răcesc țărmurile;
- **relieful și altitudinea** — cu cât urcăm, cu atât temperatura scade.

Combinând acești factori, Pământul se împarte în trei mari **zone climatice**: caldă, temperată și rece. Tabelele de mai jos, grupate pe zone de căldură, arată pentru fiecare tip de climă: latitudinea, temperatura medie anuală (**TMA**), precipitațiile medii anuale (**PMA**), vânturile/particularitățile și vegetația.

## Zona caldă (climatele calde)

Se întinde de o parte și de alta a Ecuatorului, unde razele solare cad aproape vertical tot anul.

| Tip de climă | Latitudine | TMA | PMA | Vânturi / particularități | Vegetație |
| --- | --- | --- | --- | --- | --- |
| Ecuatorial | 0–5° N și S | 24–28 °C | foarte mari, 1.000–3.000 mm/an | aer calm și umed, un singur anotimp cald-ploios | pădure ecuatorială deasă |
| Subecuatorial | 5–12° | ~28 °C | 500–1.500 mm | două anotimpuri (unul ploios, unul secetos), aduse de alizee | savană |
| Tropical-arid | 12–30° | 25–30 °C | foarte mici, 100–250 mm | sub bătaia uscată a alizeelor; aici sunt marile deșerturi calde (Sahara) | deșert cald |
| Tropical-musonic | 12–30° | 20–25 °C | musonii aduc, vara, ploi uriașe (până la 12.000 mm/an), iarna — secetă | vânturi musonice | pădure musonică |

## Zona temperată (climatele temperate)

Se află între tropice și cercurile polare, acolo unde bat mai ales **vânturile de vest** și se resimt cel mai clar **cele patru anotimpuri**. Este cea mai variată zonă.

| Tip de climă | Latitudine | TMA | PMA | Vânturi / particularități | Vegetație |
| --- | --- | --- | --- | --- | --- |
| Subtropical-mediteranean | 30–40° | 15–17 °C | — | veri calde și uscate, ierni blânde și ploioase | păduri și tufișuri mereu verzi |
| Subtropical cu ploi de vară | 25–35° | 17–25 °C | 750–1.500 mm | sub musoni și alizee | păduri |
| Temperat-oceanic | 40–60° | 10–15 °C | bogate tot anul, 1.000–2.000 mm | veri răcoroase, ierni blânde (influența oceanului) | păduri de foioase |
| Temperat-continental-umed | 40–60° | 5–10 °C | 500–750 mm | ierni geroase, veri calde | stepă și silvostepă |
| Temperat-rece (boreal) | 50–60° | ~0 °C | — | ierni lungi și aspre | păduri de conifere (taiga) |
| Temperat-continental-arid | 40–50° | 5–8 °C | sub 250 mm | amplitudini termice mari | deșerturi temperate (Gobi) |

## Zona rece (climatele reci)

Se întinde spre poli, dincolo de cercurile polare, unde razele solare cad foarte oblic și energia primită este mică. Bat **vânturile polare**, reci și uscate.

| Tip de climă | Latitudine | TMA | PMA | Vânturi / particularități | Vegetație |
| --- | --- | --- | --- | --- | --- |
| Subpolar | 60–66° | sub 10 °C | 100–300 mm | vânturi polare | tundră (mușchi, licheni, arbuști pitici) |
| Polar | 66–90° | sub 0 °C tot anul | foarte puține, 100–200 mm | deșert rece, acoperit de calote de gheață | aproape lipsită |

## De reținut

- **Clima** depinde de latitudine, de vânturi, de repartiția uscat-apă, de curenții oceanici și de relief; factorul principal este **latitudinea**, care hotărăște câtă căldură primește un loc.
- Pământul se împarte în trei **zone climatice** — caldă, temperată și rece —, fiecare cu mai multe tipuri de climă și cu vegetația proprie.
- Există o **simetrie**: de la Ecuator spre poli, temperatura scade treptat, iar tipurile de climă și vegetația se schimbă în fâșii paralele, la fel în emisfera nordică și în cea sudică.'
WHERE material_id = '1de0f330-1c16-4943-9764-9610def7d9a0' AND locale = 'ro';
