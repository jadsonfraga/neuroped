import test from 'node:test';
import assert from 'node:assert/strict';
import { planCapabilities, resolveEffectiveEntitlements } from '../../shared/entitlements.ts';
test('prototype names must be unknown plans, not inherited object properties', () => {
  for (const id of ['__proto__', 'constructor', 'toString', 'valueOf', 'hasOwnProperty', 'unregistered']) {
    assert.strictEqual(planCapabilities(id), planCapabilities(null));
    assert.equal(planCapabilities(id).canUseClinicalCore, false);
  }
});
test('non-string runtime values fail closed', () => {
  for (const id of [[], ['saas-professional'], {}, 1, true]) {
    assert.strictEqual(planCapabilities(id), planCapabilities(null));
  }
});
test('known plan and billing guard behavior are preserved', () => {
  assert.equal(planCapabilities('saas-professional').canUseClinicalCore, true);
  assert.equal(resolveEffectiveEntitlements({ planId: 'saas-professional', billingActive: true, subscriptionSeats: 3 }).seats, 3);
  assert.equal(resolveEffectiveEntitlements({ planId: 'saas-professional', billingActive: false, subscriptionSeats: 3 }).canUseClinicalCore, false);
});
