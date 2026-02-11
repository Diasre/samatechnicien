-- FIX FINAL: ACTIVE LE MODE TECHNICIEN (RPC + Permissions)

BEGIN;

-- 1. Créer (ou mettre à jour) la fonction sécurisée
CREATE OR REPLACE FUNCTION public.become_technician()
RETURNS void AS $$
BEGIN
  -- Force la mise à jour sans vérifier les politiques RLS (car SECURITY DEFINER)
  UPDATE public.users
  SET 
    role = 'technician',
    availability = 'available'
  WHERE id = auth.uid()::text;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. ACCORDER LES PERMISSIONS D'EXÉCUTION (Crucial !)
-- Sans ça, l'application ne peut pas appeler la fonction
GRANT EXECUTE ON FUNCTION public.become_technician() TO authenticated;
GRANT EXECUTE ON FUNCTION public.become_technician() TO anon;
GRANT EXECUTE ON FUNCTION public.become_technician() TO service_role;

-- 3. (Sécurité) S'assurer que la colonne 'availability' existe
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS availability TEXT DEFAULT 'available';

COMMIT;
