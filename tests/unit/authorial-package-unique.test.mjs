import test from 'node:test';
import assert from 'node:assert/strict';
import { assertUniqueAuthorialPackage } from '../../scripts/guards/assert-authorial-package-unique.mjs';
const rows = () => ['afi12-sdg', 'sdrd12-sdg', 'sarf12-sdg'].map((id) => ({ id, name: id, pendente_validacao_clinica: true }));

test('one canonical unvalidated entry per instrument is accepted', () => {
  assert.doesNotThrow(() => assertUniqueAuthorialPackage(rows()));
});
test('alternate hyphen/case ID cannot introduce the same instrument twice', () => {
  const data = rows(); data.push({ ...data[0], id: 'AFI-12-SDG', name: 'AFI–12 SDG' });
  assert.throws(() => assertUniqueAuthorialPackage(data), /found 2/);
});
test('exact duplicates are rejected before any catalogue deduplication', () => {
  const data = rows(); data.push(data[0]);
  assert.throws(() => assertUniqueAuthorialPackage(data), /found 2/);
});
test('missing scale or malformed catalogue cannot pass', () => {
  assert.throws(() => assertUniqueAuthorialPackage(rows().slice(1)), /found 0/);
  assert.throws(() => assertUniqueAuthorialPackage(null), TypeError);
});
test('an alternate ID cannot silently replace the canonical ID', () => {
  const data = rows(); data[0].id = 'afi-12-sdg';
  assert.throws(() => assertUniqueAuthorialPackage(data), /explicit migration/);
});
test('psychometric validation cannot be promoted to make CI green', () => {
  const data = rows(); data[0].pendente_validacao_clinica = false;
  assert.throws(() => assertUniqueAuthorialPackage(data), /presumed validation/);
});
test('unrelated existing catalogue entries are preserved', () => {
  const data = rows(); data.push({ id: 'unrelated-existing-instrument', name: 'Other' });
  assert.doesNotThrow(() => assertUniqueAuthorialPackage(data));
  assert.equal(data.length, 4);
});
