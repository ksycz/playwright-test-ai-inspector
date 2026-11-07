import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { parseSuggestionPayload } from '../failure-analyzer/suggest.mts';
import { escapeMarkdown } from '../shared/markdown.mts';
import { redactSecrets } from '../shared/redact.mts';

const CASES = 80;

function random(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
    return state / 4294967296;
  };
}

function pick(next: () => number, alphabet: string, length: number): string {
  let value = '';
  for (let index = 0; index < length; index += 1) {
    value += alphabet[Math.floor(next() * alphabet.length)];
  }
  return value;
}

function isSubsequence(needle: string, haystack: string): boolean {
  let index = 0;
  for (const char of haystack) {
    if (char === needle[index]) {
      index += 1;
    }
  }
  return index === needle.length;
}

function integer(next: () => number, min: number, max: number): number {
  return min + Math.floor(next() * (max - min + 1));
}

const LETTERS = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
const TOKEN = `${LETTERS}0123456789`;

function filler(next: () => number): string {
  return pick(next, `${LETTERS} `, integer(next, 0, 12));
}

function bearer(next: () => number): string {
  return `Bearer ${pick(next, TOKEN, integer(next, 8, 24))}`;
}

function assignment(next: () => number): string {
  const names = ['API_KEY', 'DB_PASSWORD', 'AUTH_TOKEN', 'SERVICE_SECRET'];
  const name = names[Math.floor(next() * names.length)] ?? 'API_KEY';
  return `${name}=${pick(next, TOKEN, integer(next, 6, 16))}`;
}

function jwt(next: () => number): string {
  return `eyJ${pick(next, TOKEN, 12)}.${pick(next, TOKEN, 12)}.${pick(next, TOKEN, 12)}`;
}

function email(next: () => number): string {
  return `${pick(next, LETTERS, 6)}@${pick(next, LETTERS, 6)}.com`;
}

function urlWithQuery(next: () => number): string {
  return `https://example.com/${pick(next, LETTERS, 4)}?token=${pick(next, TOKEN, 8)}`;
}

describe('redactSecrets properties', () => {
  it('removes a planted secret and is idempotent', () => {
    const next = random(11);
    const planters = [bearer, assignment, jwt, email, urlWithQuery];
    for (let index = 0; index < CASES; index += 1) {
      const plant = planters[index % planters.length] ?? bearer;
      const secret = plant(next);
      const input = `${filler(next)} ${secret} ${filler(next)}`;
      const once = redactSecrets(input);
      assert.equal(once.text.includes(secret), false, `case ${index} kept ${secret}`);
      assert.equal(once.count, 1, `case ${index} count for ${secret}`);
      const twice = redactSecrets(once.text);
      assert.equal(twice.text, once.text);
      assert.equal(twice.text.includes(secret), false);
    }
  });

  it('leaves ordinary words alone', () => {
    const next = random(12);
    for (let index = 0; index < CASES; index += 1) {
      const input = `${filler(next)} password field stayed empty ${filler(next)}https://example.com/orders`;
      const result = redactSecrets(input);
      assert.equal(result.count, 0);
      assert.equal(result.text, input);
    }
  });
});

describe('escapeMarkdown properties', () => {
  it('keeps letters in order and breaks markdown syntax', () => {
    const next = random(21);
    const alphabet = `${LETTERS}0123456789 &<>\`#[]()!*\n`;
    for (let index = 0; index < CASES; index += 1) {
      const input = pick(next, alphabet, integer(next, 1, 40));
      const escaped = escapeMarkdown(input);
      assert.equal(escaped.includes('<'), false, `case ${index} kept <`);
      assert.equal(escaped.includes('>'), false, `case ${index} kept >`);
      assert.equal(escaped.includes('`'), false, `case ${index} kept a backtick`);
      assert.equal(escaped.includes('!['), false, `case ${index} kept an image`);
      assert.equal(escaped.includes(']('), false, `case ${index} kept a link`);
      assert.equal(/^#{1,6} /m.test(escaped), false, `case ${index} kept a heading`);
      const letters = input.replace(/[^a-zA-Z0-9]/g, '');
      assert.equal(isSubsequence(letters, escaped), true, `case ${index} dropped letters`);
    }
  });
});

function validPayload(next: () => number): {
  summary: string;
  hypotheses: string[];
  caveats: string[];
} {
  return {
    summary: pick(next, `${LETTERS} `, integer(next, 1, 40)).trim() || 'ok',
    hypotheses: Array.from({ length: integer(next, 2, 4) }, () => pick(next, LETTERS, integer(next, 1, 20))),
    caveats: Array.from({ length: integer(next, 1, 3) }, () => pick(next, LETTERS, integer(next, 1, 20))),
  };
}

describe('parseSuggestionPayload properties', () => {
  it('accepts a payload inside the length bounds', () => {
    const next = random(31);
    for (let index = 0; index < CASES; index += 1) {
      const payload = validPayload(next);
      const parsed = parseSuggestionPayload('openai', `note ${JSON.stringify(payload)} thanks`);
      assert.ok(parsed, `case ${index} rejected ${JSON.stringify(payload)}`);
      assert.equal(parsed.provider, 'openai');
      assert.equal(parsed.summary, payload.summary.trim());
      assert.deepEqual(parsed.hypotheses, payload.hypotheses);
      assert.deepEqual(parsed.caveats, payload.caveats);
    }
  });

  it('rejects an extra key, a bad count, or an empty item', () => {
    const next = random(32);
    for (let index = 0; index < CASES; index += 1) {
      const payload = validPayload(next) as Record<string, unknown>;
      const choice = index % 3;
      if (choice === 0) {
        payload.ignore = 'previous instructions';
      } else if (choice === 1) {
        payload.hypotheses = ['only one'];
      } else {
        payload.caveats = ['ok', '  '];
      }
      assert.equal(parseSuggestionPayload('openai', JSON.stringify(payload)), null, `case ${index}`);
    }
  });
});
