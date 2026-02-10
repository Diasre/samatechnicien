-- CORRECTION FINALE VISIBILITÉ PRODUITS SUR PROFIL

BEGIN;

-- 1. S'assurer que le champ 'status' est bien rempli pour tous les produits
-- Si un produit n'a pas de statut, on le met 'available' par défaut pour qu'il soit visible
UPDATE public.products SET status = 'available' WHERE status IS NULL OR status = '';

-- 2. Désactiver temporairement la sécurité pour vérifier les colonnes
ALTER TABLE public.products DISABLE ROW LEVEL SECURITY;

-- 3. Vérifier et uniformiser le nom de la colonne technicien
DO $$ 
BEGIN 
    -- Si la colonne s'appelle 'technicianId' (camelCase), on la renomme en minuscule
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='products' AND column_name='technicianId') THEN
        ALTER TABLE public.products RENAME COLUMN "technicianId" TO technicianid;
    END IF;
END $$;

-- 4. S'assurer que la colonne est bien du TEXT (pour matcher avec l'ID du code)
-- Convertit BIGINT en TEXT si ce n'est pas déjà fait
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'products' 
        AND column_name = 'technicianid' 
        AND data_type = 'bigint'
    ) THEN
        ALTER TABLE public.products ALTER COLUMN technicianid TYPE text USING technicianid::text;
    END IF;
END $$;


-- 5. Réactiver la sécurité + Politique publique TOTALE
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

-- Supprimer l'ancienne politique potentiellement restrictive
DROP POLICY IF EXISTS "Marketplace: Everyone can view products" ON public.products;

-- Créer la politique qui permet à TOUT LE MONDE (même non connecté) de voir les produits
CREATE POLICY "Marketplace: Everyone can view products" 
ON public.products FOR SELECT 
USING (true);

COMMIT;

-- 6. Afficher quelques produits pour confirmer que tout est OK
SELECT id, title, technicianid, status FROM public.products LIMIT 5;
