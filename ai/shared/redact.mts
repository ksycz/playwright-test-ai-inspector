export interface Redaction {
  text: string;
  count: number;
}

const BEARER = /\bBearer\s+[A-Za-z0-9._~+/-]{8,}/g;
const SECRET_ASSIGNMENT = /\b([A-Z][A-Z0-9_]*(?:_KEY|_SECRET|_TOKEN|_PASSWORD))\s*=\s*[^\s'"`]+/g;
const JWT = /\beyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\b/g;
const EMAIL = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/g;
const URL_QUERY = /(https?:\/\/[^\s?#]+)\?[^\s#]*/g;

function replaceAll(input: string, pattern: RegExp, replacement: string | ((match: string) => string), count: { value: number }): string {
  return input.replace(pattern, (match) => {
    count.value += 1;
    return typeof replacement === 'function' ? replacement(match) : replacement;
  });
}

/** Replace secret-like values. The returned text never contains the original secrets. */
export function redactSecrets(input: string): Redaction {
  const count = { value: 0 };
  let text = input;
  text = replaceAll(text, BEARER, 'Bearer [REDACTED]', count);
  text = replaceAll(text, SECRET_ASSIGNMENT, (match) => `${match.split('=')[0].trim()}=[REDACTED]`, count);
  text = replaceAll(text, JWT, '[REDACTED]', count);
  text = replaceAll(text, EMAIL, '[REDACTED]', count);
  text = replaceAll(text, URL_QUERY, (match) => `${match.slice(0, match.indexOf('?'))}?[REDACTED]`, count);
  return { text, count: count.value };
}
