import OpenAI from 'openai';
import type { TaskEither } from 'fp-ts/TaskEither';
import { tryCatch } from 'fp-ts/TaskEither';
import { aiError } from '~/domain/errors';
import type { AppError } from '~/domain/errors';
import type { ChatMessage, GenerateResponse } from '~/domain/types';

export type OpenAiConfig = {
  readonly apiKey: string;
  readonly model?: string;
};

const DEFAULT_MODEL = 'gpt-4o-mini';

export const createOpenAIEffects = (config: OpenAiConfig) => {
  const client = new OpenAI({ apiKey: config.apiKey });
  const model = config.model ?? DEFAULT_MODEL;

  return {
    generateChatCompletion: (messages: readonly ChatMessage[]): TaskEither<AppError, GenerateResponse> =>
      tryCatch(
        async () => {
          const response = await client.chat.completions.create({
            model,
            messages: messages.map((m) => ({ role: m.role, content: m.content })),
          });
          const content = response.choices[0].message.content;
          if (typeof content !== 'string') throw new Error('Empty response from OpenAI');
          return { content };
        },
        (error) => aiError('Failed to generate response', error)
      ),
  };
};

export type OpenAiEffects = ReturnType<typeof createOpenAIEffects>;
