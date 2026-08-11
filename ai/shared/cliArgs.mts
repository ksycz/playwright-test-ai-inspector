/**
 * Read the next argv token as an option value.
 * Rejects missing values and tokens that look like flags (start with `-`),
 * so `--out --title` cannot silently swallow `--title` as a path.
 */
export function readOptionValue(
  args: string[],
  index: number,
  optionName: string,
): { ok: true; value: string; nextIndex: number } | { ok: false; error: string } {
  const value = args[index + 1];
  if (!value) {
    return { ok: false, error: `Missing value for ${optionName}` };
  }
  if (value.startsWith('-')) {
    return {
      ok: false,
      error: `Missing value for ${optionName} (got flag "${value}")`,
    };
  }
  return { ok: true, value, nextIndex: index + 1 };
}
