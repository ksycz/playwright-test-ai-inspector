import { readFile } from 'node:fs/promises';
import path from 'node:path';
import type { FailureCategory, FailureContext, RootCauseSuggestion } from './types.mts';

export type ReportFormat = 'md' | 'html' | 'both';

export interface ReportOptions {
  suggestion?: RootCauseSuggestion | null;
}

const SUGGESTED_STEPS: Record<FailureCategory, string[]> = {
  assertion: [
    'Compare Expected vs Received values in the error context.',
    'Open the failure screenshot and confirm the UI state matches the assertion target.',
    'If the assertion is timing-sensitive, wait for a specific UI signal before asserting.',
  ],
  timeout: [
    'Check whether the app/dev server was reachable during the run.',
    'Open the trace (if present) and inspect the last successful action before the wait.',
    'Confirm the waited condition is correct and not blocked by auth/network.',
  ],
  locator: [
    'Verify the locator still matches a unique, visible element (`getByRole` preferred).',
    'Check for strict-mode duplicates or hidden/detached elements in the screenshot.',
    'Update the page object locator if the UI label/role changed.',
  ],
  network: [
    'Confirm the Vite/app server started and `baseURL` is correct.',
    'Check for `ECONNREFUSED` / DNS errors and local port conflicts.',
    'Re-run with `CI=true` so Playwright manages a fresh webServer.',
  ],
  auth: [
    'Verify demo credentials in `tests/data/users.ts` still match the app.',
    'Confirm Local Storage auth key and login redirect behaviour.',
    'Reproduce manually via `/login` then retry the protected route.',
  ],
  unknown: [
    'Read `error-context.md` and the screenshot for clues.',
    'Open the Playwright HTML report and/or trace for the failed step.',
    'Re-run the single test headed (`npm run test:headed -- <spec>`) to observe behaviour.',
  ],
};

function bulletList(items: string[]): string {
  if (items.length === 0) {
    return '- None';
  }

  return items.map((item) => `- \`${item}\``).join('\n');
}

function numberedList(items: string[]): string {
  return items.map((item, index) => `${index + 1}. ${item}`).join('\n');
}

