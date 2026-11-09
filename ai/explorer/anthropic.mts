import type { ChatMessage, ChatModel, ToolCall, ToolSpec } from './agent.mts';
import { apiError } from '../shared/apiError.mts';

type FetchLike = typeof fetch;

type ContentBlock =
  | { type: 'text'; text: string }
  | { type: 'tool_use'; id: string; name: string; input: Record<string, unknown> }
  | { type: 'tool_result'; tool_use_id: string; content: string };

type AnthropicMessage = { role: 'user' | 'assistant'; content: string | ContentBlock[] };

function parseInput(raw: string): Record<string, unknown> {
  try {
    const value: unknown = JSON.parse(raw || '{}');
    return typeof value === 'object' && value !== null && !Array.isArray(value)
      ? (value as Record<string, unknown>)
      : {};
  } catch {
    return {};
  }
}

/**
 * Convert to the Messages API: system prompt goes in `system`, tool results
 * are user-turn `tool_result` blocks, and consecutive tool results share one turn.
 */
export function toAnthropicRequest(messages: ChatMessage[]): {
  system: string;
  messages: AnthropicMessage[];
} {
  const system: string[] = [];
  const out: AnthropicMessage[] = [];
  for (const message of messages) {
    if (message.role === 'system') {
      system.push(message.content);
      continue;
    }
    if (message.role === 'user') {
      out.push({ role: 'user', content: message.content });
      continue;
    }
    if (message.role === 'assistant') {
      const blocks: ContentBlock[] = [];
      if (message.content) blocks.push({ type: 'text', text: message.content });
      for (const call of message.toolCalls) {
        blocks.push({ type: 'tool_use', id: call.id, name: call.name, input: parseInput(call.arguments) });
      }
      out.push({ role: 'assistant', content: blocks.length > 0 ? blocks : [{ type: 'text', text: '' }] });
      continue;
    }
    const result: ContentBlock = { type: 'tool_result', tool_use_id: message.toolCallId, content: message.content };
    const last = out.at(-1);
    if (last?.role === 'user' && Array.isArray(last.content) && last.content.every((block) => block.type === 'tool_result')) {
      last.content.push(result);
    } else {
      out.push({ role: 'user', content: [result] });
    }
  }
  return { system: system.join('\n\n'), messages: out };
}

/** Anthropic Messages API with tool use. ANTHROPIC_MODEL overrides the model, as in the failure analyzer. */
export function createAnthropicChatModel(options: {
  apiKey: string;
  model?: string;
  fetchImpl?: FetchLike;
}): ChatModel {
  const fetchImpl = options.fetchImpl ?? fetch;
  const model = options.model ?? 'claude-haiku-4-5-20251001';
  return {
    name: `anthropic:${model}`,
    async complete(messages: ChatMessage[], tools: ToolSpec[]) {
      const request = toAnthropicRequest(messages);
      const response = await fetchImpl('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'x-api-key': options.apiKey,
          'anthropic-version': '2023-06-01',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model,
          max_tokens: 1024,
          system: request.system,
          messages: request.messages,
          tools: tools.map((tool) => ({
            name: tool.name,
            description: tool.description,
            input_schema: tool.parameters,
          })),
        }),
      });
      if (!response.ok) {
        throw await apiError('Anthropic', response);
      }
      const payload = (await response.json()) as { content?: ContentBlock[] };
      const blocks = payload.content ?? [];
      const text = blocks
        .filter((block): block is Extract<ContentBlock, { type: 'text' }> => block.type === 'text')
        .map((block) => block.text)
        .join('\n');
      const toolCalls: ToolCall[] = blocks
        .filter((block): block is Extract<ContentBlock, { type: 'tool_use' }> => block.type === 'tool_use')
        .map((block) => ({ id: block.id, name: block.name, arguments: JSON.stringify(block.input ?? {}) }));
      return { content: text || null, toolCalls };
    },
  };
}
