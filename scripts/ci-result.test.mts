import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { describe, it } from 'node:test';

// scripts/ci-result.mjs decides the single required check "CI result" from the other jobs.
function decide(needs: Record<string, string>): { code: number | null; out: string } {
  const json = JSON.stringify(Object.fromEntries(Object.entries(needs).map(([job, result]) => [job, { result }])));
  const run = spawnSync('node', ['scripts/ci-result.mjs'], { env: { ...process.env, NEEDS: json }, encoding: 'utf8' });
  return { code: run.status, out: run.stdout + run.stderr };
}

describe('CI result: one required check for the whole workflow', () => {
  it('CR-01: passes when every job succeeded or was skipped on purpose', () => {
    assert.equal(decide({ test: 'success', mutation: 'skipped', 'ai-provenance': 'success' }).code, 0);
  });

  it('CR-02: fails when any job failed, and names it', () => {
    const run = decide({ test: 'success', 'ai-provenance': 'failure' });
    assert.equal(run.code, 1);
    assert.match(run.out, /ai-provenance/);
  });

  it('CR-03: a cancelled job also fails the check', () => {
    assert.equal(decide({ test: 'cancelled' }).code, 1);
  });

  it('CR-04: missing or broken input fails instead of passing', () => {
    const empty = spawnSync('node', ['scripts/ci-result.mjs'], { env: { ...process.env, NEEDS: '' }, encoding: 'utf8' });
    assert.equal(empty.status, 1);
    assert.equal(decide({}).code, 1);
  });

  it('CR-05: "CI result" waits for every other job in the workflow', () => {
    const workflow = readFileSync('.github/workflows/playwright.yml', 'utf8');
    const jobsSection = workflow.slice(workflow.indexOf('\njobs:\n'));
    const jobs = [...jobsSection.matchAll(/^  ([a-z][a-z-]*):$/gm)].map((match) => match[1]!).filter((job) => job !== 'ci-result');
    const ciResult = jobsSection.slice(jobsSection.indexOf('\n  ci-result:\n'));
    const needs = [...ciResult.slice(ciResult.indexOf('needs:'), ciResult.indexOf('runs-on:')).matchAll(/^\s+- ([a-z-]+)$/gm)].map((m) => m[1]);
    assert.ok(jobs.length >= 10, jobs.join(', '));
    assert.deepEqual(jobs.filter((job) => !needs.includes(job)), []);
  });
});
