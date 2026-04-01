-- SCRIPT DE RESTAURATION COMPLÈTE DE LA STRUCTURE (RESCUE)
-- ⚠️ Ce script recrée les tables essentielles pour que l'appli refonctionne.
BEGIN;

-- 1. Table des UTILISATEURS (users)
CREATE TABLE IF NOT EXISTS public.users (
    id text PRIMARY KEY, -- Accepte UUID et ID numériques
    fullname text,
    email text,
    phone text UNIQUE,
    password text, -- Pour l'auth simplifiée
    role text DEFAULT 'client', -- 'admin', 'technician', 'client'
    city text,
    district text,
    specialty text,
    image text,
    description text,
    availability text DEFAULT 'available',
    rating numeric DEFAULT 0,
    isblocked boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT now()
);

-- 2. Table des DEMANDES DE DEVIS (quotes)
CREATE TABLE IF NOT EXISTS public.quotes (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id text REFERENCES public.users(id),
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

-- 3. Table des OFFRES DE DEVIS (devis / offers)
CREATE TABLE IF NOT EXISTS public.devis (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    demande_id uuid REFERENCES public.quotes(id) ON DELETE CASCADE,
    technicien_id text REFERENCES public.users(id) ON DELETE CASCADE,
    amount numeric,
    note text,
    status text DEFAULT 'en_attente',
    created_at timestamp with time zone DEFAULT now()
);

-- 4. Table des MESSAGES (direct_messages)
CREATE TABLE IF NOT EXISTS public.direct_messages (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    sender_id text,
    receiver_id text,
    content text,
    created_at timestamp with time zone DEFAULT now()
);

-- 5. INSERTION DE DONNÉES DE TEST (REPLANTATION)
-- Modifiez les numéros de téléphone pour vos tests
INSERT INTO public.users (id, fullname, phone, password, role, city, specialty)
VALUES 
('admin-01', 'Administrateur', '770000000', '1234', 'admin', 'Dakar', 'Direction'),
('tech-01', 'Expert Diallo', '771234567', '4321', 'technician', 'Dakar', 'Plombier')
ON CONFLICT (phone) DO NOTHING;

COMMIT;
