import assert from 'node:assert/strict';
import test from 'node:test';
import { HIDDEN_MAIN_TAB, MAIN_TABS } from './navigation.ts';

test('the main bar has four tabs and keeps profile off the bar', () => {
  assert.deepEqual(
    MAIN_TABS.map((tab) => tab.title),
    ['Home', 'Activity', 'Trips', 'Family'],
  );
  assert.equal(MAIN_TABS.some((tab) => tab.name === HIDDEN_MAIN_TAB), false);
  assert.equal(HIDDEN_MAIN_TAB, 'profile');
});
