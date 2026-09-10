-- Redenumiri de capitol (2026-08-24). Slug-urile rămân neschimbate, deci nu e
-- nevoie de migrare: se schimbă doar titlurile afișate.
-- Etichetele de capitol stau în app/config/subject.ts; aici sunt materialele.

-- Alcătuirea litosferei – minerale și roci  (fost: Tipologia rocilor)
UPDATE material_translations SET title='Alcătuirea litosferei – minerale și roci'
  WHERE material_id=(SELECT id FROM materials WHERE slug='ghid-tipologia-rocilor') AND locale='ro';
UPDATE material_translations SET title='Alcătuirea litosferei – minerale și roci'
  WHERE material_id=(SELECT id FROM materials WHERE slug='schema-tipologia-rocilor') AND locale='ro';
UPDATE material_translations SET title='Alcătuirea litosferei – minerale și roci'
  WHERE material_id=(SELECT id FROM materials WHERE slug='tipuri-de-roci') AND locale='ro';
UPDATE material_translations SET title='Minerale și roci — galerie foto'
  WHERE material_id=(SELECT id FROM materials WHERE slug='tipuri-de-roci-galerie-foto') AND locale='ro';

-- Reprezentarea spațiului geografic  (fost: Reprezentarea suprafeței terestre)
UPDATE material_translations SET title='Reprezentarea spațiului geografic. Utilizarea reprezentărilor cartografice'
  WHERE material_id=(SELECT id FROM materials WHERE slug='ghid-reprezentarea-suprafetei-terestre') AND locale='ro';
UPDATE material_translations SET title='Reprezentarea spațiului geografic. Utilizarea reprezentărilor cartografice'
  WHERE material_id=(SELECT id FROM materials WHERE slug='schema-reprezentarea-suprafetei-terestre') AND locale='ro';
UPDATE material_translations SET title='Reprezentarea spațiului geografic. Utilizarea reprezentărilor cartografice'
  WHERE material_id=(SELECT id FROM materials WHERE slug='pamantul-reprezentare-harti') AND locale='ro';

-- Proprietăți fizice ale Terrei  (fost: Terra – caracteristici fizice, chimice și mișcări)
UPDATE material_translations SET title='Proprietăți fizice ale Terrei'
  WHERE material_id=(SELECT id FROM materials WHERE slug='ghid-terra-caracteristici-si-miscari') AND locale='ro';
UPDATE material_translations SET title='Proprietăți fizice ale Terrei'
  WHERE material_id=(SELECT id FROM materials WHERE slug='schema-terra-caracteristici-si-miscari') AND locale='ro';
UPDATE material_translations SET title='Proprietăți fizice ale Terrei'
  WHERE material_id=(SELECT id FROM materials WHERE slug='pamantul-caracteristici') AND locale='ro';
UPDATE material_translations SET title='Proprietățile Terrei — galerie foto'
  WHERE material_id=(SELECT id FROM materials WHERE slug='pamantul-caracteristici-galerie-foto') AND locale='ro';

-- Biosfera. Diferențieri regionale  (fost: Zonele biogeografice ale Terrei)
UPDATE material_translations SET title='Biosfera. Diferențieri regionale'
  WHERE material_id=(SELECT id FROM materials WHERE slug='ghid-biosfera') AND locale='ro';
UPDATE material_translations SET title='Biosfera. Diferențieri regionale'
  WHERE material_id=(SELECT id FROM materials WHERE slug='schema-biosfera') AND locale='ro';
UPDATE material_translations SET title='Biosfera. Diferențieri regionale'
  WHERE material_id=(SELECT id FROM materials WHERE slug='zonele-biogeografice') AND locale='ro';
UPDATE material_translations SET title='Biosfera — galerie foto'
  WHERE material_id=(SELECT id FROM materials WHERE slug='zonele-biogeografice-galerie-foto') AND locale='ro';
