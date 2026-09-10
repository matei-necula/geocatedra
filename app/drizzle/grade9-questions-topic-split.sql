-- Retag existing grade-9 questions from the single 'geografie-fizica' bucket to their
-- lesson-specific topic_slug, matching the materials topic split (grade9-topic-split.sql),
-- so each lesson's question bank is independently selectable at Exersează.

UPDATE questions SET topic_slug = 'universul-partea-1' WHERE grade_id = '9' AND position BETWEEN 1 AND 20;
UPDATE questions SET topic_slug = 'universul-partea-2' WHERE grade_id = '9' AND position BETWEEN 21 AND 40;
UPDATE questions SET topic_slug = 'pamantul-caracteristici' WHERE grade_id = '9' AND position BETWEEN 41 AND 60;
UPDATE questions SET topic_slug = 'pamantul-miscari' WHERE grade_id = '9' AND position BETWEEN 61 AND 80;
UPDATE questions SET topic_slug = 'pamantul-reprezentare-harti' WHERE grade_id = '9' AND position BETWEEN 81 AND 100;
UPDATE questions SET topic_slug = 'dinamica-litosferei' WHERE grade_id = '9' AND position BETWEEN 101 AND 120;
UPDATE questions SET topic_slug = 'relieful-major' WHERE grade_id = '9' AND position BETWEEN 121 AND 140;
UPDATE questions SET topic_slug = 'tipuri-de-roci' WHERE grade_id = '9' AND position BETWEEN 141 AND 160;
UPDATE questions SET topic_slug = 'hidrosfera' WHERE grade_id = '9' AND position BETWEEN 161 AND 167;
UPDATE questions SET topic_slug = 'climatele-terrei' WHERE grade_id = '9' AND position BETWEEN 168 AND 173;
UPDATE questions SET topic_slug = 'solurile-terrei' WHERE grade_id = '9' AND position BETWEEN 174 AND 180;
UPDATE questions SET topic_slug = 'zonele-biogeografice' WHERE grade_id = '9' AND position BETWEEN 181 AND 200;
UPDATE questions SET topic_slug = 'relieful-minor' WHERE grade_id = '9' AND position BETWEEN 201 AND 240;
