-- 1. Création de la fonction qui sera déclenchée à chaque insertion dans la table 'discussions'
CREATE OR REPLACE FUNCTION notify_technicians_on_new_discussion()
RETURNS TRIGGER AS $$
DECLARE
    tech_record RECORD;
    technician_name TEXT;
    technician_specialty TEXT;
BEGIN
    -- Récupérer le nom et la spécialité du technicien qui vient de lancer la discussion
    -- Remarque : dans Forum.jsx, on insère avec user_id. On l'utilise ici.
    SELECT fullname, specialty INTO technician_name, technician_specialty 
    FROM users 
    WHERE id = NEW.user_id;
    
    -- Si le technicien n'a pas de nom renseigné
    IF technician_name IS NULL THEN
        technician_name := 'Un collègue';
    END IF;

    -- S'il y a bien une spécialité (rubrique) définie pour cet utilisateur
    IF technician_specialty IS NOT NULL THEN
        -- Parcourir tous les techniciens ayant la même spécialité
        FOR tech_record IN 
            SELECT id FROM users 
            WHERE specialty = technician_specialty 
            AND role IN ('technician', 'expert', 'pro')
        LOOP
            -- On n'envoie pas la notification à l'auteur lui-même
            IF tech_record.id != NEW.user_id THEN
                INSERT INTO notifications (
                    user_id, 
                    title, 
                    content, 
                    type, 
                    seen,
                    created_at
                )
                VALUES (
                    tech_record.id,
                    'Forum ' || technician_specialty || ' : Nouvelle discussion',
                    technician_name || ' a lancé une discussion : ' || COALESCE(NEW.title, 'Nouvelle discussion'),
                    'new_discussion',
                    false,
                    NOW()
                );
            END IF;
        END LOOP;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Suppression du trigger s'il existe déjà
DROP TRIGGER IF EXISTS trigger_notify_new_discussion ON discussions;

-- 3. Création du trigger qui s'exécute APRÈS chaque insertion dans la table 'discussions'
CREATE TRIGGER trigger_notify_new_discussion
AFTER INSERT ON discussions
FOR EACH ROW
EXECUTE FUNCTION notify_technicians_on_new_discussion();
