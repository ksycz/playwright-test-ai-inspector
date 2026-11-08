import type { ChatMessage, ChatModel, ToolCall, ToolSpec } from './agent.mts';

type FetchLike = typeof fetch;

type OpenAiMessage = {
  role: string;
  content: string | null;
  tool_calls?: Array<{ id: string; type: 'function'; function: { name: string; arguments: string } }>;
  tool_call_id?: string;
};

export function toOpenAiMessages(messages: ChatMessage[]): OpenAiMessage[] {
  return messages.map((message) => {
    if (message.role === 'tool') {
      return { role: 'tool', content: message.content, tool_call_id: message.toolCallId };
    }
    if (message.role === 'assistant') {
      return {
        role: 'assistant',
        content: message.content,
        ...(message.toolCalls.length > 0
          ? {
              tool_calls: message.toolCalls.map((call) => ({
                id: call.id,
                type: 'function' as const,
                function: { name: call.name, arguments: call.arguments },
              })),
            }
          : {}),
      };
    }
    return { role: message.role, content: message.content };
  });
}

/** OpenAI chat completions with tool calling (the key this repo's CI already has). */
export function createOpenAiChatModel(options: {
  apiKey: string;
  model?: string;
  fetchImpl?: FetchLike;
}): ChatModel {
  const fetchImpl = options.fetchImpl ?? fetch;
  const model = options.model ?? 'gpt-4o-mini';
  return {
    name: `openai:${model}`,
    async complete(messages: ChatMessage[], tools: ToolSpec[]) {
      const response = await fetchImpl('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${options.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model,
          temperature: 0.2,
          parallel_tool_calls: false,
          tools: tools.map((tool) => ({ type: 'function', function: tool })),
          messages: toOpenAiMessages(messages),
        }),
      });
      if (!response.ok) {
        throw new Error(`OpenAI request failed (${response.status})`);
      }
      const payload = (await response.json()) as {
        choices?: Array<{ message?: OpenAiMessage }>;
      };
      const message = payload.choices?.[0]?.message;
      const toolCalls: ToolCall[] = (message?.tool_calls ?? []).map((call) => ({
        id: call.id,
        name: call.function.name,
        arguments: call.function.arguments,
      }));
      return { content: message?.content ?? null, toolCalls };
    },
  };
}
