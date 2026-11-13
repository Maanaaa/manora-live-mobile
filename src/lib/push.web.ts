// Navigateur : pas de notifications push Expo.
export type PushRegistration = 'registered' | 'denied' | 'unavailable';

export async function registerForPush(_authToken: string): Promise<PushRegistration> {
  return 'unavailable';
}

export function useNotificationRouting() {}
