-- Ordinea materialelor de la Pedagogie, aliniată la ordinea temelor din
-- materialele pentru elevi (subject.config: reprezentare → univers → Terra →
-- dinamica litosferei → roci → relief major → relief extern → atmosferă →
-- climate → hidrosferă → biosferă → soluri → medii).

-- Ghid metodologic
UPDATE materials SET position=1  WHERE slug='ghid-reprezentarea-suprafetei-terestre';
UPDATE materials SET position=2  WHERE slug='ghid-pamantul-in-univers';
UPDATE materials SET position=3  WHERE slug='ghid-terra-caracteristici-si-miscari';
UPDATE materials SET position=4  WHERE slug='ghid-dinamica-scoartei-terestre';
UPDATE materials SET position=5  WHERE slug='ghid-tipologia-rocilor';
UPDATE materials SET position=6  WHERE slug='ghid-relieful-major';
UPDATE materials SET position=7  WHERE slug='ghid-relieful-extern';
UPDATE materials SET position=8  WHERE slug='ghid-atmosfera';
UPDATE materials SET position=9  WHERE slug='ghid-climatele-terestre';
UPDATE materials SET position=10 WHERE slug='ghid-hidrosfera';
UPDATE materials SET position=11 WHERE slug='ghid-biosfera';
UPDATE materials SET position=12 WHERE slug='ghid-solul';
UPDATE materials SET position=13 WHERE slug='ghid-medii-naturale-terestre';

-- Scheme de lecție
UPDATE materials SET position=1  WHERE slug='schema-reprezentarea-suprafetei-terestre';
UPDATE materials SET position=2  WHERE slug='schema-universul-si-sistemul-solar';
UPDATE materials SET position=3  WHERE slug='schema-terra-caracteristici-si-miscari';
UPDATE materials SET position=4  WHERE slug='schema-dinamica-scoartei-terestre';
UPDATE materials SET position=5  WHERE slug='schema-tipologia-rocilor';
UPDATE materials SET position=6  WHERE slug='schema-relieful-major';
UPDATE materials SET position=7  WHERE slug='schema-relieful-extern';
UPDATE materials SET position=8  WHERE slug='schema-atmosfera';
UPDATE materials SET position=9  WHERE slug='schema-climatele-terestre';
UPDATE materials SET position=10 WHERE slug='schema-hidrosfera';
UPDATE materials SET position=11 WHERE slug='schema-biosfera';
UPDATE materials SET position=12 WHERE slug='schema-solul';
UPDATE materials SET position=13 WHERE slug='schema-medii-naturale-terestre';

-- Proiecte de lecție (climatele trec înaintea hidrosferei, ca la elevi)
UPDATE materials SET position=1  WHERE slug='proiect-reprezentari-cartografice';
UPDATE materials SET position=2  WHERE slug='proiect-sistemul-solar';
UPDATE materials SET position=3  WHERE slug='proiect-miscarile-terrei';
UPDATE materials SET position=4  WHERE slug='proiect-dinamica-litosferei';
UPDATE materials SET position=5  WHERE slug='proiect-hazarduri-endogene';
UPDATE materials SET position=6  WHERE slug='proiect-relieful-litoral';
UPDATE materials SET position=7  WHERE slug='proiect-climatele-zonei-temperate';
UPDATE materials SET position=8  WHERE slug='proiect-dinamica-apelor-oceanice';
UPDATE materials SET position=9  WHERE slug='proiect-vegetatia-zonei-calde';
UPDATE materials SET position=10 WHERE slug='proiect-solurile';
