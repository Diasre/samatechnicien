-- SCRIPT DE RÉPARATION DU STOCKAGE DES IMAGES
-- Ce script s'assure que le bucket 'produits' est public et que tout le monde peut voir les images.

-- 1. S'assurer que le bucket 'produits' est public
INSERT INTO storage.buckets (id, name, public)
VALUES ('produits', 'produits', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- 2. Supprimer les anciennes politiques conflictuelles (si elles existent)
DROP POLICY IF EXISTS "Public Access" ON storage.objects;
DROP POLICY IF EXISTS "Give users access to own folder 1oj02bi_0" ON storage.objects;
DROP POLICY IF EXISTS "Give users access to own folder 1oj02bi_1" ON storage.objects;
DROP POLICY IF EXISTS "Give users access to own folder 1oj02bi_2" ON storage.objects;
DROP POLICY IF EXISTS "Give users access to own folder 1oj02bi_3" ON storage.objects;
DROP POLICY IF EXISTS "Allow public selection" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated uploads" ON storage.objects;

-- 3. Créer une politique d'ACCÈS PUBLIC pour la lecture (TRÈS IMPORTANT)
CREATE POLICY "Public Read Access"
ON storage.objects FOR SELECT
USING ( bucket_id = 'produits' );

-- 4. Créer une politique d'INSERTION pour les utilisateurs connectés
CREATE POLICY "Authenticated Insert"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK ( bucket_id = 'produits' );

-- 5. Créer une politique de MISE À JOUR/SUPPRESSION pour les propriétaires
-- Note: on utilise le début du nom du fichier pour vérifier le dossier (user_id/...)
CREATE POLICY "Owner Update"
ON storage.objects FOR UPDATE
TO authenticated
USING ( bucket_id = 'produits' AND (auth.uid())::text = (storage.foldername(name))[1] );

CREATE POLICY "Owner Delete"
ON storage.objects FOR DELETE
TO authenticated
USING ( bucket_id = 'produits' AND (auth.uid())::text = (storage.foldername(name))[1] );
