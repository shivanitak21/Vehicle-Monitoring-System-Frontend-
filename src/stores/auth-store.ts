import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import { create } from 'zustand';
import { storageKeys } from '@/constants/config';
import { fetchMe, loginRequest, logoutRequest, registerRequest } from '@/services/api/auth';
import { setAuthTokenGetter } from '@/services/api/client';
import { DEMO_USER } from '@/services/demo/fixtures';
import { useLiveStore } from '@/stores/live-store';
import type { Role, User } from '@/types/models';

type AuthState = {
  hydrated: boolean;
  token: string | null;
  user: User | null;
  isDemo: boolean;
  hasOnboarded: boolean;
  hydrate: () => Promise<void>;
  completeOnboarding: () => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  register: (input: { name: string; email: string; password: string; role: Role }) => Promise<void>;
  enterDemo: () => Promise<void>;
  updateUser: (user: User) => Promise<void>;
  logout: () => Promise<void>;
};

async function persistSession(user: User, token: string | null, isDemo: boolean) {
  await AsyncStorage.multiSet([
    [storageKeys.user, JSON.stringify(user)],
    [storageKeys.isDemo, isDemo ? 'true' : 'false'],
    [storageKeys.onboarded, 'true'],
  ]);
  if (token) {
    await SecureStore.setItemAsync(storageKeys.token, token);
  } else {
    await SecureStore.deleteItemAsync(storageKeys.token);
  }
}

async function clearSession() {
  await AsyncStorage.multiRemove([storageKeys.user, storageKeys.isDemo]);
  await AsyncStorage.setItem(storageKeys.isDemo, 'false');
  await SecureStore.deleteItemAsync(storageKeys.token);
}

function readUser(raw: string | null): User | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as User;
    if (!parsed?.id || !parsed.email || !parsed.name) return null;
    return parsed;
  } catch {
    return null;
  }
}

export const useAuthStore = create<AuthState>((set, get) => ({
  hydrated: false,
  token: null,
  user: null,
  isDemo: false,
  hasOnboarded: false,
  hydrate: async () => {
    const [onboarded, demoFlag, rawUser] = await AsyncStorage.multiGet([
      storageKeys.onboarded,
      storageKeys.isDemo,
      storageKeys.user,
    ]).then((pairs) => pairs.map((pair) => pair[1]));
    const user = readUser(rawUser ?? null);
    const hasOnboarded = onboarded === 'true';
    if (demoFlag === 'true' && user) {
      set({ user, isDemo: true, token: null, hasOnboarded: true, hydrated: true });
      return;
    }
    const token = await SecureStore.getItemAsync(storageKeys.token);
    if (token && user) {
      set({ token, user, isDemo: false, hasOnboarded: true, hydrated: true });
      try {
        const fresh = await fetchMe();
        await AsyncStorage.setItem(storageKeys.user, JSON.stringify(fresh));
        set({ user: fresh });
      } catch {
        await clearSession();
        set({ token: null, user: null, isDemo: false, hydrated: true, hasOnboarded });
      }
      return;
    }
    set({ hydrated: true, hasOnboarded, user: null, token: null, isDemo: false });
  },
  completeOnboarding: async () => {
    await AsyncStorage.setItem(storageKeys.onboarded, 'true');
    set({ hasOnboarded: true });
  },
  login: async (email, password) => {
    const session = await loginRequest(email, password);
    await persistSession(session.user, session.token, false);
    useLiveStore.getState().reset();
    set({ user: session.user, token: session.token, isDemo: false, hasOnboarded: true });
  },
  register: async (input) => {
    const session = await registerRequest(input);
    await persistSession(session.user, session.token, false);
    useLiveStore.getState().reset();
    set({ user: session.user, token: session.token, isDemo: false, hasOnboarded: true });
  },
  enterDemo: async () => {
    await persistSession(DEMO_USER, null, true);
    useLiveStore.getState().reset();
    useLiveStore.getState().setConnection('demo');
    set({ user: DEMO_USER, token: null, isDemo: true, hasOnboarded: true });
  },
  updateUser: async (user) => {
    await AsyncStorage.setItem(storageKeys.user, JSON.stringify(user));
    set({ user });
  },
  logout: async () => {
    const { isDemo } = get();
    if (!isDemo) await logoutRequest();
    const { stopAllLocationSharing } = await import('@/services/location');
    const { stopRealtime } = await import('@/services/realtime');
    const { stopDemoSimulator } = await import('@/services/demo/simulator');
    stopDemoSimulator();
    stopRealtime();
    await stopAllLocationSharing();
    await clearSession();
    useLiveStore.getState().reset();
    set({ user: null, token: null, isDemo: false });
  },
}));

setAuthTokenGetter(() => useAuthStore.getState().token);
