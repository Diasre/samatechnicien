-- FIX: FONCTION RPC POUR MISE À JOUR PROFIL (Contourne RLS)
-- Cette solution remplace les mises à jour directes qui échouent à cause des permissions.

BEGIN;

CREATE OR REPLACE FUNCTION public.update_user_profile(
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
SECURITY DEFINER -- IMPORTANT: S'exécute avec les droits administrateur
AS $$
BEGIN
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
    WHERE id = auth.uid()::text; -- C'est ici que la sécurité est assurée
END;
$$;

-- ACCORDER LES PERMISSIONS D'EXÉCUTION
GRANT EXECUTE ON FUNCTION public.update_user_profile TO authenticated;
GRANT EXECUTE ON FUNCTION public.update_user_profile TO anon;

COMMIT;
