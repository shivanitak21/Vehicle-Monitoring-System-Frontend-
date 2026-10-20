import { demoCabin } from '@/lib/cabin';
import { createId } from '@/lib/id';
import { pointAlong } from '@/lib/geo';
import { queryClient } from '@/lib/query-client';
import { ACTIVE_TRIP_ID, activeRoute } from '@/services/demo/fixtures';
import { useDemoStore } from '@/stores/demo-store';
import { useLiveStore } from '@/stores/live-store';
import type { SafetyAlert, SafetyKind, Severity } from '@/types/models';

let timer: ReturnType<typeof setInterval> | null = null;
let progress = 0.22;
let lastAlertAt = 0;
let guardianSentForBurst = false;
let lastProgress = 0.22;
const fired = { glance: false, brake: false, speech: false, seats: false };

function pushActivity(kind: SafetyKind, severity: Severity, title: string, message: string, at: string) {
  const alert: SafetyAlert = {
    id: createId('alert'),
    tripId: ACTIVE_TRIP_ID,
    kind,
    severity,
    title,
    message,
    createdAt: at,
    simulated: true,
    source: 'Demo simulator',
    passengerName: 'Aria Shah',
    vehicleLabel: 'Velora Shuttle 04',
  };
  useDemoStore.getState().pushAlert(alert);
  useLiveStore.getState().pushEvent(alert);
  void queryClient.invalidateQueries({ queryKey: ['safety'] });
}

function tick() {
  progress += 0.0036;
  if (progress > 1) progress = 0.08;
  const { point, heading } = pointAlong(activeRoute, progress);
  let speed = 26 + Math.sin(progress * Math.PI * 6) * 10;
  if (progress > 0.58 && progress < 0.7) speed += 28;
  speed = Math.max(0, Math.round(speed));
  const updatedAt = new Date().toISOString();
  useLiveStore.getState().applyFix({
    tripId: ACTIVE_TRIP_ID,
    latitude: point.latitude,
    longitude: point.longitude,
    speedKph: speed,
    heading,
    updatedAt,
    source: 'demo',
  });
  useLiveStore.getState().applyStatus({
    tripId: ACTIVE_TRIP_ID,
    status: 'en_route',
    etaMinutes: Math.max(1, Math.round((1 - progress) * 18)),
    progress,
  });
  useLiveStore.getState().setConnection('demo');
  useLiveStore.getState().applyCabin(
    demoCabin({
      tripId: ACTIVE_TRIP_ID,
      speedKph: speed,
      driverName: 'Leela Nair',
      passengerName: 'Aria Shah',
      updatedAt,
    }),
  );

  if (speed >= 58) {
    if (!guardianSentForBurst) {
      guardianSentForBurst = true;
      useLiveStore.getState().publishGuardian({
        reason: 'Simulated speeding signal',
        at: updatedAt,
        simulated: true,
      });
    }
  } else {
    guardianSentForBurst = false;
  }

  const now = Date.now();
  if (speed >= 58 && now - lastAlertAt > 90_000) {
    lastAlertAt = now;
    useDemoStore.getState().pushAlert({
      id: createId('alert'),
      tripId: ACTIVE_TRIP_ID,
      kind: 'speeding',
      severity: 'watch',
      title: 'Simulated speeding signal',
      message: 'The sample shuttle briefly exceeded the demo limit. This is not a live event.',
      createdAt: updatedAt,
      simulated: true,
      source: 'Demo simulator',
      passengerName: 'Aria Shah',
      vehicleLabel: 'Velora Shuttle 04',
    });
    void queryClient.invalidateQueries({ queryKey: ['safety'] });
  }

  if (progress < lastProgress) {
    fired.glance = false;
    fired.brake = false;
    fired.speech = false;
    fired.seats = false;
  }
  lastProgress = progress;

  if (progress > 0.3 && !fired.glance) {
    fired.glance = true;
    pushActivity(
      'distraction',
      'watch',
      'Glance away from the road',
      'The face camera marked a short glance. This is a simulated driver-model reading.',
      updatedAt,
    );
  }
  if (progress > 0.5 && !fired.seats) {
    fired.seats = true;
    pushActivity(
      'occupancy',
      'info',
      'Seat count matches',
      'The cabin camera counts 2 people. Aria remains in the rear left seat. Simulated count.',
      updatedAt,
    );
  }
  if (progress > 0.66 && !fired.speech) {
    fired.speech = true;
    pushActivity(
      'abusive_language',
      'watch',
      'Abusive language flagged',
      'Demo script only. No audio was transcribed on this phone.',
      updatedAt,
    );
  }
  if (progress > 0.82 && !fired.brake) {
    fired.brake = true;
    pushActivity(
      'harsh_braking',
      'watch',
      'Sharp slowdown',
      'The vehicle slowed harder than the sample limit. Simulated motion event.',
      updatedAt,
    );
  }
}

export function startDemoSimulator(): void {
  if (timer) return;
  seedDetections();
  tick();
  timer = setInterval(tick, 1_000);
}

function seedDetections() {
  const kinds = new Set(useDemoStore.getState().alerts.map((alert) => alert.kind));
  const at = new Date().toISOString();
  if (!kinds.has('occupancy')) {
    pushActivity(
      'occupancy',
      'info',
      'Seat count matches',
      'The cabin camera counts 2 people. Aria is in the rear left seat. Simulated count.',
      at,
    );
  }
  if (!kinds.has('abusive_language')) {
    pushActivity(
      'abusive_language',
      'watch',
      'Abusive language flagged',
      'Demo script only. No audio was transcribed on this phone.',
      at,
    );
  }
  if (!kinds.has('harsh_braking')) {
    pushActivity(
      'harsh_braking',
      'watch',
      'Sharp slowdown',
      'The vehicle slowed harder than the sample limit. Simulated motion event.',
      at,
    );
  }
}

export function stopDemoSimulator(): void {
  if (timer) clearInterval(timer);
  timer = null;
}
