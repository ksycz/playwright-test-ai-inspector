/**
 * Make untrusted text inert in GitHub-flavored Markdown.
 * Breaks images, links, raw HTML, headings, and code fences without hiding the words.
 */
export function escapeMarkdown(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('`', '&#96;')
    .replaceAll('![', '! [')
    .replaceAll('](', '] (')
    .replace(/(^|\n)(#{1,6})(?= )/g, '$1\\$2');
}
