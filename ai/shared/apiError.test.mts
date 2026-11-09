import assert from 'node:assert/strict';
import { test } from 'node:test';
import { apiError } from './apiError.mts';

test('a failed API call keeps the provider message, shortened and redacted', async () => {
  const anthropic = new Response(
    JSON.stringify({ type: 'error', error: { type: 'invalid_request_error', message: '`temperature` is deprecated for this model.' } }),
    { status: 400 },
  );
  assert.equal((await apiError('Anthropic', anthropic)).message, 'Anthropic request failed (400): `temperature` is deprecated for this model.');

  const openai = new Response(JSON.stringify({ error: { message: 'Bad key Bearer sk-abcdefghijklmnop' } }), { status: 401 });
  assert.equal((await apiError('OpenAI', openai)).message, 'OpenAI request failed (401): Bad key Bearer [REDACTED]');

  const text = new Response(`upstream\n timeout ${'x'.repeat(300)}`, { status: 502 });
  const message = (await apiError('Anthropic', text)).message;
  assert.match(message, /^Anthropic request failed \(502\): upstream timeout x+$/);
  assert.ok(message.length < 250);

  assert.equal((await apiError('OpenAI', new Response('', { status: 500 }))).message, 'OpenAI request failed (500)');
});
