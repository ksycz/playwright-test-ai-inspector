import assert from 'node:assert/strict';
import { mkdtemp, readFile, writeFile, cp } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { describe, it } from 'node:test';
import { analyzeFlakyReport } from '../flaky-detector/analyze.mts';
import { collectLocatorHints } from './locators.mts';
import { generateRunSummaryHtml, generateRunSummaryMarkdown } from './report.mts';
import { summarizeRuns } from './summarize.mts';

const report = path.resolve('ai/run-summary/fixtures/locator-failure/playwright-results.json');

describe('P13 locator suggestions in the run summary', () => {
  it('LH-01: the flaky detector keeps the error-context path of each attempt', async () => {
    const analysis = await analyzeFlakyReport(report);
    const failed = analysis.unexpectedTests.find((test) => test.title.startsWith('P1-M5-01'));
    assert.equal(failed?.attempts[0]?.errorContextPath, 'ai/failure-analyzer/fixtures/locator-click-renamed-button/error-context.md');
  });

  it('LH-02: a hint is collected only for a failure whose error context has a suggestion', async () => {
    const hints = await collectLocatorHints(report);
    assert.equal(hints.length, 1);
    const [hint] = hints;
    assert.match(hint!.fullTitle, /P1-M5-01/);
    assert.match(hint!.failed, /getByRole/);
    assert.match(hint!.suggested, /getByRole/);
    assert.notEqual(hint!.suggested, hint!.failed);
    assert.ok(hint!.score > 0.45 && hint!.score <= 1);
  });

  it('LH-03: a missing error-context file is skipped, not an error', async () => {
    const dir = await mkdtemp(path.join(os.tmpdir(), 'hints-'));
    const json = JSON.parse(await readFile(report, 'utf8'));
    json.suites[0].suites[0].specs[0].tests[0].results[0].attachments[0].path = path.join(dir, 'gone.md');
    const copy = path.join(dir, 'playwright-results.json');
    await writeFile(copy, JSON.stringify(json));
    assert.deepEqual(await collectLocatorHints(copy), []);
  });

  it('LH-04: the summary shows the hint under its failure when locator-hints.json sits next to the report', async () => {
    const dir = await mkdtemp(path.join(os.tmpdir(), 'hints-'));
    await cp(report, path.join(dir, 'playwright-results.json'));
    const hints = await collectLocatorHints(report);
    await writeFile(path.join(dir, 'locator-hints.json'), JSON.stringify(hints));

    const summary = await summarizeRuns([{ suite: 'smoke', reportPath: path.join(dir, 'playwright-results.json') }]);
    const failures = summary.suites[0]!.hardFailures;
    assert.ok(failures.find((failure) => /P1-M5-01/.test(failure.fullTitle))?.locator);
    assert.equal(failures.find((failure) => /P1-M5-02/.test(failure.fullTitle))?.locator, undefined);

    const markdown = generateRunSummaryMarkdown(summary);
    assert.match(markdown, /suggested locator/i);
    assert.match(markdown, /not applied/i);
    assert.match(generateRunSummaryHtml(summary), /suggested locator/i);
  });

  it('LH-05: without locator-hints.json the summary is unchanged', async () => {
    const summary = await summarizeRuns([{ suite: 'smoke', reportPath: report }]);
    assert.ok(summary.suites[0]!.hardFailures.every((failure) => failure.locator === undefined));
    assert.doesNotMatch(generateRunSummaryMarkdown(summary), /suggested locator/i);
  });
});

describe('P13 locator hint rendering is safe', () => {
  it('LH-06: a hint with backticks, newlines and HTML stays one inline code span', async () => {
    const summary = await summarizeRuns([{ suite: 'smoke', reportPath: report }]);
    summary.suites[0]!.hardFailures[0]!.locator = {
      fullTitle: 'x',
      file: 'x',
      failed: "getByRole('button')",
      suggested: "getByRole('button', { name: 'a`` b\n## Injected <img src=x>' })",
      score: 0.9,
      confidence: 'high',
    };
    const markdown = generateRunSummaryMarkdown(summary);
    const line = markdown.split('\n').find((entry) => entry.includes('suggested locator'))!;
    assert.match(line, /```getByRole\('button', \{ name: 'a`` b ## Injected <img src=x>' \}\)```/);
    assert.doesNotMatch(markdown, /^## Injected/m);
    assert.doesNotMatch(generateRunSummaryHtml(summary), /<img src=x>/);
  });
});
