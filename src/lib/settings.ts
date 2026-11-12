import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

// Réglages persistants de l'appareil. La clé d'API de la borne est un secret :
// elle reste dans expo-secure-store (localStorage seulement sur le web, pour le dev).
const KEYS = {
  mode: 'manora.mode',
  boothKey: 'manora.boothKey',
  guestSession: 'manora.guestSession',
} as const;

export type AppMode = 'guest' | 'kiosk';

async function getItem(key: string): Promise<string | null> {
  if (Platform.OS === 'web') {
    try {
      return globalThis.localStorage?.getItem(key) ?? null;
    } catch {
      return null;
    }
  }
  return SecureStore.getItemAsync(key);
}

async function setItem(key: string, value: string | null): Promise<void> {
  if (Platform.OS === 'web') {
    try {
      if (value === null) globalThis.localStorage?.removeItem(key);
      else globalThis.localStorage?.setItem(key, value);
    } catch {}
    return;
  }
  if (value === null) await SecureStore.deleteItemAsync(key);
  else await SecureStore.setItemAsync(key, value);
}

export async function getMode(): Promise<AppMode> {
  return (await getItem(KEYS.mode)) === 'kiosk' ? 'kiosk' : 'guest';
}

export function setMode(mode: AppMode) {
  return setItem(KEYS.mode, mode);
}

export function getBoothKey() {
  return getItem(KEYS.boothKey);
}

export function setBoothKey(key: string | null) {
  return setItem(KEYS.boothKey, key?.trim() || null);
}

/** Événement rejoint par l'invité (réponse de POST /auth/guest). */
export type GuestEvent = { id: string; name: string; date: string; code: string };

export type GuestSession = {
  token: string;
  guest: { id: string; name?: string | null };
  event: GuestEvent;
};

/** Session invitée : le jeton est un secret, il reste dans expo-secure-store avec l'événement. */
export async function getGuestSession(): Promise<GuestSession | null> {
  const raw = await getItem(KEYS.guestSession);
  if (!raw) return null;
  try {
    const session = JSON.parse(raw) as GuestSession;
    return session?.token && session.event ? session : null;
  } catch {
    return null;
  }
}

export function setGuestSession(session: GuestSession | null) {
  return setItem(KEYS.guestSession, session ? JSON.stringify(session) : null);
}
