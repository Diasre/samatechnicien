-- SCRIPT D'INSPECTION ET RÉPARATION ULTIME (V4)
-- Ce script répare TOTALEMENT les noms de colonnes et la fonction de mise à jour

BEGIN;

-- 1. Unifier les noms de colonnes (fullname est la référence officielle)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='full_name') THEN
        ALTER TABLE public.users RENAME COLUMN full_name TO fullname;
    END IF;
END $$;

-- 2. Créer la fonction de mise à jour INDÉSTRUCTIBLE (V4)
CREATE OR REPLACE FUNCTION public.update_profile_v4(
  p_id TEXT,
  p_fullname TEXT DEFAULT NULL,
  p_phone TEXT DEFAULT NULL,
  p_city TEXT DEFAULT NULL,
  p_district TEXT DEFAULT NULL,
  p_skills TEXT DEFAULT NULL,
  p_specialty TEXT DEFAULT NULL,
  p_description TEXT DEFAULT NULL,
  p_image TEXT DEFAULT NULL,
  p_email TEXT DEFAULT NULL
)
RETURNS SETOF public.users AS $$
DECLARE
    v_user_id TEXT;
BEGIN
    -- Trouver l'ID soit par l'ID fourni, soit par le téléphone (en dernier recours)
    SELECT id INTO v_user_id FROM public.users 
    WHERE id::text = p_id::text OR (phone = p_phone AND p_phone IS NOT NULL)
    LIMIT 1;

    IF v_user_id IS NOT NULL THEN
        UPDATE public.users
        SET
            fullname = COALESCE(p_fullname, fullname),
            phone = COALESCE(p_phone, phone),
            city = COALESCE(p_city, city),
            district = COALESCE(p_district, district),
            skills = COALESCE(p_skills, skills),
            specialty = COALESCE(p_specialty, specialty),
            description = COALESCE(p_description, description),
            image = COALESCE(p_image, image),
            email = COALESCE(p_email, email)
        WHERE id::text = v_user_id
        RETURNING *;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMIT;
