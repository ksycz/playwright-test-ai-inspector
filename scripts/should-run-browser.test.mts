import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { test } from 'node:test';

function decide(files: string[]): string {
  return execFileSync('node', ['scripts/should-run-browser.mjs'], {
    input: files.join('\n'),
    encoding: 'utf8',
  }).trim();
}

test('AI tooling and docs only: browser suites are skipped', () => {
  assert.equal(decide(['ai/run-summary/report.mts', 'ai/run-summary/README.md', 'docs/ROADMAP.md']), 'false');
  assert.equal(decide(['README.md']), 'false');
});

test('anything that can change the shop or its tests runs the browser suites', () => {
  assert.equal(decide(['ai/shared/html.mts', 'app/src/App.tsx']), 'true');
  assert.equal(decide(['tests/smoke/home-page.spec.ts']), 'true');
  assert.equal(decide(['playwright.config.ts']), 'true');
  assert.equal(decide(['package-lock.json']), 'true');
  assert.equal(decide(['scripts/playwright.sh']), 'true');
  assert.equal(decide(['.github/workflows/playwright.yml']), 'true');
});

test('an empty change list runs the browser suites', () => {
  assert.equal(decide([]), 'true');
});
