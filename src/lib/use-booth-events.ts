import { useLiveSocket, type LinkState } from './use-live-socket';

export type { LinkState };

export type BoothEvent =
  | { type: 'booth.countdown' } // règle « présence détectée » : lancer une photo
  | { type: 'booth.sleep' }
  | { type: 'booth.wake' };

/** Écoute le canal `booth` de l'API (voir useLiveSocket). */
export function useBoothEvents(boothKey: string | null, onEvent: (event: BoothEvent) => void) {
  return useLiveSocket(boothKey, (message) => {
    if (message.type.startsWith('booth.')) onEvent(message as BoothEvent);
  });
}
