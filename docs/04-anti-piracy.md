# Cum oprim plagiatul?

Răspuns cinstit la întrebarea „toate materialele adăugate pe site ar trebui să nu poată fi
descărcate/plagiate”. Documentul e scris ca să fie citit de doamna profesoară, nu doar de
un programator, deci începe cu adevărul neplăcut și abia apoi trece la ce se poate face.

---

## 1. Adevărul, spus din prima

**Niciun site din lume nu poate împiedica o captură de ecran sau o poză făcută cu telefonul.**

Nu e o limitare a acestei platforme. E o limitare a browserelor în general. În momentul în
care un material apare pe ecranul unui elev, imaginea aceea este deja în calculatorul lui, iar
tastele de captură, extensiile de browser și un al doilea telefon îndreptat spre monitor sunt
toate în afara controlului nostru.

**Orice platformă care promite altceva minte.** Există site-uri care scriu „conținut protejat,
imposibil de descărcat”. Ce fac ele în realitate e să blocheze clic-dreapta — ceea ce se ocolește
în două secunde. Noi nu vom scrie niciodată așa ceva, pentru că ar fi o promisiune falsă.

Ce **putem** face, și am făcut, se împarte în trei:

1. **Zid real** — un om fără cod de clasă nu ajunge la niciun material. Asta chiar funcționează.
2. **Frecare** — copierea din reflex („salvează imaginea”, „descarcă PDF-ul”) devine incomodă.
   Nu oprește pe cineva hotărât. E cinstit numit *frecare*, nu *protecție*.
3. **Urmă** — dacă totuși scapă ceva, se vede **din ce clasă** a plecat. Asta e cea mai
   valoroasă piesă, pentru că schimbă calculul: un elev care știe că poza îl dă de gol nu mai
   trimite poza.

Iar deasupra tuturor stă lucrul care câștigă efectiv o dispută: **legea**. Vezi secțiunea 5.

---

## 2. Ce e în platformă acum, și ce oprește fiecare lucru

| Măsură | Ce oprește CU ADEVĂRAT | Ce NU oprește |
|---|---|---|
| **Control de acces pe server** — fiecare cerere e verificată în Cloudflare Workers, nu în pagină | Un om fără cod nu vede nimic. Nici măcar dacă ghicește adresa unui fișier. Nici din „vezi sursa paginii”. | Un elev cu cod valid care își face captură de ecran |
| **Poze și PDF-uri servite doar prin `/media/:id`** — fișierele din R2 nu sunt publice | Descărcarea în masă a bibliotecii; linkuri directe către fișiere | Salvarea unei imagini pe care elevul o are deja pe ecran |
| **Adrese imposibil de ghicit** (fiecare fișier are un identificator aleator de 36 de caractere) | Cineva care încearcă `/media/1`, `/media/2`… nu găsește nimic | — |
| **Un link copiat nu funcționează în altă parte** — cookie-ul de sesiune nu pleacă spre alte site-uri | Trimiterea unui link către cineva din afara clasei: primește „Interzis” | Trimiterea unei poze cu ecranul |
| **`X-Robots-Tag` pe toate fișierele** (nou) | Pozele și schemele nu mai ajung în Google Images, care e cea mai comodă sursă de plagiat | Căutarea manuală de către cineva care are deja acces |
| **Blocarea afișării pe alt site — `Cross-Origin-Resource-Policy`** (nou) | Cineva care pune `<img src="…">` pe site-ul lui ca să-ți folosească hărțile de pe serverul tău | Cineva care întâi salvează poza și apoi o urcă la el |
| **Blocarea încadrării în alt site — `frame-ancestors`** | Un site care îți deschide lecțiile într-un cadru, ca și cum ar fi ale lui | — |
| **Fără meniu la apăsare lungă pe imagini** (nou) | „Salvează imaginea” pe telefon — drumul nr. 1 al copierii din reflex | Captura de ecran, care e o tastă alături |
| **Filigran per-sesiune** (întărit) | *Anonimatul.* O poză scursă spune din ce clasă a plecat | Captura în sine. Un om răbdător poate tăia colțul |
| **Codul de clasă expiră pe 15 iunie + se poate regenera într-un clic** | Un cod scurs care rămâne bun la nesfârșit | Ce s-a copiat deja înainte de regenerare |
| **Lecțiile nu sunt indexate de Google** (`noindex` pe paginile de material) | Ca lecțiile tale să apară în rezultatele căutării și să fie găsite de oricine | — |

