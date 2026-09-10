# „Din profil pe hartă" — planșele exercițiilor

Cele 12 benzi (`R1-*.webp`, `R2-*.webp`) sunt decupate din fișa de topografie a
doamnei profesoare (`Downloads/1.jpg` … `4.jpg`) de `app/scripts/topo-fisa.mjs`,
după casetele din `fisa.json`:

```bash
cd app
node scripts/topo-fisa.mjs ../content/games/relief-curbe-de-nivel/fisa.json <dir-ieșire>
node scripts/contact-sheet.mjs <dir-ieșire> /tmp/sheet.jpg 2 900   # verificare dintr-o privire
```

În fișă reperul stă deasupra, iar cele trei variante (cu literele `a.` `b.` `c.`
sub ele) pe un rând, dedesubt. Scriptul le găsește singur — slăbește pragul de
despărțire până când iese **un singur desen sus și exact trei variante jos** —
apoi le așază în banda lată a jocului: reper în stânga, linie, variante la
dreapta. Verificarea asta contează: la exercițiul cu două vârfuri, distanța
dintre reper și variante e de numai 5 pixeli, iar un prag fix ori le lipește, ori
taie literele.

Variantele păstrează un singur factor de scară comun, ca diferențele de înălțime
dintre ele — care sunt chiar cheia exercițiului — să nu fie desființate de
scalare.

**Cheia de răspunsuri e confirmată de doamna profesoară** (vezi commit 3d147d6);
planșele redesenate din 2026-08-26 păstrează aceeași ordine a variantelor, deci
cheia rămâne valabilă. Fișa mai are **un al șaptelea exercițiu în runda 2**
(`3.jpg`, jos-dreapta — profil cu două vârfuri gemene) care nu e în joc: nu are
răspuns confirmat. `fisa.json` îl decupează sub numele `R2-4`, gata de adăugat.

## Firimiturile de scanare (2026-08-26)

La întrebările 4 și 6 din runda 1, harta cu curbe de nivel ieșea de trei ori mai
mică decât variantele. Cauza nu era scalarea, ci **strângerea pe conținut**: fișa
are câte un punct rătăcit lângă desen, iar caseta se întindea până la el. Desenul
părea atunci aproape cât banda de lat, iar plafonul de lățime (2,4 × înălțimea
benzii) îl micșora în loc să-l mărească. `stringe()` ignoră acum segmentele de
cerneală sub 0,4% din totalul casetei — un punct are câteva zeci de pixeli, cel
mai mic cerculeț desenat are sute.

**Atenție la numărătoare:** contorul jocului arată câte întrebări sunt *terminate*
(„3 din 12" în timp ce ești la a patra), deci „întrebarea 3" din reclamație e a
patra imagine din rundă.

Plansele-sursă `1.jpg`–`4.jpg` nu mai sunt în `Downloads/`; cele două benzi
refăcute vin din decupajele de grup păstrate în scratchpad. Dacă fișa se reface
de la zero, pune sursele înapoi.

## Varietatea răspunsurilor (2026-08-26)

În runda 2, patru din șase răspunsuri corecte cădeau pe „b" — un tipar pe care
elevul îl prinde repede. Nu se poate schimba *care desen* e corect, așa că se
schimbă **locul desenelor**: câmpul `ordine` din `fisa.json` dă noua așezare a
celor trei variante (`[0,2,1]` = a rămâne, c și b fac schimb de loc).

Literele NU se mută cu desenele — se decupează separat și rămân a., b., c. de la
stânga la dreapta; altfel banda ar scrie „b. a. c.". Când muți desenele, **cheia
din `game.json` trebuie permutată la fel**: `answer` devine poziția pe care ajunge
desenul corect, iar `why` se rearanjează după aceeași ordine, ca fiecare explicație
să rămână lipită de desenul ei.

Cheia de acum: runda 1 `c a b a c b`, runda 2 `a c b c b a` — câte două de fiecare
literă în fiecare rundă, fără două răspunsuri identice unul după altul.
