import type { SafetyKind } from '@/types/models';

export const safetyKindLabel: Record<SafetyKind, string> = {
  fatigue: 'Fatigue',
  distraction: 'Distraction',
  speeding: 'Speeding',
  sos: 'SOS',
  geofence: 'Route deviation',
  harsh_braking: 'Harsh braking',
  occupancy: 'Cabin occupancy',
  abusive_language: 'Abusive language',
  device_offline: 'Device offline',
};
