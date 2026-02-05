-- Robot Version 2 : Plus intelligent (Gère les doublons)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Vérifier si l'email existe déjà dans la table publique
  IF EXISTS (SELECT 1 FROM public.users WHERE email = NEW.email) THEN
    -- Si OUI, on met à jour l'ID pour lier le compte Auth au profil existant
    UPDATE public.users 
    SET id = NEW.id 
    WHERE email = NEW.email;
  ELSE
    -- Si NON, on crée le nouveau profil proprement
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
      FALSE
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- On réinitialise le déclencheur pour être sûr
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION public.handle_new_user();
