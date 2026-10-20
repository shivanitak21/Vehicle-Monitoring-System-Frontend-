import type { SafetyKind } from '@/types/models';

export const safetyKindLabel: Record<SafetyKind, string> = {
  fatigue: 'Fatigue',
  distraction: 'Distraction',
  speeding: 'Speeding',
  sos: 'SOS',
  geofence: 'Geofence',
  harsh_braking: 'Harsh braking',
  occupancy: 'Seat count',
  abusive_language: 'Abusive language',
};
