import { execFileSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { readOptionValue } from '../shared/cliArgs.mts';
import { draftPrBody, draftSpec, slugify, type Credentials } from './draft.mts';
import type { Finding } from './types.mts';

function printUsage(): void {
  console.error(`Usage:
  npm run explore:draft -- --finding <id> [--findings ai-reports/explorer/findings.jsonl]
                           [--force] [--pr] [--dry-run]

Turns one finding from npm run explore (or explore:eval) into a draft @e2e spec under
tests/e2e/explored/. With --pr it also commits the spec on a new branch, pushes it, and
opens a draft pull request for review (needs git and gh). --dry-run prints those commands.
`);
}

export type DraftOptions = {
  finding: string;
  findings: string;
  force: boolean;
  pr: boolean;
  dryRun: boolean;
};

export function parseDraftArgs(args: string[]): DraftOptions {
  const options: DraftOptions = {
    finding: '',
    findings: 'ai-reports/explorer/findings.jsonl',
    force: false,
    pr: false,
    dryRun: false,
  };
  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];
    if (arg === '--force' || arg === '--pr' || arg === '--dry-run') {
      if (arg === '--force') options.force = true;
      if (arg === '--pr') options.pr = true;
      if (arg === '--dry-run') options.dryRun = true;
      continue;
    }
    if (arg !== '--finding' && arg !== '--findings') throw new Error(`Unknown option: ${arg}`);
    const parsed = readOptionValue(args, index, arg);
    if (!parsed.ok) throw new Error(parsed.error);
    index = parsed.nextIndex;
    if (arg === '--finding') options.finding = parsed.value;
    else options.findings = parsed.value;
  }
  if (!options.finding) throw new Error('Provide --finding <id> (see the ids in report.md).');
  if (options.dryRun && !options.pr) throw new Error('--dry-run only applies with --pr');
  return options;
}

export function readFindings(text: string): Finding[] {
  return text
    .split('\n')
    .filter((line) => line.trim())
    .map((line) => JSON.parse(line) as Finding);
}

/** owner/repo from an origin URL (https, ssh, or a proxy path ending in owner/repo). */
export function repoFromRemote(url: string): string {
  const match = url.trim().match(/[/:]([^/:]+)\/([^/]+?)(?:\.git)?\/?$/);
  if (!match) throw new Error(`Cannot read owner/repo from remote "${url}"`);
  return `${match[1]}/${match[2]}`;
}

export type Command = { cmd: string; args: string[] };

export function prCommands(options: {
  branch: string;
  specPath: string;
  title: string;
  bodyFile: string;
  repo: string;
  base: string;
}): Command[] {
  return [
    // Branch from the latest base, not from whatever branch is checked out.
    { cmd: 'git', args: ['fetch', 'origin', options.base] },
    { cmd: 'git', args: ['switch', '-c', options.branch, `origin/${options.base}`] },
    { cmd: 'git', args: ['add', '--', options.specPath] },
    { cmd: 'git', args: ['commit', '-m', options.title, '--', options.specPath] },
    { cmd: 'git', args: ['push', '-u', 'origin', options.branch] },
    {
      cmd: 'gh',
      args: [
        'api', `repos/${options.repo}/pulls`,
        '-f', `title=${options.title}`,
        '-f', `head=${options.branch}`,
        '-f', `base=${options.base}`,
        '-F', 'draft=true',
        '-F', `body=@${options.bodyFile}`,
        '--jq', '.html_url',
      ],
    },
  ];
}

function quote(arg: string): string {
  return /^[\w@%+=:,./-]+$/.test(arg) ? arg : `'${arg.replaceAll("'", "'\\''")}'`;
}

export async function main(argv: string[]): Promise<number> {
  const args = argv.slice(2);
  if (args.includes('--help') || args.includes('-h')) {
    printUsage();
    return 0;
  }
  let options: DraftOptions;
  try {
    options = parseDraftArgs(args);
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    printUsage();
    return 1;
  }

  try {
    const findings = readFindings(await readFile(options.findings, 'utf8'));
    const finding = findings.find((item) => item.id === options.finding);
    if (!finding) {
      console.error(`No finding "${options.finding}" in ${options.findings}. Ids: ${findings.map((item) => item.id).join(', ') || 'none'}`);
      return 1;
    }
    const [user] = JSON.parse(await readFile('app/src/data/users.json', 'utf8')) as Credentials[];
    const draft = draftSpec(finding, { user, date: new Date().toISOString().slice(0, 10) });

    if (existsSync(draft.path) && !options.force) {
      console.error(`${draft.path} already exists. Use --force to overwrite.`);
      return 1;
    }
    await mkdir(path.dirname(draft.path), { recursive: true });
    await writeFile(draft.path, draft.source, 'utf8');
    console.error(`Wrote ${draft.path}${draft.complete ? '' : ` (incomplete: ${draft.warnings.join('; ')})`}`);

    if (!options.pr) return 0;

    const branch = `explored/${slugify(finding.id)}`;
    const bodyFile = path.join(tmpdir(), `explored-${slugify(finding.id)}.md`);
    await writeFile(bodyFile, draftPrBody(finding, draft, branch), 'utf8');
    const remote = execFileSync('git', ['remote', 'get-url', 'origin'], { encoding: 'utf8' });
    const commands = prCommands({
      branch,
      specPath: draft.path,
      title: `test(e2e): draft spec for explored finding ${slugify(finding.id)}`,
      bodyFile,
      repo: repoFromRemote(remote),
      base: 'main',
    });
    for (const command of commands) {
      const line = [command.cmd, ...command.args].map(quote).join(' ');
      if (options.dryRun) {
        console.log(line);
        continue;
      }
      console.error(`$ ${line}`);
      const output = execFileSync(command.cmd, command.args, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'inherit'] });
      if (output.trim()) console.log(output.trim());
    }
    if (options.dryRun) console.error(`PR description written to ${bodyFile}`);
    return 0;
  } catch (error) {
    console.error(`Draft failed: ${error instanceof Error ? error.message : String(error)}`);
    return 1;
  }
}

if (process.argv[1]?.endsWith('draft-cli.mts')) {
  const code = await main(process.argv);
  process.exit(code);
}
