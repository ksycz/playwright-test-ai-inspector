import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { ESLint } from 'eslint';

// Lints sample specs with the real eslint.config.mjs, so a config change that stops the
// rules from applying (wrong glob, rule switched off) fails here instead of passing silently.
const eslint = new ESLint();

async function rulesFor(code: string, filePath = 'tests/e2e/sample.spec.ts'): Promise<string[]> {
  const [result] = await eslint.lintText(code, { filePath });
  return result!.messages.map((message) => message.ruleId ?? message.message);
}

const header = "import { test, expect } from '@playwright/test';\n";

describe('LINT: Playwright test lint gate', () => {
  it('LINT-01: a test without any assertion fails', async () => {
    const rules = await rulesFor(`${header}test('x', async ({ page }) => { await page.goto('/'); });`);
    assert.ok(rules.includes('playwright/expect-expect'), rules.join(', '));
  });

  it('LINT-02: a web-first assertion without await fails', async () => {
    const rules = await rulesFor(
      `${header}test('x', async ({ page }) => { expect(page.getByRole('button')).toBeVisible(); });`,
    );
    assert.ok(rules.includes('playwright/missing-playwright-await'), rules.join(', '));
  });

  it('LINT-03: test.only and waitForTimeout fail', async () => {
    const rules = await rulesFor(
      `${header}test.only('x', async ({ page }) => { await page.waitForTimeout(500); await expect(page).toHaveURL('/'); });`,
    );
    assert.ok(rules.includes('playwright/no-focused-test'), rules.join(', '));
    assert.ok(rules.includes('playwright/no-wait-for-timeout'), rules.join(', '));
  });

  it('LINT-04: an assertion inside an if fails', async () => {
    const rules = await rulesFor(
      `${header}test('x', async ({ page }) => { if (await page.title()) { await expect(page).toHaveURL('/'); } });`,
    );
    assert.ok(rules.includes('playwright/no-conditional-expect'), rules.join(', '));
  });

  it('LINT-05: a helper named expectSomething counts as an assertion', async () => {
    const rules = await rulesFor(
      `${header}async function expectHome(p: any) { await expect(p).toHaveURL('/'); }\ntest('x', async ({ page }) => { await expectHome(page); });`,
    );
    assert.deepEqual(rules, []);
  });

  it('LINT-06: a well-formed test passes', async () => {
    const rules = await rulesFor(
      `${header}test('x', async ({ page }) => { await page.goto('/'); await expect(page.getByRole('heading')).toBeVisible(); });`,
    );
    assert.deepEqual(rules, []);
  });
});
