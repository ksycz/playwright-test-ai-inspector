import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import { SEEDED_BUGS } from '../../app/src/seededBugs.ts';
import { parseEvalArgs } from './args.mts';
import { buildCharters } from './charters.mts';
import {
  catches,
  parseHistory,
  renderEvaluation,
  scoreEvaluation,
  SEEDED_BUG_SPECS,
  toHistoryLine,
} from './evaluate.mts';
import type { ExplorationResult, Finding } from './types.mts';

const spec = readFileSync(new URL('../../docs/APP_SPEC.md', import.meta.url), 'utf8');

function finding(id: string, specRef: string): Finding {
  return { id, source: 'probe', charter: 'cart', specRef, title: id, expected: 'x', actual: 'y', steps: [] };
}

function result(findings: Finding[], stepsUsed = 100): ExplorationResult {
  return {
    baseUrl: 'http://localhost:5174',
    startedAt: '2026-11-08T00:00:00.000Z',
    budget: 400,
    stepsUsed,
    modelUsed: null,
    charters: [],
    findings,
    dropped: [],
  };
}

const [removeBug, totalBug] = SEEDED_BUG_SPECS;

test('P12-M2-03: the scored bug list matches the bugs the app can switch on', () => {
  assert.deepEqual(SEEDED_BUG_SPECS.map((bug) => bug.id), SEEDED_BUGS.filter((bug) => !bug.startsWith('drift-')));
});

test('P12-M2-04: every requirement a bug breaks is a real charter line, so a model can cite it', () => {
  const lines = buildCharters(spec, ['cart', 'checkout', 'auth']).flatMap((charter) => charter.requirements);
  for (const bug of SEEDED_BUG_SPECS) {
    for (const requirement of bug.requirements) {
      assert.ok(lines.includes(requirement), `${bug.id}: "${requirement}" is not in APP_SPEC`);
    }
  }
});

test('P12-M2-05: a bug counts as caught only by a finding that cites its requirement', () => {
  assert.ok(catches(finding('a', 'Shopping Cart: removing products'), removeBug));
  assert.ok(!catches(finding('b', 'Shopping Cart: clearing the cart'), removeBug));

  const evaluation = scoreEvaluation({
    date: '2026-11-08',
    layer: 'probes',
    baseline: result([finding('noise', 'Checkout: validate required fields')]),
    runs: [
      { bug: removeBug, result: result([finding('cart-remove-item', 'Shopping Cart: removing products'), finding('side', 'Shopping Cart: clearing the cart')], 240) },
      { bug: totalBug, result: result([finding('unrelated', 'Login: logout supported')]) },
    ],
  });
  assert.equal(evaluation.detected, 1);
  assert.equal(evaluation.total, 2);
  assert.deepEqual(evaluation.falsePositives, ['noise']);
  assert.deepEqual(evaluation.bugs[0], {
    id: 'cart-remove-noop',
    description: removeBug.description,
    detected: true,
    caughtBy: ['cart-remove-item'],
    otherFindings: ['side'],
    stepsUsed: 240,
  });
  assert.equal(evaluation.bugs[1].detected, false);
  assert.deepEqual(evaluation.bugs[1].otherFindings, ['unrelated']);
});

test('P12-M2-06: history lines round-trip and bad lines are skipped', () => {
  const evaluation = scoreEvaluation({
    date: '2026-11-08',
    layer: 'probes',
    baseline: result([]),
    runs: [{ bug: removeBug, result: result([]) }],
  });
  const line = toHistoryLine(evaluation);
  assert.ok(line.endsWith('\n'));
  const history = parseHistory(`${line}not json\n{"date":"x"}\n\n${line}`);
  assert.equal(history.length, 2);
  const good = { date: 'd', layer: 'l', detected: 1, total: 2, falsePositives: 0, missed: [] };
  assert.equal(parseHistory(JSON.stringify(good)).length, 1);
  for (const [key, bad] of [['date', 1], ['layer', null], ['detected', 1.5], ['total', '2'], ['falsePositives', undefined], ['missed', 'x']] as const) {
    assert.equal(parseHistory(JSON.stringify({ ...good, [key]: bad })).length, 0, `bad ${key} is skipped`);
  }
  assert.deepEqual(history[0], {
    date: '2026-11-08',
    layer: 'probes',
    detected: 0,
    total: 1,
    falsePositives: 0,
    missed: ['cart-remove-noop'],
  });
});

test('P12-M2-07: the report shows rate, misses and history, with model text escaped', () => {
  const evaluation = scoreEvaluation({
    date: '2026-11-08',
    layer: 'probes + anthropic:<img src=x>',
    baseline: result([finding('![x](https://evil.example)', 'x')]),
    runs: [
      { bug: removeBug, result: result([finding('cart-remove-item', 'Shopping Cart: removing products')]) },
      { bug: totalBug, result: result([]) },
    ],
  });
  const markdown = renderEvaluation(evaluation, parseHistory(toHistoryLine(evaluation)));
  assert.match(markdown, /\*\*1 of 2\*\* \(50%\)/);
  assert.match(markdown, /False positives on the clean shop: \*\*1\*\*/);
  assert.match(markdown, /❌ missed/);
  assert.match(markdown, /## History/);
  assert.doesNotMatch(markdown, /<img|!\[x\]\(/);
  assert.match(renderEvaluation({ ...evaluation, total: 0, detected: 0, bugs: [] }, []), /\(n\/a\)/);
});

test('P12-M2-08: eval options validate bugs and port', () => {
  const known = SEEDED_BUG_SPECS.map((bug) => bug.id);
  const options = parseEvalArgs(['--bugs', 'cart-not-saved', '--port', '5180', '--no-llm'], known);
  assert.deepEqual(options.bugs, ['cart-not-saved']);
  assert.equal(options.port, 5180);
  assert.equal(options.noLlm, true);
  assert.deepEqual(parseEvalArgs([], known).bugs, known);
  assert.throws(() => parseEvalArgs(['--bugs', 'made-up'], known), /--bugs accepts/);
  assert.throws(() => parseEvalArgs(['--port', '80'], known), /between 1024 and 65535/);
  assert.throws(() => parseEvalArgs(['--headed'], known), /Unknown option/);
});

test('P12-M2-09: every probe cites a requirement that is in its own charter', async () => {
  const { PROBES } = await import('./probes.mts');
  const charters = buildCharters(spec, ['cart', 'checkout', 'auth']);
  const all = charters.flatMap((charter) => charter.requirements);
  for (const probe of PROBES) {
    assert.ok(all.includes(probe.requirement), `${probe.id}: "${probe.requirement}" is not in APP_SPEC`);
  }
});
