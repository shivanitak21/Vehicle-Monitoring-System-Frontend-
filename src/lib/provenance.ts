import type { ConnectionState, Severity } from '@/types/models';

export type Provenance = 'real' | 'demo' | 'stale' | 'offline' | 'unknown';

export const GPS_FRESH_MS = 45_000;

const provenanceLabel: Record<Provenance, string> = {
  real: 'REAL',
  demo: 'DEMO',
  stale: 'STALE',
  offline: 'OFFLINE',
  unknown: 'UNKNOWN',
};

export function provenanceLabelFor(provenance: Provenance): string {
  return provenanceLabel[provenance];
}

export function locationProvenance(input: {
  simulated: boolean;
  source?: 'socket' | 'demo' | 'device' | null;
  updatedAt?: string | null;
  connection: ConnectionState;
  sharing: boolean;
  now?: number;
}): Provenance {
  if (!input.sharing) return 'unknown';
  if (input.simulated || input.source === 'demo' || input.connection === 'demo') return 'demo';
  if (input.connection === 'offline' || input.connection === 'idle') return 'offline';
  if (input.connection === 'connecting') return 'stale';
  if (!input.updatedAt) return 'unknown';
  const age = (input.now ?? Date.now()) - new Date(input.updatedAt).getTime();
  if (Number.isNaN(age)) return 'unknown';
  if (age > GPS_FRESH_MS) return 'stale';
  if (input.source === 'socket' || input.source === 'device' || input.connection === 'live') return 'real';
  return 'unknown';
}

export type SafetyPosture = {
  label: string;
  tone: 'critical' | 'watch' | 'info' | 'unknown';
};

export function safetyPosture(alerts: { severity: Severity }[]): SafetyPosture {
  if (alerts.some((alert) => alert.severity === 'critical')) {
    return { label: 'Urgent event', tone: 'critical' };
  }
  if (alerts.some((alert) => alert.severity === 'watch')) {
    return { label: 'Warning reported', tone: 'watch' };
  }
  if (alerts.length > 0) return { label: 'Events recorded', tone: 'info' };
  return { label: 'Not verified', tone: 'unknown' };
}

export function routeRecordLabel(input: { simulated: boolean; pointCount: number }): string {
  if (input.simulated) return 'Demo simulation';
  if (input.pointCount < 2) return 'Recorded route unavailable';
  return 'Recorded GPS';
}
