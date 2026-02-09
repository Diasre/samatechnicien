-- SCRIPT NUCLÉAIRE (AUTO-DÉTECTION DES BLOCAGES)
-- Ce script est la solution ultime. Il détecte AUTOMATIQUEMENT toutes les contraintes qui bloquent
-- et les supprime avant de faire la réparation, sans avoir besoin de deviner leurs noms.

BEGIN;

-- 1. SUPPRIMER AUTOMATIQUEMENT TOUTES LES CONTRAINTES ÉTRANGÈRES VERS 'USERS'
-- (On ne devine pas les noms, on demande à Postgres de les trouver et de les supprimer)
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN
        SELECT tc.table_schema, tc.table_name, tc.constraint_name
        FROM information_schema.table_constraints AS tc
        JOIN information_schema.constraint_column_usage AS ccu
          ON ccu.constraint_name = tc.constraint_name
          AND ccu.table_schema = tc.table_schema
        WHERE tc.constraint_type = 'FOREIGN KEY' AND ccu.table_name = 'users'
    LOOP
        EXECUTE format('ALTER TABLE %I.%I DROP CONSTRAINT %I', r.table_schema, r.table_name, r.constraint_name);
    END LOOP;
END $$;

-- 2. SUPPRIMER AUTOMATIQUEMENT TOUTES LES POLITIQUES DE SÉCURITÉ SUR 'USERS'
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN SELECT policyname FROM pg_policies WHERE tablename = 'users'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.users', r.policyname);
    END LOOP;
END $$;

-- 3. DÉSACTIVER TEMPORAIREMENT LA SÉCURITÉ
ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;

-- 4. MODIFIER LA TABLE USERS (MAINTENANT QU'ELLE EST LIBRE)
ALTER TABLE public.users ALTER COLUMN id DROP IDENTITY IF EXISTS;
ALTER TABLE public.users ALTER COLUMN id TYPE text USING id::text;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS image TEXT;

-- 5. CONVERTIR LES COLONNES DES AUTRES TABLES EN TEXTE (Compatible)
-- On vérifie si les colonnes existent avant de les modifier pour éviter les erreurs

-- Platform Feedback
DO $$ BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='platform_feedback' AND column_name='userId') THEN
        ALTER TABLE public.platform_feedback ALTER COLUMN "userId" TYPE text USING "userId"::text;
    END IF;
    -- Cas minuscule
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='platform_feedback' AND column_name='userid') THEN
        ALTER TABLE public.platform_feedback ALTER COLUMN userid TYPE text USING userid::text;
    END IF;
END $$;

-- Reviews
DO $$ BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='reviews' AND column_name='clientId') THEN
        ALTER TABLE public.reviews ALTER COLUMN "clientId" TYPE text USING "clientId"::text;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='reviews' AND column_name='technicianId') THEN
        ALTER TABLE public.reviews ALTER COLUMN "technicianId" TYPE text USING "technicianId"::text;
    END IF;
END $$;

-- Products
DO $$ BEGIN 
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='products' AND column_name='technicianid') THEN
        ALTER TABLE public.products ALTER COLUMN technicianid TYPE text USING technicianid::text;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='products' AND column_name='technicianId') THEN
        ALTER TABLE public.products ALTER COLUMN "technicianId" TYPE text USING "technicianId"::text;
    END IF;
END $$;


-- 6. RECRÉER LES CONTRAINTES DES AUTRES TABLES
-- On recrée les liens proprement maintenant que tous les types sont en TEXTE

-- Platform Feedback
DO $$ BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='platform_feedback' AND column_name='userId') THEN
        ALTER TABLE public.platform_feedback ADD CONSTRAINT "platform_feedback_userId_fkey" FOREIGN KEY ("userId") REFERENCES public.users(id) ON DELETE CASCADE;
    END IF;
END $$;

-- Reviews
DO $$ BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='reviews' AND column_name='clientId') THEN
        ALTER TABLE public.reviews ADD CONSTRAINT "reviews_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES public.users(id) ON DELETE CASCADE;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='reviews' AND column_name='technicianId') THEN
        ALTER TABLE public.reviews ADD CONSTRAINT "reviews_technicianId_fkey" FOREIGN KEY ("technicianId") REFERENCES public.users(id) ON DELETE CASCADE;
    END IF;
END $$;

-- Products
DO $$ BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='products' AND column_name='technicianId') THEN
        ALTER TABLE public.products ADD CONSTRAINT "products_technicianId_fkey" FOREIGN KEY ("technicianId") REFERENCES public.users(id) ON DELETE CASCADE;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='products' AND column_name='technicianid') THEN
        ALTER TABLE public.products ADD CONSTRAINT "products_technicianid_fkey" FOREIGN KEY (technicianid) REFERENCES public.users(id) ON DELETE CASCADE;
    END IF;
END $$;

-- 7. RÉPARER FINALEMENT L'INSCRIPTION
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

-- 8. RÉACTIVER LA SÉCURITÉ
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Enable read access for all users" ON public.users FOR SELECT USING (true);
CREATE POLICY "Users can update their own profile" ON public.users FOR UPDATE USING (auth.uid()::text = id::text) WITH CHECK (auth.uid()::text = id::text);

COMMIT;
