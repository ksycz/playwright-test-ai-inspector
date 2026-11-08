import { createRequire } from 'node:module';
import path from 'node:path';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import type { ToolCaller } from './session.mts';

export type McpOptions = {
  origin: string;
  outputDir: string;
  executablePath?: string;
  noSandbox?: boolean;
  headed?: boolean;
};

const require = createRequire(import.meta.url);

/**
 * Use the Chromium this repo already installs for Playwright tests
 * (scripts/playwright.sh keeps it in .playwright-browsers), so the explorer
 * does not download a second browser.
 */
async function defaultExecutablePath(): Promise<string | undefined> {
  if (!process.env.PLAYWRIGHT_BROWSERS_PATH) {
    process.env.PLAYWRIGHT_BROWSERS_PATH = path.resolve('.playwright-browsers');
  }
  try {
    const { chromium } = await import('@playwright/test');
    return chromium.executablePath();
  } catch {
    return undefined;
  }
}

/** Start @playwright/mcp over stdio. The browser can only load the allowed origin. */
export async function startPlaywrightMcp(
  options: McpOptions,
): Promise<{ caller: ToolCaller; close: () => Promise<void> }> {
  const cli = path.join(path.dirname(require.resolve('@playwright/mcp/package.json')), 'cli.js');
  const executablePath = options.executablePath ?? (await defaultExecutablePath());
  const args = [
    cli,
    '--isolated',
    '--snapshot-mode',
    'none',
    '--viewport-size',
    '1280,800',
    '--allowed-origins',
    new URL(options.origin).origin,
    '--output-dir',
    options.outputDir,
  ];
  if (!options.headed) args.push('--headless');
  if (executablePath) args.push('--executable-path', executablePath);
  if (options.noSandbox) args.push('--no-sandbox');

  const transport = new StdioClientTransport({
    command: process.execPath,
    args,
    stderr: 'pipe',
  });
  const client = new Client({ name: 'playwright-test-ai-inspector-explorer', version: '1.0.0' });
  await client.connect(transport);

  return {
    caller: {
      async callTool(name, toolArgs) {
        const result = await client.callTool({ name, arguments: toolArgs });
        const content = (result.content ?? []) as Array<{ type: string; text?: string }>;
        return content
          .filter((part) => part.type === 'text')
          .map((part) => part.text ?? '')
          .join('\n');
      },
    },
    close: () => client.close(),
  };
}
