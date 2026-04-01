// Utiliser l'URL définie dans les variables d'environnement (pour la production)
// OU utiliser l'adresse locale par défaut (pour le développement)
const API_URL = import.meta.env.VITE_API_URL || 'http://10.28.236.131:8080';
const WEB_URL = import.meta.env.VITE_WEB_URL || 'https://samatechnicien.com';

export { API_URL, WEB_URL };
export default API_URL;
