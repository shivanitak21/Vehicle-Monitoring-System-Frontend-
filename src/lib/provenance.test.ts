import assert from 'node:assert/strict';
import test from 'node:test';
import { locationProvenance, routeRecordLabel, safetyPosture } from './provenance.ts';

const now = Date.parse('2026-10-20T12:00:00.000Z');

test('a fresh socket fix is real', () => {
  assert.equal(
    locationProvenance({
      simulated: false,
      source: 'socket',
      updatedAt: new Date(now - 5_000).toISOString(),
      connection: 'live',
      sharing: true,
      now,
    }),
    'real',
  );
});

test('demo movement is never labeled live', () => {
  assert.equal(
    locationProvenance({
      simulated: true,
      source: 'demo',
      updatedAt: new Date(now).toISOString(),
      connection: 'demo',
      sharing: true,
      now,
    }),
    'demo',
  );
});

test('an old live fix is stale and a dropped link is offline', () => {
  assert.equal(
    locationProvenance({
      simulated: false,
      source: 'socket',
      updatedAt: new Date(now - 120_000).toISOString(),
      connection: 'live',
      sharing: true,
      now,
    }),
    'stale',
  );
  assert.equal(
    locationProvenance({
      simulated: false,
      source: 'socket',
      updatedAt: new Date(now - 5_000).toISOString(),
      connection: 'offline',
      sharing: true,
      now,
    }),
    'offline',
  );
});

test('hidden sharing stays unknown', () => {
  assert.equal(
    locationProvenance({
      simulated: false,
      source: 'socket',
      updatedAt: new Date(now).toISOString(),
      connection: 'live',
      sharing: false,
      now,
    }),
    'unknown',
  );
});

test('an empty alert list is not described as safe', () => {
  assert.equal(safetyPosture([]).label, 'Not verified');
  assert.equal(safetyPosture([{ severity: 'info' }]).label, 'Events recorded');
  assert.equal(safetyPosture([{ severity: 'watch' }]).tone, 'watch');
  assert.equal(safetyPosture([{ severity: 'info' }, { severity: 'critical' }]).tone, 'critical');
});

test('route labels separate simulations from missing GPS', () => {
  assert.equal(routeRecordLabel({ simulated: true, pointCount: 20 }), 'Demo simulation');
  assert.equal(routeRecordLabel({ simulated: false, pointCount: 0 }), 'Recorded route unavailable');
  assert.equal(routeRecordLabel({ simulated: false, pointCount: 4 }), 'Recorded GPS');
});
