import { redactSecrets } from './redact.mts';

/**
 * An Error for a failed model API call that keeps the provider's own explanation,
 * e.g. "Anthropic request failed (400): `temperature` is deprecated for this model."
 * The detail is shortened and redacted; it never contains the request.
 */
export async function apiError(provider: string, response: Response): Promise<Error> {
  let detail = '';
  try {
    const body = await response.text();
    try {
      const parsed = JSON.parse(body) as { error?: { message?: unknown } | string; message?: unknown };
      const message =
        typeof parsed.error === 'object' && parsed.error !== null ? parsed.error.message : parsed.error ?? parsed.message;
      detail = typeof message === 'string' ? message : '';
    } catch {
      detail = body;
    }
  } catch {
    detail = '';
  }
  detail = redactSecrets(detail.replace(/\s+/g, ' ').trim().slice(0, 200)).text;
  return new Error(`${provider} request failed (${response.status})${detail ? `: ${detail}` : ''}`);
}
