import type { LiveFix, LiveStatus, Trip } from '@/types/models';

export function presentTrip(trip: Trip, fix: LiveFix | null, status: LiveStatus | null): Trip {
  const sameFix = fix?.tripId === trip.id;
  const sameStatus = status?.tripId === trip.id;
  return {
    ...trip,
    current: sameFix ? { latitude: fix.latitude, longitude: fix.longitude } : trip.current,
    speedKph: sameFix ? fix.speedKph : trip.speedKph,
    heading: sameFix ? fix.heading : trip.heading,
    updatedAt: sameFix ? fix.updatedAt : trip.updatedAt,
    etaMinutes: sameStatus ? status.etaMinutes : trip.etaMinutes,
    progress: sameStatus ? status.progress : trip.progress,
    status: sameStatus ? status.status : trip.status,
    simulated: trip.simulated || fix?.source === 'demo',
  };
}

export function canShowLocation(trip: Trip): boolean {
  return trip.consent === 'granted';
}
