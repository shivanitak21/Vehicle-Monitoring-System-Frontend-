import { toApiError } from '@/lib/errors';
import { api } from '@/services/api/client';
import { useAuthStore } from '@/stores/auth-store';
import type { NotificationPrefs, PrivacySettings, User } from '@/types/models';

export async function updateProfile(input: { name: string; phone?: string }): Promise<User> {
  const current = useAuthStore.getState().user;
  if (!current) throw toApiError(new Error('Sign in before updating your profile.'));
  if (useAuthStore.getState().isDemo) {
    const next = { ...current, name: input.name, phone: input.phone || undefined };
    await useAuthStore.getState().updateUser(next);
    return next;
  }
  try {
    const response = await api.patch<User>('/profile', input);
    await useAuthStore.getState().updateUser(response.data);
    return response.data;
  } catch (error) {
    throw toApiError(error);
  }
}

export async function updatePrivacySettings(privacy: PrivacySettings): Promise<PrivacySettings> {
  try {
    const response = await api.patch<PrivacySettings>('/family/privacy', privacy);
    return response.data;
  } catch (error) {
    throw toApiError(error);
  }
}

export async function updateNotificationPrefs(prefs: NotificationPrefs): Promise<NotificationPrefs> {
  try {
    const response = await api.patch<NotificationPrefs>('/profile/notifications', prefs);
    return response.data;
  } catch (error) {
    throw toApiError(error);
  }
}

export async function registerPushToken(token: string): Promise<void> {
  if (useAuthStore.getState().isDemo) return;
  try {
    await api.post('/devices/push-token', {
      token,
      platform: process.env.EXPO_OS === 'ios' ? 'ios' : 'android',
    });
  } catch (error) {
    throw toApiError(error);
  }
}

export async function fetchPrivacy(): Promise<PrivacySettings> {
  try {
    const response = await api.get<PrivacySettings>('/family/privacy');
    return response.data;
  } catch (error) {
    throw toApiError(error);
  }
}

export async function fetchNotificationPrefs(): Promise<NotificationPrefs> {
  try {
    const response = await api.get<NotificationPrefs>('/profile/notifications');
    return response.data;
  } catch (error) {
    throw toApiError(error);
  }
}
