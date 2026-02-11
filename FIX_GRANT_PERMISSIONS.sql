-- FIX: ACCORDER LES DROITS D'ÉCRITURE (UPDATE) AU RÔLE AUTHENTIFIÉ
-- Souvent, RLS est configuré, mais le "droit d'écrire" général sur la table manque.

BEGIN;

-- 1. S'assurer que le rôle 'authenticated' (utilisateurs connectés) A LE DROIT de faire des UPDATE sur la table users.
GRANT UPDATE ON TABLE public.users TO authenticated;
GRANT SELECT ON TABLE public.users TO authenticated;

-- 2. (Opt) Accorder aussi pour 'anon' si jamais (déconseillé mais utile pour debug)
-- GRANT UPDATE ON TABLE public.users TO anon;

-- 3. Rappel de la politique RLS (au cas où elle aurait sauté)
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can update their own profile" ON public.users;
CREATE POLICY "Users can update their own profile" 
ON public.users 
FOR UPDATE 
USING (auth.uid() = id); -- Version simple (Supabase gère souvent le cast auto, sinon utiliser ::uuid ou ::text)

COMMIT;
