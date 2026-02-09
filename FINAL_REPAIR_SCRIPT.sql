-- SCRIPT DE RÉPARATION ULTIME (A exécuter dans Supabase SQL Editor)
-- Ce script corrige l'erreur "Database error saving new user" en s'assurant que la table users est compatible.

-- 1. Ajouter la colonne image (si elle manque)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='image') THEN
        ALTER TABLE public.users ADD COLUMN image TEXT;
    END IF;
END
$$;

-- 2. Recréer la fonction d'inscription (Version Robuste)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (
    id,
    email,
    fullname,
    role,
    phone,
    city,
    district,
    specialty,
    image,
    email_verified
  )
  VALUES (
    NEW.id, -- Doit correspondre au type de ID dans public.users (UUID)
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
EXCEPTION
  WHEN OTHERS THEN
    -- Capture l'erreur réelle pour le debug
    RAISE EXCEPTION 'Erreur creation user: %', SQLERRM;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Réactiver le déclencheur
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION public.handle_new_user();
