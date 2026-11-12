import { useCallback, useEffect, useRef, useState } from 'react';

import { ApiError, fetchPhotos, type Photo } from './api';
import { useGuest } from './guest-context';
import { mergePhotos, removePhoto } from './photo-list';

export type FeedStatus = 'loading' | 'ready' | 'error';

/**
 * Liste de photos de l'événement (toutes, ou seulement les miennes), tenue à jour en temps réel :
 * premier chargement, tirer pour rafraîchir, chargement des suivantes, ajouts/suppressions en direct.
 */
export function usePhotoFeed({ mine = false }: { mine?: boolean } = {}) {
  const { session, live, subscribe, remember, handleError } = useGuest();
  const token = session.token;

  const [photos, setPhotos] = useState<Photo[]>([]);
  const [status, setStatus] = useState<FeedStatus>('loading');
  const [error, setError] = useState<ApiError | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [moreFailed, setMoreFailed] = useState(false);
  const [end, setEnd] = useState(false);

  type Mode = 'initial' | 'refresh' | 'silent';

  const settle = useCallback(
    (mode: Mode, result: { page: Photo[] } | { err: unknown }) => {
      setRefreshing(false);
      if ('page' in result) {
        remember(result.page);
        setPhotos((current) => mergePhotos(mode === 'silent' ? current : [], result.page));
        if (mode !== 'silent') setEnd(result.page.length === 0);
        setError(null);
        setStatus('ready');
        return;
      }
      handleError(result.err);
      // Un rafraîchissement raté garde la liste déjà affichée.
      if (mode === 'initial') {
        setError(result.err instanceof ApiError ? result.err : new ApiError('Une erreur est survenue.'));
        setStatus('error');
      }
    },
    [remember, handleError],
  );

  // Les états « chargement » sont posés par l'appelant ; l'état final arrive avec la réponse.
  const load = useCallback(
    (mode: Mode) =>
      fetchPhotos(token, { mine }).then(
        (page) => settle(mode, { page }),
        (err) => settle(mode, { err }),
      ),
    [token, mine, settle],
  );

  useEffect(() => {
    load('initial');
  }, [load]);

  const loadMore = useCallback(async () => {
    const last = photos[photos.length - 1];
    if (!last || end || loadingMore || status !== 'ready') return;
    setLoadingMore(true);
    setMoreFailed(false);
    try {
      const page = await fetchPhotos(token, { mine, after: last.id });
      remember(page);
      if (page.length === 0) setEnd(true);
      else setPhotos((current) => mergePhotos(current, page));
    } catch (err) {
      handleError(err);
      setMoreFailed(true);
    } finally {
      setLoadingMore(false);
    }
  }, [photos, end, loadingMore, status, token, mine, remember, handleError]);

  // Temps réel : nouvelles photos et suppressions, sans rafraîchir.
  useEffect(
    () =>
      subscribe((event) => {
        if (event.type === 'photo.created') {
          if (!mine || event.data.mine) setPhotos((current) => mergePhotos(current, [event.data]));
        } else {
          setPhotos((current) => removePhoto(current, event.data.id));
        }
      }),
    [subscribe, mine],
  );

  // Après une coupure du temps réel, on rattrape les photos manquées.
  const wasOffline = useRef(false);
  useEffect(() => {
    if (live === 'offline') wasOffline.current = true;
    if (live === 'online' && wasOffline.current) {
      wasOffline.current = false;
      load('silent');
    }
  }, [live, load]);

  return {
    photos,
    status,
    error,
    refreshing,
    loadingMore,
    moreFailed,
    retry: () => {
      setStatus('loading');
      load('initial');
    },
    refresh: () => {
      setRefreshing(true);
      load('refresh');
    },
    loadMore,
  };
}
