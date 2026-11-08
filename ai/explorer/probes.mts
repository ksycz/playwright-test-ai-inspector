import {
  cartBadgeCount,
  cartRows,
  cartTotal,
  describeCart,
  formatPrice,
  hasText,
  invalidFields,
  sameAmount,
} from './oracles.mts';
import type { ExplorerSession } from './session.mts';
import { findNode, type SnapshotNode } from './snapshot.mts';
import type { Flow } from './types.mts';

export type CatalogueProduct = { slug: string; name: string; price: number };
export type Credentials = { username: string; password: string };

export type ProbeContext = {
  catalogue: CatalogueProduct[];
  user: Credentials;
};

export type ProbeOutcome = { ok: true } | { ok: false; expected: string; actual: string };

export type Probe = {
  id: string;
  charter: Flow;
  /** APP_SPEC requirement the probe checks, in "Section: bullet" form. */
  requirement: string;
  title: string;
  run(session: ExplorerSession, context: ProbeContext): Promise<ProbeOutcome>;
};

const PASS: ProbeOutcome = { ok: true };

function fail(expected: string, actual: string): ProbeOutcome {
  return { ok: false, expected, actual };
}

function product(context: ProbeContext, index: number): CatalogueProduct {
  const item = context.catalogue[index];
  if (!item) throw new Error(`Catalogue has no product at index ${index}`);
  return item;
}

async function addToCart(session: ExplorerSession, name: string): Promise<void> {
  if (!(await session.currentUrl()).endsWith('/products')) {
    await session.goto('/products');
  }
  await session.waitForText(`Add ${name} to cart`);
  await session.click('button', `Add ${name} to cart`);
}

async function openCart(session: ExplorerSession): Promise<SnapshotNode[]> {
  await session.goto('/cart');
  return session.snapshot();
}

async function login(session: ExplorerSession, user: Credentials): Promise<void> {
  await session.goto('/login');
  await session.type('Username', user.username);
  await session.type('Password', user.password);
  await session.click('button', 'Log in');
}

const validCheckout = {
  Name: 'Ada Explorer',
  Email: 'ada@example.com',
  Address: '1 Test Street',
  City: 'Prague',
  'ZIP Code': '11000',
};

async function fillCheckout(session: ExplorerSession, values: Record<string, string>): Promise<void> {
  for (const [label, value] of Object.entries(values)) {
    await session.type(label, value);
  }
}

/** Checks the cart table against catalogue prices: each line and the total. */
function checkCartMath(
  nodes: SnapshotNode[],
  expected: Array<{ product: CatalogueProduct; quantity: number }>,
): ProbeOutcome {
  const rows = cartRows(nodes);
  let expectedTotal = 0;
  for (const { product: item, quantity } of expected) {
    expectedTotal += item.price * quantity;
    const row = rows.find((candidate) => candidate.name === item.name);
    if (!row || row.quantity !== quantity || !sameAmount(row.subtotal, item.price * quantity)) {
      return fail(
        `${item.name} × ${quantity} = ${formatPrice(item.price * quantity)}`,
        describeCart(nodes),
      );
    }
  }
  const expectedCount = expected.reduce((sum, line) => sum + line.quantity, 0);
  if (!sameAmount(cartTotal(nodes), expectedTotal) || cartBadgeCount(nodes) !== expectedCount) {
    return fail(`total ${formatPrice(expectedTotal)}; badge ${expectedCount}`, describeCart(nodes));
  }
  return PASS;
}

