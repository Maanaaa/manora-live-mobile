import { StyleSheet, Text, View } from 'react-native';

import type { LinkState } from '@/lib/use-booth-events';
import { colors, fonts } from '@/lib/theme';

const LABELS: Record<LinkState, { text: string; dot: string }> = {
  demo: { text: 'Mode démo', dot: colors.sand },
  connecting: { text: 'Connexion…', dot: '#e8a838' },
  online: { text: 'Borne connectée', dot: colors.teal },
  offline: { text: 'Hors ligne', dot: colors.terracotta },
};

export function StatusChip({ state }: { state: LinkState }) {
  const { text, dot } = LABELS[state];
  return (
    <View style={styles.chip} accessibilityLabel={`État de la borne : ${text}`}>
      <View style={[styles.dot, { backgroundColor: dot }]} />
      <Text style={styles.text}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: colors.paper,
    borderWidth: 1,
    borderColor: colors.line,
  },
  dot: { width: 10, height: 10, borderRadius: 5 },
  text: { fontFamily: fonts.semibold, fontSize: 14, color: colors.muted },
});
