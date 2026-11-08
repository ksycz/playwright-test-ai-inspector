import path from 'node:path';
import { extractSnapshot, findNode, pageUrl, parseSnapshot, type SnapshotNode } from './snapshot.mts';
import type { RecordedStep } from './types.mts';

/** Anything that can call a Playwright MCP tool and return its text output. */
export type ToolCaller = {
  callTool(name: string, args: Record<string, unknown>): Promise<string>;
};

/** Tools a model is allowed to use. No evaluate, no run_code, no file upload, no tabs. */
export const MODEL_TOOLS = [
  'browser_navigate',
  'browser_navigate_back',
  'browser_snapshot',
  'browser_click',
  'browser_type',
  'browser_press_key',
  'browser_select_option',
  'browser_wait_for',
] as const;

export class BudgetExceededError extends Error {
  constructor(budget: number) {
    super(`Step budget of ${budget} tool calls is used up`);
    this.name = 'BudgetExceededError';
  }
}

export class OriginNotAllowedError extends Error {
  constructor(url: string, origin: string) {
    super(`Blocked navigation to ${url}: only ${origin} is allowed`);
    this.name = 'OriginNotAllowedError';
  }
}

export class ToolFailedError extends Error {
  constructor(tool: string, detail: string) {
    super(`${tool} failed: ${detail}`);
    this.name = 'ToolFailedError';
  }
}

export class ElementNotFoundError extends Error {
  constructor(description: string) {
    super(`Could not find ${description} on the page`);
    this.name = 'ElementNotFoundError';
  }
}

/** Steps that do not change the page; left out of reproduction steps. */
const READ_ONLY_TOOLS = new Set(['browser_snapshot', 'browser_wait_for', 'browser_take_screenshot']);

export type SessionOptions = {
  /** Total tool calls this session may make, shared by probes and the model. */
  budget: number;
  /** The only origin the explorer may visit, e.g. http://localhost:5173 */
  origin: string;
  /** Absolute directory for screenshots; MCP resolves bare names against its cwd. */
  screenshotDir?: string;
};

/**
 * Bounded wrapper around a Playwright MCP connection.
 * Every call counts against the budget; navigation off the allowed origin is refused.
 */
export class ExplorerSession {
  #used = 0;
  #steps: RecordedStep[] = [];
  readonly #caller: ToolCaller;
  readonly budget: number;
  readonly origin: string;
  readonly #screenshotDir: string | undefined;

  constructor(caller: ToolCaller, options: SessionOptions) {
    this.#caller = caller;
    this.budget = options.budget;
    this.origin = new URL(options.origin).origin;
    this.#screenshotDir = options.screenshotDir;
  }

  get used(): number {
    return this.#used;
  }

  get remaining(): number {
    return this.budget - this.#used;
  }

  /** Steps since the last reset, excluding read-only calls. */
  get steps(): RecordedStep[] {
    return [...this.#steps];
  }

  resolveUrl(url: string): string {
    let resolved: URL;
    try {
      resolved = new URL(url, this.origin);
    } catch {
      throw new OriginNotAllowedError(url, this.origin);
    }
    if (resolved.origin !== this.origin) {
      throw new OriginNotAllowedError(resolved.href, this.origin);
    }
    return resolved.href;
  }

  async call(tool: string, args: Record<string, unknown> = {}, note = ''): Promise<string> {
    if (this.#used >= this.budget) {
      throw new BudgetExceededError(this.budget);
    }
    const finalArgs =
      tool === 'browser_navigate' ? { ...args, url: this.resolveUrl(String(args.url ?? '')) } : args;

    this.#used += 1;
    const text = await this.#caller.callTool(tool, finalArgs);
    if (/^### Error/m.test(text)) {
      const detail = text.replace(/^### Error\s*/m, '').split('\n').slice(0, 3).join(' ').trim();
      throw new ToolFailedError(tool, detail);
    }

    const landedOn = pageUrl(text);
    if (landedOn && new URL(landedOn).origin !== this.origin) {
      throw new OriginNotAllowedError(landedOn, this.origin);
    }

    if (!READ_ONLY_TOOLS.has(tool)) {
      this.#steps.push({ tool, args: finalArgs, note: note || describeStep(tool, finalArgs) });
    }
    return text;
  }

  async snapshot(): Promise<SnapshotNode[]> {
    const text = await this.call('browser_snapshot');
    return parseSnapshot(extractSnapshot(text));
  }

  async goto(path: string): Promise<void> {
    await this.call('browser_navigate', { url: path }, `Open ${path}`);
  }

  async currentUrl(): Promise<string> {
    const text = await this.call('browser_snapshot');
    return pageUrl(text) ?? '';
  }

  async click(role: string, name: string | RegExp): Promise<void> {
    const node = findNode(await this.snapshot(), role, name);
    if (!node?.ref) {
      throw new ElementNotFoundError(`${role} "${String(name)}"`);
    }
    await this.call(
      'browser_click',
      { element: `${role} "${node.name}"`, target: node.ref },
      `Click ${role} "${node.name}"`,
    );
  }

  async type(label: string, text: string): Promise<void> {
    const node = findNode(await this.snapshot(), 'textbox', label);
    if (!node?.ref) {
      throw new ElementNotFoundError(`textbox "${label}"`);
    }
    await this.call(
      'browser_type',
      { element: `textbox "${label}"`, target: node.ref, text },
      `Type "${text}" into "${label}"`,
    );
  }

  async waitForText(text: string): Promise<void> {
    await this.call('browser_wait_for', { text, time: 5 });
  }

  /** Returns the path to put in a report (relative to the output directory), or undefined on failure. */
  async screenshot(filename: string): Promise<string | undefined> {
    const fullPath = this.#screenshotDir ? path.join(this.#screenshotDir, filename) : filename;
    try {
      await this.call('browser_take_screenshot', { filename: fullPath, type: 'png', scale: 'css' });
    } catch (error) {
      if (error instanceof BudgetExceededError) throw error;
      return undefined;
    }
    return this.#screenshotDir ? path.join(path.basename(this.#screenshotDir), filename) : filename;
  }

  /** Fresh shop state: clear storage on the allowed origin and start from home. */
  async reset(): Promise<void> {
    await this.call('browser_navigate', { url: '/' });
    await this.call('browser_evaluate', {
      function: '() => { localStorage.clear(); sessionStorage.clear(); }',
    });
    await this.call('browser_navigate', { url: '/' });
    this.#steps = [];
  }
}

export function describeStep(tool: string, args: Record<string, unknown>): string {
  switch (tool) {
    case 'browser_navigate':
      return `Open ${String(args.url)}`;
    case 'browser_navigate_back':
      return 'Go back';
    case 'browser_click':
      return `Click ${String(args.element ?? args.target)}`;
    case 'browser_type':
      return `Type "${String(args.text)}" into ${String(args.element ?? args.target)}`;
    case 'browser_press_key':
      return `Press ${String(args.key)}`;
    case 'browser_select_option':
      return `Select ${JSON.stringify(args.values)} in ${String(args.element ?? args.target)}`;
    default:
      return tool;
  }
}
