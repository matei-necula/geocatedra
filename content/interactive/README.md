# Conținut — aplicații interactive

Aplicații HTML de sine stătătoare (simulatoare) care nu se pot exprima prin motoarele noastre de
joc. Fiecare devine un material de tip **`interactiv`**, cu HTML-ul păstrat chiar în corpul
materialului (zeci de KB — nu are rost R2).

**Întâi caută un motor de joc.** Escape room-ul „Evadare din centrul Pământului" a stat aici o zi,
apoi a devenit joc `grila` (`content/games/pamant-evadare`): era o succesiune de întrebări cu
variante, adică exact ce face motorul. Un joc adevărat se integrează în pagină, se editează din
admin și arată ca restul site-ului. Aici rămâne doar ce chiar nu încape în JSON — un simulator.

## Cum rulează

`components/InteractiveApp.tsx` le pune într-un **iframe izolat**:

```html
<iframe srcDoc={html} sandbox="allow-scripts" />
```

`sandbox="allow-scripts"` **fără** `allow-same-origin` e miezul: aplicația rulează, dar primește o
origine opacă. Nu poate citi cookie-ul de sesiune, nu poate face cereri în numele elevului și nu
poate atinge restul paginii. E cod care nu vine de la noi, deci stă în carantină.

Consecințe practice, de știut când primești un fișier:

- `localStorage` și `sessionStorage` **aruncă eroare** în sandbox. Aplicația trebuie să-și țină
  starea în memorie.
- Nu merg resurse externe (fonturi, imagini, scripturi de pe alte site-uri). Fișierul trebuie să
  fie **complet**: stiluri și scripturi înăuntru. Ingestul refuză fișierele care cheamă `http(s)://`.
- Aplicația nu poate salva scoruri în platformă. Pentru evaluare rămân „Exersează" și temele.

## Cum trebuie scrisă (mobil)

Elevii sunt pe telefon, iar aplicația primește o ramă de mărime dată. Deci:

- **Se măsoară din ramă, nu în pixeli ficși.** `html, body { height: 100% }`, dimensiuni în `vh`/`vw`
  (înăuntrul unui iframe, `100vh` e chiar înălțimea ramei) sau unități de container. Totul trebuie să
  încapă fără derulare, și pe telefon ținut vertical, și orizontal. Exemplul lucrat a fost
  `inclinarea-axei-si-anotimpurile.html` (trecea pe două coloane sub raportul 1:1); simulatorul a fost
  între timp înlocuit cu un joc `grila`, așa că fișierul se găsește doar în istoricul git.
- **Fără poziționări calculate din JavaScript** (`getBoundingClientRect` + `resize`): rămân în urmă la
  rotirea telefonului. Ce se poate face din CSS, se face din CSS.
- **Colțul din dreapta-jos rămâne liber**: acolo stă butonul de ieșire din ecran complet.
- **Texte de lungimi apropiate** în zonele care se schimbă la interacțiune, altfel restul aplicației
  sare la fiecare mișcare.

Ecranul complet are două forme: cel adevărat, unde browserul îl dă, și unul propriu (rama se întinde
peste toată pagina), fiindcă pe iPhone browserul nu dă ecran complet decât pentru video.

## Ingest

```bash
cd ../../app
node scripts/ingest-interactive.mjs ../content/interactive/manifest.json
npx wrangler d1 execute catedra --remote --file ./drizzle/ingest-interactive.sql
```

Idempotent pe `(grade_id, topic_slug, slug)`. Căile din manifest sunt relative la manifest.

Adminul poate edita HTML-ul direct din formularul de material (câmpul „Codul aplicației").
