# Runbook: lansarea publică — domeniu, site public, securitate, bani

**Scris:** 18 august 2026. **Versiunea în engleză:** `docs/08-public-launch-runbook.md`
**Pentru cine e:** pentru doamna profesoară (partea de decizii și de apăsat butoane) și pentru
oricine face partea tehnică.

Documentul ăsta duce platforma de la o adresă tehnică (`*.workers.dev`) la un site public
adevărat, cu domeniul dumneavoastră, găsibil pe Google. Și, la final, răspunde cinstit la
întrebarea cu banii.

> **Citiți întâi Partea 0.** Nu legați domeniul de site până nu e gata. Sunt lucruri de
> securitate care trebuie rezolvate înainte ca site-ul să devină public.

---

## Partea 0 — Înainte de toate (OBLIGATORIU)

O adresă tehnică pe care n-o știe nimeni e una. Un domeniu pe care îl dați școlilor e altceva —
atrage și atenție nedorită. Astea trebuie închise înainte de lansare.

### 0.1 Actualizarea react-router — cel mai important lucru din tot documentul

Biblioteca pe care e construit site-ul, `react-router`, e la versiunea 7.9.6, care are **13
probleme de securitate publicate**. Printre ele: o problemă care permite unui atacator să
execute cod pe server fără să fie logat, una care poate pica site-ul, și mai multe care pot
redirecta un vizitator către un site străin.

```bash
cd app
npm audit --omit=dev          # arată problema, înainte și după
# se urcă react-router și @react-router/dev la 7.18.2
npm install
npm run typecheck && npm test && npx wrangler deploy --dry-run
npm audit --omit=dev          # trebuie să scrie: found 0 vulnerabilities
```

**Rămânem pe linia 7 (7.18.2).** Există și 8.3.0, dar aia e o schimbare mare, cu mutări de cod.
Nu amestecăm o reparație de securitate cu o mutare de versiune mare.

- [x] Actualizat la 7.18.2; verificat din nou pe 20.08.2026: `npm audit --omit=dev` → **0 vulnerabilități**

### 0.2 Limitarea încercărilor la „Exersează"

Pagina de exersat nu are nicio limitare, deși toate celelalte pagini sensibile au. Practic, un
program automat poate: (a) să ocupe toate poreclele plauzibile dintr-o clasă, ca elevii adevărați
să nu mai poată alege una; (b) să încerce răspunsurile la nesfârșit, ca să afle care e cel corect.

Se folosește tiparul care există deja (`lib/ratelimit.ts` + o intrare nouă în `wrangler.json`).
Limita trebuie să fie **generoasă** — un elev care răspunde repede nu are voie să fie blocat — dar
strânsă la alegerea poreclei. Și trebuie să rămână **„fail-open"**: dacă limitatorul lipsește sau
se strică, elevii tot pot exersa. Mai bine fără limitare decât cu o clasă blocată.

- [x] Limitare pusă (`PRACTICE_LIMITER`, `NICK_LIMITER`), testele trec

### 0.3 Oprirea scurgerii de token-uri în jurnalele de producție

Fișierul `lib/email.ts` scrie în jurnal linkul întreg de confirmare a e-mailului — link care
conține o cheie valabilă 24 de ore — ori de câte ori lipsește cheia de trimis e-mailuri
(`RESEND_API_KEY`). Condiția e „nu există cheie", nu „suntem pe calculatorul de acasă". Iar
jurnalele de producție sunt pornite.

Deocamdată nu se întâmplă, pentru că verificarea prin e-mail e oprită. Dar dacă cineva pornește
verificarea **înainte** de a pune cheia, în jurnale ajung chei de autentificare care funcționează.

Se pune condiția pe „suntem în dezvoltare" și, în producție fără cheie, sistemul trebuie să dea
eroare zgomotos — ca să se vadă greșeala, nu s-o ascundă.

- [x] Reparat; în producție fără cheie dă eroare vizibilă, nu scrie token în jurnal

### 0.4 Ieșirea din cont să se facă prin POST

Acum ieșirea din cont (`/iesire`) se face printr-o simplă accesare de adresă. Asta înseamnă că un
site străin poate pune o imagine ascunsă cu adresa aia și vă dă afară din cont fără să vreți. Nu e
periculos (nu pierdeți date), dar e enervant și e ușor de reparat: se transformă într-un formular
care se trimite, păstrând exact același text și aceeași înfățișare a butonului.

- [x] Ieșirea se face prin POST, toate cele trei cookie-uri se șterg în continuare

### 0.5 Plasă de siguranță înainte de publicare

Acum comanda de publicare (`npm run deploy`) construiește și publică direct — fără să verifice
nimic. Nu există nici verificare automată în depozit. O greșeală ajunge direct pe site-ul public.

```json
"deploy": "npm run typecheck && npm test && react-router build && wrangler deploy"
```

Adică: verifică tipurile, rulează testele, și abia apoi publică.

- [x] Plasa de siguranță e pusă

### 0.6 Copie de siguranță pentru baza de date — acum nu există niciuna

Odată ce site-ul e public, asta contează. Cloudflare are o funcție de întoarcere în timp, dar e
bine să aveți și copia dumneavoastră.

```bash
cd app
npx wrangler d1 export catedra --remote --output "backup-$(date +%Y-%m-%d).sql"
```

De făcut **înainte de fiecare modificare a structurii bazei de date** și lunar. Ținută în altă
parte decât pe laptop — conținutul înseamnă luni de muncă.

- [x] Prima copie făcută pe 20.08.2026 → `backups/catedra-2026-08-20.sql` (873 KB). **Atenție: e încă doar pe acest calculator — copiaz-o pe un stick sau în Drive.** Conține parole criptate și tokenuri, deci nu intră niciodată în git (am pus `backups/` în `.gitignore`)

### 0.7 Întărirea CSP (opțional, se poate face mai târziu)

Politica de securitate a paginii are o portiță (`'unsafe-inline'`) pentru că tema și scriptul care
previne pâlpâirea sunt scrise direct în pagină. Verificarea n-a găsit **niciun loc** prin care
cineva să bage cod în pagină, deci nu e o gaură deschisă — e doar un strat de apărare în plus care
lipsește. Se poate face oricând, nu blochează lansarea.

