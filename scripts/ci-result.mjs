/**
 * Decides the "CI result" check: the one check `main` requires before a merge.
 *
 * Reads the workflow's `needs` context as JSON from NEEDS and passes only when every job
 * succeeded or was skipped on purpose (path rules skip suites on docs-only PRs, mutation when
 * no mutated code changed). A failed or cancelled job fails it. One aggregate check avoids
 * requiring each job: a skipped matrix job reports under an unexpanded name, which would leave
 * a required "Playwright (smoke)" pending forever.
 */
let needs;
try {
  needs = JSON.parse(process.env.NEEDS ?? '');
} catch {
  console.error('CI result: NEEDS is missing or not JSON.');
  process.exit(1);
}

const jobs = Object.entries(needs ?? {});
if (jobs.length === 0) {
  console.error('CI result: no jobs to check.');
  process.exit(1);
}

for (const [job, { result }] of jobs) console.log(`${job}: ${result}`);
const bad = jobs.filter(([, { result }]) => result !== 'success' && result !== 'skipped').map(([job]) => job);
if (bad.length > 0) {
  console.error(`CI result: failed or cancelled: ${bad.join(', ')}`);
  process.exit(1);
}
console.log('CI result: every job passed or was skipped on purpose.');
