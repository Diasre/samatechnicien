-- SCRIPT DE RÉPARATION CRITIQUE (TYPE ID)
-- Votre table 'users' est configurée avec des ID numériques (1, 2, 3...) mais Supabase utilise des UUID (a1b2-c3d4...).
-- Ce conflit de type BLOQUE l'inscription. Ce script va convertir la colonne ID en TEXTE pour tout accepter.

BEGIN;

-- 1. Supprimer les contraintes étrangères temporairement (si elles existent et sont nommées conventionnellement)
-- (C'est risqué de deviner les noms, donc on va tenter la conversion directe. Si ça échoue, il faudra supprimer les tables et recommencer)

-- 2. Convertir la colonne ID en TEXT
-- Cela permet de stocker à la fois les anciens ID (ex: "1") et les nouveaux UUID.
ALTER TABLE public.users ALTER COLUMN id TYPE text;

-- 3. Assurer que la colonne image existe
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS image TEXT;

-- 4. Recréer la fonction d'inscription pour bien gérer le texte
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (
    id, email, fullname, role, phone, city, district, specialty, image, email_verified
  )
  VALUES (
    NEW.id::text, -- Conversion explicite en texte
    NEW.email,
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'role',
    NEW.raw_user_meta_data->>'phone',
    NEW.raw_user_meta_data->>'city',
    NEW.raw_user_meta_data->>'district',
    NEW.raw_user_meta_data->>'specialty',
    NEW.raw_user_meta_data->>'image',
    FALSE
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Mettre à jour les politiques de sécurité (RLS) pour accepter le texte
DROP POLICY IF EXISTS "Users can update their own profile" ON public.users;
CREATE POLICY "Users can update their own profile"
ON public.users
FOR UPDATE
USING (auth.uid()::text = id::text)
WITH CHECK (auth.uid()::text = id::text);

COMMIT;
