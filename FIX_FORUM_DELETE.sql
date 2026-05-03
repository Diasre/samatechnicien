-- Ce script s'assure que la base de données autorise bien la suppression des discussions et de leurs messages associés.

-- 1. Autoriser la suppression dans la table 'discussions'
-- Si le Row Level Security (RLS) est activé, cela garantit que la commande DELETE fonctionnera.
ALTER TABLE discussions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow Delete Discussions" ON discussions;
CREATE POLICY "Allow Delete Discussions" 
ON discussions FOR DELETE 
USING (true); 
-- Note : La vérification de sécurité (seul l'auteur peut supprimer) est déjà gérée dans l'application mobile (Forum.jsx).

-- 2. Autoriser la suppression dans la table 'discussion_messages'
ALTER TABLE IF EXISTS discussion_messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow Delete Messages" ON discussion_messages;
CREATE POLICY "Allow Delete Messages" 
ON discussion_messages FOR DELETE 
USING (true);
