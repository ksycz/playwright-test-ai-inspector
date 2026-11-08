import { escapeMarkdown } from '../shared/markdown.mts';
import type { Action, Check, Finding } from './types.mts';

/**
 * Finding → draft @e2e spec (P12-M3).
 *
 * Every value that came from a finding (names, typed text, model text) is emitted
 * only as a JSON string literal or a single-line comment, never as code.
 */
export type Credentials = { username: string; password: string };

export type Draft = {
  path: string;
  source: string;
  /** False when a step or the assertion could not be generated; the spec is then test.fixme. */
  complete: boolean;
  warnings: string[];
};

const PAGE_OBJECTS = {
  productsPage: 'ProductsPage',
  cartPage: 'CartPage',
  checkoutPage: 'CheckoutPage',
  loginPage: 'LoginPage',
} as const;
type PageVar = keyof typeof PAGE_OBJECTS;

const GOTO: Record<string, PageVar> = {
  '/products': 'productsPage',
  '/cart': 'cartPage',
  '/checkout': 'checkoutPage',
  '/login': 'loginPage',
};

const CHECKOUT_FIELDS: Record<string, string> = {
  Name: 'name',
  Email: 'email',
  Address: 'address',
  City: 'city',
  'ZIP Code': 'zipCode',
};

/** A single-quoted TypeScript string literal; every value from a finding goes through this. */
export function str(value: string | number): string {
  if (typeof value === 'number') return String(value);
  const escaped = value.replace(/[\\'\u0000-\u001f\u007f\u2028\u2029]/g, (char) => {
    if (char === '\\') return '\\\\';
    if (char === "'") return "\\'";
    return `\\u${char.charCodeAt(0).toString(16).padStart(4, '0')}`;
  });
  return `'${escaped}'`;
}

/** Safe inside a `//` comment: one line, no control characters. */
export function commentText(value: string): string {
  return value.replace(/[\u0000-\u001f\u007f\u2028\u2029]+/g, ' ').trim();
}

/** Safe inside a block comment as well. */
function blockText(value: string): string {
  return commentText(value).replaceAll('*/', '* /');
}

export function slugify(id: string): string {
  const slug = id.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
  return slug || 'finding';
}

type Built = { lines: string[]; pages: Set<PageVar>; usesLogin: boolean; missing: string[] };

function isLoginRun(actions: Array<Action | null>, index: number, user: Credentials): boolean {
  const [goto, username, password, submit] = actions.slice(index, index + 4);
  return (
    goto?.kind === 'goto' &&
    goto.path === '/login' &&
    username?.kind === 'type' &&
    username.label === 'Username' &&
    username.text === user.username &&
    password?.kind === 'type' &&
    password.label === 'Password' &&
    password.text === user.password &&
    submit?.kind === 'click' &&
    submit.role === 'button' &&
    submit.name === 'Log in'
  );
}

/** Consecutive typing into all five checkout fields → checkoutPage.fillForm(...). */
function checkoutRun(actions: Array<Action | null>, index: number): Record<string, string> | null {
  const values: Record<string, string> = {};
  for (const action of actions.slice(index, index + 5)) {
    if (action?.kind !== 'type' || !(action.label in CHECKOUT_FIELDS)) return null;
    values[CHECKOUT_FIELDS[action.label]] = action.text;
  }
  return Object.keys(values).length === 5 ? values : null;
}

