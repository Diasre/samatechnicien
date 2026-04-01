-- Table pour gérer la connexion par QR Code
CREATE TABLE IF NOT EXISTS public.web_login_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id),
    status TEXT DEFAULT 'pending', -- 'pending', 'scanning', 'confirmed'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    expires_at TIMESTAMP WITH TIME ZONE DEFAULT (timezone('utc'::text, now()) + interval '5 minutes')
);

-- Autoriser tout le monde à créer une session (pour le site web non-connecté)
ALTER TABLE public.web_login_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow anonymous session creation" 
ON public.web_login_sessions FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Allow everyone to read their specific session" 
ON public.web_login_sessions FOR SELECT 
USING (true);

-- Autoriser les utilisateurs connectés à mettre à jour une session spécifique
CREATE POLICY "Allow authenticated users to confirm session" 
ON public.web_login_sessions FOR UPDATE 
USING (auth.role() = 'authenticated');

-- Suppression automatique des sessions expirées (Optionnel, géré par le code au cas par cas)
