# Cum se dă înapoi redesign-ul „Cobalt"

Scris la 2026-09-05, **înainte** de prima linie de cod. Dacă noua înfățișare nu place,
nimic din ce urmează nu cere să fie refăcut de mână.

## 1. Situl live, imediat (fără build, ~30 de secunde)

Cloudflare păstrează versiunile. Astea sunt cele **de dinainte** de redesign, ambele
active la 2026-09-04 seara:

| instanță | Worker | versiunea bună de dinainte |
|---|---|---|
| cu clase | `catedra` | `4b7ca9bb-3f3c-4817-b2a2-c3b0e6c88d26` |
| liberă | `catedra-liber` | `53f87f2b-6636-4be0-bae3-b181712a44ef` |

```bash
cd app
npx wrangler rollback 4b7ca9bb-3f3c-4817-b2a2-c3b0e6c88d26
npx wrangler rollback 53f87f2b-6636-4be0-bae3-b181712a44ef --env liber
```

Se poate da înapoi și din panoul Cloudflare: Workers → worker-ul → Deployments → versiunea
de mai sus → *Rollback*.

## 2. Codul

Starea de dinainte e păstrată în **două** locuri, ca să nu depindă de unul singur:

- eticheta `pre-cobalt` (pe commit-ul `e5bea9e`)
- ramura `pre-cobalt-backup`

```bash
git checkout main            # main n-a fost atins; lucrul e pe feat/redesign-cobalt
git reset --hard pre-cobalt  # doar dacă main a apucat să primească redesign-ul
```

Ramura de lucru e `feat/redesign-cobalt`. Cât timp nu e împăcată în `main`, `main` e deja
varianta veche — nu trebuie făcut nimic.

## 3. Ce NU se atinge la revenire

Baza de date și R2 **nu** sunt modificate de redesign: nicio migrare, nicio coloană nouă,
niciun obiect scris sau șters. Materialele, întrebările, rezultatele și imaginile sunt
exact aceleași înainte și după. Deci revenirea nu poate pierde conținut.

Singurele fișiere noi pe disc sunt fonturi și fotografii în `app/public/`, care rămân
nefolosite dacă se revine.
