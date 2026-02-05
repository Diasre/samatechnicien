-- 1. Nettoyage
DROP TABLE IF EXISTS messages;
DROP TABLE IF EXISTS discussions;

-- 2. Création de la table 'discussions' avec support du CAMELCASE ("technicianId")
-- pour être compatible avec votre site Vercel actuel sans redéploiement.
CREATE TABLE discussions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    "technicianId" BIGINT REFERENCES users(id) ON DELETE CASCADE,
    title TEXT,
    content TEXT
);

-- 3. Création de la table 'messages' avec support du CAMELCASE
CREATE TABLE messages (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    "discussionId" UUID REFERENCES discussions(id) ON DELETE CASCADE,
    "technicianId" BIGINT REFERENCES users(id) ON DELETE CASCADE,
    content TEXT
);

-- 4. Sécurité (RLS)
ALTER TABLE discussions ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- 5. Politiques
CREATE POLICY "Public All Discussions" ON discussions FOR ALL USING (true);
CREATE POLICY "Public All Messages" ON messages FOR ALL USING (true);
