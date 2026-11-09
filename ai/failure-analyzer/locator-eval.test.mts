import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { SEEDED_BUGS } from '../../app/src/seededBugs.ts';
import { parseLocatorEvalArgs } from './locator-eval-cli.mts';
import {
  LABEL_DRIFTS,
  matchDrift,
  renderLocatorEvaluation,
  scoreFailure,
  scoreLocatorEvaluation,
} from './locator-eval.mts';
import type { LocatorSuggestion } from './locator.mts';

function suggestion(
  failed: Partial<LocatorSuggestion['failed']>,
  candidates: Array<{ role: string; name: string }>,
  confidence: LocatorSuggestion['confidence'] = 'high',
): LocatorSuggestion {
  return {
    failed: { kind: 'role', name: '', exact: false, source: 'src', ...failed },
    confidence,
    candidates: candidates.map((candidate) => ({ ...candidate, code: `code:${candidate.name}`, score: 0.8 })),
  };
}

describe('P13-M3 locator evaluation', () => {
  it('P13-M3-01: every drift is a switch the app knows', () => {
    const appDrifts = SEEDED_BUGS.filter((bug) => bug.startsWith('drift-'));
    assert.deepEqual(LABEL_DRIFTS.map((drift) => drift.id), appDrifts);
  });

  it('P13-M3-02: failures are matched to drifts by kind, role and name', () => {
    assert.equal(matchDrift({ kind: 'role', role: 'button', name: 'Clear cart', exact: false, source: '' })?.id, 'drift-clear-cart');
    assert.equal(matchDrift({ kind: 'label', name: 'Username', exact: false, source: '' })?.id, 'drift-username-label');
    assert.equal(matchDrift({ kind: 'role', role: 'link', name: 'Clear cart', exact: false, source: '' }), undefined, 'role must match');
    assert.equal(matchDrift({ kind: 'role', role: 'button', name: 'clear cart', exact: false, source: '' }), undefined);
  });

  it('P13-M3-03: right, wrong, confident-wrong, and the removed element', () => {
    const right = scoreFailure('a', suggestion({ role: 'button', name: 'Clear cart' }, [{ role: 'button', name: 'Empty cart' }]));
    assert.deepEqual([right.drift, right.correct, right.confidentWrong], ['drift-clear-cart', true, false]);

    const wrongRole = scoreFailure('b', suggestion({ role: 'link', name: 'Browse products' }, [{ role: 'link', name: 'Browse products' }]));
    assert.deepEqual([wrongRole.correct, wrongRole.confidentWrong], [false, true], 'same name, but the role should have changed');

    const silent = scoreFailure('c', suggestion({ role: 'button', name: 'Place order' }, [], 'none'));
    assert.deepEqual([silent.correct, silent.confidentWrong], [false, false], 'a miss without a guess is not confident-wrong');

    const removedRight = scoreFailure('d', suggestion({ role: 'button', name: 'Proceed to checkout' }, [], 'none'));
    assert.equal(removedRight.correct, true);
    const removedGuess = scoreFailure('e', suggestion({ role: 'button', name: 'Proceed to checkout' }, [{ role: 'button', name: 'Clear cart' }], 'medium'));
    assert.deepEqual([removedGuess.correct, removedGuess.confidentWrong], [false, true]);

    const label = scoreFailure('f', suggestion({ kind: 'label', name: 'Username' }, [{ role: 'textbox', name: 'User name' }]));
    assert.equal(label.correct, true, 'labels compare by name only');

    const unrelated = scoreFailure('g', suggestion({ role: 'button', name: 'Something else' }, []));
    assert.deepEqual([unrelated.drift, unrelated.correct], [null, null]);
    assert.equal(scoreFailure('h', null).drift, null);
  });

  it('P13-M3-04: totals per drift and overall, rendered with escaping', () => {
    const scores = [
      scoreFailure('a', suggestion({ role: 'button', name: 'Clear cart' }, [{ role: 'button', name: 'Empty cart' }])),
      scoreFailure('b', suggestion({ role: 'button', name: 'Place order' }, [], 'none')),
      scoreFailure('c', suggestion({ role: 'button', name: 'Other' }, [])),
    ];
    const evaluation = scoreLocatorEvaluation('2026-11-09', scores);
    assert.equal(evaluation.failures, 3);
    assert.equal(evaluation.attributed, 2);
    assert.equal(evaluation.correct, 1);
    assert.deepEqual(evaluation.other, ['c']);
    assert.deepEqual(evaluation.drifts.find((drift) => drift.id === 'drift-place-order'), {
      id: 'drift-place-order',
      description: LABEL_DRIFTS[1].description,
      failures: 1,
      correct: 0,
      confidentWrong: 0,
      examples: ['no suggestion'],
    });

    const markdown = renderLocatorEvaluation(evaluation);
    assert.match(markdown, /Drifts that broke at least one test: 2 of 6/);
    assert.match(markdown, /Drifts where every suggestion was right: \*\*1 of 2\*\*/);
    assert.match(markdown, /right suggestion: \*\*1\*\* \(50%\)/);

    const hostile = scoreLocatorEvaluation('d', [{ ...scores[0], top: '<img src=x>' }]);
    assert.doesNotMatch(renderLocatorEvaluation(hostile), /<img src=x>/);
  });

  it('P13-M3-05: CLI options', () => {
    assert.deepEqual(parseLocatorEvalArgs([]), { grep: '@smoke|@e2e', outDir: 'ai-reports/locator-eval' });
    assert.equal(parseLocatorEvalArgs(['--config', 'x.ts']).config, 'x.ts');
    assert.throws(() => parseLocatorEvalArgs(['--wat']), /Unknown option/);
    assert.throws(() => parseLocatorEvalArgs(['--grep']), /Missing value/);
  });
});
