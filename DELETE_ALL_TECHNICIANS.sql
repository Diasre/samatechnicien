-- SCRIPT DE NETTOYAGE COMPLET DES TECHNICIENS
BEGIN;

-- Nettoyage global pour tests (V6 - Force TEXT cast)
DELETE FROM public.devis WHERE technicien_id::text IN (SELECT id::text FROM public.users WHERE role = 'technician');
DELETE FROM public.products WHERE technicianid::text IN (SELECT id::text FROM public.users WHERE role = 'technician');
DELETE FROM public.reviews WHERE "technicianId"::text IN (SELECT id::text FROM public.users WHERE role = 'technician');

-- Suppression finale des techniciens
DELETE FROM public.users WHERE role = 'technician';

COMMIT;
