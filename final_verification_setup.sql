-- 1. On s'assure que par défaut, c'est NON validé (FALSE)
ALTER TABLE users ALTER COLUMN email_verified SET DEFAULT FALSE;

-- 2. Création du Robot (Fonction) qui va cocher la case
CREATE OR REPLACE FUNCTION public.handle_email_verification()
RETURNS TRIGGER AS $$
BEGIN
  -- Si Supabase Auth confirme l'email (date change de NULL à quelque chose)
  IF NEW.email_confirmed_at IS NOT NULL THEN
    -- On met à jour la table publique 'users'
    UPDATE public.users
    SET email_verified = TRUE
    WHERE id = NEW.id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. On active le Robot (Trigger) sur la table des authentifications
DROP TRIGGER IF EXISTS on_email_verified ON auth.users;

CREATE TRIGGER on_email_verified
AFTER UPDATE ON auth.users
FOR EACH ROW
EXECUTE FUNCTION public.handle_email_verification();
