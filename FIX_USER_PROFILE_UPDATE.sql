-- RÉPARATION DES MISES À JOUR DE PROFIL
-- Ce script s'assure que les utilisateurs peuvent modifier leur propre profil (UPDATE).

BEGIN;

-- 1. S'assurer que les colonnes nécessaires existent
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS fullname TEXT;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS phone TEXT;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS city TEXT;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS district TEXT;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS specialty TEXT;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS image TEXT;

-- 2. Désactiver temporairement RLS pour nettoyer
ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;

-- 3. Nettoyer les politiques de mise à jour existantes (pour éviter les doublons/conflits)
DROP POLICY IF EXISTS "Users can update their own profile" ON public.users;
DROP POLICY IF EXISTS "Enable update for users based on id" ON public.users;
DROP POLICY IF EXISTS "Owners can update their profile" ON public.users;

-- 4. Réactiver RLS
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- 5. Créer une politique de mise à jour ROBUSTE et SIMPLE
-- Cette politique permet à l'utilisateur authentifié de modifier sa PROPRE ligne.
-- On caste en text pour être sûr que ça matche (UUID vs Text)
CREATE POLICY "Users can update their own profile" 
ON public.users 
FOR UPDATE 
USING (auth.uid()::text = id::text)
WITH CHECK (auth.uid()::text = id::text);

-- 6. Important : S'assurer que l'utilisateur peut aussi VOIR sa propre ligne (sinon l'update échoue souvent)
DROP POLICY IF EXISTS "Enable read access for all users" ON public.users;
CREATE POLICY "Enable read access for all users" 
ON public.users 
FOR SELECT 
USING (true);

COMMIT;

-- Vérification
SELECT count(*) FROM public.users;
