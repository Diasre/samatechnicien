-- Ajout de la colonne pour le code de récupération sécurisé
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS recovery_code TEXT;

-- Mise à jour de la fonction RPC pour vérifier ce code avant de changer le mot de passe
CREATE OR REPLACE FUNCTION reset_password_with_token(p_phone TEXT, p_token TEXT, p_new_password TEXT)
RETURNS BOOLEAN AS $$
DECLARE
    v_id UUID;
BEGIN
    -- On cherche l'utilisateur qui a ce téléphone ET ce code de récupération
    SELECT id INTO v_id FROM public.users 
    WHERE phone = p_phone AND recovery_code = p_token;

    IF v_id IS NOT NULL THEN
        -- Si trouvé, on met à jour le mot de passe et on efface le code de récupération
        UPDATE public.users 
        SET password = p_new_password, recovery_code = NULL
        WHERE id = v_id;
        RETURN TRUE;
    ELSE
        RETURN FALSE;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Droits d'exécution
GRANT EXECUTE ON FUNCTION reset_password_with_token(TEXT, TEXT, TEXT) TO public;
GRANT EXECUTE ON FUNCTION reset_password_with_token(TEXT, TEXT, TEXT) TO anon;
