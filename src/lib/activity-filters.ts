import type { SafetyAlert, Severity } from '@/types/models';

export type DateWindow = 'all' | 'today' | 'week';

export type AlertFilters = {
  passenger: string;
  vehicle: string;
  severity: 'all' | Severity;
  date: DateWindow;
};

export const defaultAlertFilters: AlertFilters = {
  passenger: 'all',
  vehicle: 'all',
  severity: 'all',
  date: 'all',
};

export type TripLookup = {
  id: string;
  passengerName: string;
  vehicle: string;
};

export type ActivityItem = {
  alert: SafetyAlert;
  passengerName: string;
  vehicleLabel: string;
};

export function mergeAlerts(remote: SafetyAlert[], live: SafetyAlert[]): SafetyAlert[] {
  const byId = new Map<string, SafetyAlert>();
  for (const alert of remote) byId.set(alert.id, alert);
  for (const alert of live) {
    const existing = byId.get(alert.id);
    byId.set(alert.id, existing ? { ...alert, ...existing } : alert);
  }
  return [...byId.values()].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export function describeAlert(alert: SafetyAlert, trips: TripLookup[]): ActivityItem {
  const trip = trips.find((item) => item.id === alert.tripId);
  return {
    alert,
    passengerName: alert.passengerName || trip?.passengerName || 'Unknown passenger',
    vehicleLabel: alert.vehicleLabel || trip?.vehicle || 'Unknown vehicle',
  };
}

function inWindow(iso: string, window: DateWindow, now: number): boolean {
  if (window === 'all') return true;
  const time = new Date(iso).getTime();
  if (Number.isNaN(time)) return false;
  const start = new Date(now);
  start.setHours(0, 0, 0, 0);
  if (window === 'today') return time >= start.getTime();
  return time >= now - 7 * 24 * 60 * 60 * 1000;
}

export function filterActivity(items: ActivityItem[], filters: AlertFilters, now = Date.now()): ActivityItem[] {
  return items.filter((item) => {
    if (filters.passenger !== 'all' && item.passengerName !== filters.passenger) return false;
    if (filters.vehicle !== 'all' && item.vehicleLabel !== filters.vehicle) return false;
    if (filters.severity !== 'all' && item.alert.severity !== filters.severity) return false;
    return inWindow(item.alert.createdAt, filters.date, now);
  });
}

export function uniqueLabels(values: string[]): string[] {
  return [...new Set(values.filter((value) => value && !value.startsWith('Unknown')))];
}
