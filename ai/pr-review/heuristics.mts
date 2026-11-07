import type { DiffLine } from './diff.mts';

export type ReviewFinding = {
  file: string;
  line: number;
  rule: 'wait' | 'locator' | 'suite-tag' | 'login' | 'test-only';
  message: string;
};

const SUITE_TAG = /@(?:smoke|e2e|api|visual)\b/;
const SPEC = /\.spec\.ts$/;
const AUTH_SPEC = 'tests/smoke/authentication.spec.ts';

function isSpec(file: string): boolean {
  return SPEC.test(file);
}

export function heuristicFindings(lines: DiffLine[]): ReviewFinding[] {
  const findings: ReviewFinding[] = [];
  const addedByFile = new Map<string, DiffLine[]>();

  for (const row of lines) {
    if (!row.added || !isSpec(row.file)) {
      continue;
    }
    const bucket = addedByFile.get(row.file) ?? [];
    bucket.push(row);
    addedByFile.set(row.file, bucket);

    if (/\bwaitForTimeout\s*\(/.test(row.text)) {
      findings.push({
        file: row.file,
        line: row.line,
        rule: 'wait',
        message: '`waitForTimeout` waits a fixed time. Wait for a locator or a response instead.',
      });
    }

    if (/\btest(?:\.describe)?\.only\s*\(/.test(row.text)) {
      findings.push({
        file: row.file,
        line: row.line,
        rule: 'test-only',
        message: '`test.only` would skip the rest of the suite in CI. Remove it before merging.',
      });
    }

    if (isCssOrXPathLocator(row.text)) {
      findings.push({
        file: row.file,
        line: row.line,
        rule: 'locator',
        message: 'This is a CSS or XPath locator. Prefer `getByRole` when the element has an accessible role.',
      });
    }

    const describe = row.text.match(/test\.describe(?:\.only)?\s*\(\s*(['"`])([\s\S]*?)\1/);
    if (describe && !SUITE_TAG.test(describe[2] ?? '')) {
      findings.push({
        file: row.file,
        line: row.line,
        rule: 'suite-tag',
        message: 'This `test.describe` has no `@smoke`, `@e2e`, `@api`, or `@visual` tag, so CI will not select it.',
      });
    }
  }

  for (const [file, added] of addedByFile) {
    if (file === AUTH_SPEC) {
      continue;
    }
    const joined = added.map((row) => row.text).join('\n');
    if (/\bloginViaUi\b|\bloggedInPage\b|auth\.fixture/.test(joined)) {
      continue;
    }
    const login = added.find((row) => /\.login\s*\(/.test(row.text));
    const usesLoginPage = /\bLoginPage\b|getByLabel\s*\(\s*['"]Username['"]/.test(joined);
    if (login && usesLoginPage) {
      findings.push({
        file,
        line: login.line,
        rule: 'login',
        message: 'This spec logs in through the page object. Use `loggedInPage` from `tests/fixtures/auth.fixture` instead.',
      });
    }
  }

  return findings;
}

function isCssOrXPathLocator(text: string): boolean {
  if (/\bgetByRole\s*\(/.test(text)) {
    return false;
  }
  return /\.locator\s*\(\s*['"`](?:[#.[\w]|xpath=|css=|\/\/)/.test(text) || /\bxpath\s*=/.test(text);
}
