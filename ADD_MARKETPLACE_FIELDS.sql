
-- AJOUT DES CHAMPS WHATSAPP ET LOCALISATION À LA TABLE PRODUCTS
BEGIN;

-- 1. Ajouter les colonnes si elles n'existent pas
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS whatsapp TEXT;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS address TEXT;

-- 2. Mettre à jour les politiques existantes pour permettre l'insertion de ces champs
-- (Pas besoin de changer INSERT, elle est déjà 'true' pour authenticated)

COMMIT;
