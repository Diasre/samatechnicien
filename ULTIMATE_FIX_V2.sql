-- SCRIPT DE RÉPARATION ULTIME V2 (DYNAMIQUE)
-- Ce script utilise une approche dynamique pour trouver et supprimer les blocages (politiques et contraintes)
-- avant de modifier la base de données.

BEGIN;

-- 1. SUPPRIMER TOUTES LES POLITIQUES DE SÉCURITÉ SUR 'USERS' (Sans connaitre leurs noms exacts)
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN SELECT policyname FROM pg_policies WHERE tablename = 'users' AND schemaname = 'public'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.users', r.policyname);
    END LOOP;
END $$;

-- 2. DÉSACTIVER RLS SUR USERS
ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;

-- 3. SUPPRIMER LES CONTRAINTES ÉTRANGÈRES QUI BLOQUENT (Approche exhaustive)
-- Products
ALTER TABLE public.products DROP CONSTRAINT IF EXISTS "products_technicianid_fkey";
ALTER TABLE public.products DROP CONSTRAINT IF EXISTS "products_technicianId_fkey";
ALTER TABLE public.products DROP CONSTRAINT IF EXISTS "products_technician_id_fkey";
ALTER TABLE public.products DROP CONSTRAINT IF EXISTS "products_userId_fkey"; 

-- Reviews
ALTER TABLE public.reviews DROP CONSTRAINT IF EXISTS "reviews_clientId_fkey";
ALTER TABLE public.reviews DROP CONSTRAINT IF EXISTS "reviews_technicianId_fkey";
ALTER TABLE public.reviews DROP CONSTRAINT IF EXISTS "reviews_client_id_fkey"; -- Variantes
ALTER TABLE public.reviews DROP CONSTRAINT IF EXISTS "reviews_technician_id_fkey";

-- Feedback
ALTER TABLE public.platform_feedback DROP CONSTRAINT IF EXISTS "platform_feedback_userId_fkey";
ALTER TABLE public.platform_feedback DROP CONSTRAINT IF EXISTS "platform_feedback_user_id_fkey";

-- 4. MODIFIER LA TABLE USERS (Le cœur du problème)
ALTER TABLE public.users ALTER COLUMN id DROP IDENTITY IF EXISTS;
ALTER TABLE public.users ALTER COLUMN id TYPE text USING id::text;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS image TEXT;

-- 5. CORRIGER LES TYPES DES TABLES LIÉES
-- Products
DO $$ BEGIN 
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='products' AND column_name='technicianid') THEN
        ALTER TABLE public.products ALTER COLUMN technicianid TYPE text USING technicianid::text;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='products' AND column_name='technicianId') THEN
        ALTER TABLE public.products ALTER COLUMN "technicianId" TYPE text USING "technicianId"::text;
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

-- Feedback
DO $$ BEGIN 
    ALTER TABLE public.platform_feedback ALTER COLUMN "userId" TYPE text USING "userId"::text;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

-- 6. RESTAURER LES CONTRAINTES ÉTRANGÈRES
-- On remet les liens, mais propres cette fois

-- Products (On détecte la bonne colonne)
DO $$ 
BEGIN 
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='products' AND column_name='technicianid') THEN
        ALTER TABLE public.products ADD CONSTRAINT "products_technicianid_fkey" FOREIGN KEY (technicianid) REFERENCES public.users(id) ON DELETE CASCADE;
    ELSEIF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='products' AND column_name='technicianId') THEN
        ALTER TABLE public.products ADD CONSTRAINT "products_technicianId_fkey" FOREIGN KEY ("technicianId") REFERENCES public.users(id) ON DELETE CASCADE;
    END IF;
END $$;

-- Reviews
DO $$ 
BEGIN 
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'reviews') THEN
        ALTER TABLE public.reviews ADD CONSTRAINT "reviews_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES public.users(id) ON DELETE CASCADE;
        ALTER TABLE public.reviews ADD CONSTRAINT "reviews_technicianId_fkey" FOREIGN KEY ("technicianId") REFERENCES public.users(id) ON DELETE CASCADE;
    END IF;
END $$;

-- Feedback
ALTER TABLE public.platform_feedback ADD CONSTRAINT "platform_feedback_userId_fkey" FOREIGN KEY ("userId") REFERENCES public.users(id) ON DELETE CASCADE;

-- 7. RÉPARER L'INSCRIPTION
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

-- 8. REMETTRE LA SÉCURITÉ (POLITIQUES)
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable read access for all users" ON public.users FOR SELECT USING (true);
CREATE POLICY "Users can update their own profile" ON public.users FOR UPDATE USING (auth.uid()::text = id::text) WITH CHECK (auth.uid()::text = id::text);

COMMIT;
