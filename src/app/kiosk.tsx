import { CameraView, useCameraPermissions } from 'expo-camera';
import { Image } from 'expo-image';
import { useKeepAwake } from 'expo-keep-awake';
import { router } from 'expo-router';
import * as ScreenOrientation from 'expo-screen-orientation';
import { StatusBar } from 'expo-status-bar';
import { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Animated, Platform, Pressable, StyleSheet, Text, View, useWindowDimensions } from 'react-native';

import { Button } from '@/components/button';
import { CountdownOverlay } from '@/components/kiosk/countdown-overlay';
import { HandRaiseDetector } from '@/components/kiosk/hand-raise-detector';
import type { HandRaiseStatus } from '@/components/kiosk/hand-raise-detector.types';
import { QrCard } from '@/components/kiosk/qr-card';
import { StatusChip } from '@/components/kiosk/status-chip';
import { isApiConfigured, uploadBoothPhoto, type UploadedPhoto } from '@/lib/api';
import { getBoothKey } from '@/lib/settings';
import { colors, fonts, radius, shadow } from '@/lib/theme';
import { useBoothEvents } from '@/lib/use-booth-events';

type Phase = 'idle' | 'countdown' | 'review' | 'sending' | 'done' | 'error';
type Trigger = 'touch' | 'hand' | 'sensor';

const COUNTDOWN_SECONDS = 3;
// Délais avant retour automatique à l'accueil, pour ne pas bloquer la borne.
const AUTO_RESET_MS: Partial<Record<Phase, number>> = { review: 40000, done: 45000, error: 60000 };
const GALLERY_URL = process.env.EXPO_PUBLIC_GALLERY_URL ?? '';

