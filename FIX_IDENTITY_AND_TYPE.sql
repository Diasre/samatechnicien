-- SCRIPT DE RÉPARATION (PROBLÈME D'IDENTITÉ)
-- Ce script corrige l'erreur "identity column type..." qui empêche la modification de l'ID.

BEGIN;

-- 1. Supprimer la propriété d'auto-incrémentation (IDENTITY) qui bloque tout
-- C'est la cause de l'erreur 22023
ALTER TABLE public.users ALTER COLUMN id DROP IDENTITY IF EXISTS;

-- 2. Maintenant on peut convertir l'ID en TEXTE pour accepter les UUID de Supabase
-- NOTE : Si cela échoue à cause de "clés étrangères" (Foreign Keys), le script continuera grâce aux commandes suivantes.
ALTER TABLE public.users ALTER COLUMN id TYPE text USING id::text;

-- 3. On convertit aussi les colonnes liées dans les autres tables (pour éviter les conflits)
-- On utilise des blocs DO pour ne pas planter si les tables n'existent pas.

DO $$ BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'reviews' AND column_name = 'technicianId') THEN
        ALTER TABLE public.reviews ALTER COLUMN "technicianId" TYPE text USING "technicianId"::text;
    END IF;
END $$;

DO $$ BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'reviews' AND column_name = 'clientId') THEN
        ALTER TABLE public.reviews ALTER COLUMN "clientId" TYPE text USING "clientId"::text;
    END IF;
END $$;

DO $$ BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'technicianId') THEN
        ALTER TABLE public.products ALTER COLUMN "technicianId" TYPE text USING "technicianId"::text;
    END IF;
END $$;

-- 4. Ajouter la colonne image (sécurité)
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS image TEXT;

-- 5. Recréer la fonction d'inscription (Mise à jour pour TEXTE)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (
    id, email, fullname, role, phone, city, district, specialty, image, email_verified
  )
  VALUES (
    NEW.id::text, -- Conversion explicite
    NEW.email,
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'role',
    NEW.raw_user_meta_data->>'phone',
    NEW.raw_user_meta_data->>'city',
    NEW.raw_user_meta_data->>'district',
    NEW.raw_user_meta_data->>'specialty',
    NEW.raw_user_meta_data->>'image',
    FALSE
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. Mettre à jour les politiques de sécurité
DROP POLICY IF EXISTS "Users can update their own profile" ON public.users;
CREATE POLICY "Users can update their own profile"
ON public.users
FOR UPDATE
USING (auth.uid()::text = id::text)
WITH CHECK (auth.uid()::text = id::text);

COMMIT;
