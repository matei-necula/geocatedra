# ADR-0008: Instanța liberă („site-ul liber") — o a doua desfășurare publică, gratuită

- **Status:** Acceptat (decizia proprietarei, august 2026)
- **Data:** 2026-08-27

## Context

Codul are deja o instanță cu clase: elevii intră cu un token de clasă, profesorii au cont,
adminul (doamna profesoară) publică materiale din spatele unui `/admin` ascuns. Proprietara a
cerut o **a doua față** a aceluiași produs: un site public și gratuit, fără conturi, fără
tokenuri, fără clase — orice vizitator vede tot ce e publicat, la fel ca un elev cu token, plus
biblioteca de pedagogie întreagă (azi rezervată profesorilor cu abonament).

Motorul a fost construit de la început subiect-agnostic și cu podeaua de acces pe server
(`docs/03-permissions-matrix.md`, `lib/entitlement.ts`) — exact structura care face posibilă o a
doua desfășurare fără o reimplementare paralelă.

## Opțiuni luate în calcul

| Opțiune | Cum arată | De ce nu |
|---|---|---|
| **Un singur Worker, un flag la execuție** | Aceeași desfășurare, un cookie/header decide „liber" vs „clase" | Rutele de admin/profesor tot ajung în bundle — orice bug de autorizare sau cookie scurs le expune. Verificarea de acces devine „mai importantă" în loc de „singura linie de apărare" |
| **Cod separat, depozit separat** | Se clonează proiectul, se șterg rutele de admin | Două codebase-uri diverg în câteva luni; orice reparație de securitate trebuie făcută de două ori |
| **Un singur Worker, rol nou la execuție, fără tăiere de rute** | `Viewer` capătă rolul `liber`, dar rutele de admin rămân în bundle, protejate doar de `resolveViewer` | Mai bine decât primul, dar tot lasă suprafața de admin fizic accesibilă din exterior; o singură verificare uitată ar redeschide-o |
| **Un cod, două tabele de rute, alese la CONSTRUCȚIE (aleasă)** | `CLOUDFLARE_ENV` decide la `react-router build` care set de rute intră în bundle | Rutele de admin/profesor/tokenuri **nu există fizic** în bundle-ul liber — nu pot fi atinse de niciun bug viitor |

## Decizie

**Un singur cod, două desfășurări Cloudflare Workers**, comutate prin variabila de mediu
`CLOUDFLARE_ENV` (`clase` implicit, `liber` explicit) — vezi `wrangler.json`, cheia `env.liber`.

### Tabela de rute se alege la construcție, nu la execuție

`app/app/routes.ts` citește `CLOUDFLARE_ENV` direct din `process.env` (evaluat de
`@react-router/dev` în Node, la configurare — înaintea oricărui `define` din Vite) și exportă:

- rute **comune** ambelor instanțe (`/`, `/media/:id`, `robots.txt`, `sitemap.xml`, cele trei
  pagini legale);
- rute **doar pe `clase`** (`/intra`, `/clasa/*`, `/demo*`, tot `/admin/*`, tot `/profesor/*`);
- rute **doar pe `liber`** (`/elevi`, `/elevi/:gradeId/m/:slug`, `/elevi/:gradeId/harta/:topicSlug`,
  `/elevi/:gradeId/exerseaza`, `/pedagogie`, `/pedagogie/:collection`,
  `/pedagogie/m/:gradeId/:slug`).

La `npm run build:liber`, rutele de admin/profesor/tokenuri **nu ajung în bundle-ul JavaScript**.
Nu sunt „ascunse" sau „blocate la autentificare" — fizic nu există. E mai tare decât orice
verificare la execuție: o rută care nu există nu poate fi atinsă de niciun bug de autorizare, de
niciun cookie scurs și de nicio greșeală viitoare de cod.

### Podeaua de acces se EXTINDE, nu se ocolește

`lib/entitlement.ts` (`Viewer`, `resolveVisibility`) primea deja rolurile `admin`, `student`,
`teacher`, `public`, `demo`. S-a **adăugat** rolul `{ role: "liber" }` — nu s-a scos nicio
verificare existentă. `resolveViewer` (`lib/guard.ts`) construiește acest rol necondiționat când
`SITE_MODE === "liber"`, înaintea oricărei citiri de sesiune (pe instanța liberă nu există
sesiuni de nici un fel). Pentru rolul `liber`, `resolveVisibility` întoarce `full` pentru orice
material **publicat**, din ambele biblioteci — verificarea de ciornă (`status !== "published"` →
`hidden`) se aplică tuturor rolurilor la fel, deci ciornele rămân invizibile și pe instanța
liberă. Aceeași funcție, un rol în plus, aceeași linie de apărare pentru toată lumea.

