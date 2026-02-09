-- SCRIPT DE RÉPARATION FINAL (CIBLÉ SUR PRODUCTS)
-- Le problème est que la table 'products' a une colonne 'technicianid' (minuscule) ou 'technicianId' qui bloque tout.
-- Ce script brute-force la conversion.

BEGIN;

-- 1. DÉSACTIVER TOUTES les contraintes sur 'products' qui pointent vers users
ALTER TABLE public.products DROP CONSTRAINT IF EXISTS "products_technicianid_fkey";
ALTER TABLE public.products DROP CONSTRAINT IF EXISTS "products_technicianId_fkey";
ALTER TABLE public.products DROP CONSTRAINT IF EXISTS "products_userId_fkey"; -- Au cas où

-- 2. DÉSACTIVER les autres contraintes (reviews, feedback)
ALTER TABLE public.platform_feedback DROP CONSTRAINT IF EXISTS "platform_feedback_userId_fkey";
ALTER TABLE public.reviews DROP CONSTRAINT IF EXISTS "reviews_clientId_fkey";
ALTER TABLE public.reviews DROP CONSTRAINT IF EXISTS "reviews_technicianId_fkey";

-- 3. DÉSACTIVER les politiques sur users
DROP POLICY IF EXISTS "Users can update their own profile" ON public.users;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.users;

-- 4. CONVERTIR la table PRODUCTS (technicianid -> text)
-- On essaie les deux cas (minuscule et CamelCase) pour être sûr
DO $$ 
BEGIN 
    -- Essai 1 : technicianid (minuscule)
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='products' AND column_name='technicianid') THEN
        ALTER TABLE public.products ALTER COLUMN technicianid TYPE text USING technicianid::text;
    END IF;
    
    -- Essai 2 : technicianId (CamelCase avec guillemets)
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='products' AND column_name='technicianId') THEN
        ALTER TABLE public.products ALTER COLUMN "technicianId" TYPE text USING "technicianId"::text;
    END IF;
END $$;

-- 5. CONVERTIR les autres tables (FEEDBACK, REVIEWS)
DO $$ 
BEGIN 
    ALTER TABLE public.platform_feedback ALTER COLUMN "userId" TYPE text USING "userId"::text;
EXCEPTION WHEN OTHERS THEN NULL; -- On ignore si ça plante (déjà fait ou n'existe pas)
END $$;

DO $$ 
BEGIN 
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'reviews') THEN
        ALTER TABLE public.reviews ALTER COLUMN "clientId" TYPE text USING "clientId"::text;
        ALTER TABLE public.reviews ALTER COLUMN "technicianId" TYPE text USING "technicianId"::text;
    END IF;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

-- 6. MODIFIER LA TABLE USERS (Le but ultime !)
ALTER TABLE public.users ALTER COLUMN id DROP IDENTITY IF EXISTS;
ALTER TABLE public.users ALTER COLUMN id TYPE text USING id::text;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS image TEXT;

-- 7. RESTAURER LES CONTRAINTES (Sur products)
DO $$ 
BEGIN 
    -- On remet la contrainte sur la bonne colonne
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='products' AND column_name='technicianid') THEN
        ALTER TABLE public.products 
            ADD CONSTRAINT "products_technicianid_fkey" 
            FOREIGN KEY (technicianid) REFERENCES public.users(id) ON DELETE CASCADE;
    ELSEIF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='products' AND column_name='technicianId') THEN
        ALTER TABLE public.products 
            ADD CONSTRAINT "products_technicianId_fkey" 
            FOREIGN KEY ("technicianId") REFERENCES public.users(id) ON DELETE CASCADE;
    END IF;
END $$;

-- 8. RESTAURER LES AUTRES CONTRAINTES
ALTER TABLE public.platform_feedback 
    ADD CONSTRAINT "platform_feedback_userId_fkey" 
    FOREIGN KEY ("userId") REFERENCES public.users(id) ON DELETE CASCADE;

-- 9. RÉPARER L'INSCRIPTION
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

-- 10. RÉACTIVER LA SÉCURITÉ
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Enable read access for all users" ON public.users FOR SELECT USING (true);
CREATE POLICY "Users can update their own profile" ON public.users FOR UPDATE USING (auth.uid()::text = id::text) WITH CHECK (auth.uid()::text = id::text);

COMMIT;
