-- SCRIPT D'AJOUT DE LA COLONNE ADRESSE DANS LA TABLE QUOTES
BEGIN;

-- 1. Ajout de la colonne address si elle n'existe pas
ALTER TABLE public.quotes ADD COLUMN IF NOT EXISTS address TEXT;

-- 2. On s'assure que les colonnes indispensables existent pour éviter les erreurs
ALTER TABLE public.quotes ADD COLUMN IF NOT EXISTS city TEXT;
ALTER TABLE public.quotes ADD COLUMN IF NOT EXISTS district TEXT;
ALTER TABLE public.quotes ADD COLUMN IF NOT EXISTS photo_url TEXT;

COMMIT;
