-- SCRIPT DE RÉPARATION FINAL POUR LES COMPTEURS (PRODUITS ET PROFIL)
-- À exécuter dans l'éditeur SQL de Supabase

-- 1. Version flexible pour les vues de PRODUITS (Supporte TEXT ou UUID ou INT)
CREATE OR REPLACE FUNCTION increment_product_views(product_id TEXT)
RETURNS void AS $$
BEGIN
  -- On essaie d'abord en le traitant comme un entier (si c'est un SERIAL)
  -- Sinon on le traite comme du texte/UUID
  UPDATE products
  SET views = COALESCE(views, 0) + 1
  WHERE id::text = product_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Version pour les vues de PROFIL (Le user.id est du TEXT dans votre base)
CREATE OR REPLACE FUNCTION increment_profile_views(user_id TEXT)
RETURNS void AS $$
BEGIN
  UPDATE users
  SET profile_views = COALESCE(profile_views, 0) + 1
  WHERE id::text = user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. S'assurer que les colonnes existent bien avec les bons noms
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='products' AND column_name='views') THEN
        ALTER TABLE products ADD COLUMN views INTEGER DEFAULT 0;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='profile_views') THEN
        ALTER TABLE users ADD COLUMN profile_views INTEGER DEFAULT 0;
    END IF;
END $$;

-- Mettre à jour les NULL en 0 pour éviter les bugs d'affichage
UPDATE products SET views = 0 WHERE views IS NULL;
UPDATE users SET profile_views = 0 WHERE profile_views IS NULL;