### D1 și R2 sunt PARTAJATE

`wrangler.json`, `env.liber`, leagă **același** D1 (`catedra`, `database_id` identic) și
**același** bucket R2 (`catedra-media`) ca instanța cu clase — nu o copie. Doamna profesoară
publică o singură dată, din `/admin` (instanța cu clase); materialul apare imediat pe ambele
fețe, dacă are statutul potrivit. Nu există sincronizare, pentru că nu există duplicare.

Consecință acceptată: cele două instanțe nu pot avea niciodată conținut diferit pentru același
rând din bază — un draft e draft peste tot, un material publicat e publicat peste tot (cu
politica de vizibilitate diferită pe rol, nu pe rând).

### Cele cinci limitatoare de rată sunt separate ca spațiu de chei, nu ca binding

`env.liber.ratelimits` din `wrangler.json` folosește aceleași `namespace_id` (1001–1005) ca
instanța implicită — Cloudflare le grupează la nivel de cont, nu de Worker. Disjuncția între
cele două instanțe vine din **prefixul cheii** trimise la `underLimit` (`liber:` pe instanța
liberă, `practice:`/`nick:`/`admin:` etc. pe cea cu clase), nu din binding-ul însuși. Vezi
`lib/ratelimit.ts` și modul în care `liber.exerseaza.tsx` își construiește cheia.

### Secretele nu se moștenesc între Workeri

`catedra-liber` e un Worker distinct — `wrangler secret put --env liber` e obligatoriu separat de
instanța cu clase. `getSecrets` (`app/app/lib/env.ts`) rezolvă fiecare secret **leneș** (la
citirea proprietății, nu la apelul funcției), tocmai ca o rută care citește doar
`sessionSecret` (singura pe care o cere Exersează, singura rută cu acțiune de pe instanța liberă)
să nu cadă din cauza unui `ADMIN_PASSWORD`/`SIGNUP_PASSWORD` lipsă — secrete pe care instanța
liberă nu le folosește niciodată, pentru că rutele care le-ar citi nu există în bundle-ul ei.

### Decizia de conținut — publicarea întregii biblioteci de pedagogie, gratis

Biblioteca de pedagogie (scheme de lecție, ghid metodologic, proiecte de lecție, studii de caz)
era rezervată profesorilor cu abonament (Faza 3, deferată). Instanța liberă o face **complet
publică și gratuită**, fără nicio bucată ascunsă în spatele unui zid — spre deosebire de vitrina
de pe `/demo`, care arată doar `min(ceil(n/2), 6)` pagini din fiecare teanc.

Aceasta e o **decizie a proprietarei, asumată ca practic ireversibilă**: odată ce o pagină a fost
servită public, ea a putut fi văzută, salvată sau redistribuită de oricine a vizitat-o — o
revenire ulterioară la „doar cu abonament" nu poate șterge ce a circulat deja. Decizia a fost
luată cunoscând acest lucru, nu din neatenție. Motivul: obiectivul instanței libere e diseminarea
cât mai largă a materialului pedagogic, nu monetizarea lui — abonamentul pentru profesori
(Faza 3) rămâne un model posibil doar pentru instanța cu clase, dacă e reluat vreodată.

## Consecințe

- Un reviewer poate verifica izolarea cu un singur test static: `grep` în bundle-ul construit cu
  `build:liber` nu trebuie să găsească nimic din `routes/admin.*` sau `routes/profesor.*`.
- Orice funcție nouă care atinge `resolveViewer`/`resolveVisibility` trebuie gândită pentru toate
  rolurile din `Viewer`, inclusiv `liber` — omiterea lui cade implicit pe `hidden` (`default` din
  `switch`), deci greșeala e „prea restrictiv", nu „prea permisiv".
- Cele două instanțe se deploiază separat (`npm run deploy` vs `npm run deploy:liber`) și necesită
  verificare separată a secretelor și a limitatoarelor de rată la fiecare deploy — vezi
  `docs/08-runbook-lansare-publica.md`, Partea 8.
- Dacă se adaugă vreodată o a treia „față" a produsului, tiparul se repetă: un `SiteMode` nou, o
  listă de rute `numeOnly` în `routes.ts`, un rol nou în `Viewer`, un `env.<nume>` în
  `wrangler.json`. Nu o arhitectură nouă.
