-- SCRIPT D'URGENCE POUR RÉPARER L'INSCRIPTION
-- Exécutez ce script dans l'éditeur SQL de Supabase pour corriger l'erreur "Database error saving new user".

-- 1. On s'assure à 100% que la colonne image existe
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS image TEXT;

-- 2. On recrée la fonction de déclencheur en s'assurant qu'elle est correcte
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, fullname, role, phone, city, district, specialty, image, email_verified)
  VALUES (
    NEW.id,
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

-- 3. On vérifie et active le trigger (au cas où il aurait sauté)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION public.handle_new_user();

-- 4. On s'assure que les permissions sont bonnes pour l'utilisateur anonyme/authentifié (juste au cas où)
GRANT ALL ON public.users TO postgres;
GRANT ALL ON public.users TO service_role;
-- Note: Les utilisateurs normaux n'insèrent pas directement dans public.users, c'est le trigger qui le fait.
