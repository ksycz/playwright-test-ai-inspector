import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';

const stryker = 'node_modules/.bin/stryker';

function run(config: string): { status: number | null; stdout: string } {
  try {
    const stdout = execFileSync(stryker, ['run', config], {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    return { status: 0, stdout };
  } catch (error) {
    const failed = error as { status?: number; stdout?: string; stderr?: string };
    return { status: failed.status ?? 1, stdout: `${failed.stdout ?? ''}${failed.stderr ?? ''}` };
  }
}

test('P11-M1-02: a weak assertion lets a mutant survive', () => {
  const result = run('scripts/mutation-spike/stryker.weak.json');
  assert.equal(result.status, 0, result.stdout);
  const report = JSON.parse(readFileSync('scripts/mutation-spike/weak-report.json', 'utf8')) as {
    files: Record<string, { mutants: Array<{ status: string }> }>;
  };
  const survived = Object.values(report.files)
    .flatMap((file) => file.mutants)
    .filter((mutant) => mutant.status === 'Survived');
  assert.ok(survived.length > 0);
});

test('P11-M1-03: a score below the break threshold fails the run', () => {
  const result = run('scripts/mutation-spike/stryker.break.json');
  assert.notEqual(result.status, 0);
  assert.match(result.stdout, /breaking threshold 100/);
});
