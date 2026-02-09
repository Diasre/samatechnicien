-- SCRIPT DE RÉPARATION SPÉCIFIQUE POUR LES AVIS (REVIEWS)
-- Ce script corrige l'erreur "invalid input syntax for type bigint" lors de la publication d'un avis.

BEGIN;

-- 1. On supprime les contraintes qui empêchent la modification de la table 'reviews'
ALTER TABLE public.reviews DROP CONSTRAINT IF EXISTS "reviews_clientId_fkey";
ALTER TABLE public.reviews DROP CONSTRAINT IF EXISTS "reviews_technicianId_fkey";
ALTER TABLE public.reviews DROP CONSTRAINT IF EXISTS "reviews_client_id_fkey";
ALTER TABLE public.reviews DROP CONSTRAINT IF EXISTS "reviews_technician_id_fkey";

-- 2. On change le type des colonnes en TEXTE (pour accepter les UUIDs)
ALTER TABLE public.reviews ALTER COLUMN "clientId" TYPE text USING "clientId"::text;
ALTER TABLE public.reviews ALTER COLUMN "technicianId" TYPE text USING "technicianId"::text;

-- 3. On s'assure que la table USERS est bien en TEXTE aussi (impératif pour les liens)
ALTER TABLE public.users ALTER COLUMN id DROP IDENTITY IF EXISTS;
ALTER TABLE public.users ALTER COLUMN id TYPE text USING id::text;

-- 4. On recrée les liens proprement entre reviews et users
-- Le ON DELETE CASCADE permet de supprimer les avis si l'utilisateur est supprimé
DO $$
BEGIN
    -- Lien pour le client
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'reviews_clientId_fkey') THEN
        ALTER TABLE public.reviews 
        ADD CONSTRAINT "reviews_clientId_fkey" 
        FOREIGN KEY ("clientId") REFERENCES public.users(id) ON DELETE CASCADE;
    END IF;

    -- Lien pour le technicien
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'reviews_technicianId_fkey') THEN
        ALTER TABLE public.reviews 
        ADD CONSTRAINT "reviews_technicianId_fkey" 
        FOREIGN KEY ("technicianId") REFERENCES public.users(id) ON DELETE CASCADE;
    END IF;
END $$;

COMMIT;
