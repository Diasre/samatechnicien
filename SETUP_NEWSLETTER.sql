-- Création de la table pour stocker les abonnés à la newsletter
CREATE TABLE IF NOT EXISTS newsletter_subscribers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email TEXT UNIQUE NOT NULL,
    subscribed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Activation de la sécurité RLS (Row Level Security)
ALTER TABLE newsletter_subscribers ENABLE ROW LEVEL SECURITY;

-- Autoriser tout le monde (utilisateurs anonymes) à insérer leur e-mail
CREATE POLICY "Permettre l'insertion publique" 
ON newsletter_subscribers
FOR INSERT 
WITH CHECK (true);

-- (Optionnel) Si vous souhaitez que les administrateurs puissent voir la liste via le dashboard Supabase
-- La lecture est par défaut interdite côté client avec RLS activé sans politique de lecture.