- [ ] (Opțional) CSP cu „nonce", fără `'unsafe-inline'`

---

## Partea 1 — Întâi numele, apoi domeniul

### 1.1 Alegerea numelui

„Catedra" e un nume de lucru, provizoriu. Și **nu e liber ieftin**: `catedra.com` e al unei firme
adevărate, iar `catedra.ro` e ținut de cineva care cumpără domenii ca să le revândă scump. Deci
numele trebuie hotărât înainte de cumpărare.

**Tensiunea, spusă pe față:** motorul e făcut intenționat **independent de materie** — geografia e
prima instanță, nu singura. Un domeniu ca `lectiadegeografie.com` aduce căutări pe Google **acum**,
dar leagă marca de geografie. Un nume neutru păstrează arhitectura curată, dar nu se caută pe Google.

**Recomandarea mea: luați acum domeniul de geografie.** Corespunde cu ce există cu adevărat, iar
căutările în română sunt singura cale realistă către un public dincolo de clasele dumneavoastră.
Dacă apare vreodată o a doua materie, se cumpără atunci un domeniu de platformă — încă 10,44 $ pe
an, nu o criză.

Candidați care păreau liberi la o verificare rapidă (**nu e dovadă că sunt liberi** — trebuie
verificat fiecare în căutarea de la Cloudflare):

