-- Materiale mutate/redenumite în lotul 2026-08-12. Ingest-ul șterge după
-- (grade, topic, slug), deci rândurile vechi rămân dacă slug-ul sau capitolul
-- s-au schimbat — le ștergem explicit.
--   evolutia-stelelor      -> evolutia-stelelor-medii + evolutia-stelelor-gigant
--   pune-le-in-ordine (Cap II) -> temperatura-stelelor (Cap I)
--   ordinea-in-sistemul-solar: Cap I -> Cap II
DELETE FROM material_translations WHERE material_id IN (
  SELECT id FROM materials WHERE grade_id='9' AND (
    (topic_slug='universul-partea-1' AND slug IN ('evolutia-stelelor','ordinea-in-sistemul-solar')) OR
    (topic_slug='universul-partea-2' AND slug='pune-le-in-ordine')));
DELETE FROM material_assets WHERE material_id IN (
  SELECT id FROM materials WHERE grade_id='9' AND (
    (topic_slug='universul-partea-1' AND slug IN ('evolutia-stelelor','ordinea-in-sistemul-solar')) OR
    (topic_slug='universul-partea-2' AND slug='pune-le-in-ordine')));
DELETE FROM materials WHERE grade_id='9' AND (
  (topic_slug='universul-partea-1' AND slug IN ('evolutia-stelelor','ordinea-in-sistemul-solar')) OR
  (topic_slug='universul-partea-2' AND slug='pune-le-in-ordine'));
