-- Split the combined "Hidrosfera, climatele și solurile Terrei" material into 3 lessons.
-- First remove the combined material (id 02c41fcc…), then add the Hidrosfera lesson.
DELETE FROM material_translations WHERE material_id='02c41fcc-33e3-47da-a73d-4ef91baeb3e4';
DELETE FROM materials WHERE id='02c41fcc-33e3-47da-a73d-4ef91baeb3e4';

-- Hidrosfera – apele Pământului: lecție scrisă, clasa a 9-a (topic geografie-fizica, poziția 11)
INSERT INTO materials (id, grade_id, topic_slug, type, library, slug, position, status, is_teaser, created_at, updated_at) VALUES ('ba9fc960-8242-4684-8733-a8036628d89e','9','geografie-fizica','scris','student','hidrosfera',11,'published',0,1783600000000,1783600000000);
INSERT INTO material_translations (material_id, locale, title, description, body) VALUES ('ba9fc960-8242-4684-8733-a8036628d89e','ro','Hidrosfera – apele Pământului','Învelișul de apă al planetei: proprietățile apei, oceanul planetar, caracteristicile și dinamica apelor oceanice, apele continentale (curgătoare, lacuri) și ghețarii.','# Hidrosfera – apele Pământului

**Hidrosfera** este învelișul de apă al Pământului, în toate stările ei — lichidă, solidă (gheață) și gazoasă (vapori). Ea cuprinde oceanele și mările, apele de pe uscat (râuri, lacuri, ape subterane) și ghețarii. Apa leagă între ele celelalte învelișuri ale planetei și este condiția de bază a vieții.

## De ce apa este specială

Apa are câteva proprietăți care o fac cu totul aparte:

- **fierbe la 100 °C și îngheață la 0 °C** (la presiune normală);
- are **densitatea maximă la +4 °C**. Sub această temperatură, apa devine din nou mai puțin densă, iar la 0 °C, când îngheață, ocupă cu circa **10% mai mult volum** decât la +4 °C. De aceea **gheața plutește** pe apă — un lucru neobișnuit, fiindcă majoritatea substanțelor se scufundă când se solidifică. Tocmai plutirea gheții face ca lacurile și mările să înghețe de sus în jos, lăsând apă lichidă și viață dedesubt;
- când apa pătrunsă în crăpăturile rocilor **îngheață**, se dilată și **dezagregă rocile** (le sfărâmă) — un important agent de modelare a reliefului.

**Limitele hidrosferei** sunt date de spațiul în care există apă liberă: în scoarță coboară până la **5–10 km** adâncime (teoretic până la discontinuitatea Moho), iar în atmosferă urcă până la circa **80 km**, deși 90% din vaporii de apă se află în primii **5 km**.

## Oceanul planetar

Cea mai mare parte a apei Terrei se află în **Oceanul planetar**, masa unitară de apă sărată care înconjoară continentele. Trebuie să deosebim doi termeni:

- **Oceanul** — o întindere foarte mare de apă sărată, delimitată de continente;
- **Marea** — o întindere de apă mult mai mică decât oceanul, situată între continente, la marginea sau în interiorul lor, și legată de ocean.

Oceanul planetar are patru componente:

- **Oceanul Pacific** — cel mai mare și mai adânc; aici se află **Groapa Marianelor**, punctul cel mai adânc de pe Terra (circa **–11.022 m**);
- **Oceanul Atlantic** — al doilea ca mărime (Groapa Puerto Rico, –9.219 m);
- **Oceanul Indian** — cel mai cald ocean (Groapa Java, –7.455 m);
- **Oceanul Arctic (Înghețat)** — cel mai mic și mai puțin adânc, acoperit în mare parte de gheață.

**Mările** se află de obicei deasupra platformelor continentale și se clasifică după poziție în: **interioare (continentale)** — adânc pătrunse în uscat (Marea Neagră); **mediterane (intercontinentale)** — între continente (Marea Mediterană); **interinsulare** — între insule (Marea Java); **mărginașe (semiînchise)** — parțial separate de ocean prin peninsule și arhipelaguri (Marea Bering); **deschise** — larg legate de ocean (Marea Arabiei).

## Caracteristicile apelor oceanice

**Temperatura.** Media apei oceanice la suprafață este de **27–28 °C** la Ecuator și **scade spre poli**, ajungând la valori apropiate de îngheț în zona rece. Temperatura **scade și cu adâncimea**: sub circa 500 m rămâne aproape constantă, în jur de 2 °C, indiferent de latitudine. La suprafață, apa se încălzește și se răcește **sezonier**, dar aceste variații se resimt doar în primii zeci de metri.

**Salinitatea** este cantitatea de săruri dizolvate în apă, măsurată în **‰ (la mie)**. Media este de **35–37‰**. Ea depinde de raportul dintre evaporație (care lasă sărurile în urmă) și aportul de apă dulce (ploi, râuri, topirea gheții). De aceea salinitatea este **minimă în Marea Baltică (5–6‰)**, unde se varsă multe râuri și evaporația e slabă, și **maximă în Marea Roșie (41‰)**, într-o zonă caldă, secetoasă și închisă.

Alte însușiri: **culoarea** (apa reflectă mai ales radiațiile albastre, dar algele și particulele în suspensie o pot schimba), **transparența** (dată de puritatea apei) și **densitatea** (crește odată cu salinitatea și cu scăderea temperaturii).

## Dinamica apelor oceanice

Apa mărilor nu stă niciodată pe loc. Ea se mișcă în trei feluri:

- **Valurile** sunt unde formate la suprafață. Cele mai multe sunt **eoliene** (produse de vânt); cele produse de cutremure submarine se numesc **seismice** (valurile „tsunami”), foarte periculoase la țărm.
- **Mareele** sunt oscilații regulate ale nivelului oceanului — ridicări (**flux**) și coborâri (**reflux**) —, provocate de **atracția gravitațională a Lunii și a Soarelui**. Ele sunt **maxime** când Soarele, Luna și Pământul se află în linie (conjuncție sau opoziție, la Lună nouă și Lună plină) și **minime** când Luna și Soarele trag în unghi drept (cuadratură).
- **Curenții oceanici** sunt adevărate râuri de apă care se deplasează prin ocean, puse în mișcare mai ales de **vânturile permanente**. Ei pot fi **calzi** (duc apă caldă spre latitudini mari, încălzind țărmurile — ex. Curentul Golfului) sau **reci**. Curenții redistribuie căldura pe glob și influențează puternic clima țărmurilor.

## Apele continentale de suprafață

Apele de pe uscat se împart, după poziție, în **ape de suprafață** și **ape subterane**. Cele de suprafață sunt **ape curgătoare** (pâraie, râuri, fluvii), **ape stătătoare** (lacuri, bălți, mlaștini) și **ghețarii**.

**Apele curgătoare** curg mereu spre punctul cel mai jos, pe un traseu adâncit în scoarță (albia), permanent sau temporar. Apa lor provine din precipitații, din topirea zăpezilor și a ghețarilor și din izvoare (ape subterane). După mărime se deosebesc:

- **pârâul** — apă curgătoare mică, permanentă sau temporară;
- **râul** — apă curgătoare mijlocie, cu afluenți;
- **fluviul** — cea mai mare apă curgătoare, cu mulți afluenți, care se varsă în mare sau ocean printr-o **deltă** sau un **estuar**.

Un râu are: **izvorul** (locul de unde începe), **cursul** (superior, mijlociu, inferior) și **gura de vărsare**. Toată suprafața de pe care un râu își adună apa prin afluenți este **bazinul hidrografic**; linia care desparte două bazine vecine, trecând prin punctele cele mai înalte, se numește **cumpăna apelor**. **Afluentul** este apa care se varsă într-un râu mai mare (colector), iar locul unirii lor este **confluența**.

Mișcarea apei se descrie prin **viteză** (distanța parcursă în unitatea de timp) și **debit** (volumul de apă care trece printr-o secțiune a albiei în unitatea de timp, măsurat în m³/s). Când debitul crește mult, apar fenomene periculoase: **revărsarea** (creșterea periodică a nivelului, apa acoperind lunca), **viitura** (creștere bruscă și puternică, din ploi sau topirea rapidă a zăpezii) și **inundația** (revărsare neregulată care acoperă zonele vecine și provoacă pagube — un dezastru natural).

## Lacurile

Lacurile sunt ape stătătoare adunate în adâncituri numite **cuvete**. După origine sunt:

- **naturale** — cuveta a fost creată de agenți naturali;
- **antropice** — formate în spatele unor **baraje** construite de om.

Lacurile naturale se clasifică după agentul care le-a săpat cuveta:

- **tectonice** (Baikal, Tanganyika, Balaton) și **vulcanice**, în craterele vulcanilor stinși (Sfânta Ana) — create de **agenți interni**;
- **glaciare**, în circuri și văi săpate de ghețari (Bâlea, Bucura, Lacul Geneva), **carstice**, în roci dizolvate de apă (Vărășoaia), **litorale** (lagune ca Razim, limanuri maritime), **fluviatile** (limanuri fluviatile ca Snagov), **de tasare** (pe loess sau în masive de sare — Lacul Ursu de la Sovata), **de baraj natural** (Lacul Roșu) și **eoliene**, între dune — create de **agenți externi**.

Lacurile **antropice** cuprind **iazurile** (pentru irigații și adăpatul vitelor), **heleșteele** (pentru piscicultură) și **lacurile hidroenergetice**, din spatele marilor baraje (Lacul Vidra).

## Zăpezile permanente și ghețarii

**Zăpezile permanente** sunt cele care se mențin de la an la an, fiindcă temperatura scăzută și grosimea mare împiedică topirea. Ele apar în regiunile polare și pe munții înalți. **Limita zăpezilor permanente** urcă pe măsură ce ne apropiem de Ecuator: de la **0 m la poli**, la circa **600 m la Cercul polar**, **3.000 m în zona temperată** și **5.000 m la Ecuator**.

Din zăpada permanentă se nasc **ghețarii**: ziua zăpada de la suprafață se topește puțin, apa se infiltrează, iar noaptea îngheață. Astfel se formează întâi o gheață grăunțoasă (**nevé** sau **firn**), apoi o gheață compactă și transparentă — **ghețarul**. Există:

- **ghețari montani**, pe munții înalți (Himalaya, Alpi, Anzi). Un **ghețar de vale** are o zonă de acumulare (**circul glaciar**) și o **limbă** care coboară pe pantă; materialele cărate și depuse de ghețar se numesc **morene**;
- **ghețari continentali (de calotă)**, care acoperă Antarctida și Groenlanda cu straturi groase de 1.500–2.000 m.

La țărm, din calotă se desprind blocuri uriașe numite **aisberguri (iceberguri)**, purtate de curenții reci până la latitudini temperate, unde se topesc — un pericol pentru navigație. Gheața formată direct din apa mării se numește **banchiză**. Prin **eroziune, transport și acumulare**, ghețarii modelează relieful: sapă **circuri** și **văi glaciare** (în care se adună apoi lacuri, ca Bâlea sau Bucura).

## De reținut

- **Hidrosfera** cuprinde toată apa planetei; proprietățile neobișnuite ale apei (gheața plutește, densitatea maximă la +4 °C) au urmări mari asupra vieții și reliefului.
- **Oceanul planetar** are patru componente; apa lui se caracterizează prin temperatură (scade spre poli și cu adâncimea) și salinitate (media 35–37‰) și se mișcă prin valuri, maree și curenți.
- **Apele continentale** (curgătoare, stătătoare, ghețari) modelează uscatul și ne dau apa dulce necesară vieții.');
