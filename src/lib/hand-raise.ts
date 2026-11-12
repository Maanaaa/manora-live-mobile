// Règle « main levée » (ADR 0006), indépendante de la plateforme.
// Entrée : les repères de pose MediaPipe (BlazePose, 33 points, coordonnées normalisées,
// y = 0 en haut de l'image). Pas d'import : ce fichier est testé tel quel par node --test.

export type Landmark = { x: number; y: number; visibility?: number };
export type Pose = Landmark[];

const LEFT_SHOULDER = 11;
const RIGHT_SHOULDER = 12;
// Repères de la main dans BlazePose : poignet, auriculaire, index, pouce.
const LEFT_HAND = [15, 17, 19, 21];
const RIGHT_HAND = [16, 18, 20, 22];

const MIN_VISIBILITY = 0.5;

const visible = (p: Landmark | undefined): p is Landmark => !!p && (p.visibility ?? 1) >= MIN_VISIBILITY;

/**
 * Une main est levée quand l'un de ses repères (poignet ou doigts) passe au-dessus de l'épaule,
 * avec une marge d'un quart de la largeur des épaules pour ignorer les petits mouvements.
 * Seule la main compte : la position du coude est ignorée.
 */
function handRaised(pose: Pose, shoulder: number, hand: number[]): boolean {
  const s = pose[shoulder];
  if (!visible(s)) return false;

  // Marge proportionnelle à la largeur des épaules : fonctionne de près comme de loin.
  const ls = pose[LEFT_SHOULDER];
  const rs = pose[RIGHT_SHOULDER];
  const shoulderWidth = ls && rs ? Math.abs(ls.x - rs.x) : 0;
  const margin = Math.max(0.03, shoulderWidth * 0.25);

  return hand.some((i) => {
    const p = pose[i];
    return visible(p) && p.y < s.y - margin;
  });
}

export function isHandRaised(pose: Pose): boolean {
  return handRaised(pose, LEFT_SHOULDER, LEFT_HAND) || handRaised(pose, RIGHT_SHOULDER, RIGHT_HAND);
}

export function anyHandRaised(poses: Pose[]): boolean {
  return poses.some(isHandRaised);
}

/**
 * Valide le geste dans la durée : il doit être tenu `holdMs` sans interruption.
 * `update` renvoie true une seule fois par geste ; il faut baisser la main pour réarmer.
 */
export function createHandRaiseTracker(holdMs = 500) {
  let since: number | null = null;
  let fired = false;

  return {
    update(raised: boolean, now: number): boolean {
      if (!raised) {
        since = null;
        fired = false;
        return false;
      }
      if (since === null) since = now;
      if (!fired && now - since >= holdMs) {
        fired = true;
        return true;
      }
      return false;
    },
    reset() {
      since = null;
      fired = false;
    },
  };
}

export const MEDIAPIPE = {
  version: '0.10.14',
  bundle: 'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/vision_bundle.mjs',
  wasm: 'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/wasm',
  model:
    'https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task',
} as const;
