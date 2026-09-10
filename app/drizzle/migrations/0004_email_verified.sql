-- Catedra — email verification flag for accounts.
ALTER TABLE users ADD COLUMN email_verified INTEGER NOT NULL DEFAULT 0;
