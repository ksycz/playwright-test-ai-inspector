/**
 * Known bugs the exploration agent is evaluated against (P12-M2).
 *
 * Off unless the dev server is started with VITE_SEEDED_BUGS, e.g.
 *   VITE_SEEDED_BUGS=cart-remove-noop npm run dev
 * A production build (`npm run build`) never turns them on.
 */
export const SEEDED_BUGS = [
  'cart-remove-noop',
  'cart-total-ignores-quantity',
  'checkout-email-not-checked',
  'cart-not-saved',
  'detail-adds-twice',
] as const;

export type SeededBug = (typeof SEEDED_BUGS)[number];

/** Comma-separated names → known bugs. `all` turns every bug on; unknown names are ignored. */
export function parseSeededBugs(raw: string | undefined): Set<SeededBug> {
  const names = (raw ?? '')
    .split(',')
    .map((name) => name.trim())
    .filter(Boolean);
  if (names.includes('all')) return new Set(SEEDED_BUGS);
  return new Set(SEEDED_BUGS.filter((bug) => names.includes(bug)));
}

type ViteEnv = { DEV?: boolean; VITE_SEEDED_BUGS?: string };

/** Only the dev server can enable bugs. Outside Vite (e.g. node unit tests) env is missing → none. */
export function activeFromEnv(env: ViteEnv | undefined): Set<SeededBug> {
  if (!env?.DEV) return new Set();
  return parseSeededBugs(env.VITE_SEEDED_BUGS);
}

const active = activeFromEnv((import.meta as { env?: ViteEnv }).env);

if (active.size > 0) {
  console.warn(`[seeded bugs] ON for exploration testing: ${[...active].join(', ')}`);
}

export function isSeeded(bug: SeededBug): boolean {
  return active.has(bug);
}
