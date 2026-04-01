-- SCRIPT DE RÉPARATION AVANCÉ (V3)
-- Cette fonction gère le cast TEXT/UUID et les noms de colonnes incohérents (fullname vs full_name)

CREATE OR REPLACE FUNCTION public.update_profile_v3(
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
RETURNS void AS $$
BEGIN
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
  WHERE id::text = p_id::text;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
