-- =========================================================================================
-- FIX: CORRECTION DU MOT DE PASSE "NULL" DANS LA TABLE USERS LORS DE L'INSCRIPTION
-- =========================================================================================
-- Raison du bug : 
-- L'application envoie bien le mot de passe lors de l'inscription dans les métadonnées.
-- Cependant, la fonction ("trigger") officielle de la base de données 
-- oubliait de copier cette information vers la colonne `password` de votre table `users`.
--
-- Ce script : 
-- 1. Corrige le trigger pour le futur.
-- 2. Répare tous les mots de passe actuels qui sont à "NULL" en récupérant l'info cachée 
--    dans l'historique de création.
-- =========================================================================================

-- 1. Réparation des mots de passe qui sont déjà à "NULL"
UPDATE public.users pu
SET password = (
    SELECT au.raw_user_meta_data->>'password'
    FROM auth.users au
    WHERE au.id::text = pu.id::text
    LIMIT 1
)
WHERE pu.password IS NULL;

-- 2. Sécurité : si un mot de passe a été récupéré mais n'a pas 4 chiffres, on le nettoie
UPDATE public.users
SET password = LPAD(SUBSTRING(COALESCE(NULLIF(TRIM(password), ''), '0000'), 1, 4), 4, '0')
WHERE length(password) < 4 OR length(password) > 4;

-- 3. Mise à jour de la fonction Automatique (Trigger) pour les TOUTES PROCHAINES INSCRIPTIONS
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (
    id, email, fullname, role, phone, city, district, specialty, image, password, email_verified
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
    NEW.raw_user_meta_data->>'password', -- 👈 LA LIGNE MAGIQUE AJOUTÉE !
    FALSE
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
