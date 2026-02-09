-- SCRIPT DE RÉPARATION COMPLET (POLITIQUES + AVIS)
-- Ce script corrige l'erreur "cannot alter type ... column used in a policy"
-- ET l'erreur "invalid input syntax for type bigint" pour les avis.

BEGIN;

-- 1. SUPPRIMER LES POLITIQUES QUI BLOQUENT LA MODIFICATION DE 'USERS'
-- C'est l'étape cruciale qui manquait : on doit enlever la sécurité pour toucher à la structure
DROP POLICY IF EXISTS "Users can update their own profile" ON public.users;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.users;
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.users;

-- 2. SUPPRIMER LES CONTRAINTES SUR LA TABLE REVIEWS (AVIS)
ALTER TABLE public.reviews DROP CONSTRAINT IF EXISTS "reviews_clientId_fkey";
ALTER TABLE public.reviews DROP CONSTRAINT IF EXISTS "reviews_technicianId_fkey";

-- 3. MODIFIER LA TABLE USERS (Maintenant qu'elle est libre)
ALTER TABLE public.users ALTER COLUMN id DROP IDENTITY IF EXISTS;
ALTER TABLE public.users ALTER COLUMN id TYPE text USING id::text;

-- 4. MODIFIER LA TABLE REVIEWS (Le correctif pour "invalid input syntax")
ALTER TABLE public.reviews ALTER COLUMN "clientId" TYPE text USING "clientId"::text;
ALTER TABLE public.reviews ALTER COLUMN "technicianId" TYPE text USING "technicianId"::text;

-- 5. REMETTRE LES CONTRAINTES (PROPREMENT)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'reviews_clientId_fkey') THEN
        ALTER TABLE public.reviews ADD CONSTRAINT "reviews_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES public.users(id) ON DELETE CASCADE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'reviews_technicianId_fkey') THEN
        ALTER TABLE public.reviews ADD CONSTRAINT "reviews_technicianId_fkey" FOREIGN KEY ("technicianId") REFERENCES public.users(id) ON DELETE CASCADE;
    END IF;
END $$;

-- 6. REMETTRE LA SÉCURITÉ (ADAPTÉE AU TYPE TEXTE)
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable read access for all users" 
ON public.users FOR SELECT 
USING (true);

CREATE POLICY "Users can update their own profile" 
ON public.users FOR UPDATE 
USING (auth.uid()::text = id::text) 
WITH CHECK (auth.uid()::text = id::text);

COMMIT;
