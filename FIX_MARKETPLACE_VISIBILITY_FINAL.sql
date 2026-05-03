-- SCRIPT DE RÉPARATION UNIVERSEL (V6 - LOCK TO PUBLIC)
-- Ce script identifie et supprime les contraintes uniquement dans le schéma 'public' pour éviter les erreurs système.

BEGIN;

-- 1. DÉSACTIVER RLS SUR LES TABLES CONNUES
ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.products DISABLE ROW LEVEL SECURITY;

-- 2. SUPPRIMER UNIQUEMENT LES CLÉS ÉTRANGÈRES DANS LE SCHÉMA PUBLIC (Ciblage précis)
DO $$ 
DECLARE
    r RECORD;
BEGIN
    FOR r IN (
        SELECT 
            pc.conname AS constraint_name, 
            pcl.relname AS table_name
        FROM pg_constraint pc
        JOIN pg_class pcl ON pc.conrelid = pcl.oid
        JOIN pg_namespace pn ON pcl.relnamespace = pn.oid
        JOIN pg_class pcrel ON pc.confrelid = pcrel.oid
        WHERE pcrel.relname = 'users' 
          AND pc.contype = 'f'
          AND pn.nspname = 'public' -- SÉCURITÉ : Ne toucher qu'au schéma public
    ) LOOP
        EXECUTE format('ALTER TABLE public.%I DROP CONSTRAINT %I', r.table_name, r.constraint_name);
    END LOOP;
END $$;

-- 3. SUPPRIMER TOUTES LES POLITIQUES EXISTANTES (PUBLIC UNIQUEMENT)
DO $$ 
DECLARE row RECORD;
BEGIN
    FOR row IN SELECT policyname, tablename FROM pg_policies WHERE schemaname = 'public'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', row.policyname, row.tablename);
    END LOOP;
END $$;

-- 4. CONVERTIR L'ID DE USERS EN TEXT
ALTER TABLE public.users ALTER COLUMN id DROP IDENTITY IF EXISTS;
ALTER TABLE public.users ALTER COLUMN id TYPE text USING id::text;

-- 5. CONVERTIR LES COLONNES LIÉES DANS LES TABLES CONNUES (FORMAT TEXT)
ALTER TABLE public.products ALTER COLUMN technicianid TYPE text USING technicianid::text;

-- Autres colonnes potentielles (Discussions, Reviews)
DO $$ BEGIN 
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='products' AND column_name='technicianId') THEN
        ALTER TABLE public.products ALTER COLUMN "technicianId" TYPE text USING "technicianId"::text;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='discussions' AND column_name='user_id') THEN
        ALTER TABLE public.discussions ALTER COLUMN user_id TYPE text USING user_id::text;
    END IF;
END $$;

-- 6. RÉINSTALLER LA CLÉ ÉTRANGÈRE ESSENTIELLE POUR LA MARKETPLACE
ALTER TABLE public.products 
    ADD CONSTRAINT "products_technicianid_fkey" 
    FOREIGN KEY (technicianid) REFERENCES public.users(id) ON DELETE CASCADE;

-- 7. RÉACTIVER LA SÉCURITÉ ET LES POLITIQUES DE LECTURE
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read users" ON public.users FOR SELECT USING (true);
CREATE POLICY "Allow public read products" ON public.products FOR SELECT USING (true);

COMMIT;

-- TEST DE VÉRIFICATION
SELECT count(*) as total_valide 
FROM public.products p 
JOIN public.users u ON p.technicianid = u.id;
