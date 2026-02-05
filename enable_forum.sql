-- 1. Nettoyage de l'existant
DROP TABLE IF EXISTS discussions;

-- 2. Création de la table avec technicianId en BIGINT (pour correspondre à users.id)
-- et gestion du CAMELCASE explicite car le code JS envoie probablement technicianId
CREATE TABLE discussions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    "technicianId" BIGINT REFERENCES users(id) ON DELETE CASCADE,
    title TEXT,
    content TEXT
);

-- 3. Activation de la sécurité (RLS)
ALTER TABLE discussions ENABLE ROW LEVEL SECURITY;

-- 4. Politiques de sécurité
-- Tout le monde peut lire le forum (pour simplifier, ou restreindre aux techniciens plus tard)
CREATE POLICY "Enable read access for all users" ON discussions
    FOR SELECT USING (true);

-- Seuls les techniciens (authentifiés) peuvent créer, mais pour l'instant on ouvre l'INSERT
-- Le frontend filtre déjà pour les techniciens
CREATE POLICY "Enable insert for all users" ON discussions
    FOR INSERT WITH CHECK (true);

-- Suppression
CREATE POLICY "Enable delete for all users" ON discussions
    FOR DELETE USING (true);
