import { StyleSheet, Text, View } from 'react-native';
import QRCode from 'react-native-qrcode-svg';

import { colors, fonts, radius } from '@/lib/theme';

export function QrCard({ value, title, caption, size = 200 }: { value: string; title: string; caption?: string; size?: number }) {
  return (
    <View style={styles.card} accessible accessibilityLabel={`${title}. QR code à scanner.`}>
      <View style={styles.qr}>
        <QRCode value={value} size={size} color={colors.ink} backgroundColor={colors.white} />
      </View>
      <View style={styles.copy}>
        <Text style={styles.title}>{title}</Text>
        {caption ? <Text style={styles.caption}>{caption}</Text> : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 20,
    padding: 18,
    borderRadius: radius.lg,
    backgroundColor: colors.paper,
    borderWidth: 1,
    borderColor: colors.sand,
  },
  qr: { padding: 10, borderRadius: radius.sm, backgroundColor: colors.white },
  copy: { flex: 1, gap: 6 },
  title: { fontFamily: fonts.extrabold, fontSize: 20, color: colors.ink },
  caption: { fontFamily: fonts.medium, fontSize: 15, lineHeight: 21, color: colors.muted },
});