Ce s-a schimbat **acum**, concret: antetele de pe fișiere (`app/app/lib/headers.ts`,
`app/app/routes/media.tsx`), filigranul (`app/app/components/Watermark.tsx`) și frecarea din
stilurile globale (`app/app/app.css`). Toate sunt gratuite și nu costă nimic lunar.

### Ce am refuzat deliberat să facem

- **Blocarea clic-dreapta pe tot site-ul cu JavaScript.** Se ocolește cu o tastă, enervează
  elevii cuminți (care vor să caute un cuvânt în dicționar) și dă impresia falsă că materialul
  e protejat. E teatru. Nu-l facem.
- **Blocarea selecției textului din lecțiile scrise.** Un elev trebuie să poată selecta o
  definiție ca s-o pună în caiet. Textul e oricum în sursa paginii, deci blocarea nu împiedică
  pe nimeni — supără doar pe cine n-are gânduri rele.
- **„Detectarea devtools”.** Se ocolește banal și dă alarme false pe telefoanele vechi.
- **Linkuri semnate, care expiră în câteva minute.** Sună impresionant, dar aici n-ar adăuga
  nimic: adresele sunt deja imposibil de ghicit, fiecare cerere e reverificată pe server, iar
  un link copiat oricum nu merge în afara sesiunii. În schimb ar strica memoria browserului
  (un teanc de 170 de pagini s-ar redescărca la fiecare răsfoire) și ar consuma datele mobile
  ale elevilor. Cost real, câștig zero.

---

## 3. Filigranul — piesa care chiar schimbă comportamentul

Pe fiecare material pe care îl vede un elev apare un cod de sesiune, în două feluri:

- **o plasă înclinată, repetată peste toată pagina**, foarte discretă (nu deranjează cititul,
  dar nu poți tăia doar un colț ca să scapi de ea);
- **o ștampilă mică, dar chiar lizibilă, în colțul din dreapta jos** — asta e cea care
  supraviețuiește unei poze retrimise de trei ori pe WhatsApp.

Dacă un material apare unde nu trebuie, codul din poză îți spune **clasa** de unde a plecat.
Nu îți spune elevul — platforma nu are conturi de elevi și nu colectează date personale despre
minori, ceea ce e o alegere deliberată și corectă. Dar îți spune clasa, iar la clasă discuția
se poartă direct. În practică, simplul fapt că elevii **știu** că materialul poartă un cod
oprește mult mai mult decât orice blocare tehnică. Merită spus cu voce tare la începutul anului.

Când vezi un cod scurs: intri în admin → **Tokenuri** → **Regenerează** pentru clasa aceea.
Codul vechi moare pe loc, sesiunile deschise cu el cad, iar tu dai clasei codul nou.

**Și pe pedagogie.** Din 26.08.2026, paginile de profesor (`/profesor/m/…`) poartă filigran cu
**adresa contului** care le vede — nu codul clasei, fiindcă aici cine se uită are un nume. Acolo
stau schemele de lecție, ghidurile, proiectele și studiile de caz, adică materialul cel mai
valoros de pe platformă; până acum un coleg cu cont putea fotografia tot, fără nicio urmă.
Filigranul trece și prin vizualizarea pe tot ecranul (atât la galerii, cât și la teancurile de
pagini), fiindcă e montat în interiorul cadrului imaginii, nu lângă el.

> Vitrina publică (`/demo/m/…`) rămâne intenționat fără filigran: e materialul pe care îl arătăm
> oricui, iar acolo bugetul de pagini limitează oricum ce se vede.

---

## 4. Ce poți face tu, fără niciun ajutor tehnic

Sunt lucruri mărunte, dar au un efect mai mare decât orice antet HTTP:

1. **Nu da niciodată PDF-ul pe mail sau pe grupul de WhatsApp.** Un fișier trimis o dată e
   pierdut definitiv — nu mai are filigran, nu mai are cod, nu mai are urmă. Trimite linkul
   către material, nu materialul. Aceasta este, de departe, cea mai importantă regulă.
2. **Ține materialele „doar vizualizare”.** Când adaugi un material, evită tipul „fișier” dacă
   poți folosi „lecție scrisă”, „galerie foto” sau „teanc de pagini”. Un fișier atașat e un
   fișier care poate pleca; o pagină de imagine, nu la fel de ușor.
