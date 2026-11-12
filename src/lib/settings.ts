import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

// Réglages persistants de l'appareil. La clé d'API de la borne est un secret :
// elle reste dans expo-secure-store (localStorage seulement sur le web, pour le dev).
const KEYS = {
  mode: 'manora.mode',
  boothKey: 'manora.boothKey',
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
