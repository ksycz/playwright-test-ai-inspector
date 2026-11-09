/**
 * The one HTML escaper for every local report (failure, flaky, trends, run summary).
 * Test titles and error text are untrusted input. Kept in its own file so mutation
 * testing covers it without also mutating report layout and CSS.
 */
export function escapeHtml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}
