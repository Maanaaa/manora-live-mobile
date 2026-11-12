import { useEffect, useRef, useState } from 'react';

import { boothSocketUrl } from './api';

export type BoothEvent =
  | { type: 'booth.countdown' } // règle « présence détectée » : lancer une photo
  | { type: 'booth.sleep' }
  | { type: 'booth.wake' };

export type LinkState = 'demo' | 'connecting' | 'online' | 'offline';

/**
 * Écoute le canal `booth` de l'API. Reconnexion automatique avec délai croissant.
 * Le callback est gardé dans une ref pour ne pas rouvrir la socket à chaque rendu.
 */
export function useBoothEvents(boothKey: string | null, onEvent: (event: BoothEvent) => void) {
  const handler = useRef(onEvent);
  useEffect(() => {
    handler.current = onEvent;
  });
  const [state, setState] = useState<LinkState>('connecting');
  const url = boothKey ? boothSocketUrl(boothKey) : null;

  useEffect(() => {
    if (!url) return;

    let socket: WebSocket | null = null;
    let retry: ReturnType<typeof setTimeout> | undefined;
    let attempt = 0;
    let closed = false;

    const connect = () => {
      setState('connecting');
      socket = new WebSocket(url);
      socket.onopen = () => {
        attempt = 0;
        setState('online');
      };
      socket.onmessage = (msg) => {
        try {
          const data = JSON.parse(String(msg.data));
          if (typeof data?.type === 'string' && data.type.startsWith('booth.')) {
            handler.current(data as BoothEvent);
          }
        } catch {}
      };
      socket.onclose = () => {
        if (closed) return;
        setState('offline');
        attempt += 1;
        retry = setTimeout(connect, Math.min(30000, 1000 * 2 ** attempt));
      };
      socket.onerror = () => socket?.close();
    };

    connect();
    return () => {
      closed = true;
      clearTimeout(retry);
      socket?.close();
    };
  }, [url]);

  return url ? state : 'demo';
}
