import type { FailureContext, LlmProvider, RootCauseSuggestion } from './types.mts';

export type FetchLike = typeof fetch;

const SYSTEM_PROMPT = `You are a senior SDET helping investigate a Playwright test failure.
Follow docs/AI_GUIDELINES.md constraints for failure analysis:
- Use only the provided failure context; do not invent stack traces, logs, or UI states.
- Prefer Playwright best practices (getByRole, no arbitrary waits, fixtures).
- Give practical debugging hypotheses, not generic advice.
- Be concise and concrete.
- Never request or repeat API keys or secrets.

Respond with JSON only in this shape:
{
  "summary": "one short sentence",
  "hypotheses": ["hypothesis 1", "hypothesis 2"],
  "caveats": ["caveat 1"]
}

Include 2-4 hypotheses and 1-3 caveats.`;

function excerptForPrompt(text: string | null): string {
  if (!text || text.trim().length === 0) {
    return 'No error context text available.';
  }

  const trimmed = text.trim();
  const errorSection = trimmed.match(
    /(?:^|\n)#{1,6}\s*Error\s*\n([\s\S]*?)(?=\n#{1,6}\s|$)/i,
  );
  const body = (errorSection?.[1] ?? trimmed).trim().replace(/^#{1,6}\s+/gm, '');
  return body.slice(0, 2000);
}

export function buildRootCausePrompt(context: FailureContext): string {
  return `Classify category: ${context.classification.category}
Classification summary: ${context.classification.summary}
Confidence: ${context.classification.confidence}
Matched signals: ${context.classification.matchedSignals.join(', ') || 'none'}
Source path: ${context.sourcePath}
Artifacts: screenshots=${context.artifacts.screenshots.length}, videos=${context.artifacts.videos.length}, traces=${context.artifacts.traces.length}

Error excerpt:
${excerptForPrompt(context.errorContextText)}
`;
}

export function parseSuggestionPayload(provider: string, content: string): RootCauseSuggestion | null {
  const trimmed = content.trim();
  const jsonMatch = trimmed.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    return null;
  }

  try {
    const parsed = JSON.parse(jsonMatch[0]) as {
      summary?: unknown;
      hypotheses?: unknown;
      caveats?: unknown;
    };

    const summary = typeof parsed.summary === 'string' ? parsed.summary.trim() : '';
    const hypotheses = Array.isArray(parsed.hypotheses)
      ? parsed.hypotheses.filter((item): item is string => typeof item === 'string' && item.trim().length > 0)
      : [];
    const caveats = Array.isArray(parsed.caveats)
      ? parsed.caveats.filter((item): item is string => typeof item === 'string' && item.trim().length > 0)
      : [];

    if (!summary || hypotheses.length === 0) {
      return null;
    }

    return {
      provider,
      summary,
      hypotheses,
      caveats:
        caveats.length > 0
          ? caveats
          : ['LLM suggestions are probabilistic — verify against the screenshot and trace.'],
    };
  } catch {
    return null;
  }
}

export function createOpenAiProvider(
  apiKey: string,
  options: { fetchImpl?: FetchLike; model?: string } = {},
): LlmProvider {
  const fetchImpl = options.fetchImpl ?? fetch;
  const model = options.model ?? process.env.OPENAI_MODEL ?? 'gpt-4o-mini';

  return {
    name: 'openai',
    async suggestRootCause(context) {
      const response = await fetchImpl('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model,
          temperature: 0.2,
          response_format: { type: 'json_object' },
          messages: [
            { role: 'system', content: SYSTEM_PROMPT },
            { role: 'user', content: buildRootCausePrompt(context) },
          ],
        }),
      });

      if (!response.ok) {
        throw new Error(`OpenAI request failed (${response.status})`);
      }

      const payload = (await response.json()) as {
        choices?: Array<{ message?: { content?: string } }>;
      };
      const content = payload.choices?.[0]?.message?.content;
      if (!content) {
        return null;
      }

      return parseSuggestionPayload('openai', content);
    },
  };
}

export function createAnthropicProvider(
  apiKey: string,
  options: { fetchImpl?: FetchLike; model?: string } = {},
): LlmProvider {
  const fetchImpl = options.fetchImpl ?? fetch;
  const model = options.model ?? process.env.ANTHROPIC_MODEL ?? 'claude-haiku-4-5-20251001';

  return {
    name: 'anthropic',
    async suggestRootCause(context) {
      const response = await fetchImpl('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model,
          max_tokens: 800,
          temperature: 0.2,
          system: SYSTEM_PROMPT,
          messages: [{ role: 'user', content: buildRootCausePrompt(context) }],
        }),
      });

      if (!response.ok) {
        throw new Error(`Anthropic request failed (${response.status})`);
      }

      const payload = (await response.json()) as {
        content?: Array<{ type?: string; text?: string }>;
      };
      const content = payload.content?.find((block) => block.type === 'text')?.text;
      if (!content) {
        return null;
      }

      return parseSuggestionPayload('anthropic', content);
    },
  };
}

/** Resolve an LLM provider from environment variables. Returns null when offline. */
export function resolveProviderFromEnv(
  env: NodeJS.ProcessEnv = process.env,
  options: { fetchImpl?: FetchLike } = {},
): LlmProvider | null {
  const openAiKey = env.OPENAI_API_KEY?.trim();
  if (openAiKey) {
    return createOpenAiProvider(openAiKey, options);
  }

  const anthropicKey = env.ANTHROPIC_API_KEY?.trim();
  if (anthropicKey) {
    return createAnthropicProvider(anthropicKey, options);
  }

  return null;
}

export async function suggestRootCause(
  context: FailureContext,
  provider: LlmProvider | null,
): Promise<RootCauseSuggestion | null> {
  if (!provider) {
    return null;
  }

  return provider.suggestRootCause(context);
}
