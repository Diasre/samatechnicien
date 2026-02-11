-- AJOUT DE LA GESTION DU STATUT (DISPONIBILITÉ)

BEGIN;

-- 1. Ajouter la colonne 'availability' à la table users
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS availability TEXT DEFAULT 'available'; 
-- Valeurs possibles: 'available' (Disponible), 'busy' (Occupé/En intervention), 'unavailable' (Indisponible)

-- 2. Mettre à jour les utilisateurs existants
UPDATE public.users SET availability = 'available' WHERE role = 'technician' AND availability IS NULL;

-- 3. Politique sécurité (déjà couverte par la politique de mise à jour générale, mais on vérifie)
-- Pas besoin de politique spécifique si "Users can update their own profile" est active.

COMMIT;
