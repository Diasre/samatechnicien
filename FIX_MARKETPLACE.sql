-- CORRECTION FINALE ET ABSOLUE : ORDRE DES OPÉRATIONS
-- Erreur précédente : on ne peut pas modifier une colonne si une politique (policy) l'utilise déjà.
-- Solution : On supprime d'abord TOUT, on modifie la colonne, et ensuite on recrée tout.

BEGIN;

-- 1. DÉSACTIVER TEMPORAIREMENT LA SÉCURITÉ POUR POUVOIR MODIFIER LA TABLE TRANQUILLEMENT
ALTER TABLE public.products DISABLE ROW LEVEL SECURITY;

-- 2. SUPPRIMER TOUTES LES POLITIQUES EXISTANTES (Nettoyage complet)
DO $$ 
DECLARE
    r RECORD;
BEGIN
    FOR r IN SELECT policyname FROM pg_policies WHERE tablename = 'products' AND schemaname = 'public'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.products', r.policyname);
    END LOOP;
END $$;

-- 3. SUPPRIMER LES CONTRAINTES LIÉES À LA COLONNE
ALTER TABLE public.products DROP CONSTRAINT IF EXISTS "products_technicianId_fkey";
ALTER TABLE public.products DROP CONSTRAINT IF EXISTS "products_technician_id_fkey";
ALTER TABLE public.products DROP CONSTRAINT IF EXISTS "products_technicianid_fkey";

-- 4. MODIFIER LE TYPE DE LA COLONNE (Le point critique)
-- Maintenant qu'aucune politique ni contrainte ne la retient, on peut la changer.
ALTER TABLE public.products ALTER COLUMN technicianid TYPE text USING technicianid::text;

-- 5. RECRÉER LA CONTRAINTE DE CLÉ ÉTRANGÈRE
ALTER TABLE public.products ADD CONSTRAINT "products_technicianid_fkey" 
FOREIGN KEY (technicianid) REFERENCES public.users(id) ON DELETE CASCADE;

-- 6. RÉACTIVER LA SÉCURITÉ
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

-- 7. RECRÉER LES POLITIQUES (Maintenant que la colonne est propre)

-- A. Lecture pour tous
CREATE POLICY "Marketplace: Everyone can view products" 
ON public.products FOR SELECT 
USING (true);

-- B. Ajout pour les techniciens (authentifiés)
CREATE POLICY "Marketplace: Authenticated users can insert products" 
ON public.products FOR INSERT 
WITH CHECK (auth.role() = 'authenticated'); 

-- C. Modification (Propriétaire uniquement)
CREATE POLICY "Marketplace: Owners can update own products" 
ON public.products FOR UPDATE 
USING (auth.uid()::text = technicianid); -- Pas besoin de cast, c'est déjà du text maintenant

-- D. Suppression (Propriétaire uniquement)
CREATE POLICY "Marketplace: Owners can delete own products" 
ON public.products FOR DELETE 
USING (auth.uid()::text = technicianid);

COMMIT;

-- 8. VÉRIFICATION FINALE
SELECT count(*) as "Nombre de produits visible dans la base" FROM public.products;
SELECT id, title, price, technicianid FROM public.products LIMIT 5;
