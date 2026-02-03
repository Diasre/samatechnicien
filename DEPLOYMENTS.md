# Guide de Déploiement - SamaTechnicien

Ce guide vous explique comment mettre votre application en ligne gratuitement.
Nous allons utiliser **Render.com** pour le Backend (serveur) et **Vercel** ou **Netlify** pour le Frontend (l'application).

---

## 🚀 Étape 1 : Déployer le Backend (Serveur) sur Render

1.  Allez sur [dashboard.render.com](https://dashboard.render.com/) et créez un compte (avec GitHub c'est plus simple).
2.  Cliquez sur le bouton **"New +"** et choisissez **"Web Service"**.
3.  Connectez votre compte GitHub et sélectionnez votre dépôt `samatechnicien`.
4.  Remplissez le formulaire avec ces informations précises :
    *   **Name** : `samatechnicien-api` (ou le nom que vous voulez)
    *   **Root Directory** : `server` (⚠️ Très important)
    *   **Environment** : `Node`
    *   **Region** : Choisissez `Frankfurt` (plus proche du Sénégal/France) ou `Ohio`.
    *   **Branch** : `main`
    *   **Build Command** : `npm install`
    *   **Start Command** : `node index.js`
    *   **Instance Type** : Sélectionnez **Free** (Gratuit).
5.  Cliquez sur **"Create Web Service"**.

⏳ Attendez quelques minutes. Quand c'est fini, Render vous donnera une URL du type `https://samatechnicien-api.onrender.com`.
👉 **Copiez cette URL**, vous en aurez besoin pour l'étape suivante.

---

## 🌐 Étape 2 : Déployer le Frontend (Site) sur Vercel

1.  Allez sur [vercel.com](https://vercel.com/) et créez un compte (avec GitHub).
2.  Cliquez sur **"Add New..."** > **"Project"**.
3.  Importez votre dépôt Git `samatechnicien`.
4.  Dans la section **"Environment Variables"** (Variables d'environnement) :
    *   **Key** : `VITE_API_URL`
    *   **Value** : Collez l'URL de votre backend Render obtenue à l'étape 1 (ex: `https://samatechnicien-api.onrender.com`). *Attention, ne mettez pas de slash `/` à la fain.*
5.  Cliquez sur **"Deploy"**.

⏳ Vercel va construire votre site. Une fois terminé, il vous donnera l'adresse de votre site en ligne (ex: `https://samatechnicien.vercel.app`).

---

## 📱 Étape 3 : Mettre à jour l'Application Mobile

Si vous voulez que votre application mobile installée sur le téléphone utilise aussi ce serveur en ligne (et non plus votre ordinateur local) :

1.  Dans votre projet local, ouvrez le fichier `.env` (créez-le à la racine s'il n'existe pas).
2.  Ajoutez cette ligne dedans :
    ```
    VITE_API_URL=https://votre-url-render-backend.onrender.com
    ```
3.  Reconstruisez l'application Android :
    ```bash
    npm run build
    npx cap sync
    npx cap open android
    ```
4.  Lancez l'application depuis Android Studio sur votre téléphone.

---

## ⚠️ Note Importante sur la Base de Données

Actuellement, nous utilisons **SQLite** (un fichier simple).
Sur les offres **gratuites** comme Render, le système de fichiers est "éphémère". Cela signifie que **si le serveur redémarre (ce qui arrive souvent en gratuit), vous perdrez les données (utilisateurs inscrits, produits, etc.)**.

Pour une vraie application en production qui conserve les données, il faudra passer à une base de données **PostgreSQL** (Render en propose une gérée) ou utiliser un service comme **Supabase**.
