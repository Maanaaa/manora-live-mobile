import { Pressable, StyleSheet, Text, type PressableProps, type StyleProp, type ViewStyle } from 'react-native';

import { colors, fonts } from '@/lib/theme';

type Variant = 'primary' | 'secondary' | 'ghost';

type Props = Omit<PressableProps, 'children' | 'style'> & {
  label: string;
  variant?: Variant;
  size?: 'md' | 'lg';
  style?: StyleProp<ViewStyle>;
};

export function Button({ label, variant = 'primary', size = 'md', style, disabled, ...rest }: Props) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: !!disabled }}
      disabled={disabled}
      style={({ pressed }) => [
        styles.base,
        size === 'lg' && styles.lg,
        styles[variant],
        pressed && styles.pressed,
        disabled && styles.disabled,
        style,
      ]}
      {...rest}>
      <Text style={[styles.label, size === 'lg' && styles.labelLg, variant === 'primary' && styles.labelPrimary]}>
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    minHeight: 56,
    paddingHorizontal: 28,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
  },
  lg: { minHeight: 76, paddingHorizontal: 40 },
  primary: { backgroundColor: colors.terracotta, borderColor: colors.terracotta },
  secondary: { backgroundColor: colors.paper, borderColor: colors.sand },
  ghost: { backgroundColor: 'transparent', borderColor: 'transparent' },
  pressed: { transform: [{ scale: 0.97 }], opacity: 0.9 },
  disabled: { opacity: 0.45 },
  label: { fontFamily: fonts.bold, fontSize: 18, color: colors.ink },
  labelLg: { fontSize: 24, fontFamily: fonts.extrabold },
  labelPrimary: { color: colors.white },
});
