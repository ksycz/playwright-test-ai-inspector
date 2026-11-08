import { findNode, type SnapshotNode } from './snapshot.mts';

/**
 * Pure checks over a parsed snapshot. Expected values come from the catalogue
 * JSON, never from the page, so a wrong total cannot confirm itself.
 */
export type CartRow = { name: string; quantity: number | null; subtotal: number | null };

export function parsePrice(text: string): number | null {
  const match = text.match(/-?\$(-?\d+(?:,\d{3})*(?:\.\d+)?)/);
  if (!match) return null;
  const value = Number(match[1].replaceAll(',', ''));
  return text.trim().startsWith('-') ? -value : value;
}

export function formatPrice(value: number): string {
  return `$${value.toFixed(2)}`;
}

/** Same amount to the cent. */
export function sameAmount(a: number | null, b: number): boolean {
  return a !== null && Math.round(a * 100) === Math.round(b * 100);
}

/**
 * Rows of the cart table: `row "<name>"`, then a `Quantity N` element and the cells
 * (product, quantity, subtotal, actions).
 */
export function cartRows(nodes: SnapshotNode[]): CartRow[] {
  const rows: CartRow[] = [];
  let current: (CartRow & { cells: string[] }) | null = null;
  for (const node of nodes) {
    if (node.role === 'row') {
      current = node.name ? { name: node.name, quantity: null, subtotal: null, cells: [] } : null;
      if (current && !/^Product\b/.test(node.name)) rows.push(current);
      continue;
    }
    if (!current) continue;
    if (node.role === 'cell') {
      current.cells.push(node.name);
      if (current.cells.length === 3) current.subtotal = parsePrice(node.name);
      continue;
    }
    const quantity = node.name.match(/^Quantity (-?\d+)$/);
    if (quantity) current.quantity = Number(quantity[1]);
  }
  return rows.map(({ name, quantity, subtotal }) => ({ name, quantity, subtotal }));
}

export function cartTotal(nodes: SnapshotNode[]): number | null {
  const node = nodes.find((item) => /^Total:/.test(item.text));
  return node ? parsePrice(node.text) : null;
}

/** Item count from the header link, e.g. `Cart, 3 items` → 3. */
export function cartBadgeCount(nodes: SnapshotNode[]): number | null {
  const link = findNode(nodes, 'link', /^Cart, -?\d+ items?$/);
  const match = link?.name.match(/(-?\d+)/);
  return match ? Number(match[1]) : null;
}

export function hasText(nodes: SnapshotNode[], text: string | RegExp): boolean {
  return nodes.some((node) =>
    [node.name, node.text].some((value) =>
      typeof text === 'string' ? value.includes(text) : text.test(value),
    ),
  );
}

export function invalidFields(nodes: SnapshotNode[]): string[] {
  return nodes
    .filter((node) => node.role === 'textbox' && node.attributes.includes('invalid'))
    .map((node) => node.name);
}

export function describeCart(nodes: SnapshotNode[]): string {
  const rows = cartRows(nodes);
  const lines = rows.map(
    (row) =>
      `${row.name} × ${row.quantity ?? '?'} = ${row.subtotal === null ? '?' : formatPrice(row.subtotal)}`,
  );
  const total = cartTotal(nodes);
  lines.push(`total ${total === null ? 'missing' : formatPrice(total)}`);
  lines.push(`badge ${cartBadgeCount(nodes) ?? 'missing'}`);
  return lines.join('; ');
}
