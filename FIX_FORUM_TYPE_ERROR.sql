-- RÉPARATION DU FORUM : CORRECTION DES TYPES D'ID (UUID vs BIGINT)
-- Ce script corrige l'erreur "invalid input syntax for type bigint" lors de la création d'une discussion.

BEGIN;

-- 1. TABLE DISCUSSIONS
-- On désactive la sécurité temporairement
ALTER TABLE public.discussions DISABLE ROW LEVEL SECURITY;

-- Supprimer les contraintes étrangères existantes sur technicianId
DO $$ 
BEGIN 
    -- Essayer de supprimer toutes les variantes possibles de contraintes
    ALTER TABLE public.discussions DROP CONSTRAINT IF EXISTS "discussions_technicianId_fkey";
    ALTER TABLE public.discussions DROP CONSTRAINT IF EXISTS "discussions_technicianid_fkey";
    ALTER TABLE public.discussions DROP CONSTRAINT IF EXISTS "discussions_technician_id_fkey";
END $$;

-- Conversion de la colonne technicianId en TEXT (UUID)
DO $$ 
BEGIN 
    -- Cas 1 : La colonne s'appelle "technicianId" (avec majuscule)
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='discussions' AND column_name='technicianId') THEN
        ALTER TABLE public.discussions ALTER COLUMN "technicianId" TYPE text USING "technicianId"::text;
        
        -- Recréer la contrainte
        ALTER TABLE public.discussions ADD CONSTRAINT "discussions_technicianId_fkey" 
        FOREIGN KEY ("technicianId") REFERENCES public.users(id) ON DELETE CASCADE;
        
    -- Cas 2 : La colonne s'appelle "technicianid" (tout minuscule)
    ELSIF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='discussions' AND column_name='technicianid') THEN
        ALTER TABLE public.discussions ALTER COLUMN technicianid TYPE text USING technicianid::text;
        
        -- Recréer la contrainte
        ALTER TABLE public.discussions ADD CONSTRAINT "discussions_technicianid_fkey" 
        FOREIGN KEY (technicianid) REFERENCES public.users(id) ON DELETE CASCADE;
    END IF;
END $$;

-- Réactiver la sécurité
ALTER TABLE public.discussions ENABLE ROW LEVEL SECURITY;
-- Recréer une politique par défaut permissive pour tester
DROP POLICY IF EXISTS "Public access" ON public.discussions;
CREATE POLICY "Public access" ON public.discussions FOR ALL USING (true) WITH CHECK (true);


-- 2. TABLE MESSAGES (Même correction)
ALTER TABLE public.messages DISABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN 
    ALTER TABLE public.messages DROP CONSTRAINT IF EXISTS "messages_technicianId_fkey";
    ALTER TABLE public.messages DROP CONSTRAINT IF EXISTS "messages_technicianid_fkey";
    ALTER TABLE public.messages DROP CONSTRAINT IF EXISTS "messages_technician_id_fkey";
END $$;

DO $$ 
BEGIN 
    -- Cas 1 : "technicianId"
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='messages' AND column_name='technicianId') THEN
        ALTER TABLE public.messages ALTER COLUMN "technicianId" TYPE text USING "technicianId"::text;
        
        ALTER TABLE public.messages ADD CONSTRAINT "messages_technicianId_fkey" 
        FOREIGN KEY ("technicianId") REFERENCES public.users(id) ON DELETE CASCADE;
        
    -- Cas 2 : "technicianid"
    ELSIF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='messages' AND column_name='technicianid') THEN
        ALTER TABLE public.messages ALTER COLUMN technicianid TYPE text USING technicianid::text;
        
        ALTER TABLE public.messages ADD CONSTRAINT "messages_technicianid_fkey" 
        FOREIGN KEY (technicianid) REFERENCES public.users(id) ON DELETE CASCADE;
    END IF;
END $$;

ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public access" ON public.messages;
CREATE POLICY "Public access" ON public.messages FOR ALL USING (true) WITH CHECK (true);

COMMIT;
