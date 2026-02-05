-- 1. Réinitialiser TOUS les utilisateurs actuels à NON VERIFIÉ (Attention: tout le monde sera bloqué sauf admin)
UPDATE users SET email_verified = FALSE;

-- 2. S'assurer que les futurs inscrits sont NON VERIFIÉS par défaut
ALTER TABLE users ALTER COLUMN email_verified SET DEFAULT FALSE;