/** Prefer the ## Error section when present; otherwise strip ATX heading markers. */
export function prepareErrorExcerptText(text: string): string {
  const trimmed = text.trim();
  const errorSection = trimmed.match(
    /(?:^|\n)#{1,6}\s*Error\s*\n([\s\S]*?)(?=\n#{1,6}\s|$)/i,
  );

  const body = (errorSection?.[1] ?? trimmed).trim();
  return body.replace(/^#{1,6}\s+/gm, '');
}

function truncateErrorText(text: string | null, maxLength = 1200): string {
  if (!text || text.trim().length === 0) {
    return '_No error context text available._';
  }

  const prepared = prepareErrorExcerptText(text);
  if (prepared.length <= maxLength) {
    return prepared;
  }

  return `${prepared.slice(0, maxLength)}\n\n_…truncated_`;
}

function truncatePlainErrorText(text: string | null, maxLength = 1200): {
  text: string;
  truncated: boolean;
  empty: boolean;
} {
  if (!text || text.trim().length === 0) {
    return { text: 'No error context text available.', truncated: false, empty: true };
  }

  const prepared = prepareErrorExcerptText(text);
  if (prepared.length <= maxLength) {
    return { text: prepared, truncated: false, empty: false };
  }

  return { text: prepared.slice(0, maxLength), truncated: true, empty: false };
}

/** Escape text for safe inclusion in HTML body content and attributes. */
export function escapeHtml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function htmlBulletList(items: string[]): string {
  if (items.length === 0) {
    return '<p class="muted">None</p>';
  }

  return `<ul>\n${items.map((item) => `  <li><code>${escapeHtml(item)}</code></li>`).join('\n')}\n</ul>`;
}

function htmlNumberedList(items: string[]): string {
  return `<ol>\n${items.map((item) => `  <li>${escapeHtml(item)}</li>`).join('\n')}\n</ol>`;
}

function markdownSuggestionSection(suggestion: RootCauseSuggestion | null | undefined): string {
  if (!suggestion) {
    return '';
  }

  const hypotheses = numberedList(suggestion.hypotheses);
  const caveats =
    suggestion.caveats.length > 0
      ? suggestion.caveats.map((item) => `- ${item}`).join('\n')
      : '- None';

  return `
## AI root-cause suggestions

- **Provider:** \`${suggestion.provider}\`
- **Summary:** ${suggestion.summary}

### Hypotheses

${hypotheses}

### Caveats

${caveats}
`;
}

function htmlSuggestionSection(suggestion: RootCauseSuggestion | null | undefined): string {
  if (!suggestion) {
    return '';
  }

  const caveats =
    suggestion.caveats.length > 0
      ? `<ul>\n${suggestion.caveats.map((item) => `  <li>${escapeHtml(item)}</li>`).join('\n')}\n</ul>`
      : '<p class="muted">None</p>';

  return `
    <section aria-labelledby="ai-heading">
      <h2 id="ai-heading">AI root-cause suggestions</h2>
      <div class="panel">
        <dl class="summary-grid">
          <div>
            <dt>Provider</dt>
            <dd><code>${escapeHtml(suggestion.provider)}</code></dd>
          </div>
          <div>
            <dt>Summary</dt>
            <dd>${escapeHtml(suggestion.summary)}</dd>
          </div>
        </dl>
      </div>
      <h3>Hypotheses</h3>
      ${htmlNumberedList(suggestion.hypotheses)}
      <h3>Caveats</h3>
      ${caveats}
    </section>`;
}

const SCREENSHOT_MIME: Record<string, string> = {
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
};

const MAX_EMBEDDED_SCREENSHOT_BYTES = 5 * 1024 * 1024;

interface EmbeddedScreenshot {
  relativePath: string;
  dataUri: string | null;
  note: string | null;
}

async function loadEmbeddedScreenshots(context: FailureContext): Promise<EmbeddedScreenshot[]> {
  const results: EmbeddedScreenshot[] = [];

  for (const relativePath of context.artifacts.screenshots) {
    const absolutePath = path.join(context.sourcePath, relativePath);
    const extension = path.extname(relativePath).toLowerCase();
    const mime = SCREENSHOT_MIME[extension];

    if (!mime) {
      results.push({
        relativePath,
        dataUri: null,
        note: 'Unsupported image type for inline preview.',
      });
      continue;
    }

    try {
      const bytes = await readFile(absolutePath);
      if (bytes.byteLength === 0) {
        results.push({ relativePath, dataUri: null, note: 'Screenshot file is empty.' });
        continue;
      }
      if (bytes.byteLength > MAX_EMBEDDED_SCREENSHOT_BYTES) {
        results.push({
          relativePath,
          dataUri: null,
          note: 'Screenshot too large to embed inline; open the file from the failure folder.',
        });
        continue;
      }

      results.push({
        relativePath,
        dataUri: `data:${mime};base64,${bytes.toString('base64')}`,
        note: null,
      });
    } catch {
      results.push({
        relativePath,
        dataUri: null,
        note: 'Screenshot file could not be read.',
      });
    }
  }

  return results;
}

function htmlScreenshotGallery(screenshots: EmbeddedScreenshot[]): string {
  if (screenshots.length === 0) {
    return '<p class="muted">None</p>';
  }

  return screenshots
    .map((shot) => {
      if (shot.dataUri) {
        return `<figure class="screenshot">
  <img src="${shot.dataUri}" alt="Failure screenshot: ${escapeHtml(shot.relativePath)}" />
  <figcaption><code>${escapeHtml(shot.relativePath)}</code></figcaption>
</figure>`;
      }

      return `<figure class="screenshot missing">
  <figcaption><code>${escapeHtml(shot.relativePath)}</code> — ${escapeHtml(shot.note ?? 'Unavailable')}</figcaption>
</figure>`;
    })
    .join('\n');
}

export function generateMarkdownReport(
  context: FailureContext,
  options: ReportOptions = {},
): string {
  const folderName = path.basename(context.sourcePath);
  const { classification, artifacts } = context;
  const confidencePercent = Math.round(classification.confidence * 100);
  const steps = SUGGESTED_STEPS[classification.category];

  const signals =
    classification.matchedSignals.length > 0
      ? classification.matchedSignals.map((signal) => `- \`${signal}\``).join('\n')
      : '- None';

  return `# Failure Investigation Report

## Summary

- **Failure folder:** \`${folderName}\`
- **Source path:** \`${context.sourcePath}\`
- **Collected at:** ${context.collectedAt}
- **Category:** \`${classification.category}\`
- **Confidence:** ${confidencePercent}%
- **Classification summary:** ${classification.summary}

## Classification

${signals}

## Artifacts

### Screenshots

${bulletList(artifacts.screenshots)}

### Videos

${bulletList(artifacts.videos)}

### Traces

${bulletList(artifacts.traces)}

### Error context

${artifacts.errorContextPath ? `- \`${artifacts.errorContextPath}\`` : '- None'}

## Error excerpt

\`\`\`text
${truncateErrorText(context.errorContextText)}
\`\`\`

## Suggested next steps

${numberedList(steps)}
${markdownSuggestionSection(options.suggestion)}
## Debugging commands

\`\`\`bash
npm run report
npm run trace -- ${context.sourcePath}/trace.zip
npm run analyze:failure -- ${context.sourcePath}
\`\`\`
`;
}

