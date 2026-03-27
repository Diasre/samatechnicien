-- 🛡️ SCRIPT DE RÉPARATION DES CONTRAINTES - SAMATECHNICIEN
-- Ce script rend les colonnes optionnelles pour éviter l'erreur "Database error saving new user"
-- lors de l'inscription par SMS OTP.

-- 1. On rend les colonnes optionnelles dans la table public.users
ALTER TABLE public.users ALTER COLUMN fullname DROP NOT NULL;
ALTER TABLE public.users ALTER COLUMN city DROP NOT NULL;
ALTER TABLE public.users ALTER COLUMN district DROP NOT NULL;
ALTER TABLE public.users ALTER COLUMN role DROP NOT NULL;
ALTER TABLE public.users ALTER COLUMN username DROP NOT NULL;
ALTER TABLE public.users ALTER COLUMN password DROP NOT NULL; -- Car le SMS n'envoie pas de password au début

-- 2. On s'assure que le trigger de synchronisation est souple
-- (Si tu as un trigger qui s'appelle handle_new_user, ce script l'aidera)

-- 🧬 FIN DU SCRIPT - Exécute le dans le SQL Editor de Supabase
