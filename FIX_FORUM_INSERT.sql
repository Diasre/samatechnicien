-- Ce script met à jour les règles de sécurité (RLS) de votre base de données 
-- pour permettre à TOUS les utilisateurs (techniciens ET clients) 
-- de publier des discussions et d'envoyer des messages.

-- 1. Autoriser l'insertion de messages dans 'discussion_messages'
ALTER TABLE IF EXISTS discussion_messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow Insert Messages" ON discussion_messages;
CREATE POLICY "Allow Insert Messages" 
ON discussion_messages FOR INSERT 
WITH CHECK (true);

-- 2. Autoriser la création de nouvelles discussions dans 'discussions'
ALTER TABLE IF EXISTS discussions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow Insert Discussions" ON discussions;
CREATE POLICY "Allow Insert Discussions" 
ON discussions FOR INSERT 
WITH CHECK (true);

-- Optionnel : S'assurer que tout le monde peut lire les messages (au cas où)
DROP POLICY IF EXISTS "Allow Select Messages" ON discussion_messages;
CREATE POLICY "Allow Select Messages" ON discussion_messages FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow Select Discussions" ON discussions;
CREATE POLICY "Allow Select Discussions" ON discussions FOR SELECT USING (true);
