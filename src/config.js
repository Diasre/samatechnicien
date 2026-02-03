// Utiliser l'URL définie dans les variables d'environnement (pour la production)
// OU utiliser l'adresse locale par défaut (pour le développement)
const API_URL = import.meta.env.VITE_API_URL || 'http://10.28.236.131:8080';

export default API_URL;
