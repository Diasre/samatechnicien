-- FIX ULTIME et RADICAL pour la mise à jour du profil CLIENT
-- Ce script désactive temporairement la sécurité stricte pour identifier le problème,
-- puis réapplique une règle simple et permissive pour l'utilisateur connecté.

BEGIN;

-- 1. Désactiver RLS sur la table users (pour tester si c'est ça qui bloque)
ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;

-- 2. Recréer les colonnes au cas où (pour être sûr à 100%)
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS fullname TEXT;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS phone TEXT;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS city TEXT;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS image TEXT;

-- 3. Réactiver RLS
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- 4. Nettoyer TOUTES les anciennes politiques pour éviter les conflits
DROP POLICY IF EXISTS "Users can update their own profile" ON public.users;
DROP POLICY IF EXISTS "Enable update for users based on id" ON public.users;
DROP POLICY IF EXISTS "Owners can update their profile" ON public.users;
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.users;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.users;

-- 5. Créer les politiques UNIQUES et SIMPLES

-- Politique de LECTURE (Tout le monde peut voir les profils, nécessaire pour afficher le sien avant de le modifier)
CREATE POLICY "Public profiles are viewable by everyone" 
ON public.users FOR SELECT 
USING (true);

-- Politique de MISE À JOUR (Seulement soi-même)
-- On utilise auth.uid() = id (avec cast text pour éviter les erreurs de type UUID)
CREATE POLICY "Users can update their own profile" 
ON public.users FOR UPDATE 
USING (auth.uid()::text = id::text)
WITH CHECK (auth.uid()::text = id::text);

COMMIT;
