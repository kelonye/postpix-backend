import {
  ChatCompletion,
  ChatCompletionMessageParam,
  ChatCompletionUserMessageParam,
} from 'openai/resources/chat/completions';
import OpenAI from 'openai';

import { logger } from '../../../logger.js';

export type OpenAIChatUserPrompt = ChatCompletionUserMessageParam['content'];

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function completeChatLegacyOpenAI({
  model = 'gpt-4o-mini',
  systemPrompt,
  examples,
  userPrompt,
  json = false,
}: {
  model?: string;
  systemPrompt: string;
  examples: Map<string, string>;
  userPrompt: OpenAIChatUserPrompt;
  json?: boolean;
}): Promise<string> {
  const messages: ChatCompletionMessageParam[] = [
    {
      role: 'system',
      content: systemPrompt,
    },
  ];
  for (const [prompt, response] of examples.entries()) {
    messages.push({
      role: 'user',
      content: prompt,
    });
    messages.push({
      role: 'assistant',
      content: response,
    });
  }
  messages.push({
    role: 'user',
    content: userPrompt,
  });
  logger.info({
    message: 'complete chat',
    messages,
  });

  const res = await openai.chat.completions.create({
    model,
    messages,
    response_format: json ? { type: 'json_object' } : undefined,
  });
  const completion: ChatCompletion = await res;

  const result = completion.choices?.[0]?.message?.content ?? null;

  logger.info({
    message: 'completed chat',
    result,
  });

  if (!result) {
    logger.error({
      message: 'No response from OpenAI',
      completion,
    });
    throw new Error('No response from OpenAI');
  }
  return result;
}
