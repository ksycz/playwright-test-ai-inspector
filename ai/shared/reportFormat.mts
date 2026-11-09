/** `--format md|html|both` for the report CLIs. */
export type ReportFormat = 'md' | 'html' | 'both';

export function parseReportFormat(value: string): ReportFormat | null {
  return value === 'md' || value === 'html' || value === 'both' ? value : null;
}

export function formatsToWrite(format: ReportFormat): Array<'md' | 'html'> {
  return format === 'both' ? ['md', 'html'] : [format];
}

export const FORMAT_ERROR = (value: string): string => `--format must be md, html or both (got "${value}").`;
export const OUT_WITH_BOTH_ERROR =
  '--out cannot be used with --format both: each format gets its default name in ai-reports/.';
