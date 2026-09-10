-- Șterge copia veche, orfană, a jocului „Caracteristicile Pământului și efectele lor".
-- Rămâne varianta curentă, `proprietati-si-consecinte`, care are fișier sursă în
-- content/games/pamant-caracteristici-asociere. Restaurare: restore-joc-duplicat-2026-08-19.sql
DELETE FROM material_translations WHERE material_id='b1579ab7-23dd-4427-ae44-edf4aad26c3e';
DELETE FROM material_assets       WHERE material_id='b1579ab7-23dd-4427-ae44-edf4aad26c3e';
DELETE FROM materials             WHERE id='b1579ab7-23dd-4427-ae44-edf4aad26c3e';
