import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { describe, it } from 'node:test';
import { extractPageSnapshot, parseFailedLocator, similarity, suggestLocators } from './locator.mts';
import { generateHtmlReport, generateMarkdownReport } from './report.mts';
import type { FailureContext } from './types.mts';

const fixture = (name: string) =>
  readFileSync(new URL(`./fixtures/${name}/error-context.md`, import.meta.url), 'utf8');

function errorContext(waitingFor: string, snapshot: string): string {
  return `# Error details\n\n\`\`\`\nTimeoutError: locator.click: Timeout 3000ms exceeded.\nCall log:\n  - waiting for ${waitingFor}\n\`\`\`\n\n# Page snapshot\n\n\`\`\`yaml\n${snapshot}\n\`\`\`\n`;
}

function context(text: string): FailureContext {
  return {
    sourcePath: 'test-results/x',
    collectedAt: '2026-11-08T00:00:00.000Z',
    artifacts: { screenshots: [], videos: [], traces: [], errorContextPath: 'error-context.md', otherFiles: [] },
    errorContextText: text,
    classification: { category: 'locator', confidence: 0.9, matchedSignals: [], summary: 's' },
  };
}

describe('P13-M1 locator suggestions', () => {
  it('P13-M1-01: real Playwright failures get the renamed element as the top suggestion', () => {
    const button = suggestLocators(fixture('locator-click-renamed-button'))!;
    assert.equal(button.confidence, 'high');
    assert.equal(button.candidates[0].code, "getByRole('button', { name: 'Add Wireless Mouse to cart' })");
    assert.equal(button.candidates.length, 1, 'the other seven "Add … to cart" buttons are not close enough');

    const heading = suggestLocators(fixture('locator-expect-renamed-heading'))!;
    assert.equal(heading.failed.source, "getByRole('heading', { name: 'Your basket is empty' })", 'read from the Locator: line');
    assert.equal(heading.candidates[0].code, "getByRole('heading', { name: 'Your cart is empty' })");

    const label = suggestLocators(fixture('locator-label-renamed'))!;
    assert.equal(label.candidates[0].code, "getByLabel('Username', { exact: true })", 'keeps exact: true');
    assert.equal(label.candidates[0].role, 'textbox');
  });

  it('P13-M1-02: parses role, label and text locators, escaped quotes, and the last link of a chain', () => {
    assert.deepEqual(parseFailedLocator("  - waiting for getByRole('link', { name: 'Don\\'t go', exact: true })"), {
      kind: 'role',
      role: 'link',
      name: "Don't go",
      exact: true,
      source: "getByRole('link', { name: 'Don\\'t go', exact: true })",
    });
    const chained = parseFailedLocator("  - waiting for getByRole('row', { name: 'Mouse' }).getByRole('button', { name: 'Remove' })");
    assert.equal(chained?.name, 'Remove');
    assert.equal(parseFailedLocator("Locator: getByText('Total: $9')")?.kind, 'text');
    assert.equal(parseFailedLocator('Error: expect(page).toHaveURL(expected) failed'), null);
    assert.equal(parseFailedLocator("getByRole('button', { name: 'X' }) without a waiting line"), null);
  });

  it('P13-M1-03: no guess when the element is still on the page, or nothing is similar', () => {
    const present = suggestLocators(errorContext("getByRole('button', { name: 'Place order' })", '- button "Place order" [ref=e1]'))!;
    assert.equal(present.confidence, 'none');
    assert.match(present.reason ?? '', /probably was not renamed.*hidden, disabled/);

    const gone = suggestLocators(errorContext("getByRole('button', { name: 'Place order' })", '- link "Home" [ref=e1]'))!;
    assert.equal(gone.confidence, 'none');
    assert.match(gone.reason ?? '', /No similar element/);

    const testid = suggestLocators(errorContext("getByTestId('cart-total')", '- link "Home"'))!;
    assert.match(testid.reason ?? '', /Test ids are not part of the accessibility snapshot/);
    assert.match(suggestLocators("  - waiting for getByLabel('Email')")!.reason ?? '', /No page snapshot/);
    assert.equal(suggestLocators(null), null);
  });

  it('P13-M1-04: a button that became a link is suggested with a note; close ties lower the confidence', () => {
    const changed = suggestLocators(errorContext("getByRole('button', { name: 'Checkout' })", '- link "Checkout" [ref=e1]'))!;
    assert.equal(changed.candidates[0].code, "getByRole('link', { name: 'Checkout' })");
    assert.equal(changed.candidates[0].note, 'role changed from button to link');

    const tie = suggestLocators(
      errorContext("getByRole('button', { name: 'Save draft' })", '- button "Save drafts" [ref=e1]\n- button "Save draft now" [ref=e2]'),
    )!;
    assert.equal(tie.candidates.length, 2);
    assert.notEqual(tie.confidence, 'high', 'two close candidates are not a confident answer');
  });

  it('P13-M1-05: similarity ignores case and punctuation and stays low for unrelated text', () => {
    assert.equal(similarity('Log in', 'log-in'), 1);
    assert.ok(similarity('Your basket is empty', 'Your cart is empty') >= 0.6);
    assert.ok(similarity('Place order', 'Browse products') < 0.45);
    assert.equal(similarity('', 'x'), 0);
    assert.equal(extractPageSnapshot('no yaml here'), null);
  });

  it('P13-M1-06: reports show the section, and page text cannot break out of it', async () => {
    const hostile = errorContext(
      "getByRole('button', { name: 'Pay now', exact: true })",
      '- button "Pay now ```<img src=x>" [ref=e1]',
    );
    const markdown = generateMarkdownReport(context(hostile));
    assert.match(markdown, /## Locator suggestions/);
    assert.ok(markdown.includes('1. Similarity'), 'the hostile element is offered as a candidate');
    const block = markdown.slice(markdown.indexOf('1. Similarity'));
    assert.match(block, /^````ts$/m, 'fence is longer than the backticks inside');

    const html = await generateHtmlReport(context(hostile));
    assert.match(html, /<h2 id="locator-heading">Locator suggestions<\/h2>/);
    assert.doesNotMatch(html, /<img src=x>/);
    assert.match(html, /&lt;img src=x&gt;/);

    const unrelated = generateMarkdownReport(context(fixture('sample-failure')));
    assert.doesNotMatch(unrelated, /Locator suggestions/);
  });
});
