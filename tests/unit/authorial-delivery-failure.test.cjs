'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const report = require('../../scripts/authorial_delivery_failure.cjs');
const marker = '<!-- neuroped-authorial-delivery-incident-v1 -->';

function fixture(overrides = {}) {
  const calls = [];
  const github = {
    paginate: async (fn, args) => { calls.push(['list', args]); return overrides.issues || []; },
    rest: { issues: {
      listForRepo() {},
      create: async (args) => { calls.push(['create', args]); return { data: { number: 101 } }; },
      update: async (args) => { calls.push(['update', args]); return { data: { number: args.issue_number } }; },
    } },
  };
  return {
    calls,
    input: {
      github,
      context: { eventName: 'schedule', ref: 'refs/heads/main', repo: { owner: 'fixture', repo: 'neuroped' }, runId: 42, ...overrides.context },
      core: { warning: (s) => calls.push(['warning', s]) },
      results: overrides.results || { test: 'success', deliver: 'failure' },
    },
  };
}

test('records one incident for an actual main delivery failure', async () => {
  const f = fixture();
  assert.deepEqual(await report(f.input), { status: 'created', issue: 101 });
  const created = f.calls.find(([verb]) => verb === 'create')[1];
  assert.match(created.body, /actions\/runs\/42/);
  assert.match(created.body, /deliver: failure/);
  assert.match(created.body, /não fazer reenvio cego/);
});
test('updates a matching open issue instead of creating duplicates', async () => {
  const f = fixture({ issues: [{ number: 7, body: marker, user: { login: 'github-actions[bot]' } }] });
  assert.deepEqual(await report(f.input), { status: 'updated', issue: 7 });
  assert.equal(f.calls.filter(([verb]) => verb === 'create').length, 0);
  assert.equal(f.calls.find(([verb]) => verb === 'list')[1].per_page, 100);
});
test('does not mistake a PR with the marker for an incident', async () => {
  const f = fixture({ issues: [{ number: 7, body: marker, pull_request: {} }] });
  assert.equal((await report(f.input)).status, 'created');
});
test('never writes incidents from a pull request', async () => {
  const f = fixture({ context: { eventName: 'pull_request' } });
  assert.equal((await report(f.input)).status, 'not_applicable');
  assert.deepEqual(f.calls, []);
});
test('never writes incidents from a work branch', async () => {
  const f = fixture({ context: { ref: 'refs/heads/work' } });
  assert.equal((await report(f.input)).status, 'not_applicable');
  assert.deepEqual(f.calls, []);
});
test('successful/no-op run cannot close a past incident', async () => {
  const f = fixture({ issues: [{ number: 7, body: marker, user: { login: 'github-actions[bot]' } }], results: { test: 'success', deliver: 'success' } });
  assert.equal((await report(f.input)).status, 'no_incident');
  assert.deepEqual(f.calls, []);
});
test('skipped jobs alone are not treated as successful delivery or a failure', async () => {
  const f = fixture({ results: { test: 'skipped', deliver: 'skipped' } });
  assert.equal((await report(f.input)).status, 'no_incident');
  assert.deepEqual(f.calls, []);
});
test('test failure is recorded even when delivery was skipped', async () => {
  const f = fixture({ results: { test: 'failure', deliver: 'skipped' } });
  await report(f.input);
  assert.match(f.calls.find(([verb]) => verb === 'create')[1].body, /test: failure/);
});
test('cancelled delivery is not quietly certified as done', async () => {
  const f = fixture({ results: { test: 'success', deliver: 'cancelled' } });
  assert.equal((await report(f.input)).status, 'created');
});
test('does not hide API failures as successful incident reporting', async () => {
  const f = fixture();
  f.input.github.paginate = async () => { throw new Error('API unavailable'); };
  await assert.rejects(report(f.input), /API unavailable/);
  assert.equal(f.calls.filter(([verb]) => verb === 'create').length, 0);
});
test('invalid run and unexpected jobs fail closed before a write', async () => {
  for (const overrides of [{ context: { runId: -1 } }, { results: { external_input: 'failure' } }]) {
    const f = fixture(overrides);
    await assert.rejects(report(f.input));
    assert.equal(f.calls.filter(([verb]) => ['create', 'update'].includes(verb)).length, 0);
  }
});

test('does not overwrite a third-party issue spoofing the marker', async () => {
  const f = fixture({ issues: [{ number: 7, body: marker, user: { login: 'external-user' } }] });
  assert.equal((await report(f.input)).status, 'created');
  assert.equal(f.calls.filter(([verb]) => verb === 'update').length, 0);
});
