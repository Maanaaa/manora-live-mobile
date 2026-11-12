import type { Photo } from './api';

// Navigateur : expo-media-library n'existe pas sur le web (l'importer fait planter l'app).
// On ouvre la photo dans un nouvel onglet, d'où l'invité peut l'enregistrer.
export async function saveToPhone(photo: Photo) {
  globalThis.open?.(photo.url, '_blank');
}
