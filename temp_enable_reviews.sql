-- 1. Nettoyage
DROP TABLE IF EXISTS reviews;

-- 2. Création de la table 'reviews' avec support du CAMELCASE ("technicianId", "clientId")
-- pour être compatible avec le code frontend actuel.
CREATE TABLE reviews (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    "technicianId" BIGINT REFERENCES users(id) ON DELETE CASCADE,
    "clientId" BIGINT REFERENCES users(id) ON DELETE SET NULL,
    rating INTEGER CHECK (rating >= 1 AND rating <= 5),
    comment TEXT
);

-- 3. Sécurité (RLS)
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;

-- 4. Politiques
CREATE POLICY "Public Read Reviews" ON reviews FOR SELECT USING (true);
CREATE POLICY "Public Insert Reviews" ON reviews FOR INSERT WITH CHECK (true);
CREATE POLICY "Public Delete Reviews" ON reviews FOR DELETE USING (true);
