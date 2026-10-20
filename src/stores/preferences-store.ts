import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { storageKeys } from '@/constants/config';
import { defaultNotifications, defaultPrivacy } from '@/services/demo/fixtures';
import { updateNotificationPrefs, updatePrivacySettings } from '@/services/api/profile';
import { useAuthStore } from '@/stores/auth-store';
import type { NotificationPrefs, PrivacySettings } from '@/types/models';

type PreferencesState = {
  privacy: PrivacySettings;
  notifications: NotificationPrefs;
  setPrivacy: (patch: Partial<PrivacySettings>) => Promise<void>;
  setNotifications: (patch: Partial<NotificationPrefs>) => Promise<void>;
};

async function writeLocationMode(privacy: PrivacySettings): Promise<void> {
  const mode = privacy.backgroundSharing ? 'background' : privacy.foregroundSharing ? 'foreground' : 'off';
  await AsyncStorage.setItem(storageKeys.locationMode, mode);
}

export const usePreferencesStore = create<PreferencesState>()(
  persist(
    (set, get) => ({
      privacy: defaultPrivacy,
      notifications: defaultNotifications,
      setPrivacy: async (patch) => {
        const previous = get().privacy;
        const next = { ...previous, ...patch };
        if (!next.foregroundSharing) next.backgroundSharing = false;
        set({ privacy: next });
        await writeLocationMode(next);
        const { isDemo, token } = useAuthStore.getState();
        if (!isDemo && token) {
          try {
            await updatePrivacySettings(next);
          } catch (error) {
            set({ privacy: previous });
            await writeLocationMode(previous);
            throw error;
          }
        }
      },
      setNotifications: async (patch) => {
        const previous = get().notifications;
        const next = { ...previous, ...patch };
        set({ notifications: next });
        const { isDemo, token } = useAuthStore.getState();
        if (!isDemo && token) {
          try {
            await updateNotificationPrefs(next);
          } catch (error) {
            set({ notifications: previous });
            throw error;
          }
        }
      },
    }),
    {
      name: storageKeys.preferences,
      storage: createJSONStorage(() => AsyncStorage),
      merge: (persisted, current) => {
        const saved = persisted as Partial<PreferencesState> | undefined;
        return {
          ...current,
          ...saved,
          privacy: { ...defaultPrivacy, ...saved?.privacy },
          notifications: { ...defaultNotifications, ...saved?.notifications },
        };
      },
    },
  ),
);
