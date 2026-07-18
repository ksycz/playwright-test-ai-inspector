import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { generateHtmlReport, generateMarkdownReport } from './report.mts';
import {
  buildRootCausePrompt,
  createOpenAiProvider,
  parseSuggestionPayload,
  resolveProviderFromEnv,
  suggestRootCause,
} from './suggest.mts';
import type { FailureContext, LlmProvider, RootCauseSuggestion } from './types.mts';

function buildContext(overrides: Partial<FailureContext> = {}): FailureContext {
  return {
    sourcePath: '/tmp/test-results/smoke-checkout-flow-chromium',
    collectedAt: '2026-07-17T18:00:00.000Z',
    artifacts: {
      screenshots: ['test-failed-1.png'],
      videos: ['video.webm'],
      traces: ['trace.zip'],
      errorContextPath: 'error-context.md',
      otherFiles: [],
    },
    errorContextText: `Error: expect(page).toHaveURL(expected) failed
Expected: "/order-confirmation"
Received: "/checkout"`,
    classification: {
      category: 'assertion',
      confidence: 0.88,
      matchedSignals: ['assertion:expect assertion mismatch'],
      summary: 'Failure looks like an assertion mismatch (expected vs received).',
    },
    ...overrides,
  };
}

const sampleSuggestion: RootCauseSuggestion = {
  provider: 'mock',
  summary: 'Checkout likely did not navigate after Place order.',
  hypotheses: [
    'Place order handler did not complete before the URL assertion.',
    'Confirmation route redirect is broken for this cart state.',
  ],
  caveats: ['Confirm in the failure screenshot that the button click registered.'],
};

describe('P3-M4 optional LLM root-cause suggestions', () => {
  it('P3-M4-01: works offline when no API keys are configured', async () => {
    const provider = resolveProviderFromEnv({
      OPENAI_API_KEY: '',
      ANTHROPIC_API_KEY: undefined,
    });
    const suggestion = await suggestRootCause(buildContext(), provider);

    assert.equal(provider, null);
    assert.equal(suggestion, null);

    const report = generateMarkdownReport(buildContext());
    assert.doesNotMatch(report, /AI root-cause suggestions/);
  });

  it('P3-M4-02: mock provider suggestions appear in Markdown and HTML reports', async () => {
    const mockProvider: LlmProvider = {
      name: 'mock',
      async suggestRootCause() {
        return sampleSuggestion;
      },
    };

    const suggestion = await suggestRootCause(buildContext(), mockProvider);
    const markdown = generateMarkdownReport(buildContext(), { suggestion });
    const html = await generateHtmlReport(buildContext(), { suggestion });

    assert.equal(suggestion?.provider, 'mock');
    assert.match(markdown, /## AI root-cause suggestions/);
    assert.match(markdown, /Checkout likely did not navigate/);
    assert.match(markdown, /Place order handler did not complete/);
    assert.match(html, /id="ai-heading">AI root-cause suggestions</);
    assert.match(html, /Checkout likely did not navigate/);
  });

  it('P3-M4-03: provider interface is swappable via resolveProviderFromEnv', () => {
    const openAi = resolveProviderFromEnv({ OPENAI_API_KEY: 'sk-test' });
    const anthropic = resolveProviderFromEnv({
      OPENAI_API_KEY: '',
      ANTHROPIC_API_KEY: 'ant-test',
    });

    assert.equal(openAi?.name, 'openai');
    assert.equal(anthropic?.name, 'anthropic');
  });

  it('P3-M4-04: prompt includes classification and error excerpt without inventing secrets', () => {
    const prompt = buildRootCausePrompt(buildContext());

    assert.match(prompt, /Classify category: assertion/);
    assert.match(prompt, /Expected: "\/order-confirmation"/);
    assert.doesNotMatch(prompt, /OPENAI_API_KEY|sk-/);
  });

  it('P3-M4-05: OpenAI provider parses mocked API JSON into suggestions', async () => {
    const fetchImpl: typeof fetch = async () =>
      new Response(
        JSON.stringify({
          choices: [
            {
              message: {
                content: JSON.stringify({
                  summary: 'URL assertion failed after checkout submit.',
                  hypotheses: ['Navigation race', 'Broken confirmation route'],
                  caveats: ['Verify with trace'],
                }),
              },
            },
          ],
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } },
      );

    const provider = createOpenAiProvider('sk-test', { fetchImpl });
    const suggestion = await provider.suggestRootCause(buildContext());

    assert.equal(suggestion?.provider, 'openai');
    assert.match(suggestion?.summary ?? '', /URL assertion failed/);
    assert.equal(suggestion?.hypotheses.length, 2);
  });

  it('P3-M4-06: parseSuggestionPayload rejects empty or invalid payloads', () => {
    assert.equal(parseSuggestionPayload('mock', 'not json'), null);
    assert.equal(parseSuggestionPayload('mock', '{"summary":"x","hypotheses":[]}'), null);
    assert.deepEqual(
      parseSuggestionPayload(
        'mock',
        '{"summary":"ok","hypotheses":["one"],"caveats":[]}',
      ),
      {
        provider: 'mock',
        summary: 'ok',
        hypotheses: ['one'],
        caveats: ['LLM suggestions are probabilistic — verify against the screenshot and trace.'],
      },
    );
  });
});
