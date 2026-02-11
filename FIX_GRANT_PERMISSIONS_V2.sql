-- FIX: ACCORDER LES DROITS D'ÉCRITURE (UPDATE) AVEC CASTING UUID CORRECT
-- Cette version corrige l'erreur "operator does not exist: uuid = text"

BEGIN;

-- 1. Accorder les droits de table (Indispensable)
GRANT UPDATE ON TABLE public.users TO authenticated;
GRANT SELECT ON TABLE public.users TO authenticated;

-- 2. Réactiver RLS
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- 3. Politique de mise à jour AVEC CAST EXPLICITE
DROP POLICY IF EXISTS "Users can update their own profile" ON public.users;

CREATE POLICY "Users can update their own profile" 
ON public.users 
FOR UPDATE 
USING (auth.uid()::text = id::text)       -- ICI: On force la comparaison en TEXT
WITH CHECK (auth.uid()::text = id::text); -- Idem pour la vérification

COMMIT;
