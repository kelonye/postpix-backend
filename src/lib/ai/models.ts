import { createOpenAI } from '@ai-sdk/openai';
import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { createMistral } from '@ai-sdk/mistral';
import { LanguageModel } from 'ai';

const ENABLE_OPENAI = true;
const ENABLE_GOOGLE = true;
const ENABLE_MISTRAL = true;

export async function getModels() {
  const { GEMINI_API_KEY, MISTRAL_API_KEY, OPENAI_API_KEY } = process.env;

  const models: Map<string, LanguageModel> = new Map([]);
  if (ENABLE_OPENAI) {
    const openai = createOpenAI({
      apiKey: OPENAI_API_KEY,
    });
    models.set('openai', openai('gpt-4o-mini') as unknown as LanguageModel);
  }
  if (ENABLE_GOOGLE) {
    const google = createGoogleGenerativeAI({
      apiKey: GEMINI_API_KEY,
    });
    models.set('google', google('gemini-1.5-pro-latest'));
  }
  if (ENABLE_MISTRAL) {
    const mistral = createMistral({
      apiKey: MISTRAL_API_KEY,
    });

    models.set(
      'mistral',
      mistral('mistral-large-latest') as unknown as LanguageModel,
    );
  }

  return models;
}
