import test from 'node:test';
import assert from 'node:assert/strict';
import { EVIDENCE_COUNTERS, buildProductEvidence, parseProductEvidence } from '../../shared/product-evidence.ts';
const scope = 'synthetic-alpha';
const asOf = new Date('2026-09-26T12:00:00Z');
const row = () => ({ clinic_id: scope, ...Object.fromEntries(EVIDENCE_COUNTERS.map(item => [item.id, 0])) });
test('observed zero is retained, while unmeasured money/security facts remain null', () => {
  const data = buildProductEvidence(row(), scope, null, asOf);
  assert.ok(data.counters.every(item => item.value === 0));
  assert.ok(data.unverified.every(item => item.value === null));
  assert.equal(data.commercialReadinessVerified, false);
  assert.equal(data.productionRecoveryVerified, false);
});
test('missing and invalid aggregates fail instead of becoming zero', () => {
  assert.throws(() => buildProductEvidence({}, scope, null, asOf));
  for (const value of [-1, NaN, Infinity, '1', 1.5, Number.MAX_SAFE_INTEGER + 1]) {
    assert.throws(() => buildProductEvidence({ ...row(), patients: value }, scope, null, asOf));
  }
});
test('tenant contamination fails closed', () => {
  assert.throws(() => buildProductEvidence(row(), 'synthetic-beta', null, asOf), /SCOPE_MISMATCH/);
});
test('health status is a point-in-time report, not uptime or deploy verification', () => {
  const data = buildProductEvidence(row(), scope, { httpStatus: 503, body: { status: 'degraded', version: '2.0.0', database: 'error', timestamp: asOf.toISOString() } }, asOf);
  assert.equal(data.health.reportedStatus, 'degraded');
  assert.equal(data.health.httpStatus, 503);
  assert.equal(data.unverified.find(item => item.id === 'uptime').value, null);
  assert.equal(data.unverified.find(item => item.id === 'deployed_sha').value, null);
  assert.deepEqual(parseProductEvidence(data), data);
});
test('malformed health cannot erase valid database counters or fabricate health', () => {
  const data = buildProductEvidence(row(), scope, { httpStatus: 200, body: { status: 'fine' } }, asOf);
  assert.equal(data.health, null); assert.equal(data.counters[0].value, 0);
});
test('client parser rejects fabricated revenue, recovery and scope claims', () => {
  const data = buildProductEvidence(row(), scope, null, asOf);
  assert.throws(() => parseProductEvidence({ ...data, commercialReadinessVerified: true }));
  assert.throws(() => parseProductEvidence({ ...data, productionRecoveryVerified: true }));
  const tampered = structuredClone(data); tampered.unverified.find(item => item.id === 'real_mrr_brl').value = 9999;
  assert.throws(() => parseProductEvidence(tampered));
});
