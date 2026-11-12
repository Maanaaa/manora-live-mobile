import { Platform } from 'react-native';

import type { GuestSession } from './settings';

// URL de l'API sur le VPS (voir .env.example). Sans URL, la borne tourne en mode démo :
// elle prend les photos mais ne les envoie nulle part.
export const API_URL = (process.env.EXPO_PUBLIC_API_URL ?? '').replace(/\/$/, '');

export const isApiConfigured = API_URL.length > 0;

export type UploadedPhoto = {
  id: string;
  /** Page publique de la photo, encodée dans le QR affiché sur la borne. */
  url: string;
};

/** Photo de la galerie (contrat ADR 0002). */
export type Photo = {
  id: string;
  url: string;
  thumbUrl: string;
  source: 'booth' | 'guest';
  authorName: string | null;
  mine: boolean;
  createdAt: string;
};

export class ApiError extends Error {
  constructor(
    message: string,
    readonly status?: number,
    /** Le serveur n'a pas pu être joint (réseau coupé, API éteinte…). */
    readonly offline = false,
  ) {
    super(message);
  }
}

const NOT_CONFIGURED = "Le serveur Manora Live n'est pas encore configuré sur cette app.";
const UNREACHABLE = 'Impossible de joindre le serveur. Vérifiez votre connexion internet.';

/** Appel JSON (ou multipart) vers l'API, avec délai maximal et erreurs lisibles. */
async function request<T>(
  path: string,
  { token, method = 'GET', body, timeout = 15000 }: { token?: string; method?: string; body?: unknown; timeout?: number } = {},
): Promise<T> {
  if (!isApiConfigured) throw new ApiError(NOT_CONFIGURED);

  const headers: Record<string, string> = {};
  if (token) headers.Authorization = `Bearer ${token}`;
  let payload: BodyInit | undefined;
  if (body instanceof FormData) payload = body;
  else if (body !== undefined) {
    headers['Content-Type'] = 'application/json';
    payload = JSON.stringify(body);
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeout);
  let res: Response;
  try {
    res = await fetch(`${API_URL}${path}`, { method, headers, body: payload, signal: controller.signal });
  } catch {
    throw new ApiError(UNREACHABLE, undefined, true);
  } finally {
    clearTimeout(timer);
  }

  if (!res.ok) {
    let message = `Le serveur a répondu par une erreur (${res.status}).`;
    try {
      const data = (await res.json()) as { error?: unknown };
      if (typeof data?.error === 'string' && data.error) message = data.error;
    } catch {}
    throw new ApiError(message, res.status);
  }
  if (res.status === 204) return undefined as T;
  try {
    return (await res.json()) as T;
  } catch {
    throw new ApiError('Réponse inattendue du serveur.', res.status);
  }
}

async function photoForm(uri: string, source: Photo['source']) {
  const form = new FormData();
  form.append('source', source);
  if (Platform.OS === 'web') {
    const blob = await (await fetch(uri)).blob();
    form.append('photo', blob, 'photo.jpg');
  } else {
    // React Native accepte un objet { uri, name, type } comme fichier.
    form.append('photo', { uri, name: 'photo.jpg', type: 'image/jpeg' } as unknown as Blob);
  }
  return form;
}

async function uploadPhoto(uri: string, token: string, source: Photo['source']): Promise<UploadedPhoto> {
  const data = await request<Partial<UploadedPhoto>>('/photos', {
    token,
    method: 'POST',
    body: await photoForm(uri, source),
    timeout: 30000,
  });
  if (!data?.id || !data.url) throw new ApiError('Réponse inattendue du serveur.');
  return { id: data.id, url: data.url };
}

/** POST /photos : envoie la photo prise par la borne (clé d'API de la tablette). */
export function uploadBoothPhoto(uri: string, boothKey: string) {
  return uploadPhoto(uri, boothKey, 'booth');
}

/** POST /photos : un invité partage une photo dans la galerie en direct. */
export function uploadGuestPhoto(uri: string, token: string) {
  return uploadPhoto(uri, token, 'guest');
}

/** POST /auth/guest : rejoindre un événement avec son code (lu dans le QR de la borne). */
export async function joinEvent(code: string): Promise<GuestSession> {
  try {
    const data = await request<Partial<GuestSession>>('/auth/guest', { method: 'POST', body: { code } });
    if (!data?.token || !data.event) throw new ApiError('Réponse inattendue du serveur.');
    return { token: data.token, guest: data.guest ?? { id: '' }, event: data.event };
  } catch (err) {
    if (err instanceof ApiError && (err.status === 404 || err.status === 400)) {
      throw new ApiError('Ce code ne correspond à aucun événement. Vérifiez-le et réessayez.', err.status);
    }
    throw err;
  }
}

/** GET /photos : plus récentes d'abord. `after` = id de la dernière photo déjà affichée. */
export function fetchPhotos(token: string, { after, mine }: { after?: string; mine?: boolean } = {}) {
  const params = new URLSearchParams();
  if (after) params.set('after', after);
  if (mine) params.set('mine', '1');
  const query = params.toString();
  return request<Photo[]>(`/photos${query ? `?${query}` : ''}`, { token });
}

/** DELETE /photos/:id : l'auteur retire sa photo. */
export function deletePhoto(id: string, token: string) {
  return request<void>(`/photos/${encodeURIComponent(id)}`, { token, method: 'DELETE' });
}

/** URL du canal temps réel (WebSocket), pour la borne comme pour l'invité. */
export function socketUrl(token: string) {
  if (!isApiConfigured) return null;
  return `${API_URL.replace(/^http/, 'ws')}/ws?token=${encodeURIComponent(token)}`;
}

/** URL du canal temps réel (WebSocket) pour la borne. */
export function boothSocketUrl(boothKey: string) {
  return socketUrl(boothKey);
}
