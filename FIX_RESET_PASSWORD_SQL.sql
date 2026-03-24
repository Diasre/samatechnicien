-- Fonction pour réinitialiser le mot de passe via le téléphone sans être connecté
-- A EXECUTER DANS LE SQL EDITOR DE SUPABASE
CREATE OR REPLACE FUNCTION reset_password_by_phone(p_phone TEXT, p_new_password TEXT)
RETURNS VOID AS $$
BEGIN
  -- Cette fonction s'exécute avec les privilèges 'security definer' (administrateur)
  UPDATE public.users 
  SET password = p_new_password 
  WHERE phone = p_phone;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Accorder le droit d'exécution à tout le monde (public)
GRANT EXECUTE ON FUNCTION reset_password_by_phone(TEXT, TEXT) TO public;
GRANT EXECUTE ON FUNCTION reset_password_by_phone(TEXT, TEXT) TO anon;
GRANT EXECUTE ON FUNCTION reset_password_by_phone(TEXT, TEXT) TO authenticated;
