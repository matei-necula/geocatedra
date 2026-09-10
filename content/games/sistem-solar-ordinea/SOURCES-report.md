# Surse imagini — joc „Ordinea în Sistemul solar" (content/games/sistem-solar-ordinea/)

Toate cele 12 imagini au fost înlocuite cu decupaje din planșa proprie a profesoarei
(înlocuiesc complet setul anterior, provenit din Wikimedia Commons + o ilustrație SVG
generată local pentru Norul lui Oort — vezi istoricul acestui fișier pentru sursele vechi).

## Sursă

`content/games/_incoming/2026-08-11/plansa-20.png` (2816×1536) — planșă furnizată de
profesoară, generată AI, sub același regim de utilizare liberă ca celelalte planșe din
`content/games/SOURCES.md` (fișier gestionat de sesiunea părinte — nu a fost editat aici).
Grilă de 12 cadre încadrate, 4 coloane × 3 rânduri, **fără niciun text** — ordinea de citire
(stânga→dreapta, sus→jos) corespunde exact ordinii cardurilor din joc.

| Fișier țintă | Poziție în grilă | Card din joc |
|---|---|---|
| soare.jpg | rând 1, col 1 | Soarele |
| mercur.jpg | rând 1, col 2 | Mercur |
| venus.jpg | rând 1, col 3 | Venus |
| pamant.jpg | rând 1, col 4 | Pământ |
| marte.jpg | rând 2, col 1 | Marte |
| centura-asteroizi.jpg | rând 2, col 2 | Centura de asteroizi |
| jupiter.jpg | rând 2, col 3 | Jupiter |
| saturn.jpg | rând 2, col 4 | Saturn |
| uranus.jpg | rând 3, col 1 | Uranus |
| neptun.jpg | rând 3, col 2 | Neptun |
| centura-planete-pitice.jpg | rând 3, col 3 | Centura planetelor pitice |
| norul-oort.jpg | rând 3, col 4 | Norul lui Oort |

Decupaje la 600 px lățime, JPEG q82, toate sub 60 KB. Grila acestei planșe e neobișnuit de
uniformă (coloane: lățime ~631 px identică pe toate cele 4; rânduri: ~432–454 px înălțime) —
verificată prin detecție de margine pe gradient (linia subțire gri-albăstruie a fiecărui cadru
dă un vârf de gradient constant pe toată înălțimea/lățimea cadrului, spre deosebire de
conținutul fotografic variabil dinăuntru), apoi confirmată vizual cu Read pentru fiecare din
cele 12 decupaje.

## Note

- **norul-oort.jpg** înlocuiește vechiul `norul-oort.svg`/`.png` generat local (nori de puncte
  concentrici) — planșa nouă are propria ilustrație (elipsă difuză cu puncte, fără text),
  eliminând nevoia desenului propriu. Extensia s-a schimbat din `.png` în `.jpg`; `game.json`
  actualizat corespunzător.
- **centura-planete-pitice.jpg** înlocuiește vechea ilustrație NASA (obiect Kuiper individual)
  cu o vedere de ansamblu a centurii (inel difuz de puncte) — mai potrivită conceptului „centură"
  decât un singur obiect.
- Blocul `svgOortCloud`/`scatterDots`/`mulberry32` din `content/games/gen/stars.mjs` a fost
  eliminat (nu mai are scop — nimic altceva din repo nu folosea acel PRNG determinist).

## Schimbare de capitol

`topicSlug` schimbat din `universul-partea-1` în `universul-partea-2` (Cap. II = „Sistemul
Solar"), conform cerinței.

## GAPS

Niciun gol — toate cele 12 carduri au imagine validă, verificată vizual (subiect corect, fără
text, fără scurgere din cadrul vecin, margine completă).
