import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Switch, Text, TextInput, View } from 'react-native';

import { Button } from '@/components/button';
import { API_URL, isApiConfigured } from '@/lib/api';
import { getBoothKey, getMode, setBoothKey, setMode } from '@/lib/settings';
import { colors, fonts, radius } from '@/lib/theme';

export default function SettingsScreen() {
  const [kiosk, setKiosk] = useState(false);
  const [key, setKey] = useState('');
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    Promise.all([getMode(), getBoothKey()]).then(([mode, storedKey]) => {
      setKiosk(mode === 'kiosk');
      setKey(storedKey ?? '');
      setLoaded(true);
    });
  }, []);

  const save = async () => {
    await setBoothKey(key);
    await setMode(kiosk ? 'kiosk' : 'guest');
    if (router.canDismiss()) router.dismissAll();
    router.replace(kiosk ? '/kiosk' : '/');
  };

  if (!loaded) return null;

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <View style={styles.card}>
        <View style={styles.row}>
          <View style={styles.rowText}>
            <Text style={styles.label}>Mode borne</Text>
            <Text style={styles.help}>
              Cet appareil devient la borne photo : plein écran, caméra frontale, décompte et QR. Pour en sortir,
              appui long sur le logo.
            </Text>
          </View>
          <Switch
            value={kiosk}
            onValueChange={setKiosk}
            trackColor={{ true: colors.terracotta, false: colors.sand }}
            accessibilityLabel="Activer le mode borne"
          />
        </View>

        {kiosk ? (
          <View style={styles.field}>
            <Text style={styles.label}>Clé d’API de la borne</Text>
            <Text style={styles.help}>Créée dans le back-office. Elle reste chiffrée sur cet appareil.</Text>
            <TextInput
              value={key}
              onChangeText={setKey}
              placeholder="mlk_…"
              placeholderTextColor={colors.muted}
              autoCapitalize="none"
              autoCorrect={false}
              secureTextEntry
              style={styles.input}
              accessibilityLabel="Clé d'API de la borne"
            />
          </View>
        ) : null}
      </View>

      <Text style={styles.meta}>
        Serveur : {isApiConfigured ? API_URL : 'non configuré (mode démo)'}
      </Text>

      <Button label="Enregistrer" onPress={save} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.cream2 },
  content: { padding: 24, gap: 20, maxWidth: 640, width: '100%', alignSelf: 'center' },
  card: { padding: 20, gap: 20, borderRadius: radius.lg, backgroundColor: colors.paper, borderWidth: 1, borderColor: colors.sand },
  row: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  rowText: { flex: 1, gap: 4 },
  field: { gap: 6 },
  label: { fontFamily: fonts.bold, fontSize: 18, color: colors.ink },
  help: { fontFamily: fonts.regular, fontSize: 15, lineHeight: 21, color: colors.muted },
  input: {
    marginTop: 6,
    minHeight: 52,
    paddingHorizontal: 16,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.sand,
    backgroundColor: colors.white,
    fontFamily: fonts.medium,
    fontSize: 17,
    color: colors.ink,
  },
  meta: { fontFamily: fonts.medium, fontSize: 14, color: colors.muted },
});
