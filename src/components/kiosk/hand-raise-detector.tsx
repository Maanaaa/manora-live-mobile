import { useEffect, useRef } from 'react';
import { StyleSheet } from 'react-native';
import { WebView, type WebViewMessageEvent } from 'react-native-webview';

import { anyHandRaised, createHandRaiseTracker, MEDIAPIPE, type Pose } from '@/lib/hand-raise';

import { HOLD_MS, REARM_DELAY_MS, type HandRaiseDetectorProps } from './hand-raise-detector.types';

const FRAME_INTERVAL_MS = 250;

// Page chargée dans une WebView invisible : MediaPipe (JS + WASM) analyse les images envoyées
// par l'app et renvoie les repères de pose. La règle « main levée » reste côté app.
const HTML = `<!doctype html><html><head><meta charset="utf-8"></head><body>
<script type="module">
import { FilesetResolver, PoseLandmarker } from '${MEDIAPIPE.bundle}';
const post = (m) => window.ReactNativeWebView.postMessage(JSON.stringify(m));
let landmarker = null;
try {
  const fileset = await FilesetResolver.forVisionTasks('${MEDIAPIPE.wasm}');
  landmarker = await PoseLandmarker.createFromOptions(fileset, {
    baseOptions: { modelAssetPath: '${MEDIAPIPE.model}', delegate: 'CPU' },
    runningMode: 'IMAGE',
    numPoses: 3,
  });
  post({ type: 'ready' });
} catch (e) {
  post({ type: 'error', message: String(e) });
}
async function analyse(base64) {
  if (!landmarker) return;
  try {
    const img = new Image();
    img.src = 'data:image/jpeg;base64,' + base64;
    await img.decode();
    const result = landmarker.detect(img);
    post({ type: 'poses', poses: result.landmarks.map((p) => p.map(({ x, y, visibility }) => ({ x, y, visibility }))) });
  } catch (e) {
    post({ type: 'poses', poses: [] });
  }
}
window.addEventListener('message', (e) => analyse(e.data));
document.addEventListener('message', (e) => analyse(e.data));
</script></body></html>`;

/**
 * Tablette : iOS n'autorise qu'une seule session caméra, donc la WebView n'ouvre pas la caméra.
 * L'app prend des images basse qualité avec la caméra de la borne et les envoie à la WebView.
 * Aucune image ne quitte l'appareil.
 */
export function HandRaiseDetector({ enabled, cameraRef, cameraReady, onRaise, onStatus }: HandRaiseDetectorProps) {
  const webview = useRef<WebView>(null);
  const ready = useRef(false);
  const busy = useRef(false);
  const tracker = useRef(createHandRaiseTracker(HOLD_MS));
  const onRaiseRef = useRef(onRaise);
  const onStatusRef = useRef(onStatus);
  useEffect(() => {
    onRaiseRef.current = onRaise;
    onStatusRef.current = onStatus;
  });

  useEffect(() => {
    onStatusRef.current('loading');
  }, []);

  useEffect(() => {
    if (!enabled || !cameraReady) {
      tracker.current.reset();
      return;
    }
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const enabledSince = Date.now();

    const loop = async () => {
      if (cancelled) return;
      if (ready.current && !busy.current && Date.now() - enabledSince >= REARM_DELAY_MS) {
        busy.current = true;
        try {
          const frame = await cameraRef.current?.takePictureAsync({
            quality: 0.2,
            base64: true,
            shutterSound: false,
          });
          if (frame?.base64 && !cancelled) webview.current?.postMessage(frame.base64);
          else busy.current = false;
        } catch {
          busy.current = false;
        }
      }
      timer = setTimeout(loop, FRAME_INTERVAL_MS);
    };
    loop();

    return () => {
      cancelled = true;
      clearTimeout(timer);
      busy.current = false;
    };
  }, [enabled, cameraReady, cameraRef]);

  const onMessage = (event: WebViewMessageEvent) => {
    let msg: { type: string; poses?: Pose[] };
    try {
      msg = JSON.parse(event.nativeEvent.data);
    } catch {
      return;
    }
    if (msg.type === 'ready') {
      ready.current = true;
      onStatusRef.current('ready');
    } else if (msg.type === 'error') {
      onStatusRef.current('error');
    } else if (msg.type === 'poses') {
      busy.current = false;
      if (tracker.current.update(anyHandRaised(msg.poses ?? []), Date.now())) onRaiseRef.current();
    }
  };

  return (
    <WebView
      ref={webview}
      style={styles.hidden}
      originWhitelist={['*']}
      source={{ html: HTML, baseUrl: 'https://localhost/' }}
      onMessage={onMessage}
      javaScriptEnabled
      pointerEvents="none"
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    />
  );
}

const styles = StyleSheet.create({
  hidden: { position: 'absolute', width: 1, height: 1, opacity: 0 },
});