3. **Regenerează codurile la începutul fiecărui an școlar.** Ele oricum expiră pe 15 iunie,
   dar un cod nou în septembrie e curat garantat.
4. **Spune-le elevilor, în prima oră, că materialele poartă un cod al clasei.** Costă un minut
   și oprește mai mult decât tot ce e scris mai sus.
5. **Publică materialul pe site ÎNAINTE de a-l arăta altundeva.** Data publicării e proba ta.
   Vezi secțiunea următoare.

---

## 5. Partea legală — aici se câștigă efectiv

Tehnologia încetinește copierea. **Legea o pedepsește.** Pentru materiale originale de
predare, partea juridică e mai puternică decât orice măsură din platformă.

**Ești autoarea.** Conform **Legii nr. 8/1996 privind dreptul de autor și drepturile conexe**,
dreptul de autor se naște **în momentul creării operei** — nu ai nevoie de nicio înregistrare,
de nicio taxă și de nicio formalitate ca să fii protejată. Schițele de lecție, proiectele,
studiile de caz și fotografiile tale sunt opere protejate din clipa în care le-ai făcut.

Ce trebuie în practică pentru a câștiga o dispută:

1. **Să dovedești că tu ai publicat primul.** Aici platforma te ajută fără să faci nimic:
   fiecare material are în baza de date data la care a fost publicat. În plus, ține-ți
   fișierele sursă (`.pptx`-urile, pozele originale la rezoluție mare) — cine are originalul
   la 4000 px demonstrează instantaneu că nu a copiat un JPEG de 800 px.
2. **Să fie clar cine e autorul.** Un anunț de drept de autor vizibil pe site nu creează
   dreptul (el există oricum), dar elimină apărarea „n-am știut că e al cuiva”. Vezi
   recomandările de mai jos.
3. **Să ai unde reclama.** În ordinea eficienței reale:
   - **notificare directă** către cel care a copiat — în majoritatea cazurilor materialul e
     retras în aceeași zi, mai ales dacă e vorba de un coleg profesor;
   - **notificare de retragere către platforma-gazdă** (Google, Facebook, Scribd, un site de
     referate). Toate au formulare de reclamare a încălcării drepturilor de autor și
     reacționează la ele; o dovadă a primei publicări e de obicei suficientă;
   - **ORDA** (Oficiul Român pentru Drepturile de Autor) și, în ultimă instanță, instanța
     civilă. Legea 8/1996 prevede despăgubiri; e drumul lung și scump, rezervat cazurilor în
     care cineva îți vinde materialele.
4. **Dacă e vorba de un coleg profesor**, conducerea școlii și inspectoratul sunt de multe ori
   calea cea mai rapidă — mai rapidă decât orice demers juridic.

### Ce lipsește azi de pe site și ar trebui adăugat (nu costă nimic)

Am verificat `routes/termeni.tsx` și `routes/confidentialitate.tsx`. Termenii spun deja lucrul
esențial — *„Nu este permisă descărcarea, copierea, redistribuirea sau publicarea materialelor
fără acordul autorului”* și *„Materialele aparțin autorului și sunt protejate de legislația
privind dreptul de autor”*. Bun, dar prea vag ca să folosească într-o reclamație. Recomand,
în ordinea importanței:

1. **Un anunț de drept de autor vizibil în subsolul fiecărei pagini** — momentan nu există
   niciun „©” nicăieri pe site. Ceva de forma:
   `© <an> <Numele autoarei>. Toate drepturile rezervate.`
2. **În „Termeni”, la „Proprietatea conținutului”**: numele autoarei, invocarea explicită a
   **Legii nr. 8/1996**, precizarea că materialele sunt destinate exclusiv uzului personal al
   elevului înscris, și că sunt interzise redistribuirea, republicarea și folosirea în alte
   materiale didactice fără acord scris.
3. **O adresă de contact pentru sesizări** (o simplă adresă de e-mail), ca cineva care găsește
   materialul copiat să aibă unde anunța.
4. **O frază despre filigran în „Termeni”**: că materialele poartă un cod al clasei și că
   redistribuirea poate fi urmărită. Transparența e și corectă, și descurajantă.

Toate patru sunt schimbări de text, nu de cod, și se pot face oricând.

---

## 6. Ce urmează, ordonat după raportul efort/câștig

