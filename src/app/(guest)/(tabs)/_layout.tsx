import { Tabs } from 'expo-router/tabs';

import { Icon } from '@/components/icon';
import { colors, fonts } from '@/lib/theme';

/** Onglets invité : galerie en direct, mes photos, partager. */
export default function GuestTabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        sceneStyle: { backgroundColor: colors.cream2 },
        tabBarActiveTintColor: colors.terracotta,
        tabBarInactiveTintColor: colors.muted,
        tabBarStyle: { backgroundColor: colors.paper, borderTopColor: colors.sand },
        tabBarLabelStyle: { fontFamily: fonts.bold, fontSize: 13 },
      }}>
      <Tabs.Screen
        name="gallery"
        options={{
          title: 'Galerie',
          tabBarAccessibilityLabel: 'Galerie en direct',
          tabBarIcon: ({ color }) => <Icon name="gallery" color={color} />,
        }}
      />
      <Tabs.Screen
        name="mine"
        options={{
          title: 'Mes photos',
          tabBarAccessibilityLabel: 'Mes photos',
          tabBarIcon: ({ color }) => <Icon name="mine" color={color} />,
        }}
      />
      <Tabs.Screen
        name="share"
        options={{
          title: 'Partager',
          tabBarAccessibilityLabel: 'Partager une photo',
          tabBarIcon: ({ color }) => <Icon name="share" color={color} />,
        }}
      />
    </Tabs>
  );
}
