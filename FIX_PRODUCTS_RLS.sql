-- SCRIPT POUR AUTORISER LA PUBLICATION D'ARTICLES
-- Si RLS est activé mais sans policy d'INSERT, la base bloque silencieusement ou refuse les envois.

BEGIN;

ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

-- 1. Autoriser tous les utilisateurs connectés à publier
DROP POLICY IF EXISTS "Allow authenticated insert products" ON public.products;
CREATE POLICY "Allow authenticated insert products" 
ON public.products 
FOR INSERT 
TO authenticated 
WITH CHECK (true);

-- 2. Autoriser la modification uniquement par le propriétaire (le technicien qui l'a publié)
DROP POLICY IF EXISTS "Allow owner update products" ON public.products;
CREATE POLICY "Allow owner update products" 
ON public.products 
FOR UPDATE 
TO authenticated 
USING (technicianid::text = auth.uid()::text);

-- 3. Autoriser la suppression uniquement par le propriétaire
DROP POLICY IF EXISTS "Allow owner delete products" ON public.products;
CREATE POLICY "Allow owner delete products" 
ON public.products 
FOR DELETE 
TO authenticated 
USING (technicianid::text = auth.uid()::text);

COMMIT;
