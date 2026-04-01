-- ==========================================
-- SYSTÈME DE NOTIFICATIONS AUTOMATIQUES
-- ==========================================

-- 1. Création de la table notifications si elle n'existe pas
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL, -- On ne met pas de FK auth.users pour plus de souplesse si l'id n'est pas encore migré
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    type TEXT DEFAULT 'info',
    seen BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Index pour accélérer les recherches par utilisateur
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications(user_id);

-- 3. Fonction qui va générer l'alerte pour les techniciens
CREATE OR REPLACE FUNCTION public.notify_tech_on_new_quote()
RETURNS TRIGGER AS $$
BEGIN
    -- On insère une notification plus détaillée pour chaque technicien de la même spécialité
    INSERT INTO public.notifications (user_id, title, content, type)
    SELECT 
        u.id, 
        '🔔 Nouvel appel : ' || NEW.title,
        '📍 Ville: ' || COALESCE(NEW.city, 'Non précisée') || ' | 🛠️ Détail: ' || LEFT(NEW.description, 80) || '... Répondez vite ! [Ref: #' || NEW.id || ']',
        'quote_alert'
    FROM public.users u
    WHERE u.role = 'technician' 
    AND (
        lower(u.specialty) = lower(NEW.specialty) 
        OR lower(u.specialty) LIKE '%' || lower(NEW.specialty) || '%'
        OR lower(NEW.specialty) LIKE '%' || lower(u.specialty) || '%'
    );
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 4. Le déclencheur (Trigger) lié à la table des devis (quotes)
DROP TRIGGER IF EXISTS tr_notify_tech_quote ON public.quotes;
CREATE TRIGGER tr_notify_tech_quote
AFTER INSERT ON public.quotes
FOR EACH ROW
EXECUTE FUNCTION public.notify_tech_on_new_quote();

-- 5. Notification pour le client quand un technicien envoie un devis
CREATE OR REPLACE FUNCTION public.notify_client_on_new_offer()
RETURNS TRIGGER AS $$
DECLARE
    v_client_id UUID;
BEGIN
    SELECT client_id INTO v_client_id FROM public.quotes WHERE id = NEW.demande_id;
    IF v_client_id IS NOT NULL THEN
        INSERT INTO public.notifications (user_id, title, content, type)
        VALUES (v_client_id, '📈 Nouvelle offre reçue !', 'Un technicien vient de répondre à votre demande. Consultez son prix !', 'offer_received');
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS tr_notify_client_offer ON public.devis;
CREATE TRIGGER tr_notify_client_offer AFTER INSERT ON public.devis FOR EACH ROW EXECUTE FUNCTION public.notify_client_on_new_offer();

-- 6. Notification pour le technicien quand son devis est ACCEPTÉ
CREATE OR REPLACE FUNCTION public.notify_tech_on_acceptance()
RETURNS TRIGGER AS $$
BEGIN
    IF (OLD.statut IS DISTINCT FROM NEW.statut AND NEW.statut = 'validé') THEN
        INSERT INTO public.notifications (user_id, title, content, type)
        VALUES (
            NEW.technicien_id::uuid,
            '🎉 Devis Accepté !',
            'Félicitations ! Le client a validé votre offre. Contactez-le pour fixer le rendez-vous.',
            'offer_accepted'
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS tr_notify_tech_accepted ON public.devis;
CREATE TRIGGER tr_notify_tech_accepted AFTER UPDATE ON public.devis FOR EACH ROW EXECUTE FUNCTION public.notify_tech_on_acceptance();
