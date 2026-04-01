import { Capacitor } from '@capacitor/core';

/**
 * 🗺️ Outils de détection de plateforme SamaTechnicien
 * Permet de faire des modifications sur Web sans toucher au Mobile, et inversement.
 */

// 🖥️ Détection ultra-fiable du Web (Ordinateur vs App Mobile)
// On considère comme "Web" tout ce qui n'est pas Capacitor natif ET qui a un écran large ou n'est pas un téléphone.
export const isWeb = 
    (Capacitor.getPlatform() === 'web') || 
    (!Capacitor.isNativePlatform() && window.innerWidth > 768) ||
    (!/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent));

export const isAndroid = Capacitor.getPlatform() === 'android';
export const isIOS = Capacitor.getPlatform() === 'ios';
export const isNative = Capacitor.isNativePlatform();

export const platform = Capacitor.getPlatform();

/**
 * 🚀 Utilisation dans ton code :
 * import { isWeb, isAndroid } from '../utils/platform';
 * 
 * if (isWeb) {
 *    // Code spécifique pour le site internet
 * }
 */