| Fel | Candidați |
|---|---|
| Descriptive, cele mai bune pe Google | `lectiadegeografie.com` · `invatgeografie.com` · `geografieinteractiva.com` · `catedradegeografie.com` |
| Personale, calde | `profadegeografie.com` · `geografiealtfel.com` |
| Evocatoare | `curbedenivel.com` (se potrivește cu motivul „contours" din temă) · `rozavanturilor.com` · `orizontgeografic.com` |
| Neutre, fără materie | `tablaverde.com` · `cretasitabla.com` |

Proba pentru fiecare: îl puteți spune la telefon unui părinte fără să-l literați? Sună bine citit cu
voce tare în clasă? E destul de scurt cât să-l scrieți pe tablă?

- [x] **Ales: `geocatedra.com`** (07.09.2026). Se potrivește cu `siteName: "Geo-catedra"` din
  `app/config/subject.ts`, deci marca și adresa spun același lucru. Trece proba telefonului:
  „geo-catedra punct com", fără literare

### 1.2 Cumpărarea

Cloudflare vinde domenii **la preț de cost, fără adaos** — `.com` costă **10,44 $ pe an**, același
preț și la reînnoire (fără șmecheria cu „primul an ieftin"), iar **protecția datelor din WHOIS e
gratuită și pornită din start**.

> **Atenție:** Cloudflare **nu vinde domenii `.ro`**. Dacă vreți vreodată și un `.ro`, trebuie luat
> de la un registrar acreditat ROTLD (de exemplu EUReg.ro, ~9 €/an, cu buletin) și abia apoi
> îndreptat către Cloudflare — două firme, două date de reînnoire. De aceea runbook-ul ăsta merge
> doar pe `.com`.

1. Panoul Cloudflare → **Domain Registration → Register Domains**
2. Căutați numele ales, adăugați în coș, plătiți
3. Zona se creează automat în contul dumneavoastră și folosește deja serverele Cloudflare
4. **Porniți reînnoirea automată** și verificați ca lui cardul salvat să nu-i expire înainte de domeniu

**Ce se întâmplă dacă nu se face plata** (bine de știut dinainte): zilele 1–30 perioadă de grație
(site-ul merge) → zilele 31–40 suspendat → zilele 41–70 se poate recupera, cu taxă → zilele 71–75
șters definitiv. Puneți data de reînnoire în calendar, cu alarmă cu două săptămâni înainte.

- [x] Domeniu cumpărat (07.09.2026) — **dar la Namecheap, nu la Cloudflare.** Vezi 1.3
- [ ] Reînnoire automată pornită **la Namecheap**, data în calendar cu alarmă cu 2 săptămâni înainte
- [ ] Verificat cât costă **anul doi** la Namecheap (primul an e adesea mai ieftin decât reînnoirea)

### 1.3 Cumpărat în altă parte: ce se schimbă

Domeniul a fost luat de la **Namecheap**. Verificarea, în orice moment:

```bash
# Windows PowerShell
Resolve-DnsName geocatedra.com -Type NS -Server 1.1.1.1
```

La cumpărare răspundea `dns1.registrar-servers.com` / `dns2.registrar-servers.com` (Namecheap) și
un `A` către `192.64.119.125` — pagina de parcare a lor.

**Ce se schimbă față de 1.2:** pasul „zona se creează automat în contul dumneavoastră" **nu se
întâmplă**. Zona trebuie creată de mână la Cloudflare, iar Namecheap trebuie pus să arate către
serverele de nume Cloudflare. Fără pasul ăsta, **nimic din Partea 2 nu e posibil**: „Custom Domain"
pe un Worker cere ca domeniul să fie o zonă în contul dumneavoastră.

**Ce NU se schimbă:** registrarul e singura diferență. Zona, DNS-ul, certificatul, Email Routing și
regulile de redirectare rămân gratuite la Cloudflare, la fel ca în restul runbook-ului. Domeniul
*poate* fi mutat la Cloudflare mai târziu (mai ieftin la reînnoire, o singură firmă de ținut minte),
dar **nu e obligatoriu** și nu se poate face în primele 60 de zile de la înregistrare.

- [ ] Cloudflare → **Add a site** → `geocatedra.com` → planul **Free**
- [ ] Notate cele **două servere de nume** pe care le dă Cloudflare (sunt personalizate pentru cont)
- [ ] Namecheap → **Domain List → Manage → Nameservers → Custom DNS** → puse cele două
- [ ] Așteptat până Cloudflare arată zona ca **Active** (de obicei sub o oră, uneori până la 24)

---

## Partea 2 — Legarea domeniului de aplicație

**Aplicația e un Worker, nu Cloudflare Pages.** Toate tutorialele despre Pages pe care le găsiți pe
internet nu se aplică aici.

### 2.1 „Custom Domain", nu „Route"

Se folosește **Custom Domain**. Aplicația *este* sursa, așa că Cloudflare face singur și înregistrarea
DNS, și certificatul de securitate. „Routes" e pentru cu totul altă situație.

**Pe care din cele două Workere?** Sunt două desfășurări ale aceluiași cod (vezi CLAUDE.md §9).
Decizia autoarei, 07.09.2026: **domeniul merge pe instanța liberă**, cea publică — ea e singura
făcută să fie găsită pe Google. Instanța cu clase rămâne deocamdată pe adresa ei `workers.dev`.

| Adresă | Worker | De ce |
|---|---|---|
| `geocatedra.com` | **`catedra-liber`** | Situl public, gratuit, indexabil |
| `www.geocatedra.com` | **`catedra-liber`** | Doar ca să redirecteze către adresa scurtă (2.2) |
| `catedra.geografie.workers.dev` | `catedra` | Tokenuri, `/admin`, `/profesor`. Neschimbat |

> Elevii cu token continuă să intre pe adresa `workers.dev` — **nu li se schimbă nimic azi.**
> Dacă mai târziu vreți și pentru ei o adresă frumoasă, se adaugă `clasa.geocatedra.com` ca al
> doilea Custom Domain, pe Workerul `catedra`. Nu strică nimic din ce se face acum și nu cere
> niciun deploy — se face din panou. Codul nu conține nicăieri un domeniu scris de mână.

Panou → **Workers & Pages → `catedra-liber` → Settings → Domains & Routes → Add → Custom Domain**

Se adaugă amândouă:
- `geocatedra.com`
- `www.geocatedra.com`

Certificatul se emite automat, de obicei în câteva minute.

> **Atenție la ordine:** asta merge doar după ce zona e **Active** la Cloudflare (1.3). Dacă
> Namecheap încă ține serverele de nume, butonul dă eroare.

- [ ] Și cu `www`, și fără, site-ul se deschide pe https

### 2.2 Redirectarea de la www către adresa scurtă

Se alege o singură adresă oficială (recomand cea fără `www`) și cealaltă trimite către ea — altfel
Google indexează două copii ale fiecărei pagini și se încurcă.

Panou → **Rules → Redirect Rules**: dacă gazda e `www.geocatedra.com`, redirectare către
`concat("https://geocatedra.com", http.request.uri.path)`, cod **301**, cu păstrarea
parametrilor.

> **Verificați că chiar funcționează.** Sunt raportări că regulile personalizate nu se execută pe
> planul gratuit, deși redirectarea automată a Cloudflare merge. Se testează așa:
> ```bash
> curl -sI https://www.geocatedra.com/termeni
> ```
> Trebuie să apară `301` și adresa corectă în `location:`.

- [ ] Testul cu `curl` confirmă redirectarea

### 2.3 Setările de securitate a conexiunii (TLS)

Panou → **SSL/TLS**:

| Setare | Valoare | De ce |
|---|---|---|
| Mod de criptare | **Full (strict)** | Simplu aici — aplicația e chiar sursa, nu există alt server de configurat |
| Always Use HTTPS | **Pornit** | Nimeni nu mai poate intra pe `http://` |
| Versiune minimă TLS | **TLS 1.2** | 1.0 și 1.1 sunt vechi și sparte |
| HSTS | **Pornit**, 6–12 luni, cu subdomenii | Aplicația trimite deja HSTS; pornit și la Cloudflare acoperă și restul |

**Reînnoirea certificatului: nu aveți nimic de făcut.** Cloudflare îl reînnoiește singur. Dacă vreți
să verificați oricând:

```bash
echo | openssl s_client -servername geocatedra.com -connect geocatedra.com:443 2>/dev/null \
  | openssl x509 -noout -dates -issuer
```

> **Porniți HSTS doar când sunteți sigură că site-ul rămâne pe https pentru totdeauna.** Browserele
> țin minte setarea pe toată durata și nu se poate retrage repede. Începeți cu o durată scurtă și
> creșteți-o după o săptămână fără probleme.

- [ ] Toate cele patru setări făcute, certificat verificat

---

## Partea 3 — Securitate la margine și gestionarea parolelor

### 3.1 Ce e gratuit la Cloudflare și merită pornit

| Funcție | Gratis? | O folosim? |
|---|---|---|
| Bot Fight Mode | Da | Da — atenție la alarme false pe monitorizări |
| Turnstile (înlocuitorul de CAPTCHA) | Da, generos | **Da — vezi 3.2** |
| Reguli de limitare | Da, dar **doar 2 reguli, fereastră de 1 minut** | Da, ca al doilea strat peste limitările din aplicație |
| Certificat SSL | Da | Deja pornit |
| **WAF / setul de reguli OWASP** | **Nu — doar pe plan Pro** | **Nu îl veți avea.** Nu vă bazați pe el |

Cele două reguli gratuite se folosesc pe `/intra` (intrarea elevilor cu token) și `/admin/login`.

### 3.2 Turnstile pe formularele de intrare — singura gaură rămasă

Token-urile de clasă sunt de forma `PREFIX-CLASA-XXXX`, cu vreo 20 de biți de aleatoriu în partea
finală. E un compromis asumat (elevul trebuie să-l poată scrie de mână), apărat de limitarea pe IP.
Problema: **limitarea pe IP nu oprește o încercare împrăștiată pe multe adrese IP.**

Se pune Turnstile pe `/intra`, `/admin/login` și `/profesor/login`. E gratuit, de obicei invizibil
pentru om, și e răspunsul corect la ghicitul automat.

Asta adaugă `challenges.cloudflare.com` în politica de securitate — singurul script străin care
merită acceptat pe site.

- [x] Programul e scris și publicat (20.08.2026), dar **stă adormit până pui cheile**. Câtă vreme `TURNSTILE_SITE_KEY` și `TURNSTILE_SECRET_KEY` sunt goale, totul merge exact ca înainte. Când le pui pe amândouă, verificarea devine obligatorie. Pașii: `docs/run-guide.md`

### 3.3 Parolele de sistem („secretele") și schimbarea lor

Trei secrete, toate deja configurate să **oprească aplicația dacă lipsesc în producție** — e corect
așa, nu e o eroare de „reparat":

```bash
cd app
npx wrangler secret put SESSION_SECRET     # șir aleatoriu lung, minim 32 de caractere
npx wrangler secret put ADMIN_PASSWORD     # parolă tare și unică
npx wrangler secret put SIGNUP_PASSWORD    # codul de înscriere pentru profesori
npx wrangler secret list                   # verificare că toate trei există în producție
```

Valorile se generează cu `openssl rand -base64 48`.

**Când se schimbă:**

| Secret | Când | Ce se întâmplă |
|---|---|---|
| `SESSION_SECRET` | Anual, sau **imediat dacă bănuiți o scurgere** | **Deconectează instantaneu pe toată lumea** — admin, profesori, elevi. Ăsta e butonul dumneavoastră de urgență |
| `ADMIN_PASSWORD` | Anual, sau după orice grijă legată de un calculator străin | Vă logați din nou |
| `SIGNUP_PASSWORD` | La fiecare an școlar | Ca să nu mai circule codul de anul trecut printre profesori |

Secretele nu se pun niciodată în cod. Fișierul `.dev.vars` e doar local și trebuie să rămână
ignorat de git — se verifică cu `git check-ignore -v app/.dev.vars`.

- [x] Verificat pe 20.08.2026: toate cele cinci secrete există în producție (`SESSION_SECRET`, `ADMIN_PASSWORD`, `SIGNUP_PASSWORD`, `RESEND_API_KEY`, `EMAIL_FROM`). **Valorile nu se pot citi**, deci verifică tu că `ADMIN_PASSWORD` nu mai e `admin`. Datele de schimbare: încă de pus în calendar

### 3.4 Ce e deja bine făcut — a nu se „repara"

O verificare completă de securitate a confirmat că astea sunt corecte. Nu le atingeți:

- Token-urile de clasă sunt păstrate doar ca amprentă (hash), iar **anularea unui token taie imediat
  și sesiunile deja deschise** — se verifică în baza de date la fiecare cerere
- Fiecare profesor vede strict datele lui — nu s-a găsit nicio cale de a citi datele altui profesor
- Nu există niciun loc prin care să se poată injecta comenzi în baza de date
- Nu există niciun loc prin care să se poată injecta cod în pagină
- `/media/:id` verifică drepturile la fiecare cerere, iar fișierele SVG sunt forțate la descărcare
  (ca să nu poată rula cod)
- Aplicațiile interactive rulează într-o ramă izolată, fără acces la datele site-ului
- Parolele profesorilor sunt păstrate cu 310.000 de iterații — foarte solid
- Protecția împotriva formularelor trimise de pe alte site-uri e suficientă așa cum e

---

## Partea 4 — Ce îi lipsește unui site public

Tot ce urmează lipsește azi, dacă nu scrie altfel.

### 4.1 Iconițe (favicon)

Există `public/favicon.ico`, dar **nimic nu trimite către el** — iconița de acum e desenată direct
în cod. Merge, dar nu aveți iconiță pentru telefon și nici pentru „adaugă pe ecranul principal".

Se generează din siglă și se pun în `app/public/`:

```
favicon.ico            32x32 + 16x16
icon.svg               varianta care se scalează
apple-touch-icon.png   180x180   (iPhone/iPad)
icon-192.png           192x192
icon-512.png           512x512
og-image.png           1200x630  (imaginea care apare la partajare)
```

- [x] Făcut: iconița site-ului, cea pentru iPhone, cele pentru telefon (192 și 512) și **imaginea de partajare** (cea care apare când trimiți linkul pe WhatsApp). Se pot reface cu `app/scripts/gen-icons.mjs`

### 4.2 Titluri, descrieri și imaginea de partajare

Doar pagina principală are descriere. **Nicio pagină nu are `og:`** — adică atunci când cineva dă
link-ul site-ului pe WhatsApp, într-un grup de profesori, apare o adresă goală, fără titlu, fără
imagine, fără descriere. Ăsta e primul lucru pe care îl vede lumea.

Se face un ajutor comun care produce toate etichetele deodată (titlu, descriere, adresa canonică,
`og:title`, `og:description`, `og:image`, `og:locale` = `ro_RO`, `twitter:card`), cu numele
site-ului luat din configurație.

Se aplică pe paginile publice: `/`, `/confidentialitate`, `/termeni`, `/cookie-uri`, `/info/:role`.

**Paginile private se marchează `noindex`:** tot ce e `/admin/*`, `/profesor/*`, `/clasa/*` și
`/intra`. Sunt deja protejate; `noindex` doar le ține în afara rezultatelor Google.

- [x] Făcut pe toate cele 42 de pagini: cele 5 publice au titlu, descriere și imagine de partajare; cele 33 private sunt marcate „a nu se indexa”

### 4.3 robots.txt

`app/public/robots.txt`:

```
User-agent: *
Allow: /
Disallow: /admin
Disallow: /profesor
Disallow: /clasa
Disallow: /media
Disallow: /intra

Sitemap: https://geocatedra.com/sitemap.xml
```

- [x] Pus — dar se scrie singur, în funcție de adresă. **Cât timp site-ul stă pe `workers.dev`, le spune motoarelor de căutare să nu indexeze nimic**, ca să nu rămână o copie veche în Google după mutarea pe domeniul propriu. Când vine domeniul adevărat, trece automat pe regulile normale

### 4.4 sitemap.xml — să se genereze singur

**Se face ca pagină care se generează, nu ca fișier scris de mână.** Un fișier scris de mână devine
vechi în clipa în care publicați o lecție nouă, și nimeni n-o să-și amintească să-l actualizeze.

Se adaugă o rută care întreabă baza de date ce materiale publice există și scrie lista în format XML.
Doar adrese cu adevărat publice — niciodată paginile de clasă.

- [x] Funcționează, cu 6 adrese: pagina principală, cele trei pagini legale și cele două pagini „în curând”. **Nicio lecție** — vezi observația de mai jos

> ### ⚠️ Observație importantă: deocamdată nu există conținut public
>
> Am verificat în cod pe 20.08.2026. **Toate lecțiile, jocurile și exercițiile sunt în spatele
> tokenului de clasă.** Un vizitator care nu are token vede exact șase pagini: pagina principală,
> cele trei pagini legale și două pagini „în curând”.
>
> Ce înseamnă asta, pe șleau: tot ce am făcut acum (titluri, imagine de partajare, sitemap) e bun
> și de păstrat — de acum, când trimiți linkul pe WhatsApp, apare frumos, cu titlu și imagine.
> **Dar nu poate aduce vizitatori din Google, fiindcă Google n-are ce indexa.**
>
> Cumpărarea domeniului nu schimbă asta. Dacă vrei să te găsească și alți oameni decât elevii tăi,
> următorul pas nu e tehnic, ci o decizie de conținut: **să publici câteva lecții întregi, vizibile
> pentru oricine.** E o lucrare separată, care merită gândită înainte.
>
> **Rezolvat între timp (27.08.2026): instanța liberă.** Observația de mai sus a fost scrisă
> înainte de `catedra-liber`. Acum toată biblioteca de elevi și toată pedagogia sunt publice, fără
> cont și fără token, iar `sitemap.xml` are **peste 100 de adrese**, nu șase. Decizia de conținut
> s-a luat; ce lipsea era exact domeniul care se leagă acum.


### 4.5 Date structurate

Pe pagina principală se adaugă o descriere în format special (JSON-LD, `EducationalOrganization`).
Asta face ca rezultatul din Google să arate mai bogat, nu doar un link simplu.

- [x] Adăugat pe pagina principală. **Încă neverificat cu testul Google** — acela cere o adresă publică, deci se face după cumpărarea domeniului

### 4.6 security.txt

`app/public/.well-known/security.txt` — ca cineva care găsește o problemă de securitate să vă poată
scrie, în loc s-o facă publică:

```
Contact: mailto:contact@geocatedra.com
Expires: 2027-08-18T00:00:00.000Z
Preferred-Languages: ro, en
```

- [x] **Făcut (07.09.2026)**, odată cu adresa de pe domeniul propriu. Fișierul e servit de
  **amândouă** desfășurările (`app/public/` e comun), deci **nu conține niciun domeniu de site** —
  doar `mailto:`. `Expires` e la un an: **07.09.2027**, trecut în lista anuală de întreținere

### 4.6b Adresa de contact — o redirectare, nu o cutie poștală

`subjectConfig.contactEmail` era gol tocmai ca să nu ajungă adresa personală a autoarei pe o pagină
publică. Acum e `contact@geocatedra.com`, iar **un singur câmp aprinde trei locuri deodată**:
subsolul (`components/site.tsx`), secțiunea de drepturi GDPR din `/confidentialitate` și
`security.txt`. Gol înseamnă rezerva onestă („scrieți-ne prin formular"), plin înseamnă `mailto:`.

**Cutia nu există.** E o regulă **Cloudflare Email Routing** care trimite mai departe către adresa
privată a autoarei: gratuită, fără spațiu de stocare, fără parolă nouă de ținut minte. Primește, dar
**nu poate trimite** — de aceea nu rezolvă e-mailurile automate de la conturile de profesor
(Partea 6 / Faza 3), care au nevoie de cu totul altceva.

Panou → zona `geocatedra.com` → **Email → Email Routing → Enable** → *Create address*:
`contact@geocatedra.com` → destinația e adresa privată → **Cloudflare cere confirmare pe acea
adresă: mesajul trebuie deschis și linkul apăsat**, altfel regula rămâne inertă. Email Routing
adaugă singur înregistrările MX și SPF în zonă.

> **De ce contează ordinea.** Codul e deja desfășurat pe amândouă instanțele (07.09.2026), deci
> `mailto:`-ul e vizibil **de pe acum**. Cât timp Email Routing nu e pornit și confirmat, orice
> mesaj trimis acolo **se pierde**. Nu e vizibil pentru nimeni azi — situl liber e încă pe
> `workers.dev`, unde `robots.txt` spune „nu indexa" — dar pasul ăsta trebuie terminat **înainte**
> de a lega domeniul (Partea 2).

- [ ] Email Routing pornit, adresa creată, **destinația confirmată din e-mail**
- [ ] Test real: trimis un mesaj către `contact@geocatedra.com` de pe alt cont și **primit**

### 4.6c Măsurarea traficului — capcana „setării automate"

**Cloudflare Web Analytics pornește singur, fără jetonul nostru.** Când adaugi situl în panou,
opțiunea implicită e **„Enable — The JS Snippet will be automatically injected"**: Cloudflare
injectează balița la marginea rețelei, în HTML-ul servit, pentru că zona e proxied. Datele încep
să curgă imediat — pe 07.09.2026 se vedeau deja 3 vizite și 10 afișări de pagină.

**De ce e o problemă și nu o comoditate.** Secțiunea „Măsurarea traficului" din
`/confidentialitate` și nota din `/cookie-uri` sunt condiționate de `CF_BEACON_TOKEN` — tocmai ca
politica să nu poată minți (vezi CLAUDE.md). Cu injectarea automată, jetonul rămâne gol, deci
**se măsura trafic în timp ce politica tăcea**. Exact starea pe care legarea de jeton trebuia s-o
facă imposibilă — ocolită dintr-un panou, fără niciun deploy.

**Cum se repară**, o dată, și rămâne așa:

1. Panou → **Analytics → Web Analytics → site → Manage site**
2. Se alege **„Enable with JS Snippet installation"** (NU „Enable"), apoi **Update**
3. Se copiază jetonul din fragmentul afișat și se pune în `wrangler.json`, la `env.liber.vars.CF_BEACON_TOKEN`
4. `npm run deploy:liber`

**Verificarea care contează e că balița apare O SINGURĂ dată** — dacă rămâne și injectarea
automată, și cea din cod, paginile se numără de două ori:

```bash
curl -s https://geocatedra.com/ | grep -c "beacon.min.js"   # trebuie să dea 1, nu 2
curl -s https://geocatedra.com/confidentialitate | grep -o "Măsurarea traficului"
curl -s https://geocatedra.com/cookie-uri | grep -o "Numărăm totuși vizitele"
```

- [x] Trecut pe fragment manual, jeton în `wrangler.json`, o singură baliză, ambele pagini legale pornite (07.09.2026)

> **Opțiunea „Enable, excluding visitor data in the EU" nu e o soluție aici.** Publicul e din
> România, deci ar exclude aproape tot. Cloudflare Web Analytics nu pune cookie-uri și nu face
> amprentarea dispozitivului — de aceea nu are nevoie de bannerul de consimțământ, și de aceea
> alegerea corectă e să măsori tot și să scrii asta în politică.

### 4.7 Fonturile să vină de la noi, nu de la Google

Acum fonturile Inter și Spectral se descarcă de la Google la fiecare vizită. Asta înseamnă că
**browserul fiecărui vizitator îi dă adresa IP lui Google înainte să se vadă ceva pe ecran**, fără
consimțământ. E o zonă gri cunoscută în GDPR — și e singura legătură cu un server străin din tot
site-ul. Pe un site folosit de copii, merită scoasă.

Se descarcă fișierele fontului în `app/public/fonts/`, se scriu regulile `@font-face` în `app.css`,
se scot cele două legături din `root.tsx` și apoi se scot și cele două excepții din politica de
securitate. Câștigăm: nicio scurgere către un terț, site mai rapid, și o politică de securitate mai
strânsă.

- [x] Făcut: cele 12 fișiere de font stau acum la noi, cu tot cu literele românești (ă â î ș ț). **Site-ul nu mai cere absolut nimic de la Google** — deci nici adresa IP a elevilor nu mai ajunge acolo

### 4.8 Paginile publice, pregătite dinainte

Acum pagina principală și paginile legale se construiesc din nou la fiecare vizită, deși arată la
fel pentru toată lumea. Se pot pregăti o dată, la publicare:

```ts
prerender: ["/", "/confidentialitate", "/termeni", "/cookie-uri"],
```

- [ ] **Nu se poate deocamdată** — am încercat și am dat înapoi: unealta care pregătește paginile dinainte nu se împacă cu Cloudflare și strică publicarea. Nu e o pierdere mare, paginile se fac oricum repede. De reîncercat după o actualizare a uneltelor

### 4.9 Setări de păstrare în memorie (cache)

`/media/:id` e deja corect. Se adaugă un fișier `app/public/_headers` pentru fișierele de
construcție, care se pot păstra mult timp.

- [x] Adăugat — fonturile și fișierele aplicației se țin în memoria browserului un an, deci site-ul se deschide mai repede a doua oară

---

## Partea 5 — Google și statisticile

### 5.1 Google Search Console

1. [search.google.com/search-console](https://search.google.com/search-console) → adăugați proprietate
2. Alegeți **Domain property** — verificarea se face printr-o înregistrare DNS, iar DNS-ul e la dumneavoastră
3. Cloudflare → DNS → adăugați înregistrarea TXT → înapoi la Google → Verify
4. Trimiteți `https://geocatedra.com/sitemap.xml`
5. **URL Inspection → Request Indexing** pe pagina principală, ca să pornească mai repede

Nu vă așteptați la nimic 1–2 săptămâni. După aceea, urmăriți **Coverage** (erori) și **Performance**
(pentru ce căutări apăreți).

Opțional: Bing Webmaster Tools importă totul din Search Console în două clicuri. Merită.

- [ ] Verificat, sitemap trimis, pagina principală indexată

### 5.2 Statistici — Cloudflare, nu Google Analytics

**Asta contează mai mult decât pare.** Acum site-ul **nu are nevoie de bannerul acela enervant cu
cookie-uri**, pentru că folosește doar cookie-uri strict necesare. Dacă puneți Google Analytics,
sunteți obligată să puneți bannerul pe toate paginile, să slăbiți politica de securitate și să dați
datele vizitatorilor unui terț — pe un site folosit de copii.

**Cloudflare Web Analytics** e gratuit, nu folosește cookie-uri, nu cere banner și se pornește
dintr-un buton, pe o zonă pe care oricum o aveți.

Statistica internă care există deja (câte vizualizări are fiecare material, pe clasă, pe zi) rămâne —
ea răspunde la „ce lecție se folosește cu adevărat", lucru pe care niciun instrument extern nu-l
poate afla, pentru că materialele sunt în spatele parolei.

- [ ] Cloudflare Web Analytics pornit; niciun banner de cookie-uri adăugat

---

## Partea 6 — Banii: verdictul cinstit

Ați cerut cifrele adevărate. Astea sunt, și nu sunt cele la care sperați.

### 6.1 De ce reclamele banner nu merg

**Scara e greșită cu un ordin de mărime.** Traficul în limba română aduce cam **2 $ la 1000 de
afișări de pagină**. Cifrele de „15–30 $" pe care le găsiți pe internet la categoria „educație" sunt
pentru public din SUA și Marea Britanie, în engleză — n-au nicio legătură cu situația noastră. Și,
pentru că publicul sunt minori, ați fi limitată la reclame **nepersonalizate**, care aduc și mai puțin.

| Afișări de pagină pe lună | Venit realist pe lună |
|---|---|
| 500 | **sub 1 €** |
| 5.000 | **7–10 €** |
| 50.000 | 75–100 € |

**Google nu plătește până nu se strâng 100 $.** La câteva mii de afișări pe lună, suma aia se strânge
**în peste un an** — dacă se strânge vreodată.

**Partea legală e și mai rea decât cea financiară.** Trei lucruri se adună:

- Noul semnal **TFAT** al Google (în funcțiune din mai 2026) scoate personalizarea reclamelor pentru
  orice utilizator pe care sistemele lui îl consideră minor — iar site-ul dumneavoastră e, prin
  construcție, pentru copii de 11–18 ani.
- **Articolul 28 din DSA** interzice reclamele bazate pe profilare către minori.
- **„Legea majoratului digital"** din România a trecut de Senat în octombrie 2025, țintind exact
  minorii sub 16 ani, cu amenzi de 0,1–0,4% din cifra de afaceri. **Statutul ei actual nu e confirmat
  și trebuie verificat înainte de a pune orice cod de reclame** — legea asta e scrisă exact pentru
  site-uri ca al dumneavoastră.

### 6.2 De ce reclama video înainte de lecție nu se poate

- Google a **închis înscrierile noi la AdSense pentru video în 2022**.
- Produsul lor de video așteaptă **milioane de afișări pe lună**.
- Rețelele care *ar* accepta un site de mărimea asta (Adsterra, PropellerAds) dau ferestre pop-under
  și reclame de calitate îndoielnică. **Descalificate în fața copiilor, indiferent de bani.**

Renunțați la idee. Și, sincer: o reclamă înainte de lecție ar fi lucrul cel mai detestat de pe site —
pentru vreo 0,30 € pe lună.

### 6.3 Ce se face în schimb — în ordinea în care merită

**1. Spații proprii de promovare — asta merită construită.**

Bannere și link-uri alese de dumneavoastră, ținute în baza de date și afișate ca orice alt conținut.
Un tabel `promos` (imagine, link, text, unde apare, între ce date, opțional pe ce clasă) și o
componentă mică.

De ce e răspunsul potrivit pentru **acest** site:

- **Niciun script străin** — politica de securitate rămâne strânsă
- **Niciun cookie → niciun banner de consimțământ** → nu stricăm ce e scris în `docs/privacy-compliance.md`
- **Nicio profilare** → problema legală cu minorii nici nu se pune
- Independentă de materie, ca tot restul motorului
- **Controlați exact ce vede un copil** — ceea ce, pe un site școlar, e tot ce contează
- Și devine și mecanismul prin care se livrează punctele 3 și 4 de mai jos

**2. Donații.** Un link de donație Revolut sau Buy Me a Coffee, în subsol și pe paginile de profesor.
Se adresează părinților și colegilor profesori — adulți — deci întrebarea cu reclamele la minori nici
nu apare. Se face în zece minute. Realist, e cea mai rapidă cale către bani adevărați la mărimea asta.

**3. Abonamentul pentru profesori — deja e Faza 3 în planul dumneavoastră.** Profesori și școli care
plătesc pentru biblioteca de pedagogie: venit adevărat, proporționat, de la adulți care aleg să
plătească. Ăsta e modelul sustenabil pentru educație cu minori, și l-ați proiectat deja.

**4. Afiliere eMAG prin Profitshare** (3% comision). Atlase, hărți și cărți lângă lecția care are
nevoie de ele — chiar util, fără frecare, livrat prin spațiile de la punctul 1. Așteptări realiste:
„câțiva euro", nu o sursă de venit.

**5. Sponsorizare directă de la edituri românești** (Litera, Editura Art, Cărturești). Cere căutare și
discuții, nu se pornește dintr-un buton — dar un site de geografie cu public real e o țintă
plauzibilă, și plătește mult mai bine per afișare decât orice rețea automată.

**6. AdSense — documentat, dar nerecomandat.** De reluat doar dacă traficul public depășește vreodată
~20.000 de afișări pe lună, și atunci doar cu limite ferme: **numai** pe paginile publice, niciodată
pe `/clasa/*` unde sunt elevii; declararea corectă a vârstei publicului; platformă de consimțământ
certificată; și un buton de oprire. Întâi se verifică statutul legii românești.

### 6.4 Taxe — forma generală (vorbiți cu un contabil)

- Banii din reclame sau afiliere veniți din străinătate se declară în **Declarația Unică (D212)**,
  până pe **25 mai** pentru anul precedent.
- Impozit pe venit **10%**.
- **CASS** se plătește doar peste 6 salarii minime brute pe an (**≈24.300 lei pentru 2026**). La
  sumele de mai sus, rămâneți mult sub prag.
- **PFA aproape sigur nu merită** la câteva sute de euro pe an. Se reia discuția dacă abonamentul
  pentru profesori aduce venit recurent adevărat.

*Nu e consultanță fiscală. Confirmați cu un contabil înainte să declarați ceva.*

---

## Partea 7 — Întreținere, pe termen lung

| Cât de des | Ce |
|---|---|
| **Lunar** | `npm audit --omit=dev`; copie de siguranță a bazei de date; o privire pe Search Console |
| **Trimestrial** | Statisticile Cloudflare; verificat dacă Turnstile/Bot Fight blochează pe cineva pe nedrept |
| **La fiecare an școlar** | Schimbat `SIGNUP_PASSWORD`; regenerate token-urile de clasă (oricum expiră pe 15 iunie) |
| **Anual** | Schimbat `SESSION_SECRET` și `ADMIN_PASSWORD`; reînnoit `Expires` din `security.txt`; verificat reînnoirea domeniului și valabilitatea cardului |
| **Înainte de orice migrare** | Întâi copia bazei de date |

**Dacă se strică ceva:** panoul Cloudflare → Workers → Logs (jurnalele sunt deja pornite).

**Dacă bănuiți că cineva a intrat unde nu trebuie:** schimbați imediat `SESSION_SECRET` — asta
deconectează pe toată lumea, peste tot — apoi schimbați `ADMIN_PASSWORD` și anulați token-urile de
clasă din `/admin`.

### Cât costă, după acest runbook

| Ce | Cât |
|---|---|
| Domeniu `geocatedra.com` (**cumpărat la Namecheap**, 07.09.2026) | taxa anuală `.com` — **cifra se ia de pe bonul Namecheap**; e mai mare decât cei 10,44 $ de la Cloudflare, iar reînnoirea e de obicei peste prețul primului an |
| Tot restul (Workers, D1, R2, KV, Turnstile, Web Analytics, certificat SSL) | **0 $** |

`docs/costs.md` a fost actualizat (07.09.2026): infrastructura rămâne **0 $ pe lună**, iar
domeniul e trecut separat, ca **singurul cost anual**.

---

## Partea 8 — Lansarea instanței libere („catedra-liber")

Tot ce e mai sus (Părțile 0–7) e despre site-ul cu clase și tokenuri — cel pe care îl folosiți
zilnic la `catedra.geografie.workers.dev` (sau pe domeniul propriu, odată cumpărat). Partea asta
e despre **a doua față** a aceluiași site: o adresă separată, `catedra-liber`, unde intră **oricine,
fără cod de clasă și fără cont** — vede materialele elevilor și toată biblioteca de pedagogie,
gratis. E același conținut, aceeași bază de date — doar ușa de intrare e alta.

**Nu amestecați pașii de mai jos cu `npm run deploy` obișnuit.** Instanța liberă are propria
comandă, propriul Worker și propriile secrete.

### 8.1 Verificare înainte de deploy

Din folderul `app`:

```bash
npm run typecheck && npm test && npm run build && npm run build:liber
```

Așteptat: toate patru trec. `build:liber` construiește **fără** paginile de admin și de profesor —
nu există fizic în acel pachet, deci nu pot fi atinse din greșeală pe adresa publică.

### 8.2 Comanda de deploy

```bash
npm run deploy:liber
```

Asta rulează din nou verificările de mai sus și abia apoi publică. Așteptat: reușit, Workerul se
numește `catedra-liber`.

### 8.3 Secretul de care are nevoie („SESSION_SECRET")

Instanța liberă nu are cont de admin și nu are înregistrare de profesor — paginile alea nici nu
există pe ea. Are nevoie de un singur secret, cel cu care semnează testele de la „Exersează":

```bash
npx wrangler secret put SESSION_SECRET --env liber
```

Introduceți o valoare lungă și aleatoare (de exemplu ieșirea de la `openssl rand -base64 48`),
**diferită** de cea folosită pe instanța cu clase — dacă ar fi la fel, o problemă pe un site ar
afecta imediat și celălalt.

**Nu puneți `ADMIN_PASSWORD` și nici `SIGNUP_PASSWORD` pe `--env liber`.** Nu lipsesc dintr-o
greșeală — instanța liberă pur și simplu nu le citește niciodată, pentru că paginile care le-ar
folosi (admin, înregistrare de profesor) nu sunt în pachetul ei. Dacă într-o zi cineva adaugă din
nou o pagină de admin pe instanța liberă, secretele alea trebuie puse atunci, altfel pagina nouă
va da eroare la prima încercare de logare.

Verificare rapidă (nu arată valoarea, doar confirmă că există):

```bash
npx wrangler secret list --env liber
```

Așteptat: apare `SESSION_SECRET`. Atât.

### 8.4 Confirmați bindingurile din tabloul de bord

În Cloudflare → Workers & Pages → `catedra-liber` → Settings → Bindings, trebuie să apară:

- `DB` — baza D1 `catedra` (**aceeași** bază ca instanța cu clase — nu una nouă)
- `MEDIA` — bucket-ul R2 `catedra-media` (tot cel comun)
- cele cinci limitatoare de încercări, **drept „Rate Limit"**, niciodată „Unsafe Metadata"

**Dacă vreunul din cele cinci apare ca „Unsafe Metadata", opriți-vă și reparați `wrangler.json`
înainte de a continua** — înseamnă că limitarea de rată e complet oprită pentru instanța liberă,
fără niciun semn vizibil pe site (site-ul merge normal, doar că nimic nu mai oprește un program
automat).

Pentru siguranță, deschideți jurnalul live într-un terminal separat și cereți o pagină:

```bash
npx wrangler tail catedra-liber --format pretty
```

Dacă vreun limitator lipsește cu adevărat, apare o singură linie de avertizare la prima cerere.

### 8.5 Verificările de după deploy — pas cu pas

Toate cu domeniul real al instanței libere (`https://catedra-liber.<subdomeniul-dvs>.workers.dev`
sau domeniul propriu, dacă e legat).

**a) Paginile care n-au voie să existe pe instanța liberă — toate trebuie să dea „nu găsit" (404):**

```bash
for p in /admin /admin/login /profesor/login /demo /intra; do
  printf "%s -> " "$p"
  curl -s -o /dev/null -w "%{http_code}\n" "https://catedra-liber.geografie.workers.dev$p"
done
```

Așteptat: `404` pe toate cinci. Dacă vreuna răspunde altfel decât 404, opriți-vă — înseamnă că o
rută de admin sau de profesor a ajuns totuși în pachetul liber.

**b) Un material de pedagogie chiar se vede:**

```bash
curl -s -o /dev/null -w "%{http_code}\n" https://catedra-liber.geografie.workers.dev/pedagogie
```

Așteptat: `200`. Deschideți-o și în browser, intrați într-un raft și într-un teanc de pagini —
trebuie să se răsfoiască **întreg**, fără niciun zid la jumătate (zidul e doar pe `/demo`, de pe
instanța cu clase).

**c) O ciornă (material nepublicat) tot nu se vede — nici pe instanța liberă:**

