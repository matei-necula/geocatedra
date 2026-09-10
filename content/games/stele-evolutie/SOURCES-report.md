# Surse imagini — joc „Evoluția stelelor medii (tip Soare)" (content/games/stele-evolutie/)

Acest joc a fost despărțit din fostul „Evoluția stelelor" (2 runde) în două materiale
separate, câte unul per rând din planșa profesoarei. Toate cele 7 imagini provin acum din
planșa proprie AI-generată, nu mai din Wikimedia Commons — vezi nota de mai jos.

## Sursă

`content/games/_incoming/2026-08-11/plansa-11.png` (2752×1536, „EVOLUȚIA STELELOR: Harta
pentru elevi") — planșă furnizată de profesoară, generată AI, sub același regim de utilizare
liberă ca celelalte planșe din `content/games/SOURCES.md` (fișier gestionat de sesiunea
părinte — nu a fost editat aici).

Rândul 1 al planșei, „EVOLUȚIA STELELOR MEDII (tip Soare)", conține 7 cadre încadrate, cu
numele românesc tipărit **sub** fiecare cadru. Fiecare imagine țintă a fost decupată **doar
cadrul ilustrat**, cu numele tipărit exclus (el este răspunsul cardului din joc):

| Fișier țintă | Card din planșă |
|---|---|
| medii-1-nebuloasa.jpg | Nebuloasă |
| medii-2-protostea.jpg | Protostea |
| medii-3-secventa-principala.jpg | Stea din Secvența Principală |
| medii-4-gigant-rosie.jpg | Gigantă Roșie |
| medii-5-nebuloasa-planetara.jpg | Nebuloasă Planetară |
| medii-6-pitica-alba.jpg | Pitică Albă |
| medii-7-pitica-neagra.jpg | Pitică Neagră |

Decupaje la 600 px lățime (fără mărire pentru cadrele mai mici — vezi mai jos), JPEG q82,
toate sub 30 KB.

## Note privind grila

Grila planșei **nu e perfect uniformă**: cadrele „Pitică Albă" și „Pitică Neagră" (6, 7) sunt
vizibil mai mici și poziționate puțin mai jos decât primele 5 cadre din rând. Coordonatele de
decupare au fost determinate individual per cadru (detecție de margine pe gradient +
verificare vizuală directă cu instrumentul Read pentru fiecare crop, nu doar o grilă
matematică presupusă uniformă) — un prim calcul cu grilă uniformă ar fi tăiat greșit aceste
două cadre (fundal + stea din cadrul vecin vizibile în margine); corectat înainte de livrare.

## Fișiere șterse (înlocuite de planșă)

Asseturile individuale căutate anterior pe Wikimedia Commons / generate local (SVG „glow" pe
fundal navy) au fost șterse, fiind înlocuite complet de decupajele din planșă:
`nebuloasa.jpg`, `protostea.jpg`, `stea-secventa.jpg`, `giganta-rosie.jpg`, `pitica-alba.jpg`,
`nebuloasa-planetara.jpg`, `pitica-neagra.png/.svg`, `stea-masiva.png/.svg`,
`supergiganta-rosie.png/.svg`, `supernova.jpg`, `stea-neutronica.jpg`. Blocul de generare
`EVO_OUT`/`EVO_STARS` din `content/games/gen/stars.mjs` a fost eliminat (nu mai are scop —
cardurile rundei „gigant" au acum fotografii/ilustrații proprii din planșă, în
`content/games/stele-evolutie-gigant/`).

## GAPS

Niciun gol — toate cele 7 carduri au imagine validă, verificată vizual (subiect corect, fără
text tipărit, fără scurgere din cadrul vecin, margine completă).
