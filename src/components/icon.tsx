import { SymbolView } from 'expo-symbols';
import type { ColorValue } from 'react-native';

// Icônes système : SF Symbols sur iOS, Material Symbols sur Android et le web.
const ICONS = {
  gallery: { ios: 'photo.on.rectangle', android: 'photo_library', web: 'photo_library' },
  mine: { ios: 'person.crop.square', android: 'account_box', web: 'account_box' },
  share: { ios: 'camera', android: 'add_a_photo', web: 'add_a_photo' },
  library: { ios: 'photo', android: 'image', web: 'image' },
  settings: { ios: 'gearshape', android: 'settings', web: 'settings' },
  leave: { ios: 'rectangle.portrait.and.arrow.right', android: 'logout', web: 'logout' },
  close: { ios: 'xmark', android: 'close', web: 'close' },
  save: { ios: 'square.and.arrow.down', android: 'download', web: 'download' },
  trash: { ios: 'trash', android: 'delete', web: 'delete' },
  offline: { ios: 'wifi.slash', android: 'wifi_off', web: 'wifi_off' },
  cloud: { ios: 'icloud.slash', android: 'cloud_off', web: 'cloud_off' },
  check: { ios: 'checkmark.circle', android: 'check_circle', web: 'check_circle' },
  warning: { ios: 'exclamationmark.triangle', android: 'warning', web: 'warning' },
} as const;

export type IconName = keyof typeof ICONS;

export function Icon({ name, size = 24, color }: { name: IconName; size?: number; color: ColorValue }) {
  return (
    <SymbolView
      name={ICONS[name]}
      size={size}
      tintColor={color}
      accessibilityElementsHidden
      importantForAccessibility="no"
    />
  );
}
