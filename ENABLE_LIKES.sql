-- SCRIPT POUR LE COMPTEUR DE LIKES (VERSION AUTOMATIQUE VIA TRIGGER)
-- À exécuter dans l'éditeur SQL de Supabase

-- 1. Ajoute la colonne likes si elle n'existe pas
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='products' AND column_name='likes') THEN
        ALTER TABLE products ADD COLUMN likes INTEGER DEFAULT 0;
    END IF;
END $$;

-- 2. Initialiser les likes à 0 (évite les bugs d'affichage) et synchroniser avec les favoris existants
UPDATE products p
SET likes = (SELECT count(*) FROM product_favorites pf WHERE pf.product_id::text = p.id::text);

-- 3. Fonction pour mettre à jour les likes automatiquement
CREATE OR REPLACE FUNCTION update_product_likes_count()
RETURNS TRIGGER AS $$
BEGIN
    IF (TG_OP = 'INSERT') THEN
        UPDATE products 
        SET likes = COALESCE(likes, 0) + 1 
        WHERE id::text = NEW.product_id::text;
    ELSIF (TG_OP = 'DELETE') THEN
        UPDATE products 
        SET likes = GREATEST(0, COALESCE(likes, 0) - 1) 
        WHERE id::text = OLD.product_id::text;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Création du Trigger (Suppression si existe pour éviter les erreurs)
DROP TRIGGER IF EXISTS tr_product_favorites_likes_count ON product_favorites;
CREATE TRIGGER tr_product_favorites_likes_count
AFTER INSERT OR DELETE ON product_favorites
FOR EACH ROW EXECUTE FUNCTION update_product_likes_count();

-- 5. Permissions
GRANT ALL ON product_favorites TO authenticated;
GRANT ALL ON product_favorites TO anon;
GRANT ALL ON product_favorites TO service_role;
