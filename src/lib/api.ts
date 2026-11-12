import { Platform } from 'react-native';

// URL de l'API sur le VPS (voir .env.example). Sans URL, la borne tourne en mode démo :
// elle prend les photos mais ne les envoie nulle part.
export const API_URL = (process.env.EXPO_PUBLIC_API_URL ?? '').replace(/\/$/, '');

export const isApiConfigured = API_URL.length > 0;

export type UploadedPhoto = {
  id: string;
  /** Page publique de la photo, encodée dans le QR affiché sur la borne. */
  url: string;
};

export class ApiError extends Error {
  constructor(message: string, readonly status?: number) {
    super(message);
  }
}

/** POST /photos : envoie la photo prise par la borne (clé d'API de la tablette). */
export async function uploadBoothPhoto(uri: string, boothKey: string): Promise<UploadedPhoto> {
  if (!isApiConfigured) throw new ApiError("L'API n'est pas configurée.");

  const form = new FormData();
  form.append('source', 'booth');
  if (Platform.OS === 'web') {
    const blob = await (await fetch(uri)).blob();
    form.append('photo', blob, 'photo.jpg');
  } else {
    // React Native accepte un objet { uri, name, type } comme fichier.
    form.append('photo', { uri, name: 'photo.jpg', type: 'image/jpeg' } as unknown as Blob);
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 20000);
  try {
    const res = await fetch(`${API_URL}/photos`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${boothKey}` },
      body: form,
      signal: controller.signal,
    });
    if (!res.ok) throw new ApiError(`Envoi refusé (${res.status}).`, res.status);
    const data = (await res.json()) as Partial<UploadedPhoto>;
    if (!data.id || !data.url) throw new ApiError('Réponse inattendue du serveur.');
    return { id: data.id, url: data.url };
  } catch (err) {
    if (err instanceof ApiError) throw err;
    throw new ApiError("Impossible de joindre le serveur.");
  } finally {
    clearTimeout(timer);
  }
}

/** URL du canal temps réel (WebSocket) pour la borne. */
export function boothSocketUrl(boothKey: string) {
  if (!isApiConfigured) return null;
  return `${API_URL.replace(/^http/, 'ws')}/ws?channel=booth&token=${encodeURIComponent(boothKey)}`;
}
