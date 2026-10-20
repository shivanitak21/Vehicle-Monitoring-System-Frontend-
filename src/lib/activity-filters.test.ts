import assert from 'node:assert/strict';
import test from 'node:test';
import { describeAlert, filterActivity, mergeAlerts } from './activity-filters.ts';
import type { SafetyAlert } from '../types/models.ts';

function alert(partial: Partial<SafetyAlert> & Pick<SafetyAlert, 'id' | 'createdAt'>): SafetyAlert {
  return {
    tripId: 'trip-1',
    kind: 'speeding',
    severity: 'watch',
    title: 'Speed',
    message: 'Over the limit',
    simulated: false,
    ...partial,
  };
}

test('merge keeps one copy of a repeated event and prefers the stored acknowledgement', () => {
  const remote = [alert({ id: 'a', createdAt: '2026-10-20T10:00:00.000Z', acknowledged: true })];
  const live = [
    alert({ id: 'a', createdAt: '2026-10-20T10:00:00.000Z', acknowledged: false }),
    alert({ id: 'b', createdAt: '2026-10-20T11:00:00.000Z' }),
  ];
  const merged = mergeAlerts(remote, live);
  assert.deepEqual(
    merged.map((item) => item.id),
    ['b', 'a'],
  );
  assert.equal(merged[1]?.acknowledged, true);
});

test('filters by passenger, vehicle, severity, and day', () => {
  const trips = [{ id: 'trip-1', passengerName: 'Aria Shah', vehicle: 'Shuttle 04' }];
  const items = [
    describeAlert(alert({ id: 'old', createdAt: '2026-10-01T10:00:00.000Z', severity: 'info' }), trips),
    describeAlert(
      alert({
        id: 'today',
        tripId: 'trip-2',
        createdAt: '2026-10-20T09:00:00.000Z',
        severity: 'critical',
        kind: 'sos',
        passengerName: 'Noah Shah',
        vehicleLabel: 'Sedan',
      }),
      trips,
    ),
  ];
  const now = Date.parse('2026-10-20T12:00:00.000Z');
  assert.equal(filterActivity(items, { passenger: 'Aria Shah', vehicle: 'all', severity: 'all', date: 'all' }, now).length, 1);
  assert.equal(filterActivity(items, { passenger: 'all', vehicle: 'Shuttle 04', severity: 'all', date: 'all' }, now).length, 1);
  assert.equal(filterActivity(items, { passenger: 'all', vehicle: 'all', severity: 'critical', date: 'today' }, now)[0]?.alert.id, 'today');
});
