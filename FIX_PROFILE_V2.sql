-- FIX ULTIME V2 : FONCTION DE MISE À JOUR + PERMISSIONS
-- Cette version crée une nouvelle fonction V2 pour éviter les conflits et assure les permissions.

BEGIN;

-- 1. Sécurité : Accorder tous les droits sur la table users aux connectés
GRANT ALL ON TABLE public.users TO authenticated;
GRANT ALL ON TABLE public.users TO service_role;

-- 2. S'assurer que les colonnes existent (en minuscule standard)
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS fullname TEXT;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS phone TEXT;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS city TEXT;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS district TEXT;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS specialty TEXT;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS image TEXT;

-- 3. Créer la fonction RPC V2 (Plus robuste)
CREATE OR REPLACE FUNCTION public.update_profile_v2(
    p_fullname text DEFAULT NULL,
    p_phone text DEFAULT NULL,
    p_city text DEFAULT NULL,
    p_district text DEFAULT NULL,
    p_specialty text DEFAULT NULL,
    p_description text DEFAULT NULL,
    p_image text DEFAULT NULL,
    p_email text DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER -- S'exécute avec les droits ADMIN
AS $$
BEGIN
    -- Mise à jour directe
    UPDATE public.users
    SET
        fullname = COALESCE(p_fullname, fullname),
        phone = COALESCE(p_phone, phone),
        city = COALESCE(p_city, city),
        district = COALESCE(p_district, district),
        specialty = COALESCE(p_specialty, specialty),
        description = COALESCE(p_description, description),
        image = COALESCE(p_image, image),
        email = COALESCE(p_email, email)
    WHERE id = auth.uid()::text; -- Sécurité via auth.uid()
END;
$$;

-- 4. Accorder le droit d'exécuter cette fonction
GRANT EXECUTE ON FUNCTION public.update_profile_v2 TO authenticated;
GRANT EXECUTE ON FUNCTION public.update_profile_v2 TO anon;
GRANT EXECUTE ON FUNCTION public.update_profile_v2 TO service_role;

COMMIT;
