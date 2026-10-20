export const config = {
  apiUrl: process.env.EXPO_PUBLIC_API_URL?.replace(/\/$/, '') ?? '',
  socketUrl: process.env.EXPO_PUBLIC_SOCKET_URL?.replace(/\/$/, '') ?? '',
  easProjectId: process.env.EXPO_PUBLIC_EAS_PROJECT_ID ?? '',
} as const;

export const socketEvents = {
  location: 'trip:location',
  status: 'trip:status',
  safety: 'safety:event',
  cabin: 'cabin:state',
} as const;

export const storageKeys = {
  onboarded: 'velora.onboarded',
  isDemo: 'velora.isDemo',
  user: 'velora.user',
  token: 'velora.token',
  locationMode: 'velora.locationMode',
  demo: 'velora.demo',
  preferences: 'velora.preferences',
} as const;
