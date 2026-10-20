import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { config } from '@/constants/config';
import { registerPushToken } from '@/services/api/profile';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export async function requestNotificationPermission(): Promise<string | null> {
  const current = await Notifications.getPermissionsAsync();
  const permission =
    current.status === 'granted' ? current : await Notifications.requestPermissionsAsync();
  if (permission.status !== 'granted') {
    return 'Notifications stay off. Velora will not send trip or safety alerts to this phone.';
  }
  return null;
}

export async function syncPushToken(): Promise<string | null> {
  if (!Device.isDevice) {
    return 'Push registration needs a physical device. Local previews still work in the simulator.';
  }
  if (!config.easProjectId) {
    return 'Add EXPO_PUBLIC_EAS_PROJECT_ID to register this device with your backend.';
  }
  const token = await Notifications.getExpoPushTokenAsync({ projectId: config.easProjectId });
  await registerPushToken(token.data);
  return null;
}

export async function previewSafetyNotification(incidentId?: string): Promise<void> {
  await Notifications.scheduleNotificationAsync({
    content: {
      title: 'Velora demo alert',
      body: 'Simulated speeding notice. This is not a live safety event.',
      data: incidentId ? { incidentId } : { demo: true },
    },
    trigger: null,
  });
}