Alegeți din `/admin` (pe instanța cu clase) un material cu statutul „ciornă" și încercați adresa
lui directă pe instanța liberă (`/elevi/<clasa>/m/<slug>` sau `/pedagogie/m/<clasa>/<slug>`).
Așteptat: `404`. Dacă se vede, verificarea de statut s-a stricat pentru rolul „liber" —
opriți totul și investigați `resolveVisibility` din `app/app/lib/entitlement.ts`.

**d) Exersează nu scrie nimic în bază** (același test ca pe instanța cu clase, Partea 0.2, dar
pentru siguranță repetat aici):

```bash
npx wrangler d1 execute catedra --remote --command "SELECT COUNT(*) n FROM practice_attempts;" --json
```

Notați `n`. Dați un test complet pe `https://catedra-liber.geografie.workers.dev/elevi/9/exerseaza`,
apoi rulați din nou aceeași comandă. Așteptat: `n` neschimbat.

**e) Un test lung nu vă dă afară la mijloc:**

Dați un test de 20 de întrebări, până la capăt, fără pauză. Așteptat: se termină normal, cu
rezultatul afișat — nu „testul a expirat" pe la jumătate. (Din august 2026, verificarea la
fiecare întrebare folosește limitatorul mai larg, `PRACTICE_LIMITER`; doar pornirea testului
folosește limitatorul strict, `DEMO_LIMITER`.)

- [ ] Toate cele cinci verificări (a–e) trecute după deploy

### 8.6 Ce NU trebuie să se schimbe pe instanța cu clase

Un deploy pe `--env liber` nu atinge Workerul de pe instanța cu clase. Ca plasă de siguranță
suplimentară, repetați testul din Partea 0 după orice deploy liber:

```bash
curl -s -o /dev/null -w "%{http_code}\n" https://catedra.geografie.workers.dev/profesor/pedagogie
```

Așteptat: **exact codul de dinainte** (un redirect spre login, nu 200).
