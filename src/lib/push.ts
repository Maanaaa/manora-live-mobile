import Constants from 'expo-constants';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { router } from 'expo-router';
import { useEffect } from 'react';
import { Platform } from 'react-native';

import { savePushToken } from './api';

// Notifications reçues app ouverte : bandeau et liste, sans son ni pastille.
Notifications.setNotificationHandler({
  handleNotification: async () => ({ shouldShowBanner: true, shouldShowList: true, shouldPlaySound: false, shouldSetBadge: false }),
});

export type PushRegistration = 'registered' | 'denied' | 'unavailable';

/**
 * Demande l'autorisation, obtient le jeton Expo Push et l'envoie à l'API (`POST /push-tokens`).
 * Sans effet sur simulateur ; sur Android, il faut le fichier Firebase (google-services.json) dans le build.
 */
export async function registerForPush(authToken: string): Promise<PushRegistration> {
  if (!Device.isDevice) return 'unavailable';
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'Notifications',
      importance: Notifications.AndroidImportance.HIGH,
    });
  }
  let { status } = await Notifications.getPermissionsAsync();
  if (status !== 'granted') status = (await Notifications.requestPermissionsAsync()).status;
  if (status !== 'granted') return 'denied';

  const projectId = Constants.expoConfig?.extra?.eas?.projectId ?? Constants.easConfig?.projectId;
  try {
    const { data } = await Notifications.getExpoPushTokenAsync({ projectId });
    await savePushToken(data, authToken);
    return 'registered';
  } catch {
    return 'unavailable'; // ex. Firebase non configuré dans ce build
  }
}

/** Ouvre l'écran indiqué par la notification touchée (`data.url`, ex. `/gallery`), même app fermée. */
export function useNotificationRouting() {
  const response = Notifications.useLastNotificationResponse();
  useEffect(() => {
    const url = response?.notification.request.content.data?.url;
    if (typeof url === 'string' && url.startsWith('/')) router.push(url as never);
  }, [response]);
}
