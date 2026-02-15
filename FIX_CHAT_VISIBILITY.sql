-- Fonction pour récupérer vos conversations à coup sûr !
CREATE OR REPLACE FUNCTION public.fetch_my_conversations(p_user_uuid UUID)
RETURNS TABLE (
    id UUID,             -- ID de la conversation
    updated_at TIMESTAMP WITH TIME ZONE,
    other_user_id UUID,
    other_user_name TEXT,
    other_user_image TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER -- C'est la clé : cela contourne les restrictions RLS
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        c.id,
        c.updated_at,
        -- On détermine qui est l'AUTRE personne
        CASE 
            WHEN c.participant1_id = p_user_uuid THEN c.participant2_id
            ELSE c.participant1_id
        END,
        -- On récupère son nom (compatible avec fullname ou full_name)
        CASE 
            WHEN c.participant1_id = p_user_uuid THEN COALESCE(u2.fullname, u2.full_name, 'Utilisateur')
            ELSE COALESCE(u1.fullname, u1.full_name, 'Utilisateur')
        END,
        -- On récupère son image
        CASE 
            WHEN c.participant1_id = p_user_uuid THEN u2.image
            ELSE u1.image
        END
    FROM public.conversations c
    -- On joint avec la table users pour avoir les infos
    LEFT JOIN public.users u1 ON c.participant1_id = u1.uuid
    LEFT JOIN public.users u2 ON c.participant2_id = u2.uuid
    WHERE c.participant1_id = p_user_uuid OR c.participant2_id = p_user_uuid
    ORDER BY c.updated_at DESC;
END;
$$;

-- Donner la permission à tout le monde de l'utiliser
GRANT EXECUTE ON FUNCTION public.fetch_my_conversations TO authenticated;
GRANT EXECUTE ON FUNCTION public.fetch_my_conversations TO anon;
