-- 1. On valide TOUS les utilisateurs actuels
UPDATE public.users SET email_verified = TRUE;

-- 2. On change la valeur par défaut de la colonne
ALTER TABLE public.users ALTER COLUMN email_verified SET DEFAULT TRUE;

-- 3. On met à jour le ROBOT pour qu'il crée les nouveaux utilisateurs en "Vérifié" directement
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  IF EXISTS (SELECT 1 FROM public.users WHERE email = NEW.email) THEN
    UPDATE public.users SET id = NEW.id, email_verified = TRUE WHERE email = NEW.email;
  ELSE
    INSERT INTO public.users (id, email, fullname, role, phone, city, district, specialty, email_verified)
    VALUES (
      NEW.id,
      NEW.email,
      NEW.raw_user_meta_data->>'full_name',
      NEW.raw_user_meta_data->>'role',
      NEW.raw_user_meta_data->>'phone',
      NEW.raw_user_meta_data->>'city',
      NEW.raw_user_meta_data->>'district',
      NEW.raw_user_meta_data->>'specialty',
      TRUE -- <--- CHANGEMENT ICI : TRUE par défaut
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
