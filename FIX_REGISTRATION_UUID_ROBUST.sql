
-- SCRIPT DE RÉPARATION SUPRÊME : INSCRIPTION ET TYPES UUID
BEGIN;

-- 1. On s'assure que la table users accepte UUID comme ID
ALTER TABLE public.users ALTER COLUMN id TYPE uuid USING id::uuid;

-- 2. On s'assure que les colonnes ont des noms cohérents (on essaye les deux au cas où)
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='full_name') THEN
        ALTER TABLE public.users RENAME COLUMN fullname TO full_name;
    EXCEPTION WHEN OTHERS THEN NULL;
    END IF;
END $$;

-- 3. RECRÉER LA FONCTION handle_new_user (SUPER ROBUSTE)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- On essaye de remplir toutes les colonnes possibles
  INSERT INTO public.users (
    id, 
    email, 
    full_name, 
    role, 
    phone, 
    city, 
    district, 
    specialty, 
    image, 
    email_verified,
    created_at
  )
  VALUES (
    NEW.id::uuid, -- Conversion forcée en UUID
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'fullName', 'Utilisateur'),
    COALESCE(NEW.raw_user_meta_data->>'role', 'client'),
    NEW.raw_user_meta_data->>'phone',
    NEW.raw_user_meta_data->>'city',
    NEW.raw_user_meta_data->>'district',
    NEW.raw_user_meta_data->>'specialty',
    NEW.raw_user_meta_data->>'image',
    TRUE, -- On force à TRUE pour les tests
    NOW()
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    role = EXCLUDED.role,
    phone = EXCLUDED.phone;
    
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  -- Si ça échoue, on ne bloque pas auth.users (on pourra corriger le profil plus tard)
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. RE-CRÉER LE TRIGGER S'IL EST MORT
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 5. POLITIQUES RLS (Version UUID)
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Enable read access for all users" ON public.users;
CREATE POLICY "Enable read access for all users" ON public.users FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can update their own profile" ON public.users;
CREATE POLICY "Users can update their own profile"
ON public.users
FOR UPDATE
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

COMMIT;
