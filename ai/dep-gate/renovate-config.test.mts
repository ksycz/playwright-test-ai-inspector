import assert from 'node:assert/strict';
import { access, readFile } from 'node:fs/promises';
import { describe, it } from 'node:test';

const config = JSON.parse(await readFile(new URL('../../renovate.json', import.meta.url), 'utf8')) as {
  extends: string[];
  dependencyDashboard: boolean;
  packageRules: Array<Record<string, unknown>>;
};

function rule(match: (entry: Record<string, unknown>) => boolean): Record<string, unknown> {
  const found = config.packageRules.find(match);
  assert.ok(found, 'expected package rule was missing');
  return found;
}

describe('P9-M2 Renovate config', () => {
  it('uses the recommended preset and the Dependency Dashboard', () => {
    assert.ok(config.extends.includes('config:recommended'));
    assert.equal(config.dependencyDashboard, true);
  });

  it('waits 3 days before proposing an npm update', () => {
    const age = rule(
      (entry) =>
        Array.isArray(entry.matchManagers) &&
        entry.matchManagers.includes('npm') &&
        entry.minimumReleaseAge !== undefined,
    );
    assert.equal(age.minimumReleaseAge, '3 days');
  });

  it('groups Playwright packages into one pull request', () => {
    const playwright = rule((entry) => entry.groupName === 'Playwright');
    assert.deepEqual(playwright.matchPackageNames, [
      '@playwright/test',
      'playwright',
      'playwright-core',
    ]);
  });

  it('groups other non-major devDependencies weekly and automerges them', () => {
    const weekly = rule((entry) => entry.groupName === 'non-major devDependencies');
    assert.deepEqual(weekly.matchDepTypes, ['devDependencies']);
    assert.deepEqual(weekly.matchUpdateTypes, ['minor', 'patch']);
    assert.equal(weekly.automerge, true);
    assert.deepEqual(weekly.schedule, ['before 6am on monday']);
    assert.deepEqual(weekly.matchPackageNames, [
      '!@playwright/test',
      '!playwright',
      '!playwright-core',
    ]);
  });

  it('does not automerge major updates', () => {
    const majors = rule(
      (entry) =>
        Array.isArray(entry.matchUpdateTypes) &&
        entry.matchUpdateTypes.includes('major') &&
        entry.automerge === false,
    );
    assert.equal(majors.automerge, false);
  });

  it('P9-M2-05: Dependabot version updates stay off', async () => {
    await assert.rejects(() => access(new URL('../../.github/dependabot.yml', import.meta.url)));
  });
});
