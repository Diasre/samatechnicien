-- SCRIPT DE FIXATION DES POLITIQUES RLS POUR LA TABLE QUOTES
-- Résout l'erreur: "new row violates row-level security policy for table 'quotes'"

BEGIN;

-- 1. On s'assure que la table existe avec les bonnes colonnes
CREATE TABLE IF NOT EXISTS public.quotes (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id text,
    title text,
    description text,
    message text,
    specialty text,
    billing_type text,
    status text DEFAULT 'en_attente',
    planned_date date,
    photo_url text,
    address text,
    city text,
    district text,
    created_at timestamp with time zone DEFAULT now()
);

-- 2. On active la sécurité RLS
ALTER TABLE public.quotes ENABLE ROW LEVEL SECURITY;

-- 3. Suppression des anciennes politiques si elles existent pour éviter les doublons
DROP POLICY IF EXISTS "Clients can insert their own quotes" ON public.quotes;
DROP POLICY IF EXISTS "Users can see their own quotes" ON public.quotes;
DROP POLICY IF EXISTS "Technicians can see quotes for their specialty" ON public.quotes;
DROP POLICY IF EXISTS "Clients can update their own quotes" ON public.quotes;
DROP POLICY IF EXISTS "Clients can delete their own quotes" ON public.quotes;
DROP POLICY IF EXISTS "Enable all access for authenticated users" ON public.quotes;

-- 4. Création des politiques ROBUSTES

-- INSERT : Un utilisateur connecté peut envoyer un devis en son nom
CREATE POLICY "Clients can insert their own quotes"
ON public.quotes FOR INSERT
TO authenticated
WITH CHECK (auth.uid()::text = client_id);

-- SELECT : 
-- a) Le client voit ses propres demandes
-- b) Le technicien voit les demandes qui correspondent à sa spécialité
CREATE POLICY "Users can see quotes"
ON public.quotes FOR SELECT
TO authenticated
USING (
    auth.uid()::text = client_id 
    OR 
    EXISTS (
        SELECT 1 FROM public.users 
        WHERE id = auth.uid()::text 
        AND role = 'technician' 
        AND specialty ILIKE '%' || quotes.specialty || '%'
    )
);

-- UPDATE : Le client peut modifier sa demande (ex: annuler)
CREATE POLICY "Clients can update their own quotes"
ON public.quotes FOR UPDATE
TO authenticated
USING (auth.uid()::text = client_id)
WITH CHECK (auth.uid()::text = client_id);

-- DELETE : Le client peut supprimer sa demande
CREATE POLICY "Clients can delete their own quotes"
ON public.quotes FOR DELETE
TO authenticated
USING (auth.uid()::text = client_id);

-- 6. Table des offres (devis / offers)
CREATE TABLE IF NOT EXISTS public.devis (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    demande_id uuid REFERENCES public.quotes(id) ON DELETE CASCADE,
    technicien_id text REFERENCES public.users(id) ON DELETE CASCADE,
    amount numeric,
    note text,
    status text DEFAULT 'en_attente',
    created_at timestamp with time zone DEFAULT now()
);

-- Activation RLS sur devis
ALTER TABLE public.devis ENABLE ROW LEVEL SECURITY;

-- Suppression anciennes politiques devis
DROP POLICY IF EXISTS "Technicians can insert their own offers" ON public.devis;
DROP POLICY IF EXISTS "Users can see relevant offers" ON public.devis;
DROP POLICY IF EXISTS "Technicians can delete their own offers" ON public.devis;

-- INSERT : Un technicien connecté peut envoyer une offre
CREATE POLICY "Technicians can insert their own offers"
ON public.devis FOR INSERT
TO authenticated
WITH CHECK (auth.uid()::text = technicien_id);

-- SELECT : 
-- a) Le client voit les offres pour ses demandes
-- b) Le technicien voit ses propres offres
CREATE POLICY "Users can see offers"
ON public.devis FOR SELECT
TO authenticated
USING (
    auth.uid()::text = technicien_id
    OR
    EXISTS (
        SELECT 1 FROM public.quotes
        WHERE id = devis.demande_id
        AND client_id = auth.uid()::text
    )
);

-- DELETE : Le technicien peut retirer son offre
CREATE POLICY "Technicians can delete their own offers"
ON public.devis FOR DELETE
TO authenticated
USING (auth.uid()::text = technicien_id);

-- 7. Permissions de base
GRANT ALL ON public.devis TO authenticated;
GRANT ALL ON public.devis TO service_role;

COMMIT;
