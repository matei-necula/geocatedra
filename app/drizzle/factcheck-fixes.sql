-- Fact-check corrections for grade-9 geografie-fizica materials (2026-07-01)
-- 1) Universul I: age of Universe 15 -> ~13,8 mld; Big Bang phrasing corrected
UPDATE material_translations
SET body = REPLACE(body,
  '15 miliarde de ani, prin explozia unei particule, urmată de un proces de expansiune a materiei care continuă și astăzi',
  '13,8 miliarde de ani, printr-o expansiune extrem de rapidă a materiei și a spațiului, pornind dintr-o stare inițială foarte densă și fierbinte — expansiune care continuă și astăzi')
WHERE material_id = (SELECT id FROM materials WHERE slug='universul-partea-1');

-- 2) Universul I: weak nuclear force governs radioactive decay, not fission
UPDATE material_translations
SET body = REPLACE(body,
  'responsabilă de fisiunea nucleară (folosită în centralele nucleare) și aflată la originea fuziunii nucleare din stele.',
  'responsabilă de dezintegrarea radioactivă (radioactivitatea) și implicată în reacțiile de fuziune din stele.')
WHERE material_id = (SELECT id FROM materials WHERE slug='universul-partea-1');

-- 3) Universul II: Charon is Pluto's satellite, not a dwarf planet
UPDATE material_translations
SET body = REPLACE(body,
  'planete pitice (de exemplu Pluto și Charon), care orbitează dincolo de Neptun.',
  'corpuri înghețate și planete pitice (de exemplu Pluto, Makemake și Haumea), care orbitează dincolo de Neptun. (Charon nu este o planetă pitică, ci satelitul lui Pluto.)')
WHERE material_id = (SELECT id FROM materials WHERE slug='universul-partea-2');

-- 4) Grilă #1 rebuilt: false premise (weak force -> fission) removed
UPDATE question_translations
SET stem = 'Forța nucleară slabă stă la baza dezintegrării radioactive și este implicată în reacțiile de fuziune din stele. Ce concluzie corectă putem trage?',
    options_json = '["Aceeași forță fundamentală se manifestă în procese foarte diferite — de la radioactivitatea de pe Pământ până la producerea energiei în stele.","Radioactivitatea și fuziunea stelară sunt, de fapt, unul și același proces.","Stelele produc energie prin dezintegrare radioactivă, la fel ca rocile radioactive.","Forța gravitațională este cea care declanșează dezintegrarea radioactivă."]',
    explanation = 'Concentrează-te pe ce au în comun cele două fenomene la nivel de forță fundamentală, nu pe rezultatele lor. Aceeași forță (nucleară slabă) stă la baza radioactivității și este implicată în fuziunea din stele.'
WHERE question_id = (SELECT id FROM questions WHERE grade_id='9' AND topic_slug='geografie-fizica' AND position=1);

-- ===== Minor imprecisions (2026-07-01) =====

-- 5) Universul II: Mercur day/year phrasing made precise
UPDATE material_translations
SET body = REPLACE(body,
  '- Mercur — fără atmosferă, plin de cratere; temperaturi extreme (de la −180 °C la +430 °C); o zi durează aproape cât un an.',
  '- Mercur — fără atmosferă, plin de cratere; temperaturi extreme (de la −180 °C la +430 °C); se rotește foarte încet — o rotație în jurul axei durează circa 59 de zile terestre, iar un an mercurian (o revoluție) circa 88 de zile.')
WHERE material_id = (SELECT id FROM materials WHERE slug='universul-partea-2');

-- 6) Universul II: Venus surface temperature ~465 °C
UPDATE material_translations
SET body = REPLACE(body, 'fiind cea mai fierbinte planetă (circa +480 °C)', 'fiind cea mai fierbinte planetă (circa +465 °C)')
WHERE material_id = (SELECT id FROM materials WHERE slug='universul-partea-2');

-- 7) Universul I: Orion is a secondary arm (spur), not one of the main arms
UPDATE material_translations
SET body = REPLACE(body,
  '- Este alcătuită dintr-un nucleu turtit și trei brațe importante: Orion (unde se află Soarele), Perseu și Săgetător; în brațe se găsesc cele mai multe stele tinere.',
  '- Este alcătuită dintr-un nucleu turtit și mai multe brațe spiralate (printre cele principale: Perseu și Săgetător); Soarele se află într-un braț secundar, numit brațul Orion. În brațe se găsesc cele mai multe stele tinere.')
WHERE material_id = (SELECT id FROM materials WHERE slug='universul-partea-1');

-- 8) Pământul – caracteristici: element percentages describe the crust, not the whole Earth
UPDATE material_translations
SET body = REPLACE(body,
  'Principalele elemente chimice din alcătuirea Pământului (procente din masă):',
  'Principalele elemente chimice din alcătuirea scoarței terestre (procente din masă):')
WHERE material_id = (SELECT id FROM materials WHERE slug='pamantul-caracteristici');

-- 9) Pământul – caracteristici: aurora duration (minutes to hours, not seconds)
UPDATE material_translations
SET body = REPLACE(body,
  'Aurorele se manifestă la altitudini de peste 100 km și durează câteva secunde.',
  'Aurorele se manifestă la altitudini de peste 100 km și pot dura de la câteva minute la câteva ore.')
WHERE material_id = (SELECT id FROM materials WHERE slug='pamantul-caracteristici');
