import { readOptionValue } from '../shared/cliArgs.mts';
import { FLOWS, type Flow } from './types.mts';

export type CliOptions = {
  baseUrl: string;
  charters: Flow[];
  budget: number;
  outDir: string;
  noLlm: boolean;
  modelSteps: number;
  modelTurns: number;
  executablePath?: string;
  noSandbox: boolean;
  headed: boolean;
};

const VALUE_OPTIONS = new Set([
  '--base-url',
  '--charters',
  '--budget',
  '--out-dir',
  '--model-steps',
  '--model-turns',
  '--executable-path',
]);

function positiveInt(value: string, name: string): number {
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < 1) {
    throw new Error(`${name} must be a positive integer`);
  }
  return parsed;
}

/** The explorer may only drive a shop on this machine. */
export function assertLocalBaseUrl(value: string): string {
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    throw new Error(`--base-url is not a URL: ${value}`);
  }
  if (!['localhost', '127.0.0.1'].includes(url.hostname) || !['http:', 'https:'].includes(url.protocol)) {
    throw new Error('--base-url must point at localhost or 127.0.0.1');
  }
  return url.origin;
}

export function parseArgs(args: string[]): CliOptions {
  const options: CliOptions = {
    baseUrl: 'http://localhost:5173',
    charters: [...FLOWS],
    budget: 400,
    outDir: 'ai-reports/explorer',
    noLlm: false,
    modelSteps: 30,
    modelTurns: 40,
    executablePath: process.env.EXPLORER_EXECUTABLE_PATH || undefined,
    noSandbox: process.env.EXPLORER_NO_SANDBOX === '1',
    headed: false,
  };
  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];
    if (arg === '--no-llm') {
      options.noLlm = true;
      continue;
    }
    if (arg === '--no-sandbox') {
      options.noSandbox = true;
      continue;
    }
    if (arg === '--headed') {
      options.headed = true;
      continue;
    }
    if (!VALUE_OPTIONS.has(arg)) {
      throw new Error(`Unknown option: ${arg}`);
    }
    const parsed = readOptionValue(args, index, arg);
    if (!parsed.ok) throw new Error(parsed.error);
    index = parsed.nextIndex;
    const value = parsed.value;
    switch (arg) {
      case '--base-url':
        options.baseUrl = assertLocalBaseUrl(value);
        break;
      case '--charters': {
        const names = value.split(',').map((name) => name.trim()).filter(Boolean);
        const unknown = names.filter((name) => !FLOWS.includes(name as Flow));
        if (names.length === 0 || unknown.length > 0) {
          throw new Error(`--charters accepts ${FLOWS.join(', ')}`);
        }
        options.charters = names as Flow[];
        break;
      }
      case '--budget':
        options.budget = positiveInt(value, arg);
        break;
      case '--out-dir':
        options.outDir = value;
        break;
      case '--model-steps':
        options.modelSteps = positiveInt(value, arg);
        break;
      case '--model-turns':
        options.modelTurns = positiveInt(value, arg);
        break;
      case '--executable-path':
        options.executablePath = value;
        break;
    }
  }
  return options;
}

export type EvalOptions = {
  bugs: string[];
  port: number;
  budget: number;
  outDir: string;
  history: string;
  noLlm: boolean;
  modelSteps: number;
  modelTurns: number;
  executablePath?: string;
  noSandbox: boolean;
};

const EVAL_VALUE_OPTIONS = new Set([
  '--bugs',
  '--port',
  '--budget',
  '--out-dir',
  '--history',
  '--model-steps',
  '--model-turns',
  '--executable-path',
]);

/** Options for npm run explore:eval. `known` is the list of seeded bug ids. */
export function parseEvalArgs(args: string[], known: readonly string[]): EvalOptions {
  const options: EvalOptions = {
    bugs: [...known],
    port: 5174,
    budget: 400,
    outDir: 'ai-reports/explorer-eval',
    history: 'ai-reports/explorer-eval/history.jsonl',
    noLlm: false,
    modelSteps: 30,
    modelTurns: 40,
    executablePath: process.env.EXPLORER_EXECUTABLE_PATH || undefined,
    noSandbox: process.env.EXPLORER_NO_SANDBOX === '1',
  };
  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];
    if (arg === '--no-llm') {
      options.noLlm = true;
      continue;
    }
    if (arg === '--no-sandbox') {
      options.noSandbox = true;
      continue;
    }
    if (!EVAL_VALUE_OPTIONS.has(arg)) {
      throw new Error(`Unknown option: ${arg}`);
    }
    const parsed = readOptionValue(args, index, arg);
    if (!parsed.ok) throw new Error(parsed.error);
    index = parsed.nextIndex;
    const value = parsed.value;
    switch (arg) {
      case '--bugs': {
        const names = value.split(',').map((name) => name.trim()).filter(Boolean);
        const unknown = names.filter((name) => !known.includes(name));
        if (names.length === 0 || unknown.length > 0) {
          throw new Error(`--bugs accepts ${known.join(', ')}`);
        }
        options.bugs = names;
        break;
      }
      case '--port': {
        const port = positiveInt(value, arg);
        if (port < 1024 || port > 65535) throw new Error('--port must be between 1024 and 65535');
        options.port = port;
        break;
      }
      case '--budget':
        options.budget = positiveInt(value, arg);
        break;
      case '--out-dir':
        options.outDir = value;
        break;
      case '--history':
        options.history = value;
        break;
      case '--model-steps':
        options.modelSteps = positiveInt(value, arg);
        break;
      case '--model-turns':
        options.modelTurns = positiveInt(value, arg);
        break;
      case '--executable-path':
        options.executablePath = value;
        break;
    }
  }
  return options;
}
