-- Corecții științifice în lecția „Zonele biogeografice ale Terrei" (b7c3e2a1-...).
-- 1) morse -> balene (morsele sunt arctice, nu antarctice)
-- 2) laricea nu e veșnic verde (conifer foios)
-- 3) bananierul nu e palmier
-- 4) bambusul e iarbă, nu arbore
-- 5) „pantera" (redundant cu leopardul) -> ghepardul
-- 6) fisticul (Pistacia vera) e foios, scos din lista veșnic verzi
UPDATE material_translations SET body =
  REPLACE(
  REPLACE(
  REPLACE(
  REPLACE(
  REPLACE(
  REPLACE(body,
    'palmieri (de ulei, de cocos, bananier), arbori de cauciuc',
    'palmieri (de ulei, de cocos), bananieri, arbori de cauciuc'),
    'urmate de răpitoare (**leul, leopardul, pantera, hiena**)',
    'urmate de răpitoare (**leul, leopardul, ghepardul, hiena**)'),
    'sezonul secetos: **teck, santal** (cu miros puternic), **bambus**.',
    'sezonul secetos: **teck** și **santal** (cu miros puternic); în subarboret crește **bambusul**, care nu este un arbore, ci o iarbă uriașă.'),
    'măslinul, fisticul, cedrul de Liban',
    'măslinul, cedrul de Liban'),
    'Domină **coniferele veșnic verzi**: molidul, bradul, laricea, zâmbrul.',
    'Domină **coniferele**, în cea mai mare parte veșnic verzi: molidul, bradul, zâmbrul; face excepție **laricea**, singurul conifer care își leapădă acele toamna.'),
    '**pinguini, foci, morse și albatroși**',
    '**pinguini, foci, balene și albatroși**')
WHERE material_id = 'b7c3e2a1-4d5f-4a6b-9c8e-1f2a3b4c5d6e' AND locale = 'ro';
