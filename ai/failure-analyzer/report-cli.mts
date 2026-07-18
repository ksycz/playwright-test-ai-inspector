import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { collectFailureContext } from './collect.mts';
import {
  defaultReportPath,
  generateHtmlReport,
  generateMarkdownReport,
  parseReportFormat,
  type ReportFormat,
} from './report.mts';
import { resolveProviderFromEnv, suggestRootCause } from './suggest.mts';
import type { RootCauseSuggestion } from './types.mts';

function printUsage(): void {
  console.error(`Usage: npm run analyze:report -- <test-results-folder> [options]

Collect failure artifacts, classify the failure, and write an investigation report.

Options:
  --format <md|html|both>   Output format (default: md)
  --out <path>              Output file (md|html) or directory (both)
  --llm                     Request optional LLM suggestions when an API key is set
  --no-llm                  Skip LLM suggestions even if an API key is set
  -h, --help                Show this help

Environment (optional LLM):
  OPENAI_API_KEY            Prefer OpenAI provider
  ANTHROPIC_API_KEY         Used when OpenAI key is absent
  OPENAI_MODEL / ANTHROPIC_MODEL   Optional model overrides

Examples:
  npm run analyze:report -- test-results/smoke-checkout-flow-...-chromium
  npm run analyze:report -- ai/failure-analyzer/fixtures/sample-failure --format html
  npm run analyze:report -- ai/failure-analyzer/fixtures/sample-failure --llm
  npm run analyze:report -- ai/failure-analyzer/fixtures/sample-failure --format both
`);
}

async function main(argv: string[]): Promise<number> {
  const args = argv.slice(2);

  if (args.length === 0 || args.includes('--help') || args.includes('-h')) {
    printUsage();
    return args.length === 0 ? 1 : 0;
  }

  let sourcePath: string | undefined;
  let outPath: string | undefined;
  let format: ReportFormat = 'md';
  let llmMode: 'auto' | 'on' | 'off' = 'auto';

  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];
    if (arg === '--out') {
      outPath = args[index + 1];
      if (!outPath) {
        console.error('Missing value for --out');
        return 1;
      }
      index += 1;
      continue;
    }

    if (arg === '--format') {
      const rawFormat = args[index + 1];
      if (!rawFormat) {
        console.error('Missing value for --format (expected md, html, or both)');
        return 1;
      }
      const parsed = parseReportFormat(rawFormat);
      if (!parsed) {
        console.error(`Invalid --format "${rawFormat}" (expected md, html, or both)`);
        return 1;
      }
      format = parsed;
      index += 1;
      continue;
    }

    if (arg === '--llm') {
      llmMode = 'on';
      continue;
    }

    if (arg === '--no-llm') {
      llmMode = 'off';
      continue;
    }

    if (arg.startsWith('-')) {
      console.error(`Unknown option: ${arg}`);
      printUsage();
      return 1;
    }

    if (sourcePath) {
      console.error('Only one failure folder path is supported.');
      printUsage();
      return 1;
    }

    sourcePath = arg;
  }

  if (!sourcePath) {
    printUsage();
    return 1;
  }

  try {
    const context = await collectFailureContext(sourcePath);
    let suggestion: RootCauseSuggestion | null = null;

    if (llmMode !== 'off') {
      const provider = resolveProviderFromEnv();
      if (provider) {
        try {
          suggestion = await suggestRootCause(context, provider);
          if (suggestion) {
            console.error(`Added LLM suggestions from provider "${provider.name}".`);
          } else {
            console.error(`LLM provider "${provider.name}" returned no usable suggestions.`);
          }
        } catch (error) {
          const message = error instanceof Error ? error.message : String(error);
          console.error(`LLM suggestions skipped: ${message}`);
        }
      } else if (llmMode === 'on') {
        console.error(
          'LLM requested via --llm, but neither OPENAI_API_KEY nor ANTHROPIC_API_KEY is set. Continuing offline.',
        );
      }
    }

    const reportOptions = { suggestion };
    const written: string[] = [];

    if (format === 'both') {
      const reportsDir = path.resolve(outPath ?? 'ai-reports');
      const mdPath = path.join(reportsDir, path.basename(defaultReportPath(context, '.', 'md')));
      const htmlPath = path.join(reportsDir, path.basename(defaultReportPath(context, '.', 'html')));

      await mkdir(reportsDir, { recursive: true });
      await writeFile(mdPath, generateMarkdownReport(context, reportOptions), 'utf8');
      await writeFile(htmlPath, await generateHtmlReport(context, reportOptions), 'utf8');
      written.push(mdPath, htmlPath);
    } else {
      const report =
        format === 'html'
          ? await generateHtmlReport(context, reportOptions)
          : generateMarkdownReport(context, reportOptions);
      const absoluteOut = path.resolve(outPath ?? defaultReportPath(context, 'ai-reports', format));

      await mkdir(path.dirname(absoluteOut), { recursive: true });
      await writeFile(absoluteOut, report, 'utf8');
      written.push(absoluteOut);

      process.stdout.write(report);
    }

    for (const file of written) {
      console.error(`Wrote investigation report to ${file}`);
    }
    return 0;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`Failed to generate investigation report: ${message}`);
    return 1;
  }
}

const exitCode = await main(process.argv);
process.exit(exitCode);