function clickLine(action: Extract<Action, { kind: 'click' }>, lastPath: string, pages: Set<PageVar>): string {
  const { role, name } = action;
  if (role === 'button') {
    const add = name.match(/^Add (.+) to cart$/);
    if (add && lastPath === '/products') {
      pages.add('productsPage');
      return `await productsPage.addToCart(${str(add[1])});`;
    }
    const cartButtons: Array<[RegExp, string]> = [
      [/^Increase quantity of (.+)$/, 'increaseQuantityButton'],
      [/^Decrease quantity of (.+)$/, 'decreaseQuantityButton'],
      [/^Remove (.+) from cart$/, 'removeProductButton'],
    ];
    for (const [pattern, method] of cartButtons) {
      const match = name.match(pattern);
      if (match) {
        pages.add('cartPage');
        return `await cartPage.${method}(${str(match[1])}).click();`;
      }
    }
    if (name === 'Clear cart') {
      pages.add('cartPage');
      return 'await cartPage.clearCart();';
    }
    if (name === 'Proceed to checkout') {
      pages.add('cartPage');
      return 'await cartPage.proceedToCheckout();';
    }
    if (name === 'Place order') {
      pages.add('checkoutPage');
      return 'await checkoutPage.placeOrderButton.click();';
    }
  }
  return `await page.getByRole(${str(role)}, { name: ${str(name)}, exact: true }).click();`;
}

function buildSteps(finding: Finding, user: Credentials): Built {
  const built: Built = { lines: [], pages: new Set(), usesLogin: false, missing: [] };
  const actions = finding.actions ?? [];
  let lastPath = '';
  for (let index = 0; index < actions.length; index += 1) {
    const action = actions[index];
    if (!action) {
      const note = finding.steps[index] ?? 'unknown step';
      built.missing.push(note);
      built.lines.push(`// TODO: not generated, do this by hand: ${commentText(note)}`);
      continue;
    }
    if (isLoginRun(actions, index, user)) {
      built.usesLogin = true;
      built.lines.push('await loginViaUi(page);');
      lastPath = '/login';
      index += 3;
      continue;
    }
    const form = checkoutRun(actions, index);
    if (form) {
      built.pages.add('checkoutPage');
      const fields = Object.entries(form).map(([key, value]) => `${key}: ${str(value)}`).join(', ');
      built.lines.push(`await checkoutPage.fillForm({ ${fields} });`);
      index += 4;
      continue;
    }
    if (action.kind === 'goto') {
      lastPath = action.path.split('?')[0];
      const pageVar = GOTO[action.path];
      if (pageVar) {
        built.pages.add(pageVar);
        built.lines.push(`await ${pageVar}.goto();`);
      } else {
        built.lines.push(`await page.goto(${str(action.path)});`);
      }
    } else if (action.kind === 'click') {
      built.lines.push(clickLine(action, lastPath, built.pages));
    } else {
      built.lines.push(`await page.getByLabel(${str(action.label)}, { exact: true }).fill(${str(action.text)});`);
    }
  }
  return built;
}

export function checkLine(check: Check, pages: Set<PageVar>): string {
  switch (check.kind) {
    case 'cartTotal':
      pages.add('cartPage');
      return `await expect(cartPage.cartTotal).toHaveText(${str(check.amount)});`;
    case 'cartBadge':
      pages.add('cartPage');
      return `await expect(cartPage.cartLink(${check.count})).toBeVisible();`;
    case 'rowVisible':
      pages.add('cartPage');
      return `await expect(cartPage.productRow(${str(check.name)})).toBeVisible();`;
    case 'rowAbsent':
      pages.add('cartPage');
      return `await expect(cartPage.productRow(${str(check.name)})).toHaveCount(0);`;
    case 'url':
      return `await expect(page).toHaveURL(new RegExp(${str(check.pattern)}));`;
    case 'fieldInvalid':
      return `await expect(page.getByRole('textbox', { name: ${str(check.label)}, exact: true })).toHaveAttribute('aria-invalid', 'true');`;
    case 'textVisible':
      return `await expect(page.getByText(${str(check.text)})).toBeVisible();`;
    case 'buttonVisible':
      return `await expect(page.getByRole('button', { name: ${str(check.name)}, exact: true })).toBeVisible();`;
    case 'linkVisible':
      return `await expect(page.getByRole('link', { name: ${str(check.name)}, exact: true })).toBeVisible();`;
  }
}

