-- Climatele Terrei — galerie foto: înlocuiește toate diagramele climatice cu setul nou
-- (Kalgoorlie, Iquitos, Londra, Moscova, Aktiubinsk, Iakutsk, Inuvik, McMurdo, Taipei, Atena),
-- plasate corelat cu harta de repartiție geografică a fiecărui tip de climă.
-- Binarele au fost deja înlocuite în R2 (local + remote) pe aceleași r2_key.
-- Diagramele fără corespondent nou (subecuatorial/Veracruz, musonic/Darwin+Bangkok,
-- tropical-arid dublura Port Said) sunt eliminate; hărțile de repartiție rămân neschimbate.

-- 1) actualizează dimensiunea (bytes) pentru asseturile ale căror binare au fost înlocuite
UPDATE material_assets SET bytes = 533843 WHERE id = 'b0135751-6aa5-4aa2-863a-ba821a121366'; -- ecuatorial -> Iquitos
UPDATE material_assets SET bytes = 583452 WHERE id = 'd69b6cf5-1875-4fb5-8517-b86d712f7468'; -- tropical-arid -> Kalgoorlie
UPDATE material_assets SET bytes = 543128 WHERE id = '7d119877-5bc5-4861-9986-e2812b8db8bd'; -- subtropical-mediteranean -> Atena
UPDATE material_assets SET bytes = 553869 WHERE id = '76d1659a-3ca3-4b2e-b6a5-8afb3af7b724'; -- subtropical-umed -> Taipei
UPDATE material_assets SET bytes = 561594 WHERE id = 'f08674ea-7c2b-4fbe-a017-c3e11b9d8d0d'; -- temperat-oceanic -> Londra
UPDATE material_assets SET bytes = 553799 WHERE id = '6d84e80d-3177-4edd-983b-50a82c6a942b'; -- temperat-continental -> Moscova
UPDATE material_assets SET bytes = 566821 WHERE id = 'd6c93dc3-1561-4d4a-b9b3-2f36c34c437b'; -- temperat-continental-arid -> Aktiubinsk
UPDATE material_assets SET bytes = 583397 WHERE id = '1c851b28-4fdd-4f7d-baee-32364218d3f9'; -- temperat-rece(boreal) -> Iakutsk
UPDATE material_assets SET bytes = 569259 WHERE id = '6cd11633-a06e-40ee-8c36-eb55916a1432'; -- subpolar -> Inuvik
UPDATE material_assets SET bytes = 602190 WHERE id = 'd4745c0a-bfda-4786-bb7d-0e61be7ddb54'; -- polar -> McMurdo

-- 2) elimină diagramele fără corespondent în setul nou
DELETE FROM material_assets WHERE id IN (
  '8d7e503c-6d6c-4177-909b-df115a4dc715', -- subecuatorial, Veracruz
  '40c75427-ccd2-4185-b8bb-c12be97f9d43', -- musonic, Darwin
  'b0c2c233-7341-4438-a410-d6a68c18a803', -- musonic, Bangkok
  '33cc9e75-6317-4ccf-9942-ad074415e6dd'  -- tropical-arid, Port Said (dublură)
);

