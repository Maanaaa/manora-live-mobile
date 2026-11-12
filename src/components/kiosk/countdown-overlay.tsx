import { useEffect, useState } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';

import { colors, fonts } from '@/lib/theme';

/** Grand chiffre du décompte, posé sur l'aperçu caméra. Rejoue l'animation à chaque seconde. */
export function CountdownOverlay({ value }: { value: number }) {
  const [scale] = useState(() => new Animated.Value(1.4));
  const [opacity] = useState(() => new Animated.Value(0));

  useEffect(() => {
    scale.setValue(1.4);
    opacity.setValue(0);
    Animated.parallel([
      Animated.spring(scale, { toValue: 1, friction: 6, useNativeDriver: true }),
      Animated.timing(opacity, { toValue: 1, duration: 180, useNativeDriver: true }),
    ]).start();
  }, [value, scale, opacity]);

  return (
    <View style={styles.wrap} pointerEvents="none" accessibilityLiveRegion="assertive">
      <Animated.View style={[styles.bubble, { opacity, transform: [{ scale }] }]}>
        <Text style={styles.number} accessibilityLabel={`Photo dans ${value}`}>
          {value}
        </Text>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { position: 'absolute', top: 0, right: 0, bottom: 0, left: 0, alignItems: 'center', justifyContent: 'center' },
  bubble: {
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: 'rgba(255, 250, 241, 0.88)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  number: { fontFamily: fonts.extrabold, fontSize: 132, lineHeight: 150, color: colors.terracotta },
});
