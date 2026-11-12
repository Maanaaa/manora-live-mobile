import { useEffect, useRef } from 'react';

import { anyHandRaised, createHandRaiseTracker, MEDIAPIPE, type Pose } from '@/lib/hand-raise';

import { HOLD_MS, REARM_DELAY_MS, type HandRaiseDetectorProps } from './hand-raise-detector.types';

// Import d'un module ES distant sans que Metro tente de le résoudre au build.
const importFromUrl = new Function('url', 'return import(url)') as (url: string) => Promise<any>;

const ANALYSIS_INTERVAL_MS = 100; // ~10 images/s suffisent pour un geste

/**
 * Navigateur : MediaPipe Pose Landmarker analyse directement le flux de la webcam.
 * Un flux vidéo caché est ouvert en parallèle de l'aperçu (le navigateur partage la caméra).
 * Aucune image ne quitte l'appareil.
 */
export function HandRaiseDetector({ enabled, onRaise, onStatus }: HandRaiseDetectorProps) {
  const enabledRef = useRef(enabled);
  const onRaiseRef = useRef(onRaise);
  const onStatusRef = useRef(onStatus);
  useEffect(() => {
    enabledRef.current = enabled;
    onRaiseRef.current = onRaise;
    onStatusRef.current = onStatus;
  });

  useEffect(() => {
    let cancelled = false;
    let stream: MediaStream | null = null;
    let landmarker: any = null;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const tracker = createHandRaiseTracker(HOLD_MS);
    let enabledSince: number | null = null;

    (async () => {
      onStatusRef.current('loading');
      try {
        const { FilesetResolver, PoseLandmarker } = await importFromUrl(MEDIAPIPE.bundle);
        const fileset = await FilesetResolver.forVisionTasks(MEDIAPIPE.wasm);
        landmarker = await PoseLandmarker.createFromOptions(fileset, {
          baseOptions: { modelAssetPath: MEDIAPIPE.model, delegate: 'GPU' },
          runningMode: 'VIDEO',
          numPoses: 3,
        });
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 480 } },
          audio: false,
        });
        if (cancelled) return;

        const video = document.createElement('video');
        video.muted = true;
        video.playsInline = true;
        video.srcObject = stream;
        await video.play();
        onStatusRef.current('ready');

        const tick = () => {
          if (cancelled) return;
          const now = performance.now();
          if (!enabledRef.current) {
            enabledSince = null;
            tracker.reset();
          } else {
            enabledSince ??= now;
            if (now - enabledSince >= REARM_DELAY_MS && video.readyState >= 2) {
              const result = landmarker.detectForVideo(video, now);
              const raised = anyHandRaised((result?.landmarks ?? []) as Pose[]);
              if (tracker.update(raised, now)) onRaiseRef.current();
            }
          }
          timer = setTimeout(tick, ANALYSIS_INTERVAL_MS);
        };
        tick();
      } catch (err) {
        console.warn('[main levée]', err);
        if (!cancelled) onStatusRef.current('error');
      }
    })();

    return () => {
      cancelled = true;
      clearTimeout(timer);
      stream?.getTracks().forEach((t) => t.stop());
      landmarker?.close?.();
    };
  }, []);

  return null;
}
