export type ReadableStatus = 'passed' | 'failed' | 'timedOut' | 'skipped' | 'interrupted';

export function formatDuration(durationMs: number): string {
  if (durationMs < 1000) return `${Math.round(durationMs)}ms`;
  return `${(durationMs / 1000).toFixed(1)}s`;
}

export function formatReadableLine(input: {
  title: string;
  status: ReadableStatus;
  durationMs: number;
  retry?: number;
}): string {
  const mark = input.status === 'passed' ? '✓' : input.status === 'skipped' ? '-' : '✘';
  const title = input.title.split('\n')[0] ?? input.title;
  const retry = input.retry && input.retry > 0 ? ` retry ${input.retry}` : '';
  return `  ${mark}  ${title}${retry} (${formatDuration(input.durationMs)})`;
}
