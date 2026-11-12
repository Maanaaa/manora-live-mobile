import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

import { Button } from '@/components/button';
import { Icon, type IconName } from '@/components/icon';
import { colors, fonts, radius } from '@/lib/theme';

type Props = {
  icon?: IconName;
  loading?: boolean;
  title: string;
  message?: string;
  actionLabel?: string;
  onAction?: () => void;
};

/** Écran d'état : chargement, liste vide, erreur ou hors ligne. */
export function StateView({ icon, loading, title, message, actionLabel, onAction }: Props) {
  return (
    <View style={styles.wrap} accessibilityLiveRegion="polite">
      <View style={styles.card}>
        {loading ? (
          <ActivityIndicator size="large" color={colors.terracotta} />
        ) : icon ? (
          <View style={styles.badge}>
            <Icon name={icon} size={30} color={colors.terracotta} />
          </View>
        ) : null}
        <Text style={styles.title} accessibilityRole="header">
          {title}
        </Text>
        {message ? <Text style={styles.message}>{message}</Text> : null}
        {actionLabel && onAction ? <Button label={actionLabel} onPress={onAction} style={styles.action} /> : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flexGrow: 1, justifyContent: 'center', padding: 24 },
  card: {
    alignItems: 'center',
    gap: 12,
    padding: 28,
    borderRadius: radius.lg,
    backgroundColor: colors.paper,
    borderWidth: 1,
    borderColor: colors.sand,
  },
  badge: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.terracottaSoft,
  },
  title: { fontFamily: fonts.extrabold, fontSize: 22, lineHeight: 28, color: colors.ink, textAlign: 'center' },
  message: { fontFamily: fonts.medium, fontSize: 16, lineHeight: 24, color: colors.muted, textAlign: 'center' },
  action: { marginTop: 8, alignSelf: 'stretch' },
});
