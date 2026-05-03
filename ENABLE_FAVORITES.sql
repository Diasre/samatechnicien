-- 1. Création de la table des favoris (V2 - Correction des types pour compatibilité)
-- On utilise TEXT pour user_id et product_id car ta base utilise des types TEXT pour les IDs
CREATE TABLE IF NOT EXISTS product_favorites (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
    product_id TEXT REFERENCES products(id) ON DELETE CASCADE,
    UNIQUE(user_id, product_id)
);

-- 2. Activation de RLS (Row Level Security)
ALTER TABLE product_favorites ENABLE ROW LEVEL SECURITY;

-- 3. Politiques de sécurité (Policies)
-- Tout le monde peut voir ses propres favoris (Conversion auth.uid() en text pour comparaison)
CREATE POLICY "Users can see their own favorites"
ON product_favorites FOR SELECT
USING (auth.uid()::text = user_id);

-- Les utilisateurs connectés peuvent ajouter un favori
CREATE POLICY "Users can insert their own favorites"
ON product_favorites FOR INSERT
WITH CHECK (auth.uid()::text = user_id);

-- Les utilisateurs peuvent supprimer leurs propres favoris
CREATE POLICY "Users can delete their own favorites"
ON product_favorites FOR DELETE
USING (auth.uid()::text = user_id);

-- 4. Accorder les permissions
GRANT ALL ON product_favorites TO authenticated;
GRANT ALL ON product_favorites TO anon;
GRANT ALL ON product_favorites TO service_role;
