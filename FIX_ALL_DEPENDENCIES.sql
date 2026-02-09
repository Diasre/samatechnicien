-- SCRIPT DE RÉPARATION COMPLET (DEPENDANCES & TYPES)
-- Ce script gère l'erreur "foreign key constraint" en traitant TOUTES les tables liées.

BEGIN;

-- 1. Supprimer TEMPORAIREMENT les contraintes étrangères qui bloquent (platform_feedback, reviews, products...)
ALTER TABLE public.platform_feedback DROP CONSTRAINT IF EXISTS "platform_feedback_userId_fkey";
-- On supprime aussi celles des autres tables au cas où
ALTER TABLE public.reviews DROP CONSTRAINT IF EXISTS "reviews_clientId_fkey";
ALTER TABLE public.reviews DROP CONSTRAINT IF EXISTS "reviews_technicianId_fkey";
ALTER TABLE public.products DROP CONSTRAINT IF EXISTS "products_technicianId_fkey";

-- 2. Supprimer les politiques de sécurité (RLS) sur users
DROP POLICY IF EXISTS "Users can update their own profile" ON public.users;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.users;
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.users;

-- 3. Modifier la table USERS (Coeur du problème)
-- On enlève l'auto-incrémentation
ALTER TABLE public.users ALTER COLUMN id DROP IDENTITY IF EXISTS;
-- On passe l'ID en TEXTE
ALTER TABLE public.users ALTER COLUMN id TYPE text USING id::text;
-- On s'assure que la colonne image est là
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS image TEXT;

-- 4. Modifier les colonnes des tables LIÉES pour qu'elles matchent le type TEXTE
-- platform_feedback
ALTER TABLE public.platform_feedback ALTER COLUMN "userId" TYPE text USING "userId"::text;

-- reviews (si elle existe)
DO $$ BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'reviews') THEN
        ALTER TABLE public.reviews ALTER COLUMN "clientId" TYPE text USING "clientId"::text;
        ALTER TABLE public.reviews ALTER COLUMN "technicianId" TYPE text USING "technicianId"::text;
    END IF;
END $$;

-- products (si elle existe)
DO $$ BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'products') THEN
        ALTER TABLE public.products ALTER COLUMN "technicianId" TYPE text USING "technicianId"::text;
    END IF;
END $$;

-- 5. REMETTRE les contraintes étrangères (Maintenant que les types sont compatibles)
-- platform_feedback
ALTER TABLE public.platform_feedback 
    ADD CONSTRAINT "platform_feedback_userId_fkey" 
    FOREIGN KEY ("userId") REFERENCES public.users(id) ON DELETE CASCADE;

-- reviews
DO $$ BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'reviews') THEN
        ALTER TABLE public.reviews 
            ADD CONSTRAINT "reviews_clientId_fkey" 
            FOREIGN KEY ("clientId") REFERENCES public.users(id) ON DELETE CASCADE;
        ALTER TABLE public.reviews 
            ADD CONSTRAINT "reviews_technicianId_fkey" 
            FOREIGN KEY ("technicianId") REFERENCES public.users(id) ON DELETE CASCADE;
    END IF;
END $$;

-- products
DO $$ BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'products') THEN
        ALTER TABLE public.products 
            ADD CONSTRAINT "products_technicianId_fkey" 
            FOREIGN KEY ("technicianId") REFERENCES public.users(id) ON DELETE CASCADE;
    END IF;
END $$;

-- 6. Recréer la fonction d'inscription (Corrige l'erreur "database error saving new user")
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (
    id, email, fullname, role, phone, city, district, specialty, image, email_verified
  )
  VALUES (
    NEW.id::text, -- Conversion explicite en texte
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

-- 7. Rétablir les politiques de sécurité (RLS)
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable read access for all users"
ON public.users FOR SELECT
USING (true);

CREATE POLICY "Users can update their own profile"
ON public.users FOR UPDATE
USING (auth.uid()::text = id::text)
WITH CHECK (auth.uid()::text = id::text);

COMMIT;
