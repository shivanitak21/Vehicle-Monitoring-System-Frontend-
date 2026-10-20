import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import * as Location from 'expo-location';
import * as SecureStore from 'expo-secure-store';
import { config, storageKeys } from '@/constants/config';
import { LOCATION_TASK } from '@/services/location-task';

let watch: Location.LocationSubscription | null = null;

async function publishFix(location: Location.LocationObject): Promise<void> {
  const [mode, demoFlag] = await AsyncStorage.multiGet([storageKeys.locationMode, storageKeys.isDemo]).then(
    (pairs) => pairs.map((pair) => pair[1]),
  );
  if (demoFlag === 'true') return;
  if (mode !== 'foreground' && mode !== 'background') return;
  const token = await SecureStore.getItemAsync(storageKeys.token);
  if (!token || !config.apiUrl) return;
  const speed = location.coords.speed ?? 0;
  await axios.post(
    `${config.apiUrl}/location/share`,
    {
      latitude: location.coords.latitude,
      longitude: location.coords.longitude,
      speedKph: speed > 0 ? speed * 3.6 : 0,
      heading: location.coords.heading ?? 0,
      recordedAt: new Date(location.timestamp).toISOString(),
    },
    { headers: { Authorization: `Bearer ${token}` }, timeout: 12_000 },
  );
}

export async function enableForegroundSharing(): Promise<string | null> {
  const current = await Location.getForegroundPermissionsAsync();
  const permission =
    current.status === 'granted' ? current : await Location.requestForegroundPermissionsAsync();
  if (permission.status !== 'granted') {
    return permission.canAskAgain
      ? 'Location stays off until you allow it. Velora will not read this phone’s position.'
      : 'Location permission is blocked. Enable it in system settings if you want to share this phone.';
  }
  if (!watch) {
    watch = await Location.watchPositionAsync(
      { accuracy: Location.Accuracy.Balanced, timeInterval: 12_000, distanceInterval: 20 },
      (location) => {
        void publishFix(location);
      },
    );
  }
  return null;
}

export async function enableBackgroundSharing(): Promise<string | null> {
  const foreground = await enableForegroundSharing();
  if (foreground) return foreground;
  const current = await Location.getBackgroundPermissionsAsync();
  const permission =
    current.status === 'granted' ? current : await Location.requestBackgroundPermissionsAsync();
  if (permission.status !== 'granted') {
    return 'Background sharing stays off. Velora can still share while the app is open.';
  }
  const started = await Location.hasStartedLocationUpdatesAsync(LOCATION_TASK);
  if (!started) {
    await Location.startLocationUpdatesAsync(LOCATION_TASK, {
      accuracy: Location.Accuracy.Balanced,
      timeInterval: 15_000,
      distanceInterval: 30,
      showsBackgroundLocationIndicator: true,
      foregroundService: {
        notificationTitle: 'Velora is sharing your trip',
        notificationBody: 'Location sharing stays on only while you allow it in Privacy.',
        notificationColor: '#D6FF4A',
      },
    });
  }
  return null;
}

export function stopForegroundWatch(): void {
  watch?.remove();
  watch = null;
}

export async function stopBackgroundUpdates(): Promise<void> {
  const started = await Location.hasStartedLocationUpdatesAsync(LOCATION_TASK);
  if (started) await Location.stopLocationUpdatesAsync(LOCATION_TASK);
}

export async function stopAllLocationSharing(): Promise<void> {
  stopForegroundWatch();
  await stopBackgroundUpdates();
}
