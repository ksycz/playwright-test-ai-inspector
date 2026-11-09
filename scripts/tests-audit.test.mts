import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  BEHAVIOUR_BUGS,
  buildAudit,
  CASCADE_THRESHOLD,
  outcomesFromReport,
  parseAuditArgs,
  reportProblem,
  renderAudit,
  type TestOutcome,
} from './tests-audit.mts';

const t = (id: string, failed = false): TestOutcome => ({ id: `f.spec.ts::${id}`, failed });

test('TA-01: reads nested Playwright JSON into one outcome per test', () => {
  const report = {
    suites: [
      {
        file: 'smoke/a.spec.ts',
        suites: [{ specs: [{ title: 'one', ok: true }, { title: 'two', ok: false }] }],
        specs: [{ title: 'top', ok: true }],
      },
    ],
  };
  assert.deepEqual(outcomesFromReport(report), [
    { id: 'smoke/a.spec.ts::top', failed: false },
    { id: 'smoke/a.spec.ts::one', failed: false },
    { id: 'smoke/a.spec.ts::two', failed: true },
  ]);
  assert.deepEqual(outcomesFromReport({}), []);
});

test('TA-02: finds single guards, uncaught bugs and tests that never failed', () => {
  const clean = [t('a'), t('b'), t('c')];
  const audit = buildAudit(clean, [
    { bug: 'bug-1', tests: [t('a', true), t('b'), t('c')] },
    { bug: 'bug-2', tests: [t('a', true), t('b', true), t('c')] },
    { bug: 'bug-3', tests: [t('a'), t('b'), t('c')] },
  ]);
  assert.equal(audit.total, 3);
  assert.deepEqual(audit.baselineFailures, []);
  assert.deepEqual(audit.singleGuards, [{ bug: 'bug-1', test: 'f.spec.ts::a' }]);
  assert.deepEqual(audit.neverFailed, ['f.spec.ts::c']);
  assert.equal(audit.bugs[2].failing.length, 0);
});

test('TA-03: many failures from one bug count as a cascade, not separate guards', () => {
  const many = Array.from({ length: CASCADE_THRESHOLD + 1 }, (_, i) => t(`x${i}`, true));
  const audit = buildAudit(many.map((x) => ({ ...x, failed: false })), [{ bug: 'root', tests: many }]);
  assert.deepEqual(audit.cascades, [{ bug: 'root', count: CASCADE_THRESHOLD + 1 }]);
  assert.deepEqual(audit.singleGuards, []);
});

test('TA-04: a failing clean run is flagged, and report text is escaped', () => {
  const audit = buildAudit([t('![x](https://evil.example)', true)], [{ bug: 'b', tests: [t('![x](https://evil.example)', true)] }]);
  assert.equal(audit.baselineFailures.length, 1);
  const markdown = renderAudit(audit, { date: '2026-11-09', grep: '@smoke' });
  assert.match(markdown, /failed on the clean shop/);
  assert.match(markdown, /## Bugs guarded by a single test/);
  assert.match(markdown, /Tests that failed for none of the planted bugs \(0 of 1\)/);
  assert.doesNotMatch(markdown, /!\[x\]\(/);
  const ok = renderAudit(buildAudit([t('a')], [{ bug: 'b', tests: [t('a')] }]), { date: 'd', grep: 'all' });
  assert.match(ok, /Clean shop: all tests passed/);
  assert.match(ok, /## Bugs no test caught/);
});

test('TA-05: options default to behaviour bugs and reject unknown ones', () => {
  assert.deepEqual(parseAuditArgs([]).bugs, BEHAVIOUR_BUGS);
  assert.ok(BEHAVIOUR_BUGS.every((bug) => !bug.startsWith('drift-')));
  assert.deepEqual(parseAuditArgs(['--bugs', 'cart-not-saved,drift-clear-cart']).bugs, ['cart-not-saved', 'drift-clear-cart']);
  assert.equal(parseAuditArgs(['--grep', '@api']).grep, '@api');
  assert.throws(() => parseAuditArgs(['--bugs', 'nope']), /Unknown bug: nope/);
  assert.throws(() => parseAuditArgs(['--bugs']), /Missing value/);
  assert.throws(() => parseAuditArgs(['--bogus', 'x']), /Unknown option/);
});

test('TA-06: a report with no tests is a problem, not a pass', () => {
  const portInUse = { suites: [], errors: [{ message: 'Error: http://localhost:5173 is already used, make sure that nothing is running on the port/url' }] };
  assert.match(reportProblem(portInUse) ?? '', /could not run the tests.*already used.*Stop the running dev server/);
  assert.match(reportProblem({ suites: [], errors: [] }) ?? '', /ran no tests/);
  assert.match(reportProblem({ errors: [{ message: '\u001b[31mBoom\u001b[39m\nstack' }] }) ?? '', /: Boom$/);
  assert.equal(reportProblem({ suites: [{ file: 'a.spec.ts', specs: [{ title: 't', ok: true }] }], errors: [] }), null);
});
