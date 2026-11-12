import { Redirect } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';

import { getMode, type AppMode } from '@/lib/settings';
import { colors } from '@/lib/theme';

/** Aiguillage au lancement : une tablette réglée en mode borne démarre directement sur la borne. */
export default function Index() {
  const [mode, setMode] = useState<AppMode | null>(null);

  useEffect(() => {
    getMode().then(setMode);
  }, []);

  if (!mode) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.cream2 }}>
        <ActivityIndicator color={colors.terracotta} />
      </View>
    );
  }

  return <Redirect href={mode === 'kiosk' ? '/kiosk' : '/guest'} />;
}
