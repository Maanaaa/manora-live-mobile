import { StyleSheet, Text, View } from 'react-native';

import type { LinkState } from '@/lib/use-live-socket';
import { colors, fonts } from '@/lib/theme';

const LABELS: Record<LinkState, { text: string; dot: string }> = {
  demo: { text: 'Hors ligne', dot: colors.sand },
  connecting: { text: 'Connexion…', dot: '#e8a838' },
  online: { text: 'En direct', dot: colors.teal },
  offline: { text: 'Hors ligne', dot: colors.terracotta },
};

/** Pastille d'état du temps réel de la galerie. */
export function LiveBadge({ state }: { state: LinkState }) {
  const { text, dot } = LABELS[state];
  return (
    <View style={styles.chip} accessible accessibilityLabel={`Galerie : ${text}`}>
      <View style={[styles.dot, { backgroundColor: dot }]} />
      <Text style={styles.text}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    backgroundColor: colors.paper,
    borderWidth: 1,
    borderColor: colors.line,
  },
  dot: { width: 8, height: 8, borderRadius: 4 },
  text: { fontFamily: fonts.semibold, fontSize: 13, color: colors.muted },
});
