import * as Updates from 'expo-updates';
import { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, AppState, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { colors, fonts, radius, shadow } from '@/lib/theme';

const CHECK_EVERY_MS = 30 * 60 * 1000;

type State = 'idle' | 'available' | 'installing' | 'error';

/**
 * Mises à jour over the air (EAS Update) : jamais appliquées d'office.
 * L'app vérifie au lancement, au retour au premier plan et toutes les 30 min (`checkAutomatically: NEVER`
 * dans app.json), puis propose « Installer ». Rien sur le web ni en développement (expo-updates inactif).
 */
export function UpdateBanner() {
  const insets = useSafeAreaInsets();
  const [state, setState] = useState<State>('idle');
  const dismissedAt = useRef(0);
  const enabled = Platform.OS !== 'web' && Updates.isEnabled && !__DEV__;

  const check = useCallback(async () => {
    if (!enabled) return;
    // « Plus tard » : on ne redemande pas avant la prochaine vérification périodique.
    if (Date.now() - dismissedAt.current < CHECK_EVERY_MS) return;
    try {
      const result = await Updates.checkForUpdateAsync();
      if (result.isAvailable) setState((s) => (s === 'installing' ? s : 'available'));
    } catch {
      // Pas de réseau : on réessaiera plus tard, sans déranger l'utilisateur.
    }
  }, [enabled]);

  useEffect(() => {
    if (!enabled) return;
    const first = setTimeout(check, 0);
    const timer = setInterval(check, CHECK_EVERY_MS);
    const sub = AppState.addEventListener('change', (next) => {
      if (next === 'active') check();
    });
    return () => {
      clearTimeout(first);
      clearInterval(timer);
      sub.remove();
    };
  }, [enabled, check]);

  const install = async () => {
    setState('installing');
    try {
      const result = await Updates.fetchUpdateAsync();
      if (result.isNew) await Updates.reloadAsync();
      else setState('idle');
    } catch {
      setState('error');
    }
  };

  if (state === 'idle') return null;

  return (
    <View style={[styles.wrap, { bottom: insets.bottom + 16 }]} pointerEvents="box-none">
      <View style={styles.card} accessibilityRole="alert">
        <View style={styles.copy}>
          <Text style={styles.title}>{state === 'error' ? 'La mise à jour a échoué' : 'Une mise à jour est disponible'}</Text>
          <Text style={styles.text}>
            {state === 'installing'
              ? 'Téléchargement… l’app va redémarrer.'
              : state === 'error'
                ? 'Vérifiez la connexion et réessayez.'
                : 'Installez-la pour profiter des dernières améliorations.'}
          </Text>
        </View>
        {state === 'installing' ? (
          <ActivityIndicator color={colors.terracotta} accessibilityLabel="Installation en cours" />
        ) : (
          <View style={styles.actions}>
            <Pressable
              onPress={() => {
                dismissedAt.current = Date.now();
                setState('idle');
              }}
              accessibilityRole="button"
              accessibilityLabel="Plus tard"
              style={({ pressed }) => [styles.later, pressed && styles.pressed]}>
              <Text style={styles.laterText}>Plus tard</Text>
            </Pressable>
            <Pressable
              onPress={install}
              accessibilityRole="button"
              accessibilityLabel={state === 'error' ? 'Réessayer la mise à jour' : 'Installer la mise à jour'}
              style={({ pressed }) => [styles.install, pressed && styles.pressed]}>
              <Text style={styles.installText}>{state === 'error' ? 'Réessayer' : 'Installer'}</Text>
            </Pressable>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { position: 'absolute', left: 16, right: 16, alignItems: 'center', zIndex: 1000 },
  card: {
    width: '100%',
    maxWidth: 560,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    padding: 16,
    borderRadius: radius.lg,
    backgroundColor: colors.paper,
    borderWidth: 1,
    borderColor: colors.sand,
    ...shadow,
  },
  copy: { flex: 1, gap: 2 },
  title: { fontFamily: fonts.extrabold, fontSize: 16, color: colors.ink },
  text: { fontFamily: fonts.medium, fontSize: 14, lineHeight: 19, color: colors.muted },
  actions: { flexDirection: 'row', gap: 8 },
  later: { minHeight: 44, paddingHorizontal: 14, borderRadius: 999, justifyContent: 'center' },
  laterText: { fontFamily: fonts.bold, fontSize: 15, color: colors.muted },
  install: { minHeight: 44, paddingHorizontal: 18, borderRadius: 999, justifyContent: 'center', backgroundColor: colors.terracotta },
  installText: { fontFamily: fonts.extrabold, fontSize: 15, color: colors.white },
  pressed: { opacity: 0.85 },
});
