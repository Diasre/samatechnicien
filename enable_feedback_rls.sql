-- 1. Nettoyage
DROP TABLE IF EXISTS platform_feedback;

-- 2. Création de la table avec support explicite du CAMELCASE ("userId", "userName")
-- Cela permet au code existant sur Vercel (qui envoie userId) de fonctionner sans redéploiement.
CREATE TABLE platform_feedback (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    "userId" BIGINT REFERENCES users(id) ON DELETE SET NULL, 
    "userName" TEXT,
    content TEXT
);

-- 3. Activation de la sécurité (RLS)
ALTER TABLE platform_feedback ENABLE ROW LEVEL SECURITY;

-- 4. Création des politiques
CREATE POLICY "Enable insert for all users" ON platform_feedback
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Enable read access for all users" ON platform_feedback
    FOR SELECT USING (true);
    
CREATE POLICY "Enable delete for all users" ON platform_feedback
    FOR DELETE USING (true);
