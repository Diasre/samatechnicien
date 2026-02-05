
-- 1. Table des UTILISATEURS (Clients et Techniciens)
CREATE TABLE IF NOT EXISTS users (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    fullname TEXT NOT NULL,         -- Nom complet (Attention: minuscule pour Supabase)
    email TEXT UNIQUE NOT NULL,     -- Email unique
    password TEXT NOT NULL,         -- Mot de passe ou PIN
    role TEXT DEFAULT 'client',     -- 'client', 'technician', 'admin'
    specialty TEXT,                 -- Pour les techniciens
    city TEXT,
    district TEXT,
    phone TEXT,
    image TEXT,                     -- URL de la photo de profil
    description TEXT,               -- Biographie du technicien
    commentsenabled INTEGER DEFAULT 1, -- 1 = oui, 0 = non
    isblocked INTEGER DEFAULT 0     -- 1 = bloqué, 0 = actif
);

-- 2. Table des PRODUITS (Marketplace)
CREATE TABLE IF NOT EXISTS products (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    technicianId UUID REFERENCES users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    price NUMERIC NOT NULL,
    category TEXT,
    condition TEXT,
    description TEXT,
    status TEXT DEFAULT 'available', -- 'available' ou 'sold'
    image TEXT,                      -- Image principale
    image2 TEXT,
    image3 TEXT,
    image1_label TEXT,
    image2_label TEXT,
    image3_label TEXT
);

-- 3. Table des AVIS (Reviews)
CREATE TABLE IF NOT EXISTS reviews (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    technicianId UUID REFERENCES users(id) ON DELETE CASCADE,
    clientId UUID REFERENCES users(id) ON DELETE SET NULL,
    rating INTEGER CHECK (rating >= 1 AND rating <= 5),
    comment TEXT
);

-- 4. Table du FORUM (Discussions)
CREATE TABLE IF NOT EXISTS discussions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    technicianId UUID REFERENCES users(id) ON DELETE CASCADE,
    title TEXT,
    content TEXT
);

-- 5. Table des SIGNALEMENTS (Feedback)
CREATE TABLE IF NOT EXISTS platform_feedback (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    userId UUID REFERENCES users(id) ON DELETE SET NULL,
    userName TEXT,
    content TEXT
);

-- Activer le stockage (Storage) pour les images (si ce n'est pas déjà fait via l'interface)
-- Note: La création des "Buckets" de stockage se fait généralement via l'interface Supabase (Storage > New Bucket 'products').
