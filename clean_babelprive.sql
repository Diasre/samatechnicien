-- Supprimer l'utilisateur bloquant pour permettre une réinscription propre
DELETE FROM public.users WHERE email = 'babelprive@gmail.com';

-- Pour être sûr, on supprime aussi s'il traîne dans la table auth
DELETE FROM auth.users WHERE email = 'babelprive@gmail.com';
