-- SCRIPT POUR LES VUES DE PROFIL
-- Ajoute la colonne profile_views à la table users

DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='users' AND column_name='profile_views') THEN
        ALTER TABLE users ADD COLUMN profile_views INTEGER DEFAULT 0;
    END IF;
END $$;

UPDATE users SET profile_views = 0 WHERE profile_views IS NULL;

-- Fonction RPC pour incrémenter les vues de profil
CREATE OR REPLACE FUNCTION increment_profile_views(user_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE users
  SET profile_views = COALESCE(profile_views, 0) + 1
  WHERE id = user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
