import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { readOptionValue } from '../shared/cliArgs.mts';
import { REVIEW_SYSTEM_PROMPT, type ReviewModel } from './model.mts';
import { readGuidelines, reviewTestDiff } from './review.mts';

function printUsage(): void {
  console.error(`Usage:
  npm run analyze:review -- --diff <tests.diff> [--out <file.md>] [--no-llm]

Review added lines under tests/ for suite tags, fixed waits, CSS or XPath locators,
test.only, and login steps that skip auth.fixture.
Prints Markdown and exits 0. Findings do not fail the command.
`);
}

async function modelFromEnv(disabled: boolean): Promise<ReviewModel | null> {
  if (disabled) {
    return null;
  }
  const apiKey = process.env.OPENAI_API_KEY?.trim();
  if (!apiKey) {
    return null;
  }
  const modelName = process.env.OPENAI_MODEL ?? 'gpt-4o-mini';
  return {
    name: 'openai',
    async review(prompt: string): Promise<string> {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: modelName,
          temperature: 0.2,
          response_format: { type: 'json_object' },
          messages: [
            { role: 'system', content: REVIEW_SYSTEM_PROMPT },
            { role: 'user', content: prompt },
          ],
        }),
      });
      if (!response.ok) {
        throw new Error(`OpenAI request failed (${response.status})`);
      }
      const payload = (await response.json()) as { choices?: Array<{ message?: { content?: string } }> };
      return payload.choices?.[0]?.message?.content ?? '';
    },
  };
}

export async function main(argv: string[]): Promise<number> {
  const args = argv.slice(2);
  if (args.length === 0 || args.includes('--help') || args.includes('-h')) {
    printUsage();
    return args.length === 0 ? 1 : 0;
  }

  let diffPath: string | undefined;
  let outPath: string | undefined;
  let noLlm = false;

  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];
    if (arg === '--no-llm') {
      noLlm = true;
      continue;
    }
    if (arg === '--diff' || arg === '--out') {
      const parsed = readOptionValue(args, index, arg);
      if (!parsed.ok) {
        console.error(parsed.error);
        return 1;
      }
      if (arg === '--diff') {
        diffPath = parsed.value;
      } else {
        outPath = parsed.value;
      }
      index = parsed.nextIndex;
      continue;
    }
    console.error(`Unknown option: ${arg}`);
    printUsage();
    return 1;
  }

  if (!diffPath) {
    console.error('Provide --diff <tests.diff>.');
    return 1;
  }

  try {
    const diff = await readFile(diffPath, 'utf8');
    const guidelines = readGuidelines([
      'docs/TESTING.md',
      'docs/AI_GUIDELINES.md',
      'tests/fixtures/index.ts',
    ]);
    const result = await reviewTestDiff({
      diff,
      guidelines,
      model: await modelFromEnv(noLlm),
    });
    if (outPath) {
      const absoluteOut = path.resolve(outPath);
      await mkdir(path.dirname(absoluteOut), { recursive: true });
      await writeFile(absoluteOut, result.markdown, 'utf8');
      console.error(`Wrote test review to ${absoluteOut}`);
    }
    process.stdout.write(result.markdown);
    return 0;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`Failed to review the test diff: ${message}`);
    return 1;
  }
}

const code = await main(process.argv);
process.exit(code);
