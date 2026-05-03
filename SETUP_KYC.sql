-- SCRIPT DE MISE EN PLACE DU SYSTEME KYC (CONTRAT DE CONFIANCE)

BEGIN;

-- 1. Ajout des colonnes pour la table users
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS id_card_recto TEXT;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS id_card_verso TEXT;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS verification_status VARCHAR(50) DEFAULT 'none';

COMMIT;

-- 2. Creation du Bucket pour les documents KYC (A executer separement si l'interface Supabase bloque)
INSERT INTO storage.buckets (id, name, public) 
VALUES ('kyc_documents', 'kyc_documents', true)
ON CONFLICT (id) DO NOTHING;

-- 3. Ajout des policies pour le bucket (Autoriser tout le monde authentifie a lire et envoyer pour le moment)
CREATE POLICY "Allow authenticated view kyc" ON storage.objects FOR SELECT TO authenticated USING (bucket_id = 'kyc_documents');
CREATE POLICY "Allow authenticated insert kyc" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'kyc_documents');
CREATE POLICY "Allow authenticated update kyc" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'kyc_documents');

