import test from 'node:test';
import assert from 'node:assert/strict';
import { ONBOARDING_STEPS, buildOnboardingProgress, parseOnboardingProgress } from '../../shared/onboarding-progress.ts';
const now = new Date('2026-09-26T12:00:00Z');
const facts = () => Object.fromEntries(ONBOARDING_STEPS.filter(s => s.id !== 'billing_configured').map(s => [s.id, null]));
test('zero retained milestones means visible zero, never invented activation', () => {
  const value = buildOnboardingProgress(facts(), now);
  assert.equal(value.observedSteps, 0); assert.equal(value.percent, 0);
  assert.equal(value.commercialReadinessVerified, false);
});
test('database timestamps are preserved, including SQLite UTC format', () => {
  const value = buildOnboardingProgress({ ...facts(), account_created: '2026-09-20 12:00:00' }, now);
  assert.equal(value.observedSteps, 1);
  assert.equal(value.steps[0].observedAt, '2026-09-20T12:00:00.000Z');
  assert.equal(parseOnboardingProgress(value).observedSteps, 1);
});
test('checkout and retained records cannot assert provider billing confirmation', () => {
  const row = Object.fromEntries(Object.keys(facts()).map(k => [k, '2026-09-20T12:00:00Z']));
  const value = buildOnboardingProgress({ ...row, billing_configured: '2026-09-20T12:00:00Z', paid: true, success: true }, now);
  assert.equal(value.steps.find(s => s.id === 'billing_configured').status, 'not_measured');
  assert.equal(value.observedSteps, 9); assert.equal(value.percent, 90);
  assert.equal(value.commercialReadinessVerified, false);
});
test('missing columns, invalid/future dates and arrays fail closed rather than becoming zero', () => {
  assert.throws(() => buildOnboardingProgress({}, now));
  assert.throws(() => buildOnboardingProgress([], now));
  for (const bad of ['tomorrow', '2027-01-01T00:00:00Z', '2026-02-30T00:00:00Z', 123]) {
    assert.throws(() => buildOnboardingProgress({ ...facts(), first_patient: bad }, now));
  }
});
test('client parser rejects fabricated completion and malformed server snapshots', () => {
  const value = buildOnboardingProgress(facts(), now);
  assert.throws(() => parseOnboardingProgress({ ...value, observedSteps: 10, percent: 100 }));
  assert.throws(() => parseOnboardingProgress({ ...value, commercialReadinessVerified: true }));
  assert.throws(() => parseOnboardingProgress({ ...value, steps: [] }));
});
