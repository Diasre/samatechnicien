-- 1. Mettre tout le monde à TRUE maintenant (Anciens comptes)
UPDATE users SET email_verified = TRUE;

-- 2. Dire à la base de données : "Pour les prochains, coche la case automatiquement"
ALTER TABLE users ALTER COLUMN email_verified SET DEFAULT TRUE;
