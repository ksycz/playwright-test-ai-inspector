/**
 * Shared building blocks for the local HTML reports (flaky, trends, run summary), so they
 * look the same as the failure report. Everything that comes from a test run is escaped:
 * test titles and error text are untrusted input.
 */

export function escapeHtml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

/** A table cell: plain text (escaped) or HTML the caller has already built from escaped parts. */
export type Cell = string | number | { html: string };

function renderCell(cell: Cell): string {
  if (typeof cell === 'number') return String(cell);
  if (typeof cell === 'string') return escapeHtml(cell);
  return cell.html;
}

export function dataTable(headers: string[], rows: Cell[][], rowClass?: string): string {
  const head = headers.map((header) => `<th>${escapeHtml(header)}</th>`).join('');
  const body = rows
    .map((row) => `<tr${rowClass ? ` class="${rowClass}"` : ''}>${row.map((cell) => `<td>${renderCell(cell)}</td>`).join('')}</tr>`)
    .join('\n        ');
  return `<table>
        <thead><tr>${head}</tr></thead>
        <tbody>
        ${body}
        </tbody>
      </table>`;
}

export type Tone = 'good' | 'bad' | 'warn' | 'neutral';

export function statTiles(tiles: Array<{ label: string; value: number; tone?: Tone }>): string {
  const items = tiles
    .map(
      (tile) =>
        `<div class="stat ${tile.tone ?? 'neutral'}"><div class="n">${tile.value}</div><div class="label">${escapeHtml(tile.label)}</div></div>`,
    )
    .join('\n        ');
  return `<div class="stats">
        ${items}
      </div>`;
}

export function section(id: string, heading: string, content: string): string {
  return `<section aria-labelledby="${id}-heading">
      <h2 id="${id}-heading">${escapeHtml(heading)}</h2>
      ${content}
    </section>`;
}

export function muted(text: string): string {
  return `<p class="muted">${escapeHtml(text)}</p>`;
}

export function code(text: string): string {
  return `<code>${escapeHtml(text)}</code>`;
}

const STYLES = `
    :root { --bg: #eef3f5; --ink: #15202b; --muted: #4d5d68; --line: #b8c5ce; --panel: #f7fafb;
      --accent: #0b6e63; --accent-soft: #cfe8e3; --code-bg: #e3ebf0;
      --good: #1d7a3e; --bad: #b3261e; --warn: #a15c00; }
    * { box-sizing: border-box; }
    body { margin: 0; color: var(--ink); background: var(--bg); line-height: 1.55;
      font-family: "Source Sans 3", "Avenir Next", "Segoe UI", sans-serif; }
    main { max-width: 52rem; margin: 0 auto; padding: 2.5rem 1.25rem 3.5rem; }
    h1 { font-size: clamp(1.75rem, 4vw, 2.25rem); margin: 0 0 0.35rem; letter-spacing: -0.02em; }
    .lede { color: var(--muted); margin: 0 0 1.75rem; }
    h2 { font-size: 1.05rem; text-transform: uppercase; letter-spacing: 0.06em; color: var(--accent);
      margin: 2rem 0 0.75rem; padding-bottom: 0.35rem; border-bottom: 1px solid var(--line); }
    h3 { font-size: 1rem; margin: 0 0 0.35rem; }
    .panel { background: var(--panel); border: 1px solid var(--line); border-radius: 2px; padding: 1rem 1.1rem; margin: 0 0 0.9rem; }
    .stats { display: grid; grid-template-columns: repeat(auto-fit, minmax(9rem, 1fr)); gap: 0.75rem; }
    .stat { background: var(--panel); border: 1px solid var(--line); border-radius: 2px; padding: 0.75rem 0.9rem; }
    .stat .n { font-size: 1.6rem; font-weight: 700; }
    .stat .label { font-size: 0.8rem; text-transform: uppercase; letter-spacing: 0.05em; color: var(--muted); }
    .stat.good .n, .good { color: var(--good); } .stat.bad .n, .bad { color: var(--bad); } .stat.warn .n, .warn { color: var(--warn); }
    .meta { color: var(--muted); margin: 0 0 0.6rem; }
    .muted { color: var(--muted); }
    .badge { display: inline-block; padding: 0.05rem 0.5rem; background: var(--accent-soft); color: var(--accent); font-weight: 600; border-radius: 2px; }
    .status { font-weight: 700; } .status-pass { color: var(--good); } .status-fail { color: var(--bad); }
    table { width: 100%; border-collapse: collapse; font-size: 0.92rem; }
    th, td { text-align: left; padding: 0.35rem 0.5rem; border-top: 1px solid var(--line); vertical-align: top; }
    th { font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.05em; color: var(--muted); border-top: 0; }
    code { font-family: "IBM Plex Mono", "SF Mono", ui-monospace, monospace; font-size: 0.85rem;
      background: var(--code-bg); padding: 0.1rem 0.3rem; border-radius: 2px; word-break: break-word; }
    pre { background: var(--code-bg); padding: 0.75rem 1rem; border-radius: 2px; overflow-x: auto; }
    pre code { background: none; padding: 0; }
    ul { padding-left: 1.25rem; } li { margin: 0.25rem 0; }
    .bar { display: inline-block; height: 0.7rem; border-radius: 1px; vertical-align: middle; margin-right: 0.4rem; }
    .bar.bad { background: var(--bad); } .bar.warn { background: var(--warn); } .bar.accent { background: var(--accent); }
`;

export function htmlPage(options: {
  title: string;
  testId: string;
  heading: string;
  lede: string;
  body: string;
  extraStyles?: string;
}): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${escapeHtml(options.title)}</title>
  <style>${STYLES}${options.extraStyles ?? ''}</style>
</head>
<body>
  <main data-testid="${escapeHtml(options.testId)}">
    <h1>${escapeHtml(options.heading)}</h1>
    <p class="lede">${escapeHtml(options.lede)}</p>

    ${options.body}
  </main>
</body>
</html>
`;
}
