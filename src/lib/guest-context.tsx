import { router } from 'expo-router';
import { createContext, useCallback, useContext, useMemo, useRef, type ReactNode } from 'react';

import { ApiError, type Photo } from './api';
import { setGuestSession, type GuestSession } from './settings';
import { useLiveSocket, type LinkState } from './use-live-socket';

export type PhotoEvent = { type: 'photo.created'; data: Photo } | { type: 'photo.deleted'; data: { id: string } };

type GuestContextValue = {
  session: GuestSession;
  /** État du canal temps réel. */
  live: LinkState;
  /** Abonnement aux photos ajoutées / supprimées (temps réel ou actions locales). */
  subscribe: (listener: (event: PhotoEvent) => void) => () => void;
  /** Diffuse un événement local (ex. après une suppression) à toutes les listes. */
  emit: (event: PhotoEvent) => void;
  /** Garde les photos chargées en mémoire pour ouvrir leur fiche sans nouvel appel. */
  remember: (photos: Photo[]) => void;
  findPhoto: (id: string) => Photo | undefined;
  leave: () => Promise<void>;
  /** Jeton refusé (401) : la session est effacée et l'invité revient à l'écran d'accès. */
  handleError: (err: unknown) => void;
};

const GuestContext = createContext<GuestContextValue | null>(null);

export function GuestProvider({ session, children }: { session: GuestSession; children: ReactNode }) {
  const listeners = useRef(new Set<(event: PhotoEvent) => void>());
  const cache = useRef(new Map<string, Photo>());

  const emit = useCallback((event: PhotoEvent) => {
    if (event.type === 'photo.created') cache.current.set(event.data.id, event.data);
    else cache.current.delete(event.data.id);
    listeners.current.forEach((listener) => listener(event));
  }, []);

  const live = useLiveSocket(session.token, (message) => {
    const data = message.data as Partial<Photo> | undefined;
    if (!data?.id) return;
    if (message.type === 'photo.created') emit({ type: 'photo.created', data: data as Photo });
    if (message.type === 'photo.deleted') emit({ type: 'photo.deleted', data: { id: data.id } });
  });

  const leave = useCallback(async () => {
    await setGuestSession(null);
    router.replace('/join');
  }, []);

  const value = useMemo<GuestContextValue>(
    () => ({
      session,
      live,
      emit,
      subscribe: (listener) => {
        listeners.current.add(listener);
        return () => {
          listeners.current.delete(listener);
        };
      },
      remember: (photos) => photos.forEach((p) => cache.current.set(p.id, p)),
      findPhoto: (id) => cache.current.get(id),
      leave,
      handleError: (err) => {
        if (err instanceof ApiError && err.status === 401) {
          setGuestSession(null).then(() => router.replace({ pathname: '/join', params: { expired: '1' } }));
        }
      },
    }),
    [session, live, emit, leave],
  );

  return <GuestContext.Provider value={value}>{children}</GuestContext.Provider>;
}

export function useGuest() {
  const ctx = useContext(GuestContext);
  if (!ctx) throw new Error('useGuest doit être utilisé dans le groupe (guest).');
  return ctx;
}
