-- Trigger pour synchroniser automatiquement la validation d'email
-- de Supabase Auth vers la table publique 'users'.

-- 1. Création de la fonction de synchronisation
-- Cette fonction s'exécute avec les droits "SECURITY DEFINER" pour pouvoir modifier la table users
CREATE OR REPLACE FUNCTION public.handle_email_verification()
RETURNS TRIGGER AS $$
BEGIN
  -- Si l'email vient d'être confirmé (la date de confirmation change de NULL à une date)
  IF NEW.email_confirmed_at IS NOT NULL AND (OLD.email_confirmed_at IS NULL) THEN
    UPDATE public.users
    SET email_verified = TRUE
    WHERE id = NEW.id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Création du déclencheur (Trigger) sur la table auth.users
-- Ce trigger écoute chaque mise à jour sur la table des utilisateurs sécurisés
DROP TRIGGER IF EXISTS on_email_verified ON auth.users;

CREATE TRIGGER on_email_verified
AFTER UPDATE ON auth.users
FOR EACH ROW
EXECUTE FUNCTION public.handle_email_verification();
