import {
  generateText as baseGenerateText,
  generateObject as baseGenerateObject,
  ModelMessage,
  UserContent,
} from 'ai';

import { getModels } from '../models.js';
import { logger } from '../../logger.js';

import {
  completeChatLegacyOpenAI,
  OpenAIChatUserPrompt,
} from './legacy/openai.js';
import {
  completeChatLegacyMistral,
  MistralUserPrompt,
} from './legacy/mistral.js';

const ENABLE_LEGACY = true;

export async function generateText({
  systemPrompt,
  examples,
  userPrompt,
}: {
  systemPrompt: string;
  examples: Map<string, string>;
  userPrompt: UserContent;
}): Promise<string> {
  const models = await getModels();

  const messages: ModelMessage[] = [
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

  for (const [name, model] of models) {
    try {
      logger.info(`Trying model ${name}`, {
        // model,
        system: systemPrompt,
        // messages,
      });
      const result = await baseGenerateText({
        model,
        system: systemPrompt,
        messages,
      });
      return result.text;
    } catch (error) {
      console.error(error);
      logger.error(`Model ${name} failed:`, error);
      if (name === models.keys().next().value) {
        throw new Error('All models failed');
      }
    }
  }

  if (ENABLE_LEGACY) {
    try {
      logger.info('Trying legacy OpenAI', {
        system: systemPrompt,
        // messages,
      });
      const legacyUserPrompt: OpenAIChatUserPrompt = [];
      if (typeof userPrompt === 'string') {
        legacyUserPrompt.push({
          type: 'text',
          text: userPrompt,
        });
      } else {
        for (const part of userPrompt) {
          switch (part.type) {
            case 'text':
              legacyUserPrompt.push({
                type: 'text',
                text: part.text,
              });
              break;
            case 'image':
              legacyUserPrompt.push({
                type: 'image_url',
                image_url: {
                  url: part.image.toString(),
                },
              });
              break;
            default:
              throw new Error(`Unsupported part type: ${part.type}`);
          }
        }
      }

      return await completeChatLegacyOpenAI({
        systemPrompt,
        examples,
        userPrompt: legacyUserPrompt,
      });
    } catch (error) {
      logger.error('Error generating text:', error);
    }

    try {
      logger.info('Trying legacy Mistral', {
        system: systemPrompt,
        // messages,
      });
      const legacyUserPrompt: MistralUserPrompt = [];
      if (typeof userPrompt === 'string') {
        legacyUserPrompt.push({
          type: 'text',
          text: userPrompt,
        });
      } else {
        for (const part of userPrompt) {
          switch (part.type) {
            case 'text':
              legacyUserPrompt.push({
                type: 'text',
                text: part.text,
              });
              break;
            case 'image':
              legacyUserPrompt.push({
                type: 'image_url',
                imageUrl: {
                  url: part.image.toString(),
                },
              });
              break;
            default:
              throw new Error(`Unsupported part type: ${part.type}`);
          }
        }
      }

      return await completeChatLegacyMistral({
        systemPrompt,
        examples,
        userPrompt: legacyUserPrompt,
      });
    } catch (error) {
      logger.error('Error generating text:', error);
    }
  }

  throw new Error('All models failed');
}

export async function generateObject<T>({
  systemPrompt,
  examples,
  userPrompt,
  schema,
}: {
  systemPrompt: string;
  examples: Map<string, string>;
  userPrompt: string;
  schema: any;
}): Promise<T> {
  const models = await getModels();

  const messages: ModelMessage[] = [
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

  for (const [name, model] of models) {
    try {
      logger.info(`Trying model ${name}`, {
        // model,
        system: systemPrompt,
        // messages,
        // schema,
      });
      const result = await baseGenerateObject({
        model,
        system: systemPrompt,
        messages,
        schema,
      });
      return result.object as T;
    } catch (error) {
      console.error(error);
      logger.error(`Model ${name} failed:`, error);
    }
  }

  throw new Error('All models failed');
}
