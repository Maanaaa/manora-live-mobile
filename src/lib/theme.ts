// Charte Manora : reprise des tokens du site (manora-site-vitrine) et de l'ambiance ManaBooth.
export const colors = {
  ink: '#132537',
  inkLight: '#22384f',
  muted: '#475569',
  terracotta: '#b83a22',
  terracottaDark: '#9c2e19',
  terracottaSoft: '#fff1ee',
  cream: '#fff3df',
  cream2: '#fffaf1',
  paper: '#fffefb',
  sand: '#ead8bd',
  peach: '#ffc8ad',
  teal: '#136d66',
  line: 'rgba(19, 37, 55, 0.08)',
  lineStrong: 'rgba(19, 37, 55, 0.16)',
  white: '#ffffff',
} as const;

export const fonts = {
  regular: 'PlusJakartaSans_400Regular',
  medium: 'PlusJakartaSans_500Medium',
  semibold: 'PlusJakartaSans_600SemiBold',
  bold: 'PlusJakartaSans_700Bold',
  extrabold: 'PlusJakartaSans_800ExtraBold',
} as const;

export const radius = { sm: 14, md: 20, lg: 32, xl: 42 } as const;

export const shadow = {
  shadowColor: colors.ink,
  shadowOpacity: 0.12,
  shadowRadius: 28,
  shadowOffset: { width: 0, height: 16 },
  elevation: 8,
} as const;
