import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Icon, type IconName } from '@/components/icon';
import { confirm } from '@/lib/confirm';
import { useGuest } from '@/lib/guest-context';
import { colors, fonts } from '@/lib/theme';

import { LiveBadge } from './live-badge';

/** En-tête des onglets invité : nom de l'événement, état du direct, réglages et sortie. */
export function GuestHeader({ title }: { title: string }) {
  const { top } = useSafeAreaInsets();
  const { session, live, leave } = useGuest();

  const onLeave = async () => {
    const ok = await confirm(
      'Quitter l’événement ?',
      `Vous ne verrez plus la galerie de « ${session.event.name} ». Vous pourrez la rejoindre à nouveau avec son code.`,
      'Quitter',
    );
    if (ok) leave();
  };

  return (
    <View style={[styles.header, { paddingTop: top + 12 }]}>
      <View style={styles.row}>
        <Text style={styles.event} numberOfLines={1}>
          {session.event.name}
        </Text>
        <LiveBadge state={live} />
      </View>
      <View style={styles.row}>
        <Text style={styles.title} accessibilityRole="header" numberOfLines={1}>
          {title}
        </Text>
        <View style={styles.actions}>
          <HeaderButton icon="settings" label="Ouvrir les réglages" onPress={() => router.push('/settings')} />
          <HeaderButton icon="leave" label="Quitter l’événement" onPress={onLeave} />
        </View>
      </View>
    </View>
  );
}

function HeaderButton({ icon, label, onPress }: { icon: IconName; label: string; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      hitSlop={6}
      style={({ pressed }) => [styles.iconButton, pressed && styles.pressed]}>
      <Icon name={icon} size={22} color={colors.ink} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  header: { paddingHorizontal: 20, paddingBottom: 12, gap: 6, backgroundColor: colors.cream2 },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  event: { flex: 1, fontFamily: fonts.bold, fontSize: 14, letterSpacing: 1.2, color: colors.terracotta, textTransform: 'uppercase' },
  title: { flex: 1, fontFamily: fonts.extrabold, fontSize: 30, lineHeight: 36, color: colors.ink },
  actions: { flexDirection: 'row', gap: 8 },
  iconButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.paper,
    borderWidth: 1,
    borderColor: colors.sand,
  },
  pressed: { transform: [{ scale: 0.95 }], opacity: 0.85 },
});
