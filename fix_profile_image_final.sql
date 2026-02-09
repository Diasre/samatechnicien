-- 1. Assurer que la colonne image existe
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS image TEXT;

-- 2. Désactiver temporairement RLS pour vérifier si c'est un problème de droits (Optionnel mais utile pour le debug)
-- ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;

-- 3. Créer une politique explicite pour permettre à chacun de modifier son PROPRE profil (y compris l'image)
DROP POLICY IF EXISTS "Users can update their own profile" ON public.users;
CREATE POLICY "Users can update their own profile"
ON public.users
FOR UPDATE
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- 4. Vérifier que le bucket "produits" est bien public (nécessaire pour voir l'image)
INSERT INTO storage.buckets (id, name, public)
VALUES ('produits', 'produits', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- 5. Politique de stockage pour permettre l'upload d'images (si pas déjà fait)
DROP POLICY IF EXISTS "Technicians can upload avatar" ON storage.objects;
CREATE POLICY "Technicians can upload avatar"
ON storage.objects
FOR INSERT
WITH CHECK (bucket_id = 'produits' AND auth.role() = 'authenticated');

-- 6. Politique pour VOIR les images
DROP POLICY IF EXISTS "Public can view avatar" ON storage.objects;
CREATE POLICY "Public can view avatar"
ON storage.objects
FOR SELECT
USING (bucket_id = 'produits');