export default function KioskScreen() {
  useKeepAwake();
  const { width, height } = useWindowDimensions();
  const landscape = width >= height;

  const cameraRef = useRef<CameraView>(null);
  const [permission, requestPermission] = useCameraPermissions();
  const [cameraReady, setCameraReady] = useState(false);

  const [boothKey, setBoothKeyState] = useState<string | null>(null);
  const [phase, setPhase] = useState<Phase>('idle');
  const [count, setCount] = useState(COUNTDOWN_SECONDS);
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [uploaded, setUploaded] = useState<UploadedPhoto | null>(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [flash] = useState(() => new Animated.Value(0));
  const [handStatus, setHandStatus] = useState<HandRaiseStatus>('loading');
  const [trigger, setTrigger] = useState<Trigger>('touch');

  // Borne en paysage, plein écran.
  useEffect(() => {
    if (Platform.OS === 'web') return;
    ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.LANDSCAPE).catch(() => {});
    return () => {
      ScreenOrientation.unlockAsync().catch(() => {});
    };
  }, []);

  useEffect(() => {
    getBoothKey().then(setBoothKeyState);
  }, []);

  const reset = useCallback(() => {
    setPhase('idle');
    setPhotoUri(null);
    setUploaded(null);
    setErrorMessage('');
    setCount(COUNTDOWN_SECONDS);
  }, []);

  const start = useCallback(
    (by: Trigger = 'touch') => {
      if (!cameraReady) return;
      setTrigger(by);
      setCount(COUNTDOWN_SECONDS);
      setPhase('countdown');
    },
    [cameraReady],
  );

  // Événements temps réel : la règle « présence détectée » (capteur PIR) lance la photo.
  const phaseRef = useRef(phase);
  useEffect(() => {
    phaseRef.current = phase;
  }, [phase]);
  const link = useBoothEvents(boothKey, (event) => {
    if (event.type === 'booth.countdown' && phaseRef.current === 'idle') start('sensor');
  });

  const capture = useCallback(async () => {
    Animated.sequence([
      Animated.timing(flash, { toValue: 1, duration: 60, useNativeDriver: true }),
      Animated.timing(flash, { toValue: 0, duration: 420, useNativeDriver: true }),
    ]).start();
    try {
      const picture = await cameraRef.current?.takePictureAsync({ quality: 0.85, imageType: 'jpg', shutterSound: false });
      if (!picture?.uri) throw new Error('no picture');
      setPhotoUri(picture.uri);
      setPhase('review');
    } catch {
      setErrorMessage("La photo n'a pas pu être prise. Réessayez dans un instant.");
      setPhase('error');
    }
  }, [flash]);

  // Décompte : une seconde par chiffre, puis déclenchement.
  useEffect(() => {
    if (phase !== 'countdown') return;
    if (count === 0) {
      capture();
      return;
    }
    const t = setTimeout(() => setCount((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [phase, count, capture]);

  // Retour automatique à l'accueil.
  useEffect(() => {
    const delay = AUTO_RESET_MS[phase];
    if (!delay) return;
    const t = setTimeout(reset, delay);
    return () => clearTimeout(t);
  }, [phase, reset]);

  const send = useCallback(async () => {
    if (!photoUri) return;
    if (!isApiConfigured || !boothKey) {
      setPhase('done'); // mode démo : rien à envoyer
      return;
    }
    setPhase('sending');
    try {
      setUploaded(await uploadBoothPhoto(photoUri, boothKey));
      setPhase('done');
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : "L'envoi a échoué.");
      setPhase('error');
    }
  }, [photoUri, boothKey]);

  const showPhoto = photoUri && phase !== 'idle' && phase !== 'countdown';

  return (
    <View style={styles.screen}>
      <StatusBar hidden />

      <View style={styles.header}>
        <Pressable
          onLongPress={() => router.push('/settings')}
          delayLongPress={1500}
          accessibilityRole="button"
          accessibilityLabel="Manora. Appui long pour ouvrir les réglages."
          hitSlop={12}>
          <Image source={require('@/assets/images/manora-logo.png')} style={styles.logo} contentFit="contain" />
        </Pressable>
        <StatusChip state={link} />
      </View>

      <View style={[styles.body, !landscape && styles.bodyPortrait]}>
        {/* Aperçu caméra : les invités se voient en direct. */}
        <View style={[styles.stage, landscape ? styles.stageLandscape : styles.stagePortrait]}>
          {permission?.granted ? (
            <CameraView
              ref={cameraRef}
              style={StyleSheet.absoluteFill}
              facing="front"
              mirror
              animateShutter={false}
              onCameraReady={() => setCameraReady(true)}
              onMountError={() => {
                setErrorMessage('La caméra ne répond pas.');
                setPhase('error');
              }}
            />
          ) : (
            <PermissionPanel loading={!permission} canAsk={permission?.canAskAgain ?? true} onAsk={requestPermission} />
          )}

          {showPhoto ? <Image source={{ uri: photoUri }} style={StyleSheet.absoluteFill} contentFit="cover" /> : null}
          {phase === 'countdown' && count > 0 ? <CountdownOverlay value={count} /> : null}
          <Animated.View pointerEvents="none" style={[StyleSheet.absoluteFill, styles.flash, { opacity: flash }]} />

          {permission?.granted ? (
            <HandRaiseDetector
              enabled={phase === 'idle'}
              cameraRef={cameraRef}
              cameraReady={cameraReady}
              onRaise={() => {
                if (phaseRef.current === 'idle') start('hand');
              }}
              onStatus={setHandStatus}
            />
          ) : null}

          {phase === 'idle' && permission?.granted ? (
            <Pressable
              style={StyleSheet.absoluteFill}
              onPress={() => start()}
              accessibilityRole="button"
              accessibilityLabel="Toucher l'écran pour prendre une photo"
            />
          ) : null}
        </View>

        <View style={[styles.aside, landscape ? styles.asideLandscape : styles.asidePortrait]}>
          <Aside
            phase={phase}
            count={count}
            trigger={trigger}
            handReady={handStatus === 'ready'}
            cameraReady={cameraReady && !!permission?.granted}
            uploaded={uploaded}
            errorMessage={errorMessage}
            onStart={() => start()}
            onRetake={() => {
              setPhotoUri(null);
              start();
            }}
            onKeep={send}
            onRetry={photoUri ? send : reset}
            onFinish={reset}
          />
        </View>
      </View>
    </View>
  );
}

function Aside(props: {
  phase: Phase;
  count: number;
  trigger: Trigger;
  handReady: boolean;
  cameraReady: boolean;
  uploaded: UploadedPhoto | null;
  errorMessage: string;
  onStart: () => void;
  onRetake: () => void;
  onKeep: () => void;
  onRetry: () => void;
  onFinish: () => void;
}) {
  const { phase } = props;

  if (phase === 'countdown') {
    return (
      <>
        <Text style={styles.eyebrow}>{props.trigger === 'hand' ? 'MAIN LEVÉE, C’EST PARTI' : 'SOURIEZ'}</Text>
        <Text style={styles.title}>Regardez l’objectif…</Text>
        <Text style={styles.lead}>Photo dans {props.count} seconde{props.count > 1 ? 's' : ''}.</Text>
      </>
    );
  }

  if (phase === 'review') {
    return (
      <>
        <Text style={styles.eyebrow}>APERÇU</Text>
        <Text style={styles.title}>Elle vous plaît ?</Text>
        <Text style={styles.lead}>Gardez-la pour la récupérer sur votre téléphone, ou recommencez.</Text>
        <View style={styles.actions}>
          <Button label="Je la garde" size="lg" onPress={props.onKeep} />
          <Button label="Recommencer" variant="secondary" onPress={props.onRetake} />
        </View>
      </>
    );
  }

  if (phase === 'sending') {
    return (
      <>
        <ActivityIndicator size="large" color={colors.terracotta} style={styles.spinner} />
        <Text style={styles.title}>Envoi de votre photo…</Text>
        <Text style={styles.lead}>Quelques secondes et elle arrive dans la galerie.</Text>
      </>
    );
  }

  if (phase === 'done') {
    return (
      <>
        <Text style={styles.eyebrow}>C’EST DANS LA BOÎTE</Text>
        <Text style={styles.title}>Merci !</Text>
        {props.uploaded ? (
          <QrCard
            value={props.uploaded.url}
            title="Récupérez votre photo"
            caption="Scannez avec l'appareil photo de votre téléphone."
            size={170}
          />
        ) : (
          <Text style={styles.lead}>Mode démo : la photo n’a pas été envoyée.</Text>
        )}
        <View style={styles.actions}>
          <Button label="Nouvelle photo" size="lg" onPress={props.onFinish} />
        </View>
        <Text style={styles.hint}>La borne revient à l’accueil toute seule.</Text>
      </>
    );
  }

  if (phase === 'error') {
    return (
      <>
        <Text style={[styles.eyebrow, { color: colors.terracotta }]}>OUPS</Text>
        <Text style={styles.title}>Un petit souci</Text>
        <Text style={styles.lead}>{props.errorMessage}</Text>
        <View style={styles.actions}>
          <Button label="Réessayer" size="lg" onPress={props.onRetry} />
          <Button label="Revenir à l'accueil" variant="secondary" onPress={props.onFinish} />
        </View>
      </>
    );
  }

  return (
    <>
      <Text style={styles.eyebrow}>PHOTOBOOTH</Text>
      <Text style={styles.title}>Prenez la pose !</Text>
      <Text style={styles.lead}>
        {props.handReady
          ? 'Levez la main ou touchez l’écran : 3 secondes pour vous placer, puis souriez.'
          : 'Touchez l’écran : 3 secondes pour vous placer, puis souriez.'}
      </Text>
      <View style={styles.actions}>
        <Button
          label={props.cameraReady ? 'Prendre ma photo' : 'Démarrage de la caméra…'}
          size="lg"
          disabled={!props.cameraReady}
          onPress={props.onStart}
        />
      </View>
      {GALLERY_URL ? (
        <QrCard
          value={GALLERY_URL}
          title="La galerie en direct"
          caption="Retrouvez toutes les photos et partagez les vôtres."
          size={110}
        />
      ) : null}
    </>
  );
}

function PermissionPanel({ loading, canAsk, onAsk }: { loading: boolean; canAsk: boolean; onAsk: () => void }) {
  if (loading) {
    return (
      <View style={styles.permission}>
        <ActivityIndicator color={colors.terracotta} />
      </View>
    );
  }
  return (
    <View style={styles.permission}>
      <Text style={styles.permissionTitle}>La borne a besoin de la caméra</Text>
      <Text style={styles.lead}>
        {canAsk
          ? 'Autorisez la caméra pour que les invités puissent se voir et prendre leur photo.'
          : "Autorisez la caméra dans les réglages de la tablette, puis revenez sur l'app."}
      </Text>
      {canAsk ? <Button label="Autoriser la caméra" onPress={onAsk} /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.cream2, paddingHorizontal: 32, paddingTop: 20, paddingBottom: 28 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 },
  logo: { width: 180, height: 56 },
  body: { flex: 1, flexDirection: 'row', gap: 32 },
  bodyPortrait: { flexDirection: 'column', gap: 20 },
  stage: {
    overflow: 'hidden',
    borderRadius: radius.xl,
    backgroundColor: colors.ink,
    borderWidth: 1,
    borderColor: colors.sand,
    ...shadow,
  },
  stageLandscape: { flex: 1.25 },
  stagePortrait: { flex: 1 },
  flash: { backgroundColor: colors.white },
  aside: { justifyContent: 'center', gap: 18 },
  asideLandscape: { flex: 0.85, paddingRight: 8 },
  asidePortrait: { flex: 0, paddingBottom: 8 },
  eyebrow: { fontFamily: fonts.bold, fontSize: 14, letterSpacing: 2.4, color: colors.terracotta },
  title: { fontFamily: fonts.extrabold, fontSize: 48, lineHeight: 54, color: colors.ink },
  lead: { fontFamily: fonts.medium, fontSize: 20, lineHeight: 30, color: colors.muted, maxWidth: 520 },
  hint: { fontFamily: fonts.medium, fontSize: 14, color: colors.muted },
  actions: { gap: 12, marginTop: 6 },
  spinner: { alignSelf: 'flex-start' },
  permission: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 16, padding: 40, backgroundColor: colors.cream },
  permissionTitle: { fontFamily: fonts.extrabold, fontSize: 28, color: colors.ink, textAlign: 'center' },
});