export async function generateHtmlReport(
  context: FailureContext,
  options: ReportOptions = {},
): Promise<string> {
  const folderName = path.basename(context.sourcePath);
  const { classification, artifacts } = context;
  const confidencePercent = Math.round(classification.confidence * 100);
  const steps = SUGGESTED_STEPS[classification.category];
  const excerpt = truncatePlainErrorText(context.errorContextText);
  const screenshots = await loadEmbeddedScreenshots(context);

  const signals =
    classification.matchedSignals.length > 0
      ? `<ul>\n${classification.matchedSignals
          .map((signal) => `  <li><code>${escapeHtml(signal)}</code></li>`)
          .join('\n')}\n</ul>`
      : '<p class="muted">None</p>';

  const errorContextArtifact = artifacts.errorContextPath
    ? `<ul>\n  <li><code>${escapeHtml(artifacts.errorContextPath)}</code></li>\n</ul>`
    : '<p class="muted">None</p>';

  const truncatedNote = excerpt.truncated
    ? '<p class="muted"><em>…truncated</em></p>'
    : '';

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Failure Investigation Report — ${escapeHtml(folderName)}</title>
  <style>
    :root {
      --bg: #e8eef2;
      --bg-accent: #d4e8e3;
      --ink: #15202b;
      --muted: #4d5d68;
      --line: #b8c5ce;
      --panel: #f7fafb;
      --accent: #0b6e63;
      --accent-soft: #cfe8e3;
      --code-bg: #e3ebf0;
      --command-bg: #15202b;
      --command-ink: #dce8e5;
    }

    * { box-sizing: border-box; }

    body {
      margin: 0;
      color: var(--ink);
      font-family: "Source Sans 3", "Avenir Next", "Segoe UI", sans-serif;
      line-height: 1.55;
      background:
        radial-gradient(ellipse 70% 45% at 0% 0%, var(--bg-accent), transparent 50%),
        linear-gradient(160deg, #f2f6f8 0%, var(--bg) 55%, #dfe9ed 100%);
      min-height: 100vh;
    }

    main {
      max-width: 46rem;
      margin: 0 auto;
      padding: 2.5rem 1.25rem 3.5rem;
    }

    h1 {
      font-family: "Source Serif 4", "Iowan Old Style", "Palatino Linotype", Palatino, serif;
      font-weight: 600;
      font-size: clamp(1.75rem, 4vw, 2.25rem);
      line-height: 1.2;
      margin: 0 0 0.35rem;
      letter-spacing: -0.02em;
    }

    .lede {
      color: var(--muted);
      margin: 0 0 1.75rem;
      max-width: 36rem;
    }

    h2 {
      font-size: 1.05rem;
      text-transform: uppercase;
      letter-spacing: 0.06em;
      color: var(--accent);
      margin: 2rem 0 0.75rem;
      padding-bottom: 0.35rem;
      border-bottom: 1px solid var(--line);
    }

    h3 {
      font-size: 0.95rem;
      margin: 1.1rem 0 0.4rem;
    }

    .panel {
      background: var(--panel);
      border: 1px solid var(--line);
      border-radius: 2px;
      padding: 1rem 1.1rem;
    }

    .summary-grid {
      display: grid;
      gap: 0.55rem 1rem;
      margin: 0;
      padding: 0;
      list-style: none;
    }

    .summary-grid dt {
      font-size: 0.75rem;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: var(--muted);
    }

    .summary-grid dd {
      margin: 0 0 0.35rem;
    }

    .badge {
      display: inline-block;
      padding: 0.15rem 0.55rem;
      background: var(--accent-soft);
      color: var(--accent);
      font-weight: 600;
      font-size: 0.9rem;
      border-radius: 2px;
    }

    code, pre {
      font-family: "IBM Plex Mono", "SF Mono", ui-monospace, monospace;
      font-size: 0.86rem;
    }

    code {
      background: var(--code-bg);
      padding: 0.1rem 0.35rem;
      border-radius: 2px;
    }

    pre {
      margin: 0;
      padding: 0.9rem 1rem;
      overflow-x: auto;
      background: var(--code-bg);
      border: 1px solid var(--line);
      border-radius: 2px;
      white-space: pre-wrap;
      word-break: break-word;
    }

    pre.empty {
      color: var(--muted);
      font-style: italic;
    }

    ul, ol {
      margin: 0.35rem 0 0;
      padding-left: 1.25rem;
    }

    li { margin: 0.25rem 0; }

    .muted { color: var(--muted); margin: 0.25rem 0 0; }

    .commands pre {
      background: var(--command-bg);
      color: var(--command-ink);
      border-color: var(--command-bg);
    }

    .commands pre code {
      background: transparent;
      color: inherit;
      padding: 0;
    }

    figure.screenshot {
      margin: 0.75rem 0 0;
      padding: 0.75rem;
      background: var(--panel);
      border: 1px solid var(--line);
      border-radius: 2px;
    }

    figure.screenshot img {
      display: block;
      width: auto;
      max-width: 100%;
      height: auto;
      border: 1px solid var(--line);
      background: #fff;
    }

    figure.screenshot figcaption {
      margin-top: 0.55rem;
      color: var(--muted);
      font-size: 0.9rem;
    }

    figure.screenshot.missing {
      color: var(--muted);
    }
  </style>
</head>
<body>
  <main data-testid="failure-report">
    <h1>Failure Investigation Report</h1>
    <p class="lede">Structured findings from the AI Failure Analyzer — classification, artifacts, and suggested next steps.</p>

    <section aria-labelledby="summary-heading">
      <h2 id="summary-heading">Summary</h2>
      <div class="panel">
        <dl class="summary-grid">
          <div>
            <dt>Failure folder</dt>
            <dd><code>${escapeHtml(folderName)}</code></dd>
          </div>
          <div>
            <dt>Source path</dt>
            <dd><code>${escapeHtml(context.sourcePath)}</code></dd>
          </div>
          <div>
            <dt>Collected at</dt>
            <dd>${escapeHtml(context.collectedAt)}</dd>
          </div>
          <div>
            <dt>Category</dt>
            <dd><span class="badge">${escapeHtml(classification.category)}</span></dd>
          </div>
          <div>
            <dt>Confidence</dt>
            <dd>${confidencePercent}%</dd>
          </div>
          <div>
            <dt>Classification summary</dt>
            <dd>${escapeHtml(classification.summary)}</dd>
          </div>
        </dl>
      </div>
    </section>

    <section aria-labelledby="classification-heading">
      <h2 id="classification-heading">Classification</h2>
      ${signals}
    </section>

    <section aria-labelledby="artifacts-heading">
      <h2 id="artifacts-heading">Artifacts</h2>
      <h3>Screenshots</h3>
      ${htmlScreenshotGallery(screenshots)}
      <h3>Videos</h3>
      ${htmlBulletList(artifacts.videos)}
      <h3>Traces</h3>
      ${htmlBulletList(artifacts.traces)}
      <h3>Error context</h3>
      ${errorContextArtifact}
    </section>

    <section aria-labelledby="error-heading">
      <h2 id="error-heading">Error excerpt</h2>
      <pre class="${excerpt.empty ? 'empty' : ''}"><code>${escapeHtml(excerpt.text)}</code></pre>
      ${truncatedNote}
    </section>

    <section aria-labelledby="steps-heading">
      <h2 id="steps-heading">Suggested next steps</h2>
      ${htmlNumberedList(steps)}
    </section>
${htmlSuggestionSection(options.suggestion)}
    <section class="commands" aria-labelledby="commands-heading">
      <h2 id="commands-heading">Debugging commands</h2>
      <pre><code>npm run report
npm run trace -- ${escapeHtml(context.sourcePath)}/trace.zip
npm run analyze:failure -- ${escapeHtml(context.sourcePath)}</code></pre>
    </section>
  </main>
</body>
</html>
`;
}

export function defaultReportPath(
  context: FailureContext,
  reportsDir = 'ai-reports',
  format: Exclude<ReportFormat, 'both'> = 'md',
): string {
  const folderName = path.basename(context.sourcePath);
  const extension = format === 'html' ? 'html' : 'md';
  return path.join(reportsDir, `${folderName}.${extension}`);
}

export function parseReportFormat(value: string): ReportFormat | null {
  if (value === 'md' || value === 'html' || value === 'both') {
    return value;
  }
  return null;
}
