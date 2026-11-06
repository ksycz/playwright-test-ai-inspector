import { execFile } from 'node:child_process';
import { readFile } from 'node:fs/promises';
import { promisify } from 'node:util';
import { readOptionValue } from '../shared/cliArgs.mts';
import { gateNewDependencies, type PackageManifest } from './gate.mts';
import { lookupNpmPackage } from './registry.mts';

const execFileAsync = promisify(execFile);

const MANIFESTS = ['package.json', 'app/package.json'] as const;

function printUsage(): void {
  console.error(`Usage: npm run analyze:deps -- --base <git-ref>

Compare root package.json and app/package.json with a git ref (usually the PR base).
Only newly added dependency names are checked against the npm registry.

A new package fails when it does not exist, is younger than 7 days, or has fewer
than 1000 weekly downloads. Version bumps of packages already in the base are ignored.

Examples:
  npm run analyze:deps -- --base origin/main
  npm run analyze:deps -- --base <pull-request-base-sha>
`);
}

function parseManifest(raw: string, label: string): PackageManifest {
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new Error(`${label} is not valid JSON`);
  }
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
    throw new Error(`${label} must be a JSON object`);
  }
  return parsed as PackageManifest;
}

function isMissingGitPath(error: unknown): boolean {
  const stderr = error && typeof error === 'object' && 'stderr' in error ? String(error.stderr) : '';
  const message = error instanceof Error ? error.message : String(error);
  return /exists on disk|does not exist in/i.test(`${message}\n${stderr}`);
}

async function readBaseManifest(ref: string, file: string): Promise<PackageManifest> {
  try {
    const { stdout } = await execFileAsync('git', ['show', `${ref}:${file}`], {
      encoding: 'utf8',
      maxBuffer: 1024 * 1024,
    });
    return parseManifest(stdout, `${ref}:${file}`);
  } catch (error) {
    if (isMissingGitPath(error)) return {};
    const stderr = error && typeof error === 'object' && 'stderr' in error ? String(error.stderr).trim() : '';
    const detail = stderr || (error instanceof Error ? error.message : String(error));
    throw new Error(`Could not read ${file} from ${ref}. ${detail}`);
  }
}

async function readHeadManifest(file: string): Promise<PackageManifest> {
  try {
    const raw = await readFile(file, 'utf8');
    return parseManifest(raw, file);
  } catch (error) {
    const code = error && typeof error === 'object' && 'code' in error ? error.code : undefined;
    if (code === 'ENOENT') return {};
    throw error;
  }
}

async function main(argv: string[]): Promise<number> {
  const args = argv.slice(2);

  if (args.includes('--help') || args.includes('-h')) {
    printUsage();
    return 0;
  }

  let baseRef: string | undefined;

  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];
    if (arg === '--base') {
      const parsed = readOptionValue(args, index, '--base');
      if (!parsed.ok) {
        console.error(parsed.error);
        printUsage();
        return 1;
      }
      baseRef = parsed.value;
      index = parsed.nextIndex;
      continue;
    }

    console.error(`Unknown option: ${arg}`);
    printUsage();
    return 1;
  }

  if (!baseRef) {
    console.error('Missing required option --base <git-ref>');
    printUsage();
    return 1;
  }

  try {
    const pairs = await Promise.all(
      MANIFESTS.map(async (label) => ({
        label,
        base: await readBaseManifest(baseRef, label),
        head: await readHeadManifest(label),
      })),
    );

    const result = await gateNewDependencies({
      pairs,
      lookup: lookupNpmPackage,
    });

    if (!result.ok) {
      console.error('Dependency gate failed:');
      for (const item of result.violations) {
        console.error(item.message);
      }
      return 1;
    }

    console.error('Dependency gate passed.');
    return 0;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(message);
    return 1;
  }
}

const exitCode = await main(process.argv);
process.exit(exitCode);
