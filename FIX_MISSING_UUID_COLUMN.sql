
-- 1. On ajoute la colonne 'uuid' qui manque
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS uuid UUID REFERENCES auth.users(id);

-- 2. CRUCIAL : On remplit cette colonne pour tous les utilisateurs existants
-- On fait correspondre l'email de la table 'users' avec l'email de sécurité 'auth.users'
UPDATE public.users
SET uuid = auth.users.id
FROM auth.users
WHERE public.users.email = auth.users.email;

-- 3. On s'assure que tout le monde peut lire cet UUID (nécessaire pour le chat)
GRANT SELECT ON public.users TO authenticated;
GRANT SELECT ON public.users TO anon;
