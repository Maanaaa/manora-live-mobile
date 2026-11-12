import type { CameraView } from 'expo-camera';
import type { RefObject } from 'react';

export type HandRaiseStatus = 'loading' | 'ready' | 'error';

export type HandRaiseDetectorProps = {
  /** Vrai seulement sur l'accueil de la borne (critère 2 de l'ADR 0006). */
  enabled: boolean;
  /** Caméra de la borne : sur tablette, les images d'analyse en sont tirées. */
  cameraRef: RefObject<CameraView | null>;
  cameraReady: boolean;
  onRaise: () => void;
  onStatus: (status: HandRaiseStatus) => void;
};

/** Délai après le retour à l'accueil avant de réécouter le geste (critère 3). */
export const REARM_DELAY_MS = 3000;
/** Durée pendant laquelle la main doit rester levée (critère 1). */
export const HOLD_MS = 500;