-- 3) reindexează idx-urile rămase în ordinea finală (0..19)
UPDATE material_assets SET idx = 0 WHERE id = '93c754ca-0988-4f64-b315-1e1ce41d9219'; -- harta de ansamblu
UPDATE material_assets SET idx = 1 WHERE id = 'fb78599a-547d-4921-bea0-362930add06f'; -- ecuatorial, hartă
UPDATE material_assets SET idx = 2 WHERE id = 'b0135751-6aa5-4aa2-863a-ba821a121366'; -- ecuatorial, diagramă (Iquitos)
UPDATE material_assets SET idx = 3 WHERE id = '1066832c-f49d-4204-ac48-ad34007c5624'; -- subecuatorial, hartă
UPDATE material_assets SET idx = 4 WHERE id = '04da6821-94ce-4485-acdb-27727785b422'; -- musonic, hartă
UPDATE material_assets SET idx = 5 WHERE id = '48401967-8e77-4fd4-a05d-23c0cc8db7c3'; -- tropical-arid, hartă
UPDATE material_assets SET idx = 6 WHERE id = 'd69b6cf5-1875-4fb5-8517-b86d712f7468'; -- tropical-arid, diagramă (Kalgoorlie)
UPDATE material_assets SET idx = 7 WHERE id = 'da62b28d-e4fe-4045-9518-e5c99768d496'; -- subtropical, hartă
UPDATE material_assets SET idx = 8 WHERE id = '7d119877-5bc5-4861-9986-e2812b8db8bd'; -- subtropical-mediteranean, diagramă (Atena)
UPDATE material_assets SET idx = 9 WHERE id = '76d1659a-3ca3-4b2e-b6a5-8afb3af7b724'; -- subtropical-umed, diagramă (Taipei)
UPDATE material_assets SET idx = 10 WHERE id = '16fb319b-be63-48b1-b6dc-7a6436648159'; -- temperat-oceanic, hartă
UPDATE material_assets SET idx = 11 WHERE id = 'f08674ea-7c2b-4fbe-a017-c3e11b9d8d0d'; -- temperat-oceanic, diagramă (Londra)
UPDATE material_assets SET idx = 12 WHERE id = 'be4738a9-aba1-4222-8aa2-f229e1661947'; -- temperat-continental+deșertic, hartă
UPDATE material_assets SET idx = 13 WHERE id = '6d84e80d-3177-4edd-983b-50a82c6a942b'; -- temperat-continental, diagramă (Moscova)
UPDATE material_assets SET idx = 14 WHERE id = 'd6c93dc3-1561-4d4a-b9b3-2f36c34c437b'; -- temperat-continental-arid, diagramă (Aktiubinsk)
UPDATE material_assets SET idx = 15 WHERE id = '1a7acba6-a7e0-4056-b1c7-ce0c66789267'; -- temperat-rece, hartă
UPDATE material_assets SET idx = 16 WHERE id = '1c851b28-4fdd-4f7d-baee-32364218d3f9'; -- temperat-rece(boreal), diagramă (Iakutsk)
UPDATE material_assets SET idx = 17 WHERE id = '3b1b7aa6-082f-423f-9068-f7cbeeab2a51'; -- subpolar, hartă
UPDATE material_assets SET idx = 18 WHERE id = '6cd11633-a06e-40ee-8c36-eb55916a1432'; -- subpolar, diagramă (Inuvik)
UPDATE material_assets SET idx = 19 WHERE id = 'd4745c0a-bfda-4786-bb7d-0e61be7ddb54'; -- polar, diagramă (McMurdo)

-- 4) legendele, în noua ordine (aliniate 1:1 cu idx 0..19)
UPDATE material_translations SET
body = '{"captions":["Climatele globului – harta de ansamblu a tipurilor de climă","Clima ecuatorială – repartiție geografică","Clima ecuatorială – diagramă climatică (Iquitos, Peru)","Clima subecuatorială – repartiție geografică","Clima musonică – repartiție geografică","Clima tropical-aridă (deșertică) – repartiție geografică","Clima tropical-aridă – diagramă climatică (Kalgoorlie, Australia)","Clima subtropicală – mediteraneană (vest) și umedă (est) – repartiție geografică","Clima subtropicală mediteraneană – diagramă climatică (Atena, Grecia)","Clima subtropicală umedă – diagramă climatică (Taipei, Taiwan)","Clima temperat-oceanică – repartiție geografică","Clima temperat-oceanică – diagramă climatică (Londra, Marea Britanie)","Clima temperat-continentală și temperat-deșertică – repartiție geografică","Clima temperat-continentală – diagramă climatică (Moscova, Rusia)","Clima temperat-continentală semiaridă – diagramă climatică (Aktiubinsk, Kazahstan)","Clima temperat-rece (boreală) – repartiție geografică","Clima temperat-rece (boreală) – diagramă climatică (Iakutsk, Rusia)","Clima subpolară – repartiție geografică","Clima subpolară – diagramă climatică (Inuvik, Canada)","Clima polară – diagramă climatică (McMurdo, Antarctica)"]}'
WHERE material_id = 'a1000000-0000-4000-8000-000000000012' AND locale = 'ro';
