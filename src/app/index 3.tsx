import { Redirect, type Href } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';

import { getGuestSession, getMode } from '@/lib/settings';
import { colors } from '@/lib/theme';

/**
 * Aiguillage au lancement : une tablette réglée en mode borne démarre directement sur la borne ;
 * sinon l'invité retrouve sa galerie, ou l'écran pour rejoindre un événement.
 */
export default function Index() {
  const [target, setTarget] = useState<Href | null>(null);

  useEffect(() => {
    (async () => {
      if ((await getMode()) === 'kiosk') return setTarget('/kiosk');
      setTarget((await getGuestSession()) ? '/gallery' : '/join');
    })();
  }, []);

  if (!target) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.cream2 }}>
        <ActivityIndicator color={colors.terracotta} accessibilityLabel="Chargement" />
      </View>
    );
  }

  return <Redirect href={target} />;
}
