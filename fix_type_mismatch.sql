-- 1. CORRECTION DU ROBOT DE VALIDATION (Utilise l'Email au lieu de l'ID)
CREATE OR REPLACE FUNCTION public.handle_email_verification()
RETURNS TRIGGER AS $$
BEGIN
  -- On utilise l'email pour trouver l'utilisateur, ça évite l'erreur de type ID
  IF NEW.email_confirmed_at IS NOT NULL THEN
    UPDATE public.users
    SET email_verified = TRUE
    WHERE email = NEW.email; -- <--- CORRECTION ICI
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. CORRECTION DU ROBOT D'INSCRIPTION (Ne force pas l'ID s'il n'est pas compatible)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- On vérifie par EMAIL
  IF EXISTS (SELECT 1 FROM public.users WHERE email = NEW.email) THEN
    -- On met à jour sans toucher à l'ID (on laisse faire la base)
    UPDATE public.users SET email_verified = TRUE WHERE email = NEW.email;
  ELSE
    -- On insère SANS spécifier l'ID (on laisse l'auto-incrément faire)
    INSERT INTO public.users (email, fullname, role, phone, city, district, specialty, email_verified)
    VALUES (
      NEW.email,
      NEW.raw_user_meta_data->>'full_name',
      NEW.raw_user_meta_data->>'role',
      NEW.raw_user_meta_data->>'phone',
      NEW.raw_user_meta_data->>'city',
      NEW.raw_user_meta_data->>'district',
      NEW.raw_user_meta_data->>'specialty',
      TRUE -- On valide direct
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
