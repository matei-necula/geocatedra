# Provenance — jocurile de soluri (2026-08-11)

Toate fișierele de mai jos sunt decupate din planșele furnizate de profesoară și sunt
**generate AI, libere de utilizat** (decizie a proprietarei) — același regim ca planșele
`relief-minor-planse` documentate în `content/games/SOURCES.md`.

## Sursă: `content/games/_incoming/2026-07-25/plansa-8.jpg` (2816×1536, 8 coloane de profile de sol)

Decupaje: bara de orizonturi (colorată, în stânga fiecărei coloane) + profilul complet de sol,
de la suprafață până la baza coloanei. Exclus: peisajul/cerul de deasupra și numele tipărit dedesubt.

| Fișier | Coloană din planșă (stânga→dreapta) | Folosit în |
|---|---|---|
| `sol-1-laterit.jpg` | 1 — LATERIT | `soluri-profile/game.json`, `soluri-vegetatie/game.json` |
| `sol-2-feralitic.jpg` | 2 — SOL FERALITIC | idem |
| `sol-3-nisipos.jpg` | 3 — SOL NISIPOS | idem |
| `sol-4-terra-rosa.jpg` | 4 — TERRA ROSA | idem |
| `sol-5-molisol.jpg` | 5 — MOLISOL | idem |
| `sol-6-argiluvisol.jpg` | 6 — ARGILUVISOL | idem |
| `sol-7-podzol.jpg` | 7 — PODZOL | idem |
| `sol-8-turbos.jpg` | 8 — SOL TURBOS | idem |

Fiecare fișier apare identic (aceeași decupare) atât în `content/games/soluri-profile/`
cât și în `content/games/soluri-vegetatie/`, câte o copie în fiecare folder de conținut.

## Sursă: `content/games/_incoming/2026-07-29/plansa-10.jpg` (2816×1536, 5 carduri didactice cu blocuri 3D)

Decupaje: doar ilustrația bloc 3D din fiecare card. Exclus: titlul de deasupra și descrierea
de dedesubt (răspunsurile jocului de ordonare).

| Fișier | Card din planșă (stânga→dreapta) | Folosit în |
|---|---|---|
| `orizont-1-litiera.jpg` | 1 — LITERĂ (O) | `soluri-orizonturi/game.json` |
| `orizont-2-humus.jpg` | 2 — ORIZONT BOGAT ÎN HUMUS (A) | idem |
| `orizont-3-eluvial.jpg` | 3 — ORIZONT DE ALTERARE / ELUVIAL (B) | idem |
| `orizont-4-regolit.jpg` | 4 — ROCA ALTERATĂ / REGOLIT (C) | idem |
| `orizont-5-roca-mama.jpg` | 5 — ROCA MAMĂ (R) | idem |

## Fișiere șterse (superseded)

Vechile fotografii de profil de sol au fost înlocuite de decupajele de mai sus și șterse din
ambele foldere: `sol-cernoziom.jpg`, `sol-desertic.jpg`, `sol-laterit.jpg`, `sol-podzol.jpg`,
`sol-tundra.jpg` (din `soluri-profile/`) și `sol-argiluvisol.jpg`, `sol-feralitic.jpg`,
`sol-laterit.jpg`, `sol-molisol.jpg`, `sol-nisipos.jpg`, `sol-podzol.jpg`, `sol-terra-rosa.jpg`,
`sol-turbos.jpg` (din `soluri-vegetatie/`).

## Înlocuire planșă (2026-09-01)

Planșa a fost regenerată de profesoară: `Gemini_Generated_Image_gia8yogia8yogia8.jfif`
(2816×1536, tot 8 coloane, trimisă pe 2026-09-01). Aceleași 8 fișiere `sol-*.jpg` au fost
retăiate din ea, la 520 px lățime, de la vârful profilului până la raftul de lemn (y=936).

**Atenție la ordine — nu e aceeași cu a planșei vechi.** Etichetele de pe raft dau, de la
stânga la dreapta: pădure ecuatorială, savană, zonă tropical-aridă, zonă mediteraneeană,
**păduri de foioase**, **stepă**, taiga, tundră. Adică ultimele două din mijloc sunt
inversate față de numerotarea fișierelor:

| Coloană nouă | Etichetă pe planșă | Fișier |
|---|---|---|
| 5 | PĂDURI DE FOIOASE — Brown Earth | `sol-6-argiluvisol.jpg` |
| 6 | STEPĂ — Chernozem | `sol-5-molisol.jpg` |

Dacă se retaie vreodată planșa presupunând ordinea 1→8, cernoziomul și solul brun de pădure
ajung schimbate între ele în toate cele patru jocuri. Versiunea „- Copy" a planșei are
etichetele acoperite cu o bandă albă — pentru identificare, folosește originalul.

Fișierele sunt folosite acum în patru jocuri: `soluri-profile`, `soluri-harta`,
`soluri-vegetatie` și — compuse în dosare — `medii-dosare` (`gen/dosare.py`).
