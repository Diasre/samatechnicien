-- 1. Création de la fonction qui sera déclenchée à chaque insertion dans la table 'products'
CREATE OR REPLACE FUNCTION notify_all_users_on_new_product()
RETURNS TRIGGER AS $$
DECLARE
    user_record RECORD;
    technician_name TEXT;
BEGIN
    -- Récupérer le nom du technicien qui vient de publier l'article
    SELECT fullname INTO technician_name FROM users WHERE id = NEW.technicianid;
    
    -- Si le technicien n'a pas de nom renseigné, on met une valeur par défaut
    IF technician_name IS NULL THEN
        technician_name := 'Un expert';
    END IF;

    -- Parcourir tous les utilisateurs existants dans la base de données
    FOR user_record IN SELECT id FROM users LOOP
        -- On n'envoie pas la notification à celui qui vient de publier
        IF user_record.id != NEW.technicianid THEN
            INSERT INTO notifications (
                user_id, 
                title, 
                content, 
                type, 
                seen,
                created_at
            )
            VALUES (
                user_record.id,
                'Nouvel article : ' || NEW.title,
                technician_name || ' vient de publier un nouvel article dans la boutique !',
                'new_product',
                false,
                NOW()
            );
        END IF;
    END LOOP;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Suppression du trigger s'il existe déjà (pour éviter les erreurs en cas de double exécution)
DROP TRIGGER IF EXISTS trigger_notify_new_product ON products;

-- 3. Création du trigger qui s'exécute APRÈS chaque insertion dans la table 'products'
CREATE TRIGGER trigger_notify_new_product
AFTER INSERT ON products
FOR EACH ROW
EXECUTE FUNCTION notify_all_users_on_new_product();
