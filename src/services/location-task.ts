import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import * as Location from 'expo-location';
import * as SecureStore from 'expo-secure-store';
import * as TaskManager from 'expo-task-manager';
import { config, storageKeys } from '@/constants/config';

export const LOCATION_TASK = 'velora-background-location';

type LocationTaskData = {
  locations?: Location.LocationObject[];
};

TaskManager.defineTask(LOCATION_TASK, async ({ data, error }) => {
  if (error) return;
  const latest = (data as LocationTaskData | undefined)?.locations?.[0];
  if (!latest) return;
  const [mode, demoFlag] = await AsyncStorage.multiGet([storageKeys.locationMode, storageKeys.isDemo]).then(
    (pairs) => pairs.map((pair) => pair[1]),
  );
  if (demoFlag === 'true' || mode !== 'background') return;
  const token = await SecureStore.getItemAsync(storageKeys.token);
  if (!token || !config.apiUrl) return;
  const speed = latest.coords.speed ?? 0;
  await axios.post(
    `${config.apiUrl}/location/share`,
    {
      latitude: latest.coords.latitude,
      longitude: latest.coords.longitude,
      speedKph: speed > 0 ? speed * 3.6 : 0,
      heading: latest.coords.heading ?? 0,
      recordedAt: new Date(latest.timestamp).toISOString(),
    },
    { headers: { Authorization: `Bearer ${token}` }, timeout: 12_000 },
  );
});
