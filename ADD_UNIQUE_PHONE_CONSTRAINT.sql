-- Ajouter une contrainte d'unicité sur le numéro de téléphone
ALTER TABLE public.users ADD CONSTRAINT users_phone_key UNIQUE (phone);