export function draftSpec(finding: Finding, options: { user: Credentials; date: string }): Draft {
  const slug = slugify(finding.id);
  const built = buildSteps(finding, options.user);
  const checks = (finding.checks ?? []).map((check) => checkLine(check, built.pages));
  const warnings: string[] = [];
  if (built.missing.length > 0) warnings.push(`${built.missing.length} step(s) could not be generated`);
  if (checks.length === 0) warnings.push('no expected-state checks (model finding): write the assertion by hand');
  const complete = warnings.length === 0;

  const pageVars = [...built.pages].sort();
  const imports = ["import { test, expect } from '@playwright/test';"];
  if (built.usesLogin) imports.push("import { loginViaUi } from '../../fixtures';");
  if (pageVars.length > 0) {
    imports.push(`import { ${pageVars.map((name) => PAGE_OBJECTS[name]).sort().join(', ')} } from '../../pages';`);
  }

  const body: string[] = [];
  if (!complete) {
    body.push(`test.fixme(true, ${str(`Draft is incomplete: ${warnings.join('; ')}`)});`);
  }
  for (const name of pageVars) body.push(`const ${name} = new ${PAGE_OBJECTS[name]}(page);`);
  if (pageVars.length > 0) body.push('');
  body.push(...built.lines);
  body.push('');
  if (checks.length > 0) {
    body.push(`// Expected: ${commentText(finding.expected)}`);
    body.push(...checks);
  } else {
    body.push(`// Expected: ${commentText(finding.expected)}`);
    body.push(`// The explorer saw: ${commentText(finding.actual)}`);
    body.push('// TODO: assert the expected behaviour with a page object.');
  }

  const header = [
    '/**',
    ` * Draft generated by npm run explore:draft on ${blockText(options.date)}.`,
    ` * Finding: ${blockText(finding.id)} (${finding.source === 'probe' ? 'deterministic probe' : 'model, confirmed by replay'})`,
    ` * Spec: ${blockText(finding.specRef)} (docs/APP_SPEC.md)`,
    ' * Asserts the correct behaviour: it fails while the bug is present and passes once fixed.',
    ' * Review the steps and assertions before merging.',
    ' */',
  ];

  const source = [
    ...imports,
    '',
    ...header,
    `test.describe(${str(`@e2e Explored: ${finding.charter}`)}, () => {`,
    `  test(${str(`${finding.title} (${finding.id})`)}, async ({ page }) => {`,
    ...body.map((line) => (line ? `    ${line}` : '')),
    '  });',
    '});',
    '',
  ].join('\n');

  return { path: `tests/e2e/explored/${slug}.spec.ts`, source, complete, warnings };
}

/** Four-section PR description for a draft (what, problem, how to test, risk). */
export function draftPrBody(finding: Finding, draft: Draft, branch: string): string {
  const safe = (value: string) => escapeMarkdown(commentText(value));
  return `## What changed

A draft end-to-end test generated from exploration finding \`${slugify(finding.id)}\`: ${safe(finding.title)}. It repeats the steps the explorer took and asserts what the spec expects, using the page objects in \`tests/pages\`.

## What problem it solves

The explorer found behaviour that breaks **${safe(finding.specRef)}** (docs/APP_SPEC.md).

- Expected: ${safe(finding.expected)}
- Explorer saw: ${safe(finding.actual)}

As a test, it keeps failing until the behaviour is fixed, then guards against it coming back.

## How to test locally

\`\`\`bash
git fetch origin ${branch} && git switch ${branch}
npm run setup
npm run test:e2e -- ${draft.path}
\`\`\`

While the bug is present the test fails on the expectation above; after the fix it passes.${
    draft.complete ? '' : `\n\n⚠️ The draft is incomplete (${safe(draft.warnings.join('; '))}), so it's marked \`test.fixme\` and is skipped until finished by hand.`
  }

## Risk

**Low, but needs review.** Generated code: check the locators and assertions match the intent. ${
    finding.source === 'model'
      ? 'The finding came from the model layer; it was confirmed by replay but is still a claim, not a verdict.'
      : 'The finding came from a deterministic probe and reproduced twice.'
  } If the bug is real and not fixed in this PR, merging makes CI red: mark it \`test.fail()\` or fix the bug first.
`;
}
