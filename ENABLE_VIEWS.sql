-- SCRIPT POUR LES VUES (VIEWS) DES PRODUITS
-- Ajoute la colonne views si elle n'existe pas

DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='products' AND column_name='views') THEN
        ALTER TABLE products ADD COLUMN views INTEGER DEFAULT 0;
    END IF;
END $$;

-- Mettre à jour les produits existants s'ils ont NULL
UPDATE products SET views = 0 WHERE views IS NULL;
