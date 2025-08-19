import { Mistral } from '@mistralai/mistralai';
import { UserMessage } from '@mistralai/mistralai/models/components/usermessage.js';
import { SystemMessage } from '@mistralai/mistralai/models/components/systemmessage.js';
import { AssistantMessage } from '@mistralai/mistralai/models/components/assistantmessage.js';
import { ToolMessage } from '@mistralai/mistralai/models/components/toolmessage.js';

import { logger } from '../../../logger.js';

export type MistralUserPrompt = UserMessage['content'];

const mistral = new Mistral({
  apiKey: process.env.MISTRAL_API_KEY,
  // fetch: (url: RequestInfo | URL, init?: RequestInit) => {
  //   // Remove headers that cause issues in Cloudflare
  //   if (init?.headers) {
  //     const headers = new Headers(init.headers);
  //     headers.delete('User-Agent');
  //     headers.delete('user-agent');
  //     init.headers = headers;
  //   }

  //   return fetch(url, init);
  // },
  // httpClient: new HTTPClient(),
});

export async function completeChatLegacyMistral({
  model = 'mistral-large-latest',
  systemPrompt,
  examples,
  userPrompt,
}: {
  model?: string;
  systemPrompt: string;
  examples: Map<string, string>;
  userPrompt: UserMessage['content'];
}): Promise<string> {
  const messages: Array<
    | (SystemMessage & { role: 'system' })
    | (UserMessage & { role: 'user' })
    | (AssistantMessage & { role: 'assistant' })
    | (ToolMessage & { role: 'tool' })
  > = [
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

  const completion = await mistral.chat.complete({
    model,
    messages: messages,
  });

  const content = completion.choices?.[0]?.message?.content ?? null;
  const result = typeof content === 'string' ? content : content?.join('');

  logger.info({
    message: 'completed chat',
    result,
  });

  if (!result) {
    throw new Error('No response from Mistral');
  }
  return result;
}
