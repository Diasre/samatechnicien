-- CRÉATION D'UNE FONCTION SÉCURISÉE POUR DEVENIR TECHNICIEN
-- Cette fonction contourne les problèmes potentiels de droits (RLS) pour cette action spécifique.

BEGIN;

CREATE OR REPLACE FUNCTION public.become_technician()
RETURNS void AS $$
BEGIN
  -- Met à jour l'utilisateur courant
  UPDATE public.users
  SET 
    role = 'technician',
    availability = 'available'
  WHERE id = auth.uid()::text; -- On s'assure que c'est bien l'utilisateur connecté
END;
$$ LANGUAGE plpgsql SECURITY DEFINER; -- SECURITY DEFINER = s'exécute avec les droits d'admin

COMMIT;
