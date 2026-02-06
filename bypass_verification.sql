-- 1. DEBLOQUER TOUS LES COMPTES ACTUELS (Force Supabase à dire OUI)
UPDATE auth.users 
SET email_confirmed_at = NOW() 
WHERE email_confirmed_at IS NULL;

-- 2. SUPPRIMER LES ANCIENS ROBOTS QUI POURRAIENT GÊNER
DROP TRIGGER IF EXISTS auto_confirm_email ON auth.users;

-- 3. CRÉER LE ROBOT SUPRÊME : Il valide l'email DÈS L'INSCRIPTION
CREATE OR REPLACE FUNCTION public.force_confirm_email()
RETURNS TRIGGER AS $$
BEGIN
  -- On force la date de confirmation à "Maintenant"
  UPDATE auth.users SET email_confirmed_at = NOW() WHERE id = NEW.id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. ACTIVER LE ROBOT
CREATE TRIGGER auto_confirm_email
AFTER INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION public.force_confirm_email();
