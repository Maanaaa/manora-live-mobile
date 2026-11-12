import { Image } from 'expo-image';
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button } from '@/components/button';
import { Icon } from '@/components/icon';
import { ApiError, deletePhoto, type Photo } from '@/lib/api';
import { confirm } from '@/lib/confirm';
import { saveToPhone } from '@/lib/save-photo';
import { useGuest } from '@/lib/guest-context';
import { colors, fonts } from '@/lib/theme';

type Busy = 'save' | 'delete' | null;

function formatTime(iso: string) {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
}

/** Fiche photo en plein écran : enregistrer sur le téléphone, supprimer si c'est la mienne. */
export default function PhotoScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { session, findPhoto, emit, handleError } = useGuest();
  const insets = useSafeAreaInsets();
  const photo = id ? findPhoto(id) : undefined;

  const [busy, setBusy] = useState<Busy>(null);
  const [notice, setNotice] = useState<{ text: string; error: boolean } | null>(null);

  const close = () => (router.canGoBack() ? router.back() : router.replace('/gallery'));

  if (!photo) {
    return (
      <View style={[styles.screen, styles.center, { paddingTop: insets.top }]}>
        <Text style={styles.title}>Photo introuvable</Text>
        <Text style={styles.meta}>Elle a peut-être été supprimée.</Text>
        <Button label="Revenir à la galerie" variant="secondary" onPress={close} />
      </View>
    );
  }

  const save = async () => {
    setBusy('save');
    setNotice(null);
    try {
      await saveToPhone(photo);
      if (Platform.OS !== 'web') setNotice({ text: 'Photo enregistrée sur votre téléphone.', error: false });
    } catch (err) {
      setNotice({ text: err instanceof Error ? err.message : 'L’enregistrement a échoué.', error: true });
    } finally {
      setBusy(null);
    }
  };

  const remove = async () => {
    const ok = await confirm(
      'Supprimer cette photo ?',
      'Elle disparaîtra de la galerie pour tous les invités.',
      'Supprimer',
    );
    if (!ok) return;
    setBusy('delete');
    setNotice(null);
    try {
      await deletePhoto(photo.id, session.token);
      emit({ type: 'photo.deleted', data: { id: photo.id } });
      close();
    } catch (err) {
      handleError(err);
      setNotice({ text: err instanceof ApiError ? err.message : 'La suppression a échoué.', error: true });
      setBusy(null);
    }
  };

  const author = photo.source === 'booth' ? 'Photo de la borne' : photo.mine ? 'Votre photo' : `Photo de ${photo.authorName ?? 'un invité'}`;
  const time = formatTime(photo.createdAt);

  return (
    <View style={styles.screen}>
      <Image
        source={{ uri: photo.url }}
        placeholder={{ uri: photo.thumbUrl }}
        placeholderContentFit="contain"
        style={StyleSheet.absoluteFill}
        contentFit="contain"
        transition={200}
        accessibilityLabel={author}
      />

      <View style={[styles.top, { paddingTop: insets.top + 12 }]}>
        <View style={styles.caption}>
          <Text style={styles.title} numberOfLines={1}>
            {author}
          </Text>
          {time ? <Text style={styles.meta}>Prise à {time}</Text> : null}
        </View>
        <Pressable
          onPress={close}
          accessibilityRole="button"
          accessibilityLabel="Fermer la photo"
          hitSlop={8}
          style={({ pressed }) => [styles.close, pressed && styles.pressed]}>
          <Icon name="close" size={22} color={colors.white} />
        </Pressable>
      </View>

      <View style={[styles.bottom, { paddingBottom: insets.bottom + 16 }]}>
        {notice ? (
          <Text style={[styles.notice, notice.error && styles.noticeError]} accessibilityLiveRegion="polite">
            {notice.text}
          </Text>
        ) : null}
        <View style={styles.actions}>
          <Button
            label={busy === 'save' ? 'Enregistrement…' : 'Enregistrer'}
            accessibilityLabel="Enregistrer la photo sur mon téléphone"
            onPress={save}
            disabled={busy !== null}
            style={styles.action}
          />
          {photo.mine ? (
            <Button
              label={busy === 'delete' ? 'Suppression…' : 'Supprimer'}
              variant="secondary"
              accessibilityLabel="Supprimer ma photo de la galerie"
              onPress={remove}
              disabled={busy !== null}
            />
          ) : null}
        </View>
        {busy ? <ActivityIndicator color={colors.white} accessibilityLabel="Patientez" /> : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.ink },
  center: { alignItems: 'center', justifyContent: 'center', gap: 16, padding: 24 },
  top: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 20,
    paddingBottom: 16,
    backgroundColor: 'rgba(19, 37, 55, 0.7)',
  },
  caption: { flex: 1, gap: 2 },
  title: { fontFamily: fonts.extrabold, fontSize: 20, color: colors.white },
  meta: { fontFamily: fonts.medium, fontSize: 15, color: colors.cream },
  close: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.16)',
  },
  pressed: { opacity: 0.7 },
  bottom: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    gap: 12,
    paddingHorizontal: 20,
    paddingTop: 16,
    backgroundColor: 'rgba(19, 37, 55, 0.7)',
  },
  actions: { flexDirection: 'row', gap: 10 },
  action: { flex: 1 },
  notice: { fontFamily: fonts.semibold, fontSize: 15, lineHeight: 22, color: colors.cream, textAlign: 'center' },
  noticeError: { color: colors.peach },
});