export const PROBES: Probe[] = [
  {
    id: 'cart-persists-after-refresh',
    charter: 'cart',
    requirement: 'Shopping Cart: The cart should persist after page refresh.',
    title: 'Cart keeps its item after a full page load',
    async run(session, context) {
      const mouse = product(context, 0);
      await addToCart(session, mouse.name);
      return checkCartMath(await openCart(session), [{ product: mouse, quantity: 1 }]);
    },
  },
  {
    id: 'cart-two-products-total',
    charter: 'cart',
    requirement: 'Shopping Cart: calculating total',
    title: 'Total equals the sum of catalogue prices for two products',
    async run(session, context) {
      const first = product(context, 0);
      const second = product(context, 3);
      await addToCart(session, first.name);
      await addToCart(session, second.name);
      return checkCartMath(await openCart(session), [
        { product: first, quantity: 1 },
        { product: second, quantity: 1 },
      ]);
    },
  },
  {
    id: 'cart-increase-quantity',
    charter: 'cart',
    requirement: 'Shopping Cart: increasing quantity',
    title: 'Increasing quantity updates the line subtotal, total and badge',
    async run(session, context) {
      const item = product(context, 1);
      await addToCart(session, item.name);
      await openCart(session);
      await session.click('button', `Increase quantity of ${item.name}`);
      await session.click('button', `Increase quantity of ${item.name}`);
      return checkCartMath(await session.snapshot(), [{ product: item, quantity: 3 }]);
    },
  },
  {
    id: 'cart-decrease-to-zero-removes',
    charter: 'cart',
    requirement: 'Shopping Cart: decreasing quantity',
    title: 'Decreasing quantity below one removes the line instead of showing 0 or less',
    async run(session, context) {
      const item = product(context, 2);
      const other = product(context, 4);
      await addToCart(session, item.name);
      await addToCart(session, other.name);
      await openCart(session);
      await session.click('button', `Decrease quantity of ${item.name}`);
      const nodes = await session.snapshot();
      const rows = cartRows(nodes);
      const badRow = rows.find((row) => row.quantity !== null && row.quantity < 1);
      if (badRow || rows.some((row) => row.name === item.name)) {
        return fail(`${item.name} removed; ${other.name} × 1 left`, describeCart(nodes));
      }
      return checkCartMath(nodes, [{ product: other, quantity: 1 }]);
    },
  },
  {
    id: 'cart-remove-item',
    charter: 'cart',
    requirement: 'Shopping Cart: removing products',
    title: 'Removing one product keeps the other and updates the total',
    async run(session, context) {
      const keep = product(context, 0);
      const remove = product(context, 5);
      await addToCart(session, keep.name);
      await addToCart(session, remove.name);
      await openCart(session);
      await session.click('button', `Remove ${remove.name} from cart`);
      return checkCartMath(await session.snapshot(), [{ product: keep, quantity: 1 }]);
    },
  },
  {
    id: 'cart-clear',
    charter: 'cart',
    requirement: 'Shopping Cart: clearing the cart',
    title: 'Clear cart empties the table and resets the badge',
    async run(session, context) {
      await addToCart(session, product(context, 0).name);
      await addToCart(session, product(context, 1).name);
      await openCart(session);
      await session.click('button', 'Clear cart');
      const nodes = await session.snapshot();
      if (!hasText(nodes, 'Your cart is empty') || cartBadgeCount(nodes) !== 0) {
        return fail('empty cart state; badge 0', describeCart(nodes));
      }
      return PASS;
    },
  },
  {
    id: 'checkout-guest-redirect',
    charter: 'checkout',
    requirement: 'Login: protected checkout route',
    title: 'A guest who opens /checkout is sent to login',
    async run(session, context) {
      await addToCart(session, product(context, 0).name);
      await session.goto('/checkout');
      const url = await session.currentUrl();
      if (!/\/login(\?|$)/.test(new URL(url).pathname + new URL(url).search)) {
        return fail('redirect to /login', `stayed on ${new URL(url).pathname}`);
      }
      return PASS;
    },
  },
  {
    id: 'checkout-empty-submit',
    charter: 'checkout',
    requirement: 'Checkout: validate required fields',
    title: 'Submitting an empty checkout form flags all five fields',
    async run(session, context) {
      await addToCart(session, product(context, 0).name);
      await login(session, context.user);
      await session.goto('/checkout');
      await session.click('button', 'Place order');
      const nodes = await session.snapshot();
      const invalid = invalidFields(nodes);
      const expected = Object.keys(validCheckout);
      const missing = expected.filter((field) => !invalid.includes(field));
      if (missing.length > 0 || !hasText(nodes, 'Checkout')) {
        return fail(`invalid: ${expected.join(', ')}`, `invalid: ${invalid.join(', ') || 'none'}`);
      }
      return PASS;
    },
  },
  {
    id: 'checkout-invalid-email',
    charter: 'checkout',
    requirement: 'Checkout: display validation errors',
    title: 'A malformed email blocks the order with an email error',
    async run(session, context) {
      await addToCart(session, product(context, 0).name);
      await login(session, context.user);
      await session.goto('/checkout');
      await fillCheckout(session, { ...validCheckout, Email: 'not-an-email' });
      await session.click('button', 'Place order');
      const nodes = await session.snapshot();
      const url = await session.currentUrl();
      if (!invalidFields(nodes).includes('Email') || !url.endsWith('/checkout')) {
        return fail(
          'Email marked invalid; still on /checkout',
          `invalid: ${invalidFields(nodes).join(', ') || 'none'}; page ${new URL(url).pathname}`,
        );
      }
      return PASS;
    },
  },
  {
    id: 'checkout-success-clears-cart',
    charter: 'checkout',
    requirement: 'Checkout: clear cart after successful checkout',
    title: 'A valid order shows confirmation and empties the cart',
    async run(session, context) {
      await addToCart(session, product(context, 0).name);
      await login(session, context.user);
      await session.goto('/checkout');
      await fillCheckout(session, validCheckout);
      await session.click('button', 'Place order');
      await session.waitForText('Order confirmed').catch(() => undefined);
      const nodes = await session.snapshot();
      const url = await session.currentUrl();
      if (!url.endsWith('/order-confirmation') || cartBadgeCount(nodes) !== 0) {
        return fail(
          'on /order-confirmation; badge 0',
          `page ${new URL(url).pathname}; badge ${cartBadgeCount(nodes) ?? 'missing'}`,
        );
      }
      return PASS;
    },
  },
  {
    id: 'auth-invalid-login',
    charter: 'auth',
    requirement: 'Error Handling: invalid login message',
    title: 'A wrong password shows an error and does not log in',
    async run(session, context) {
      await session.goto('/login');
      await session.type('Username', context.user.username);
      await session.type('Password', `${context.user.password}-wrong`);
      await session.click('button', 'Log in');
      const nodes = await session.snapshot();
      if (!hasText(nodes, /invalid/i) || findNode(nodes, 'button', 'Log out')) {
        return fail('error message; still logged out', hasText(nodes, /invalid/i) ? 'logged in' : 'no error shown');
      }
      return PASS;
    },
  },
  {
    id: 'auth-session-persists',
    charter: 'auth',
    requirement: 'Login: session persisted in Local Storage',
    title: 'A logged-in user stays logged in after a full page load',
    async run(session, context) {
      await login(session, context.user);
      await session.goto('/products');
      const nodes = await session.snapshot();
      if (!findNode(nodes, 'button', 'Log out')) {
        return fail('Log out button after reload', 'Login link shown');
      }
      return PASS;
    },
  },
  {
    id: 'auth-logout-protects-checkout',
    charter: 'auth',
    requirement: 'Login: logout supported',
    title: 'After logout, /checkout is protected again',
    async run(session, context) {
      await addToCart(session, product(context, 0).name);
      await login(session, context.user);
      await session.click('button', 'Log out');
      await session.goto('/checkout');
      const url = await session.currentUrl();
      if (!new URL(url).pathname.startsWith('/login')) {
        return fail('redirect to /login after logout', `page ${new URL(url).pathname}`);
      }
      return PASS;
    },
  },
];
