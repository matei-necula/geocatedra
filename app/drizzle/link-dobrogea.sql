-- Zona de clic de pe pagina 9 a studiului „Relieful Dobrogei": textul
-- „(lectură activă)" din titlu duce la suportul de lectură. Coordonatele sunt
-- procente din pagina de 1600×900, măsurate pe cuvintele din imagine.
UPDATE material_translations
SET body = '{"kind":"pagini","count":10,"links":[{"page":9,"x":41.3,"y":7.4,"w":18.2,"h":5.2,"slug":"studiu-suport-lectura-relieful-dobrogei","label":"Deschide Suportul de lectură activă"}]}'
WHERE material_id IN (SELECT id FROM materials WHERE slug='studiu-relieful-dobrogei');
