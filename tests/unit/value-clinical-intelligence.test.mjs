import test from 'node:test';
import assert from 'node:assert/strict';
import { buildClinicalIntelligence } from '../../shared/clinical-intelligence.ts';

const scope = { clinicId: 'synthetic-alpha', patientId: 'synthetic-patient' };
const now = '2026-09-26T12:00:00Z';
const event = (id, eventType, payload, extra = {}) => ({
  ...scope, id, eventType, payload, occurredAt: '2026-09-20T12:00:00Z',
  createdAt: '2026-09-20T12:01:00Z', authorUserId: 'synthetic-professional',
  provenanceKind: 'observed', provenanceSource: 'clinician', status: 'active', ...extra,
});
const outcome = (id, value, extra = {}) => event(id, 'outcome', {
  domain: 'sleep', goalId: 'synthetic-sleep-goal', measure: 'night-awakenings',
  valueNumber: value, unit: 'count/night', context: 'home',
}, extra);
const fixture = () => [
  event('consult-1', 'encounter', { encounterType: 'initial' }, { occurredAt: '2026-08-20T12:00:00Z' }),
  event('consult-2', 'encounter', { encounterType: 'followup' }),
  event('school', 'document', { text: 'Synthetic school report' }, { provenanceKind: 'reported', provenanceSource: 'school' }),
  event('family', 'observation', { domain: 'attention', findingStatus: 'present', valueText: 'Synthetic family report' }, { provenanceKind: 'reported', provenanceSource: 'family' }),
  event('instrument', 'scale_result', { instrumentId: 'synthetic-unvalidated' }, { provenanceKind: 'measured', provenanceSource: 'instrument' }),
  event('exam', 'document', { text: 'Synthetic laboratory report' }, { provenanceKind: 'documented', provenanceSource: 'laboratory' }),
  event('therapy', 'plan', { kind: 'therapy', target: 'Synthetic communication goal', status: 'planned' }, { provenanceKind: 'decision' }),
  outcome('sleep-before', 4, { occurredAt: '2026-08-20T12:00:00Z' }),
  outcome('sleep-after', 2),
];
const build = (events, options = {}) => buildClinicalIntelligence(events, scope, { now, ...options });

test('synthetic longitudinal case keeps provenance and produces a review-only draft', () => {
  const result = build(fixture());
  assert.equal(result.timeline.length, 9);
  assert.equal(result.numericDeltas.length, 1);
  assert.equal(result.numericDeltas[0].change, -2);
  assert.equal(result.numericDeltas[0].clinicalDirection, 'not_inferred');
  assert.deepEqual(result.numericDeltas[0].eventIds, ['sleep-before', 'sleep-after']);
  assert.equal(result.timeline.find(x => x.id === 'family').nature, 'RELATO');
  assert.deepEqual(result.unstructuredSourceIds, ['exam', 'instrument', 'school']);
  assert.ok(result.domainCoverage.some(x => x.domain === 'autonomy' && x.status === 'not_documented_in_window'));
  assert.equal(result.draft.professionalReviewRequired, true);
  assert.equal(result.draft.finalDocument, false);
  assert.equal(result.draft.autonomousDiagnosis, false);
});

test('tenant and patient contamination fail closed, even in corrected events', () => {
  for (const extra of [{ clinicId: 'synthetic-beta' }, { patientId: 'synthetic-other' }]) {
    assert.throws(() => build([outcome('foreign', 1, { ...extra, status: 'corrected' })]), /SCOPE_MISMATCH/);
  }
});
test('one observation, absent goal, unit mismatch and same instant do not establish delta', () => {
  assert.equal(build([outcome('one', 4)]).numericDeltas.length, 0);
  const before = outcome('before', 4, { occurredAt: '2026-09-19T12:00:00Z' });
  for (const patch of [{ goalId: undefined }, { unit: 'hours' }, { context: 'school' }, { measure: 'different-questionnaire' }]) {
    const after = outcome('after', 2); Object.assign(after.payload, patch);
    assert.equal(build([before, after]).numericDeltas.length, 0);
  }
  assert.equal(build([outcome('same-1', 4), outcome('same-2', 2)]).numericDeltas.length, 0);
});
test('corrected, voided, future and inferred observations cannot supply numeric deltas', () => {
  for (const patch of [{ status: 'corrected' }, { status: 'voided' }, { occurredAt: '2027-01-01T00:00:00Z' }, { provenanceKind: 'inferred' }]) {
    assert.equal(build([outcome('old', 4, { occurredAt: '2026-09-19T12:00:00Z' }), outcome('new', 2, patch)]).numericDeltas.length, 0);
  }
});
test('observations and questionnaire totals are never compared as interchangeable outcomes', () => {
  const input = [event('a', 'observation', { domain: 'attention', valueNumber: 9, unit: 'score' }),
    event('b', 'observation', { domain: 'attention', valueNumber: 3, unit: 'score' }, { occurredAt: '2026-09-21T12:00:00Z' })];
  assert.equal(build(input).numericDeltas.length, 0);
});
test('different sources yield a potential divergence, not an adjudicated clinical fact', () => {
  const result = build([outcome('school', 4, { provenanceSource: 'school', provenanceKind: 'reported' }),
    outcome('family', 2, { provenanceSource: 'family', provenanceKind: 'reported' })]);
  assert.equal(result.potentialDivergences.length, 1);
  assert.equal(result.numericDeltas.length, 0);
  assert.equal(result.potentialDivergences[0].requiresReview, true);
});
test('truncated source set never claims global missing-data completeness', () => {
  const result = build(fixture(), { sourceWindowComplete: false });
  assert.equal(result.coverage.sourceWindowComplete, false);
  assert.ok(result.limitations.includes('SOURCE_WINDOW_INCOMPLETE'));
});
test('critical documented alerts and missing dose-calculation weight remain alerts only', () => {
  const result = build([event('med', 'medication', { action: 'reported_use', genericName: 'synthetic-medication', doseMgKgDay: 1 }),
    event('critical', 'safety', { domain: 'acute_neurologic_change', severity: 'critical', status: 'identified', actionTaken: 'Synthetic documented response' })]);
  assert.ok(result.safetyAlerts.some(x => x.code === 'WEIGHT_NOT_DOCUMENTED_AT_MEDICATION_EVENT'));
  assert.ok(result.safetyAlerts.some(x => x.code === 'DOCUMENTED_CRITICAL_ALERT'));
  assert.equal(result.draft.autonomousPrescription, false);
});
test('invalid dates, author/provenance gaps, duplicate IDs and oversized input are rejected', () => {
  for (const patch of [{ occurredAt: 'yesterday' }, { occurredAt: '2026-02-30T12:00:00Z' }, { authorUserId: '' }, { provenanceSource: '' }, { provenanceKind: 'invented' }]) {
    assert.throws(() => build([outcome('invalid', 1, patch)]));
  }
  assert.throws(() => build([outcome('repeat', 1), outcome('repeat', 2)]), /DUPLICATE_ID/);
  assert.throws(() => build(Array.from({ length: 501 }, (_, i) => outcome(`e-${i}`, 1))), /WINDOW_LIMIT/);
});
test('stable ordering and no input mutation', () => {
  const data = fixture(); const initial = JSON.stringify(data);
  assert.deepEqual(build(data), build([...data].reverse()));
  assert.equal(JSON.stringify(data), initial);
});
test('non-finite measurements are rejected instead of silently converted to missing', () => {
  assert.throws(() => build([outcome('invalid-number', Infinity)]), /NON_FINITE_VALUE/);
});
