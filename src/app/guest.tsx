import { Image } from 'expo-image';
import { Link } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { colors, fonts, radius } from '@/lib/theme';

// Mode utilisateur (par défaut) : galerie en direct, mes photos, envoi. À construire.
export default function GuestHome() {
  return (
    <SafeAreaView style={styles.screen}>
      <Image source={require('@/assets/images/manora-logo.png')} style={styles.logo} contentFit="contain" />
      <View style={styles.card}>
        <Text style={styles.title}>La galerie en direct</Text>
        <Text style={styles.lead}>Retrouvez vos photos de la soirée et partagez les vôtres.</Text>
      </View>
      <Link href="/settings" style={styles.link} accessibilityLabel="Ouvrir les réglages">
        Réglages
      </Link>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.cream2, padding: 24, gap: 24 },
  logo: { width: 160, height: 50 },
  card: { padding: 24, borderRadius: radius.lg, backgroundColor: colors.paper, borderWidth: 1, borderColor: colors.sand, gap: 8 },
  title: { fontFamily: fonts.extrabold, fontSize: 28, color: colors.ink },
  lead: { fontFamily: fonts.medium, fontSize: 17, lineHeight: 25, color: colors.muted },
  link: { fontFamily: fonts.bold, fontSize: 17, color: colors.terracotta, paddingVertical: 12 },
});
