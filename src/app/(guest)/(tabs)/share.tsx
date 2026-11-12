import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { router } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Linking, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';

import { Button } from '@/components/button';
import { GuestHeader } from '@/components/guest/guest-header';
import { StateView } from '@/components/guest/state-view';
import { Icon } from '@/components/icon';
import { ApiError, isApiConfigured, uploadGuestPhoto } from '@/lib/api';
import { useGuest } from '@/lib/guest-context';
import { colors, fonts, radius, shadow } from '@/lib/theme';

type Phase = 'pick' | 'preview' | 'sending' | 'done' | 'error';

const PICKER_OPTIONS: ImagePicker.ImagePickerOptions = { mediaTypes: 'images', quality: 0.85, allowsEditing: false };

/** Partager une photo : prise de vue ou photo du téléphone, aperçu, puis envoi dans la galerie. */
export default function ShareScreen() {
  const { session, handleError } = useGuest();
  const [phase, setPhase] = useState<Phase>('pick');
  const [uri, setUri] = useState<string | null>(null);
  const [message, setMessage] = useState('');
  const [blocked, setBlocked] = useState(false);

  const pick = async (from: 'camera' | 'library') => {
    setMessage('');
    setBlocked(false);
    try {
      if (from === 'camera' && Platform.OS !== 'web') {
        const permission = await ImagePicker.requestCameraPermissionsAsync();
        if (!permission.granted) {
          setBlocked(!permission.canAskAgain);
          setMessage(
            permission.canAskAgain
              ? 'L’accès à la caméra est nécessaire pour prendre une photo.'
              : 'L’accès à la caméra est refusé. Autorisez-le dans les réglages du téléphone.',
          );
          return;
        }
      }
      const result =
        from === 'camera'
          ? await ImagePicker.launchCameraAsync({ ...PICKER_OPTIONS, cameraType: ImagePicker.CameraType.back })
          : await ImagePicker.launchImageLibraryAsync(PICKER_OPTIONS);
      if (result.canceled || !result.assets[0]) return;
      setUri(result.assets[0].uri);
      setPhase('preview');
    } catch {
      setMessage('Impossible d’ouvrir la caméra ou vos photos. Réessayez.');
    }
  };

  const send = async () => {
    if (!uri) return;
    setPhase('sending');
    try {
      await uploadGuestPhoto(uri, session.token);
      setPhase('done');
    } catch (err) {
      handleError(err);
      setMessage(err instanceof ApiError ? err.message : 'L’envoi a échoué.');
      setPhase('error');
    }
  };

  const restart = () => {
    setUri(null);
    setMessage('');
    setPhase('pick');
  };

  if (!isApiConfigured) {
    return (
      <View style={styles.screen}>
        <GuestHeader title="Partager" />
        <StateView
          icon="cloud"
          title="Partage indisponible"
          message="Le serveur Manora Live n’est pas encore configuré sur cette app : les photos ne peuvent pas être envoyées pour l’instant."
        />
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <GuestHeader title="Partager" />
      <ScrollView contentContainerStyle={styles.content}>
        {phase === 'pick' ? (
          <View style={styles.card}>
            <View style={styles.badge}>
              <Icon name="share" size={30} color={colors.terracotta} />
            </View>
            <Text style={styles.title}>Ajoutez votre photo à la galerie</Text>
            <Text style={styles.lead}>Elle apparaîtra en direct chez tous les invités de « {session.event.name} ».</Text>
            <View style={styles.actions}>
              <Button label="Prendre une photo" size="lg" onPress={() => pick('camera')} />
              <Button label="Choisir dans mes photos" variant="secondary" onPress={() => pick('library')} />
            </View>
            {message ? (
              <Text style={styles.error} accessibilityLiveRegion="polite">
                {message}
              </Text>
            ) : null}
            {blocked && Platform.OS !== 'web' ? (
              <Button label="Ouvrir les réglages du téléphone" variant="ghost" onPress={() => Linking.openSettings()} />
            ) : null}
          </View>
        ) : (
          <>
            <View style={styles.preview}>
              {uri ? (
                <Image
                  source={{ uri }}
                  style={StyleSheet.absoluteFill}
                  contentFit="cover"
                  accessibilityLabel="Aperçu de la photo à partager"
                />
              ) : null}
              {phase === 'sending' ? (
                <View style={styles.overlay}>
                  <ActivityIndicator size="large" color={colors.white} />
                </View>
              ) : null}
            </View>

            <View style={styles.card} accessibilityLiveRegion="polite">
              {phase === 'preview' ? (
                <>
                  <Text style={styles.title}>Elle vous plaît ?</Text>
                  <View style={styles.actions}>
                    <Button label="Envoyer dans la galerie" size="lg" onPress={send} />
                    <Button label="Choisir une autre photo" variant="secondary" onPress={restart} />
                  </View>
                </>
              ) : null}
              {phase === 'sending' ? (
                <>
                  <Text style={styles.title}>Envoi en cours…</Text>
                  <Text style={styles.lead}>Quelques secondes et elle arrive dans la galerie.</Text>
                </>
              ) : null}
              {phase === 'done' ? (
                <>
                  <Icon name="check" size={36} color={colors.teal} />
                  <Text style={styles.title}>Photo partagée !</Text>
                  <Text style={styles.lead}>Elle est maintenant dans la galerie en direct.</Text>
                  <View style={styles.actions}>
                    <Button
                      label="Voir la galerie"
                      size="lg"
                      onPress={() => {
                        restart();
                        router.navigate('/gallery');
                      }}
                    />
                    <Button label="Partager une autre photo" variant="secondary" onPress={restart} />
                  </View>
                </>
              ) : null}
              {phase === 'error' ? (
                <>
                  <Text style={styles.title}>L’envoi n’a pas abouti</Text>
                  <Text style={styles.error}>{message}</Text>
                  <View style={styles.actions}>
                    <Button label="Réessayer" size="lg" onPress={send} />
                    <Button label="Choisir une autre photo" variant="secondary" onPress={restart} />
                  </View>
                </>
              ) : null}
            </View>
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  content: { flexGrow: 1, padding: 16, paddingTop: 4, gap: 16, width: '100%', maxWidth: 560, alignSelf: 'center' },
  card: {
    alignItems: 'center',
    gap: 12,
    padding: 24,
    borderRadius: radius.lg,
    backgroundColor: colors.paper,
    borderWidth: 1,
    borderColor: colors.sand,
  },
  badge: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.terracottaSoft,
  },
  title: { fontFamily: fonts.extrabold, fontSize: 24, lineHeight: 30, color: colors.ink, textAlign: 'center' },
  lead: { fontFamily: fonts.medium, fontSize: 16, lineHeight: 24, color: colors.muted, textAlign: 'center' },
  error: { fontFamily: fonts.semibold, fontSize: 15, lineHeight: 22, color: colors.terracottaDark, textAlign: 'center' },
  actions: { alignSelf: 'stretch', gap: 10, marginTop: 4 },
  preview: {
    aspectRatio: 3 / 4,
    overflow: 'hidden',
    borderRadius: radius.xl,
    backgroundColor: colors.sand,
    borderWidth: 1,
    borderColor: colors.sand,
    ...shadow,
  },
  overlay: { ...StyleSheet.absoluteFill, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(19, 37, 55, 0.45)' },
});
