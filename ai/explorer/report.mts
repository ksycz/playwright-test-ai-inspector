import { escapeMarkdown } from '../shared/markdown.mts';
import type { ExplorationResult, Finding } from './types.mts';

/** One finding per line. Model-written fields stay as data; escaping happens in Markdown only. */
export function toJsonl(findings: Finding[]): string {
  return findings.map((finding) => JSON.stringify(finding)).join('\n') + (findings.length ? '\n' : '');
}

function cell(value: string): string {
  return escapeMarkdown(value).replaceAll('|', '\\|').replaceAll('\n', ' ');
}

function sourceLabel(finding: Finding): string {
  return finding.source === 'probe'
    ? 'deterministic probe'
    : 'model-reported, confirmed by replay (still needs human review)';
}

export function renderMarkdown(result: ExplorationResult): string {
  const lines: string[] = [];
  lines.push('# Exploratory testing report');
  lines.push('');
  lines.push(`- Target: ${cell(result.baseUrl)}`);
  lines.push(`- Started: ${result.startedAt}`);
  lines.push(`- Steps used: ${result.stepsUsed} of ${result.budget}`);
  lines.push(`- Model layer: ${result.modelUsed ? cell(result.modelUsed) : 'off (probes only)'}`);
  lines.push(`- Findings: **${result.findings.length}**, dropped as not reproducible: ${result.dropped.length}`);
  lines.push('');
  lines.push('| Charter | Checks | Passed | Findings | Dropped | Note |');
  lines.push('|---|---|---|---|---|---|');
  for (const charter of result.charters) {
    lines.push(
      `| ${charter.charter} | ${charter.checksRun} | ${charter.checksPassed} | ${charter.findings} | ${charter.dropped} | ${charter.stoppedEarly ? cell(charter.stoppedEarly) : ''} |`,
    );
  }
  lines.push('');

  if (result.findings.length === 0) {
    lines.push('No reproducible findings.');
    lines.push('');
  }

  for (const finding of result.findings) {
    lines.push(`## ${cell(finding.id)}: ${cell(finding.title)}`);
    lines.push('');
    lines.push(`- Charter: ${finding.charter}`);
    lines.push(`- Spec: ${cell(finding.specRef)} (docs/APP_SPEC.md)`);
    lines.push(`- Source: ${sourceLabel(finding)}`);
    lines.push(`- Expected: ${cell(finding.expected)}`);
    lines.push(`- Actual: ${cell(finding.actual)}`);
    if (finding.screenshot) lines.push(`- Screenshot: \`${finding.screenshot.replaceAll('`', '')}\``);
    lines.push('');
    lines.push('Steps (from a fresh shop state):');
    lines.push('');
    finding.steps.forEach((step, index) => lines.push(`${index + 1}. ${cell(step)}`));
    lines.push('');
  }

  if (result.dropped.length > 0) {
    lines.push('## Dropped (not reproducible)');
    lines.push('');
    for (const item of result.dropped) {
      lines.push(`- ${cell(item.id)} (${item.source}): ${cell(item.title)}. ${cell(item.reason)}`);
    }
    lines.push('');
  }

  return lines.join('\n');
}
