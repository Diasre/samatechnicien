-- SCRIPT DE RÉPARATION (PROBLÈME DÉPENDANCES POLITIQUE)
-- Ce script désactive d'abord les politiques pour permettre la modification des colonnes.

BEGIN;

-- 1. Supprimer TOUTES les politiques qui bloquent la modification de l'ID
DROP POLICY IF EXISTS "Users can update their own profile" ON public.users;
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.users;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.users;
-- (Ajoutez ici d'autres noms de politiques si vous en avez créé d'autres)

-- 2. Supprimer la propriété d'identité (numérotation auto)
ALTER TABLE public.users ALTER COLUMN id DROP IDENTITY IF EXISTS;

-- 3. Convertir l'ID en TEXTE
ALTER TABLE public.users ALTER COLUMN id TYPE text USING id::text;

-- 4. Convertir les dépendances (Foreign Keys)
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

-- 5. Ajouter la colonne image (si nécessaire)
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS image TEXT;

-- 6. Recréer la fonction d'inscription
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (
    id, email, fullname, role, phone, city, district, specialty, image, email_verified
  )
  VALUES (
    NEW.id::text,
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

-- 7. RECRÉER les politiques de sécurité (RLS)
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable read access for all users"
ON public.users FOR SELECT
USING (true);

CREATE POLICY "Users can update their own profile"
ON public.users FOR UPDATE
USING (auth.uid()::text = id::text)
WITH CHECK (auth.uid()::text = id::text);

COMMIT;
