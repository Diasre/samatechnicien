-- 1. Nettoyage complet : On supprime la table pour éviter les conflits de droits/colonnes
DROP TABLE IF EXISTS messages;

-- 2. Création de la table des messages (réponses)
CREATE TABLE messages (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    "discussionId" UUID REFERENCES discussions(id) ON DELETE CASCADE,
    "technicianId" BIGINT REFERENCES users(id) ON DELETE CASCADE,
    content TEXT
);

-- 3. Activation de la sécurité (RLS)
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- 4. Politiques de sécurité
CREATE POLICY "Enable read access for all users" ON messages
    FOR SELECT USING (true);

CREATE POLICY "Enable insert for all users" ON messages
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Enable delete for all users" ON messages
    FOR DELETE USING (true);
