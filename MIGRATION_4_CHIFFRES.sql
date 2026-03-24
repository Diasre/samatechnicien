-- ==============================================================================
-- FIX: MIGRATION DES MOTS DE PASSE VERS UN CODE SECRET À 4 CHIFFRES
-- ==============================================================================
CREATE EXTENSION IF NOT EXISTS pgcrypto;

DO $$ 
BEGIN 
    -- 1. Nettoyer et tronquer les mots de passe dans la table publique `users`
    UPDATE public.users
    SET password = SUBSTRING(COALESCE(NULLIF(TRIM(password), ''), '0000'), 1, 4);

    -- 2. Si un mot de passe faisait moins de 4 caractères, on le remplit de zéros
    UPDATE public.users
    SET password = RPAD(password, 4, '0')
    WHERE length(password) < 4;

    -- 3. Mettre à jour l'authentification officielle (auth.users)
    -- On hache (crypt) le nouveau mot de passe de la table `users` + l'astuce "00"
    -- Correction apportée : cast explicite (::uuid) pour pallier à l'erreur de type (text = uuid)
    UPDATE auth.users au
    SET encrypted_password = crypt(
        (SELECT pu.password || '00' FROM public.users pu WHERE pu.id::text = au.id::text),
        gen_salt('bf')
    )
    WHERE EXISTS (SELECT 1 FROM public.users pu WHERE pu.id::text = au.id::text);

END $$;

-- Vérification des résultats
SELECT id, fullname, phone, password AS code_secret_4_chiffres FROM public.users LIMIT 10;
