import { useEffect, useRef, useState } from 'react';

import { socketUrl } from './api';

export type LinkState = 'demo' | 'connecting' | 'online' | 'offline';

/** Message temps réel du contrat d'API : `{ type, data }`. */
export type LiveMessage = { type: string; data?: unknown };

/**
 * Canal temps réel de l'API (WebSocket `/ws?token=`). Reconnexion automatique avec délai croissant.
 * Le callback est gardé dans une ref pour ne pas rouvrir la socket à chaque rendu.
 * Renvoie `demo` quand l'API n'est pas configurée.
 */
export function useLiveSocket(token: string | null, onMessage: (message: LiveMessage) => void) {
  const handler = useRef(onMessage);
  useEffect(() => {
    handler.current = onMessage;
  });
  const [state, setState] = useState<LinkState>('connecting');
  const url = token ? socketUrl(token) : null;

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
          if (typeof data?.type === 'string') handler.current(data as LiveMessage);
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
