import type { FailureCategory, FailureClassification, FailureContext } from './types.mts';

interface ClassificationRule {
  category: FailureCategory;
  confidence: number;
  signal: string;
  pattern: RegExp;
}

const RULES: ClassificationRule[] = [
  {
    category: 'network',
    confidence: 0.95,
    signal: 'browser connection error',
    pattern: /net::ERR_|ERR_CONNECTION|ECONNREFUSED|NS_ERROR_|ERR_NAME_NOT_RESOLVED|Failed to fetch/i,
  },
  {
    category: 'auth',
    confidence: 0.9,
    signal: 'authentication / redirect to login',
    pattern: /unauthorized|401\b|403\b|Invalid username or password|redirect.*login|\/login\?redirect=/i,
  },
  {
    category: 'locator',
    confidence: 0.9,
    signal: 'locator resolution failure',
    pattern:
      /strict mode violation|resolved to \d+ elements|locator\(['"`].*['"`]\)|waiting for (locator|getBy)|Unable to find|element\(s\) not found|not visible|Timeout.*waiting for.*(getBy|locator|role)/i,
  },
  {
    category: 'timeout',
    confidence: 0.85,
    signal: 'explicit timeout',
    pattern: /Test timeout of \d+ms exceeded|Timeout \d+ms exceeded|exceeded while waiting|timed out/i,
  },
  {
    category: 'assertion',
    confidence: 0.88,
    signal: 'expect assertion mismatch',
    pattern: /expect\(|AssertionError|Expected:|Received:|toHaveURL|toBeVisible|toHaveText|toHaveCount/i,
  },
];

const CATEGORY_SUMMARIES: Record<FailureCategory, string> = {
  network: 'Failure looks network-related (connection refused, DNS, or fetch error).',
  auth: 'Failure looks authentication-related (credentials, unauthorized, or login redirect).',
  locator: 'Failure looks locator-related (element not found, strict mode, or wait for selector).',
  timeout: 'Failure looks like a timeout while waiting for a condition or test limit.',
  assertion: 'Failure looks like an assertion mismatch (expected vs received).',
  unknown: 'Failure category could not be determined from available error text.',
};

function scoreText(errorText: string): { category: FailureCategory; confidence: number; matchedSignals: string[] } {
  let bestCategory: FailureCategory = 'unknown';
  let bestConfidence = 0;
  const matchedSignals: string[] = [];

  for (const rule of RULES) {
    if (!rule.pattern.test(errorText)) {
      continue;
    }

    matchedSignals.push(`${rule.category}:${rule.signal}`);

    if (rule.confidence > bestConfidence) {
      bestCategory = rule.category;
      bestConfidence = rule.confidence;
    }
  }

  if (bestCategory === 'unknown') {
    return { category: 'unknown', confidence: 0.2, matchedSignals: [] };
  }

  return { category: bestCategory, confidence: bestConfidence, matchedSignals };
}

export function classifyFailure(context: Pick<FailureContext, 'errorContextText' | 'artifacts'>): FailureClassification {
  const errorText = context.errorContextText?.trim() ?? '';

  if (!errorText) {
    const hasArtifacts =
      context.artifacts.screenshots.length > 0 ||
      context.artifacts.videos.length > 0 ||
      context.artifacts.traces.length > 0;

    return {
      category: 'unknown',
      confidence: hasArtifacts ? 0.25 : 0.1,
      matchedSignals: hasArtifacts ? ['artifacts-present-without-error-text'] : [],
      summary: CATEGORY_SUMMARIES.unknown,
    };
  }

  const scored = scoreText(errorText);

  return {
    category: scored.category,
    confidence: scored.confidence,
    matchedSignals: scored.matchedSignals,
    summary: CATEGORY_SUMMARIES[scored.category],
  };
}
