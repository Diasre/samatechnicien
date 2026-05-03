-- SCRIPT POUR AUTORISER L'ADMINISTRATEUR À MODIFIER LES COMPTES (Blocage, KYC, Validation)
-- Version corrigée avec cast text explicite.

BEGIN;

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- 1. Autoriser chaque utilisateur à modifier son PROPRE profil
DROP POLICY IF EXISTS "Les utilisateurs peuvent modifier leur propre profil" ON public.users;
CREATE POLICY "Les utilisateurs peuvent modifier leur propre profil"
ON public.users
FOR UPDATE
USING (auth.uid()::text = id::text);

-- 2. Autoriser l'ADMINISTRATEUR à TOUT modifier
DROP POLICY IF EXISTS "L'admin peut modifier tous les profils" ON public.users;
CREATE POLICY "L'admin peut modifier tous les profils"
ON public.users
FOR UPDATE
USING (
    EXISTS (
        SELECT 1 FROM public.users AS u 
        WHERE u.id::text = auth.uid()::text AND u.role = 'admin'
    )
);

COMMIT;
