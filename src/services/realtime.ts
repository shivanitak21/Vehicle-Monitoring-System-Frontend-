import { io, type Socket } from 'socket.io-client';
import { config, socketEvents } from '@/constants/config';
import { useLiveStore } from '@/stores/live-store';
import type { CabinMonitor, LiveStatus, SafetyAlert, TripStatus } from '@/types/models';

let socket: Socket | null = null;

type LocationPayload = {
  tripId: string;
  latitude: number;
  longitude: number;
  speedKph: number;
  heading: number;
  updatedAt: string;
};

type StatusPayload = {
  tripId: string;
  status: TripStatus;
  etaMinutes: number;
  progress: number;
};

export function startRealtime(token: string): void {
  if (!config.socketUrl) {
    useLiveStore.getState().setConnection('offline');
    return;
  }
  if (socket?.connected) return;
  stopRealtime();
  useLiveStore.getState().setConnection('connecting');
  socket = io(config.socketUrl, {
    auth: { token },
    transports: ['websocket'],
    autoConnect: true,
  });
  socket.on('connect', () => useLiveStore.getState().setConnection('live'));
  socket.on('disconnect', () => useLiveStore.getState().setConnection('offline'));
  socket.on('connect_error', () => useLiveStore.getState().setConnection('offline'));
  socket.on(socketEvents.location, (payload: LocationPayload) => {
    useLiveStore.getState().applyFix({ ...payload, source: 'socket' });
  });
  socket.on(socketEvents.status, (payload: StatusPayload) => {
    const status: LiveStatus = payload;
    useLiveStore.getState().applyStatus(status);
  });
  socket.on(socketEvents.safety, (payload: SafetyAlert) => {
    useLiveStore.getState().pushEvent(payload);
  });
  socket.on(socketEvents.cabin, (payload: CabinMonitor) => {
    if (!payload || !Array.isArray(payload.seats)) return;
    useLiveStore.getState().applyCabin(payload);
  });
}

export function stopRealtime(): void {
  socket?.removeAllListeners();
  socket?.disconnect();
  socket = null;
}