**Merită făcut, gratuit:**

- textele legale de la 5 (jumătate de oră, câștig mare);
- ~~filigran și pe paginile de profesor~~ — **făcut** (26.08.2026): filigran cu adresa contului
  pe `/profesor/m/…`, inclusiv pe tot ecranul;
- ~~eliminarea butoanelor de descărcare rămase pe pagina elevului~~ — **făcut** (26.08.2026):
  `routes/material.tsx` transmite acum `viewOnly={!isAdmin}`;
- ~~textele legale de la 5~~ — **făcut** (26.08.2026): notă de copyright în subsol și secțiunea
  „Proprietatea conținutului" din Termeni, ambele pe numele **Liliana Necula**, cu trimitere la
  Legea nr. 8/1996.

**De cântărit, tot gratuit:**

- filigran „ars” în imaginea însăși, la generare, nu suprapus în pagină — nu se mai poate
  șterge din browser. Dezavantaj: materialul trebuie regenerat, iar filigranul devine același
  pentru toată lumea, deci pierzi exact ce e mai valoros: identificarea clasei. Compromisul
  rezonabil ar fi un „© <nume>” ars discret în colț **plus** filigranul de sesiune de acum.

**Nu merită:**

- **Cloudflare Stream / DRM (Widevine, FairPlay)** — **costă bani lunar**, iar proiectul e
  deliberat pe 0 lei/lună. În plus, protejează video, nu imaginile și schițele, care sunt
  materialul tău real. Și tot nu bat un telefon îndreptat spre ecran.
- **Aplicație nativă de telefon** pentru a bloca capturile — luni de muncă, cost de publicare
  în magazine, și tot rămâne problema celui de-al doilea telefon.
- **Blocarea clic-dreapta / detectarea devtools** — teatru, explicat la secțiunea 2.

---

## 7. Scăpări găsite la audit (de reparat, nu de discutat)

Acestea nu sunt idei de îmbunătățire, sunt găuri în ce ar fi trebuit să existe deja:

1. **Pagina de material a elevului oferă butoane de descărcare.**
   `app/app/routes/material.tsx:129` și `:131` nu transmit `viewOnly`, iar valoarea implicită
   e „descărcarea permisă”. Rezultat: un elev vede „⬇ Descarcă fișierul”, „📄 Deschide PDF”
   (cu butonul de descărcare al browserului) și butonul de descărcare din player-ul video.
   Ironia e că pagina de **profesor** transmite corect `viewOnly`
   (`routes/profesor.m.$gradeId.$slug.tsx:85,87`) — deci profesorii sunt protejați și elevii nu.
   **Rezolvat 26.08.2026** (`routes/material.tsx` transmite `viewOnly={!isAdmin}`).
2. ~~**Filigranul lipsește de pe paginile de profesor și din vitrină.**~~ Rezolvat pentru
   profesori (26.08.2026); vitrina rămâne fără filigran, intenționat.
3. ~~**Filigranul trebuie să intre în vizualizarea pe tot ecranul.**~~ Rezolvat (26.08.2026):
   filigranul se transmite prin **contextul React**, care trece prin `createPortal`, deși
   moștenirea CSS nu trece — vezi `WatermarkProvider`/`useWatermark` din
   `app/app/components/Watermark.tsx`. `Lightbox` îl randează mereu, `PageBook` doar pe tot
   ecranul (în rest îl acoperă filigranul de pagină, și s-ar suprapune două).
4. ~~**`robots.txt`** nu interzice `/exerseaza`.~~ Rezolvat (26.08.2026).

---

## 8. Pe scurt, pentru o singură pagină

- Nimeni nu poate opri capturile de ecran. Cine spune că poate, minte.
- Ce oprim: accesul celor fără cod, descărcarea fișierelor, indexarea în Google, folosirea
  pozelor tale direct pe alt site.
- Ce nu oprim: elevul cu acces care fotografiază ecranul.
- Ce facem în schimb: fiecare material poartă codul clasei, deci scurgerea are un nume.
- Ce faci tu: nu trimite fișiere, trimite linkuri; regenerează codurile în septembrie; spune-le
  elevilor că materialul e marcat.
- Ce te apără cu adevărat: Legea 8/1996. Ești autoarea din momentul creării, ai dovada primei
  publicări în platformă, iar o notificare de retragere rezolvă majoritatea cazurilor.
