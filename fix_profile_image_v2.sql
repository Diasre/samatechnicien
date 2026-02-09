-- CORRECTION ERREUR "uuid = bigint"
-- On utilise le cast ::text pour permettre la comparaison quel que soit le type de la colonne id

-- 1. Assurer que la colonne image existe
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS image TEXT;

-- 2. Politique de mise à jour du profil (Version corrigée)
DROP POLICY IF EXISTS "Users can update their own profile" ON public.users;
CREATE POLICY "Users can update their own profile"
ON public.users
FOR UPDATE
USING (auth.uid()::text = id::text)
WITH CHECK (auth.uid()::text = id::text);

-- 3. Configuration du stockage (Images)
INSERT INTO storage.buckets (id, name, public)
VALUES ('produits', 'produits', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- 4. Politique d'upload (Insertion)
DROP POLICY IF EXISTS "Technicians can upload avatar" ON storage.objects;
CREATE POLICY "Technicians can upload avatar"
ON storage.objects
FOR INSERT
WITH CHECK (bucket_id = 'produits' AND auth.role() = 'authenticated');

-- 5. Politique de lecture (Voir les images)
DROP POLICY IF EXISTS "Public can view avatar" ON storage.objects;
CREATE POLICY "Public can view avatar"
ON storage.objects
FOR SELECT
USING (bucket_id = 'produits');

-- 6. Politique de mise à jour des images (Optionnel, pour écraser)
DROP POLICY IF EXISTS "Technicians can update avatar" ON storage.objects;
CREATE POLICY "Technicians can update avatar"
ON storage.objects
FOR UPDATE
USING (bucket_id = 'produits' AND auth.uid() = owner)
WITH CHECK (bucket_id = 'produits' AND auth.uid() = owner);
