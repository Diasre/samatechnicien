-- 1. Ajouter la colonne image à la table users si elle n'existe pas
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS image TEXT;

-- 2. Mettre à jour la fonction handle_new_user pour inclure l'image
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
    NEW.raw_user_meta_data->>'image',  -- Nouvelle colonne
    FALSE
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
