import { Redirect, Stack } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';

import { GuestProvider } from '@/lib/guest-context';
import { getGuestSession, type GuestSession } from '@/lib/settings';
import { colors } from '@/lib/theme';

/** Mode invité : il faut avoir rejoint un événement (jeton dans expo-secure-store). */
export default function GuestLayout() {
  const [session, setSession] = useState<GuestSession | null | undefined>(undefined);

  useEffect(() => {
    getGuestSession().then(setSession);
  }, []);

  if (session === undefined) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.cream2 }}>
        <ActivityIndicator color={colors.terracotta} accessibilityLabel="Chargement" />
      </View>
    );
  }

  if (!session) return <Redirect href="/join" />;

  return (
    <GuestProvider session={session}>
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.cream2 } }}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen
          name="photo/[id]"
          options={{ presentation: 'fullScreenModal', animation: 'fade', contentStyle: { backgroundColor: colors.ink } }}
        />
      </Stack>
    </GuestProvider>
  );
}
