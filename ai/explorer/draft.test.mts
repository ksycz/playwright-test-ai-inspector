import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import { parseDraftArgs, prCommands, readFindings, repoFromRemote } from './draft-cli.mts';
import { checkLine, commentText, draftPrBody, draftSpec, slugify, str } from './draft.mts';
import type { Finding } from './types.mts';

const user = { username: 'standard_user', password: 'secret123' };
const [recorded] = readFindings(
  readFileSync(new URL('./fixtures/finding-cart-increase-quantity.jsonl', import.meta.url), 'utf8'),
);

function finding(overrides: Partial<Finding>): Finding {
  return {
    id: 'checkout-invalid-email',
    source: 'probe',
    charter: 'checkout',
    specRef: 'Checkout: display validation errors',
    title: 'A malformed email blocks the order',
    expected: 'Email marked invalid',
    actual: 'order placed',
    steps: [],
    ...overrides,
  };
}

test('P12-M3-01: a recorded probe finding becomes a page-object spec', () => {
  const draft = draftSpec(recorded, { user, date: '2026-11-08' });
  assert.equal(draft.path, 'tests/e2e/explored/cart-increase-quantity.spec.ts');
  assert.equal(draft.complete, true);
  assert.match(draft.source, /import \{ CartPage, ProductsPage \} from '\.\.\/\.\.\/pages';/);
  assert.match(draft.source, /test\.describe\('@e2e Explored: cart'/);
  assert.match(draft.source, /await productsPage\.addToCart\('Mechanical Keyboard'\);/);
  assert.equal((draft.source.match(/increaseQuantityButton\('Mechanical Keyboard'\)\.click\(\)/g) ?? []).length, 2);
  assert.match(draft.source, /await expect\(cartPage\.cartTotal\)\.toHaveText\('\$269\.97'\);/);
  assert.match(draft.source, /await expect\(cartPage\.cartLink\(3\)\)\.toBeVisible\(\);/);
  assert.doesNotMatch(draft.source, /test\.fixme|getByRole\('button'/);
});

test('P12-M3-02: login and the checkout form use the fixture and fillForm', () => {
  const draft = draftSpec(
    finding({
      actions: [
        { kind: 'goto', path: '/login' },
        { kind: 'type', label: 'Username', text: 'standard_user' },
        { kind: 'type', label: 'Password', text: 'secret123' },
        { kind: 'click', role: 'button', name: 'Log in' },
        { kind: 'goto', path: '/checkout' },
        { kind: 'type', label: 'Name', text: 'Ada' },
        { kind: 'type', label: 'Email', text: 'not-an-email' },
        { kind: 'type', label: 'Address', text: '1 St' },
        { kind: 'type', label: 'City', text: 'Prague' },
        { kind: 'type', label: 'ZIP Code', text: '11000' },
        { kind: 'click', role: 'button', name: 'Place order' },
      ],
      checks: [{ kind: 'fieldInvalid', label: 'Email' }, { kind: 'url', pattern: '/checkout$' }],
    }),
    { user, date: '2026-11-08' },
  );
  assert.match(draft.source, /import \{ loginViaUi \} from '\.\.\/\.\.\/fixtures';/);
  assert.match(draft.source, /await loginViaUi\(page\);/);
  assert.doesNotMatch(draft.source, /Username|secret123/);
  assert.match(draft.source, /checkoutPage\.fillForm\(\{ name: 'Ada', email: 'not-an-email', address: '1 St', city: 'Prague', zipCode: '11000' \}\)/);
  assert.match(draft.source, /checkoutPage\.placeOrderButton\.click\(\)/);
  assert.match(draft.source, /toHaveURL\(new RegExp\('\/checkout\$'\)\)/);
});

test('P12-M3-03: a wrong-password login stays as plain steps, not the fixture', () => {
  const draft = draftSpec(
    finding({
      actions: [
        { kind: 'goto', path: '/login' },
        { kind: 'type', label: 'Username', text: 'standard_user' },
        { kind: 'type', label: 'Password', text: 'nope' },
        { kind: 'click', role: 'button', name: 'Log in' },
      ],
      checks: [{ kind: 'textVisible', text: 'Invalid username or password' }],
    }),
    { user, date: 'd' },
  );
  assert.doesNotMatch(draft.source, /loginViaUi/);
  assert.match(draft.source, /getByLabel\('Password', \{ exact: true \}\)\.fill\('nope'\)/);
  assert.match(draft.source, /getByRole\('button', \{ name: 'Log in', exact: true \}\)\.click\(\)/);
});

test('P12-M3-04: model findings without checks or with ref-only steps become test.fixme', () => {
  const draft = draftSpec(
    finding({ source: 'model', steps: ['Open /cart', 'Click e12'], actions: [{ kind: 'goto', path: '/cart' }, null] }),
    { user, date: 'd' },
  );
  assert.equal(draft.complete, false);
  assert.equal(draft.warnings.length, 2);
  assert.match(draft.source, /test\.fixme\(true, 'Draft is incomplete:/);
  assert.match(draft.source, /\/\/ TODO: not generated, do this by hand: Click e12/);
  assert.match(draft.source, /\/\/ TODO: assert the expected behaviour/);
});

test('P12-M3-05: text from a finding cannot escape a string or a comment', () => {
  const hostile = "x'); process.exit(1); ('\n*/ evil() /*";
  const draft = draftSpec(
    finding({
      id: '../../etc/passwd',
      source: 'model',
      title: hostile,
      expected: hostile,
      actual: hostile,
      specRef: hostile,
      actions: [{ kind: 'type', label: hostile, text: hostile }],
      checks: [{ kind: 'textVisible', text: hostile }],
    }),
    { user, date: '2026-11-08' },
  );
  assert.equal(draft.path, 'tests/e2e/explored/etc-passwd.spec.ts');
  const lines = draft.source.split('\n');
  const headerEnd = lines.indexOf(' */');
  assert.ok(lines.slice(0, headerEnd).every((line) => !line.includes('*/')), 'header block comment cannot be closed early');
  for (const line of lines.filter((item) => item.includes('evil'))) {
    const trimmed = line.trim();
    const safe = trimmed.startsWith('//') || trimmed.startsWith('*') || line.includes(str(hostile).slice(1, -1));
    assert.ok(safe, `unsafe line: ${line}`);
  }
  assert.equal(eval(str(hostile)), hostile);
  assert.equal(str("a b'\\"), "'a\\u2028b\\'\\\\'");
  assert.equal(commentText('a\nb\u0007c'), 'a b c');
  assert.equal(slugify('!!!'), 'finding');
});

test('P12-M3-06: every check kind has an assertion', () => {
  const pages = new Set<never>();
  assert.match(checkLine({ kind: 'rowVisible', name: 'A' }, pages), /productRow\('A'\)\)\.toBeVisible/);
  assert.match(checkLine({ kind: 'rowAbsent', name: 'A' }, pages), /toHaveCount\(0\)/);
  assert.match(checkLine({ kind: 'buttonVisible', name: 'Log out' }, pages), /getByRole\('button', \{ name: 'Log out', exact: true \}\)/);
  assert.match(checkLine({ kind: 'linkVisible', name: 'Login' }, pages), /getByRole\('link', \{ name: 'Login', exact: true \}\)/);
  assert.match(checkLine({ kind: 'textVisible', text: 'Hi' }, pages), /getByText\('Hi'\)\)\.toBeVisible/);
  assert.match(checkLine({ kind: 'cartBadge', count: 0 }, pages), /cartLink\(0\)/);
});

test('P12-M3-07: the PR description has the four sections and escapes model text', () => {
  const model = finding({ source: 'model', title: '![x](https://evil.example/p.png)' });
  const draft = draftSpec(model, { user, date: 'd' });
  const body = draftPrBody(model, draft, 'explored/checkout-invalid-email');
  for (const heading of ['## What changed', '## What problem it solves', '## How to test locally', '## Risk']) {
    assert.ok(body.includes(heading), heading);
  }
  assert.doesNotMatch(body, /!\[x\]\(/);
  assert.match(body, /npm run test:e2e -- tests\/e2e\/explored\/checkout-invalid-email\.spec\.ts/);
  assert.match(body, /test\.fixme/);
  assert.match(body, /model layer/);
});

test('P12-M3-08: --pr builds a branch, a one-file commit, and a draft PR', () => {
  assert.equal(repoFromRemote('https://github.com/ksycz/playwright-test-ai-inspector.git\n'), 'ksycz/playwright-test-ai-inspector');
  assert.equal(repoFromRemote('git@github.com:ksycz/repo.git'), 'ksycz/repo');
  assert.equal(repoFromRemote('http://127.0.0.1:1234/git/ksycz/repo'), 'ksycz/repo');
  assert.throws(() => repoFromRemote('nonsense'), /owner\/repo/);

  const commands = prCommands({
    branch: 'explored/x',
    specPath: 'tests/e2e/explored/x.spec.ts',
    title: 't',
    bodyFile: '/tmp/b.md',
    repo: 'o/r',
    base: 'main',
  });
  assert.deepEqual(commands.map((command) => `${command.cmd} ${command.args[0]}`), [
    'git fetch',
    'git switch',
    'git add',
    'git commit',
    'git push',
    'gh api',
  ]);
  assert.deepEqual(commands[1].args, ['switch', '-c', 'explored/x', 'origin/main'], 'branches from the base');
  assert.deepEqual(commands[3].args.slice(-2), ['--', 'tests/e2e/explored/x.spec.ts'], 'commits only the spec');
  assert.ok(commands[5].args.includes('draft=true'));

  assert.deepEqual(parseDraftArgs(['--finding', 'a', '--pr', '--dry-run']).dryRun, true);
  assert.throws(() => parseDraftArgs([]), /--finding/);
  assert.throws(() => parseDraftArgs(['--finding', 'a', '--dry-run']), /only applies with --pr/);
  assert.throws(() => parseDraftArgs(['--finding', 'a', '--wat']), /Unknown option/);
});
