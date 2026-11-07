import { escapeMarkdown } from '../shared/markdown.mts';
import type { ReviewFinding } from './heuristics.mts';
import type { ModelReview } from './model.mts';

export function renderReviewMarkdown(
  findings: ReviewFinding[],
  model: ModelReview | null,
  modelRejected = false,
): string {
  const lines = ['## Test convention review', ''];

  if (findings.length === 0) {
    lines.push('No heuristic findings in the changed specs.');
  } else {
    lines.push('Heuristic findings (this check does not block the merge):', '');
    for (const finding of findings) {
      const where = escapeMarkdown(`${finding.file}:${finding.line}`);
      lines.push(`- ${where} — ${finding.message}`);
    }
  }

  lines.push('');
  if (modelRejected) {
    lines.push('Model reply rejected. Heuristic findings still apply.');
  } else if (!model) {
    lines.push('Model review skipped (no API key).');
  } else {
    lines.push('### Model notes — unverified', '');
    lines.push(escapeMarkdown(model.summary), '');
    for (const finding of model.findings) {
      lines.push(`- ${escapeMarkdown(finding)}`);
    }
    if (model.findings.length > 0) {
      lines.push('');
    }
    for (const caveat of model.caveats) {
      lines.push(`- ${escapeMarkdown(caveat)}`);
    }
  }

  lines.push('');
  return `${lines.join('\n')}\n`;
}
