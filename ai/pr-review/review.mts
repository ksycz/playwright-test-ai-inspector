import { readFileSync } from 'node:fs';
import { readTestDiff } from './diff.mts';
import { heuristicFindings } from './heuristics.mts';
import { buildReviewPrompt, parseReviewPayload, type ReviewModel } from './model.mts';
import { renderReviewMarkdown } from './report.mts';

export type ReviewResult = {
  markdown: string;
  usedModel: boolean;
};

export async function reviewTestDiff(input: {
  diff: string;
  guidelines: string;
  model: ReviewModel | null;
}): Promise<ReviewResult> {
  const findings = heuristicFindings(readTestDiff(input.diff));
  if (!input.model) {
    return { markdown: renderReviewMarkdown(findings, null), usedModel: false };
  }

  try {
    const content = await input.model.review(buildReviewPrompt(input.diff, input.guidelines));
    const parsed = parseReviewPayload(input.model.name, content);
    if (!parsed) {
      return { markdown: renderReviewMarkdown(findings, null, true), usedModel: false };
    }
    return { markdown: renderReviewMarkdown(findings, parsed), usedModel: true };
  } catch {
    return { markdown: renderReviewMarkdown(findings, null, true), usedModel: false };
  }
}

export function readGuidelines(paths: string[]): string {
  const chunks: string[] = [];
  for (const filePath of paths) {
    try {
      chunks.push(readFileSync(filePath, 'utf8'));
    } catch {
      chunks.push('');
    }
  }
  return chunks.join('\n');
}
