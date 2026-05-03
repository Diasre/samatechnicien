# Intégration du système KYC (Contrat de Confiance)

Ce plan décrit les modifications nécessaires pour permettre aux techniciens de télécharger leur pièce d'identité (recto/verso) et aux administrateurs de valider ces documents pour octroyer le "Contrat de Confiance".

## 1. Modifications de la Base de Données (Supabase)
Nous allons fournir un script SQL complet (`SETUP_KYC.sql`) qui permettra de :
- Ajouter les colonnes `id_card_recto`, `id_card_verso` (texte) dans la table `users`.
- Ajouter la colonne `verification_status` (texte, par défaut 'none') dans la table `users`.
- Créer un espace de stockage (Bucket) nommé `kyc_documents` pour héberger les photos de façon sécurisée.
- Configurer les règles de sécurité (Policies) pour que seuls les techniciens puissent uploader et que seuls les admins (et le technicien lui-même) puissent lire ces documents.

> [!WARNING]
> Vous devrez exécuter ce script manuellement dans le "SQL Editor" de votre Supabase avant que nous implémentions le code.

## 2. Interface du Technicien (`ExpertDashboard.jsx`)
Dans le tableau de bord de l'expert :
- **Si le statut = 'none' ou 'rejected'** : Afficher un formulaire d'envoi. 
  - Deux boutons d'upload : "Recto de la pièce" et "Verso de la pièce".
  - Un bouton "Envoyer ma demande".
- **Comportement d'envoi** : Les images seront compressées/téléversées vers le bucket `kyc_documents`. Les URLs seront enregistrées dans le profil de l'utilisateur, et son statut passera à 'pending'.
- **Si le statut = 'pending'** : Afficher un message bloquant : "⏳ Votre pièce d'identité est en cours de validation par un administrateur."
- **Si le statut = 'verified'** : Afficher un message de succès : "✅ Félicitations, vous êtes un technicien de confiance."

## 3. Interface Administrateur (`Dashboard.jsx`)
Dans le tableau de bord d'administration :
- Ajout d'une nouvelle section : **"Vérifications KYC en attente"**.
- Cette section listera tous les techniciens ayant le statut `verification_status = 'pending'`.
- L'administrateur pourra voir les photos (Recto/Verso) de chaque demande.
- Deux boutons seront proposés :
  1. **Valider** : Passe le statut à 'verified' et active le `contrat_confiance = true`.
  2. **Rejeter** : Passe le statut à 'rejected' et remet le `contrat_confiance = false` (le technicien pourra recommencer).

> [!IMPORTANT]
> Pour que cela fonctionne, vous devez me donner votre feu vert sur ce plan pour que je génère le code et le script SQL.
