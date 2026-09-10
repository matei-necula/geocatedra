-- Split grade-9 topic_slug from the single 'geografie-fizica' bucket into one topic per lesson,
-- so each lesson has its own chapter on the browse page and its own selectable question set at Exersează.
-- (subject.config topics["9"] updated in the same change.)

UPDATE materials SET topic_slug = 'universul-partea-1' WHERE grade_id = '9' AND slug IN ('universul-partea-1', 'universul-partea-1-galerie-foto');
UPDATE materials SET topic_slug = 'universul-partea-2' WHERE grade_id = '9' AND slug IN ('universul-partea-2', 'universul-partea-2-galerie-foto');
UPDATE materials SET topic_slug = 'pamantul-caracteristici' WHERE grade_id = '9' AND slug IN ('pamantul-caracteristici', 'pamantul-caracteristici-galerie-foto');
UPDATE materials SET topic_slug = 'pamantul-miscari' WHERE grade_id = '9' AND slug IN ('pamantul-miscari', 'pamantul-miscari-galerie-foto');
UPDATE materials SET topic_slug = 'pamantul-reprezentare-harti' WHERE grade_id = '9' AND slug IN ('pamantul-reprezentare-harti', 'pamantul-reprezentare-harti-galerie-foto');
UPDATE materials SET topic_slug = 'dinamica-litosferei' WHERE grade_id = '9' AND slug IN ('dinamica-litosferei', 'dinamica-litosferei-galerie-foto');
UPDATE materials SET topic_slug = 'relieful-major' WHERE grade_id = '9' AND slug IN ('relieful-major', 'relieful-major-galerie-foto');
UPDATE materials SET topic_slug = 'tipuri-de-roci' WHERE grade_id = '9' AND slug IN ('tipuri-de-roci', 'tipuri-de-roci-galerie-foto');
UPDATE materials SET topic_slug = 'hidrosfera' WHERE grade_id = '9' AND slug IN ('hidrosfera', 'hidrosfera-galerie-foto');
UPDATE materials SET topic_slug = 'climatele-terrei' WHERE grade_id = '9' AND slug IN ('climatele-terrei', 'climatele-terrei-galerie-foto');
UPDATE materials SET topic_slug = 'solurile-terrei' WHERE grade_id = '9' AND slug IN ('solurile-terrei', 'solurile-terrei-galerie-foto');
UPDATE materials SET topic_slug = 'zonele-biogeografice' WHERE grade_id = '9' AND slug IN ('zonele-biogeografice', 'zonele-biogeografice-galerie-foto');
UPDATE materials SET topic_slug = 'relieful-minor' WHERE grade_id = '9' AND slug IN ('relieful-minor', 'relieful-minor-galerie-foto');
