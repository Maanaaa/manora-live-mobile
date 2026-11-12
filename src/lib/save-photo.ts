import { File, Paths } from 'expo-file-system';
import * as MediaLibrary from 'expo-media-library';

import type { Photo } from './api';

/** Télécharge la photo dans le cache de l'app puis l'ajoute à la galerie du téléphone. */
export async function saveToPhone(photo: Photo) {
  const permission = await MediaLibrary.requestPermissionsAsync(true, ['photo']);
  if (!permission.granted) {
    throw new Error('Autorisez l’accès à vos photos dans les réglages du téléphone pour enregistrer celle-ci.');
  }
  let file: File;
  try {
    const target = new File(Paths.cache, `manora-${photo.id.replace(/[^\w-]/g, '')}.jpg`);
    file = await File.downloadFileAsync(photo.url, target, { idempotent: true });
  } catch {
    throw new Error('Le téléchargement a échoué. Vérifiez votre connexion et réessayez.');
  }
  await MediaLibrary.Asset.create(file.uri);
}
