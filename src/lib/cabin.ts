import type { CabinMonitor, DriverGaze } from '@/types/models';

export function demoCabin(input: {
  tripId: string;
  speedKph: number;
  driverName: string;
  passengerName: string;
  updatedAt: string;
}): CabinMonitor {
  const gaze: DriverGaze = input.speedKph >= 58 ? 'glance' : 'forward';
  return {
    tripId: input.tripId,
    simulated: true,
    updatedAt: input.updatedAt,
    seatCount: 2,
    driverName: input.driverName,
    passengerName: input.passengerName,
    gaze,
    gazeLabel: gaze === 'glance' ? 'Glance off the road' : 'Eyes on the road',
    seats: [
      { id: 'front-left', label: 'Driver', occupant: input.driverName, role: 'driver' },
      { id: 'front-right', label: 'Front right', occupant: null, role: 'empty' },
      { id: 'rear-left', label: 'Rear left', occupant: input.passengerName, role: 'passenger' },
      { id: 'rear-right', label: 'Rear right', occupant: null, role: 'empty' },
    ],
    vlm: { status: 'idle', note: '' },
    camera: 'unavailable',
    inference: 'idle',
    recording: 'off',
  };
}
