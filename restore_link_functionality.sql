-- 1. ON ARRÊTE DE VALIDER AUTOMATIQUEMENT DANS AUTH
-- (Pour que le lien envoyé par email reste valide et fonctionne)
DROP TRIGGER IF EXISTS auto_confirm_email ON auth.users;
DROP FUNCTION IF EXISTS public.force_confirm_email();

-- 2. ON GARDE LE ROBOT QUI CRÉE LE PROFIL PUBLIC
-- (Mais on le laisse créer le profil proprement)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- On vérifie si le profil existe déjà par email
  IF EXISTS (SELECT 1 FROM public.users WHERE email = NEW.email) THEN
     -- S'il existe, on met à jour le statut, mais on laisse Supabase Auth gérer le "Confirmed At"
     UPDATE public.users SET email_verified = TRUE WHERE email = NEW.email;
  ELSE
    -- S'il n'existe pas, on le crée. 
    -- On met email_verified à TRUE pour ne pas bloquer le front-end,
    -- mais c'est le clic sur le lien qui fera la vraie connexion Auth.
    INSERT INTO public.users (email, fullname, role, phone, city, district, specialty, email_verified)
    VALUES (
      NEW.email,
      NEW.raw_user_meta_data->>'full_name',
      NEW.raw_user_meta_data->>'role',
      NEW.raw_user_meta_data->>'phone',
      NEW.raw_user_meta_data->>'city',
      NEW.raw_user_meta_data->>'district',
      NEW.raw_user_meta_data->>'specialty',
      TRUE
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. NETTOYAGE DU COMPTE TEST BLOQUÉ (Pour réessayer proprement)
DELETE FROM public.users WHERE email = 'babelprive@gmail.com';
DELETE FROM auth.users WHERE email = 'babelprive@gmail.com';
