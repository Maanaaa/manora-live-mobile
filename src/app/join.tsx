import { Image } from 'expo-image';
import { Link, router, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button } from '@/components/button';
import { ApiError, isApiConfigured, joinEvent } from '@/lib/api';
import { parseEventCode } from '@/lib/photo-list';
import { setGuestSession } from '@/lib/settings';
import { colors, fonts, radius } from '@/lib/theme';

/**
 * Rejoindre un événement : saisie du code, ou lien `manoralive://join?code=…` ouvert depuis le QR de la borne.
 */
export default function JoinScreen() {
  const params = useLocalSearchParams<{ code?: string; expired?: string }>();
  const [code, setCode] = useState(params.code ?? '');
  const [joining, setJoining] = useState(false);
  const [error, setError] = useState(
    params.expired ? 'Votre accès à l’événement a expiré. Saisissez à nouveau son code.' : '',
  );

  const submit = useCallback(async (value: string) => {
    const parsed = parseEventCode(value);
    if (!parsed) {
      setError('Ce code n’est pas valide. Il figure sous le QR code de la borne.');
      return;
    }
    setJoining(true);
    setError('');
    try {
      await setGuestSession(await joinEvent(parsed));
      router.replace('/gallery');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Impossible de rejoindre l’événement. Réessayez.');
      setJoining(false);
    }
  }, []);

  // Lien profond depuis le QR : on rejoint directement.
  const autoJoined = useRef<string | null>(null);
  useEffect(() => {
    if (!params.code || !isApiConfigured || autoJoined.current === params.code) return;
    autoJoined.current = params.code;
    setCode(params.code);
    submit(params.code);
  }, [params.code, submit]);

  return (
    <SafeAreaView style={styles.screen}>
      <KeyboardAvoidingView style={styles.screen} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <Image
            source={require('@/assets/images/manora-logo.png')}
            style={styles.logo}
            contentFit="contain"
            accessibilityLabel="Manora Live"
          />

          <View style={styles.hero}>
            <Text style={styles.eyebrow}>GALERIE EN DIRECT</Text>
            <Text style={styles.title} accessibilityRole="header">
              Rejoignez l’événement
            </Text>
            <Text style={styles.lead}>
              Scannez le QR code de la borne avec l’appareil photo de votre téléphone, ou saisissez le code de
              l’événement.
            </Text>
          </View>

          {isApiConfigured ? (
            <View style={styles.card}>
              <Text style={styles.label} nativeID="event-code-label">
                Code de l’événement
              </Text>
              <TextInput
                value={code}
                onChangeText={(text) => {
                  setCode(text);
                  if (error) setError('');
                }}
                placeholder="Ex. MARIAGE24"
                placeholderTextColor={colors.muted}
                autoCapitalize="characters"
                autoCorrect={false}
                autoComplete="off"
                returnKeyType="go"
                onSubmitEditing={() => submit(code)}
                editable={!joining}
                style={styles.input}
                accessibilityLabel="Code de l’événement"
                accessibilityLabelledBy="event-code-label"
              />
              {error ? (
                <Text style={styles.error} accessibilityLiveRegion="polite" accessibilityRole="alert">
                  {error}
                </Text>
              ) : null}
              <Button
                label={joining ? 'Connexion…' : 'Rejoindre'}
                accessibilityLabel="Rejoindre l’événement"
                onPress={() => submit(code)}
                disabled={joining || code.trim().length === 0}
              />
              {joining ? <ActivityIndicator color={colors.terracotta} accessibilityLabel="Connexion en cours" /> : null}
            </View>
          ) : (
            <View style={styles.card}>
              <Text style={styles.label}>Serveur non configuré</Text>
              <Text style={styles.help}>
                Le serveur Manora Live n’est pas encore configuré sur cette app : impossible de rejoindre un événement
                pour l’instant.
              </Text>
            </View>
          )}

          <Link href="/settings" style={styles.link} accessibilityRole="button" accessibilityLabel="Ouvrir les réglages">
            Réglages
          </Link>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.cream2 },
  content: { flexGrow: 1, padding: 24, gap: 24, width: '100%', maxWidth: 560, alignSelf: 'center', justifyContent: 'center' },
  logo: { width: 160, height: 50 },
  hero: { gap: 10 },
  eyebrow: { fontFamily: fonts.bold, fontSize: 14, letterSpacing: 2.4, color: colors.terracotta },
  title: { fontFamily: fonts.extrabold, fontSize: 34, lineHeight: 40, color: colors.ink },
  lead: { fontFamily: fonts.medium, fontSize: 17, lineHeight: 26, color: colors.muted },
  card: { padding: 20, gap: 14, borderRadius: radius.lg, backgroundColor: colors.paper, borderWidth: 1, borderColor: colors.sand },
  label: { fontFamily: fonts.bold, fontSize: 18, color: colors.ink },
  help: { fontFamily: fonts.regular, fontSize: 16, lineHeight: 23, color: colors.muted },
  input: {
    minHeight: 56,
    paddingHorizontal: 16,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.sand,
    backgroundColor: colors.white,
    fontFamily: fonts.bold,
    fontSize: 20,
    letterSpacing: 1.5,
    color: colors.ink,
  },
  error: { fontFamily: fonts.semibold, fontSize: 15, lineHeight: 22, color: colors.terracottaDark },
  link: { alignSelf: 'center', fontFamily: fonts.bold, fontSize: 17, color: colors.terracotta, paddingVertical: 12 },
});
