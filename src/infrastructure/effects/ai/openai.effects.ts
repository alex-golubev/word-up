import { tryCatch } from 'fp-ts/TaskEither';
import OpenAI from 'openai';

import { aiError } from '~/domain/errors';
import type { AppError } from '~/domain/errors';
import type { ChatMessage, GenerateResponse, SpeechVoice, SpeechResponse } from '~/domain/types';

import type { TaskEither } from 'fp-ts/TaskEither';

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

    generateSpeech: (text: string, voice: SpeechVoice = 'shimmer'): TaskEither<AppError, SpeechResponse> =>
      tryCatch(
        async () => {
          const response = await client.audio.speech.create({
            model: 'tts-1',
            input: text,
            voice,
            response_format: 'mp3',
          });
          const buffer = Buffer.from(await response.arrayBuffer());
          return { audio: buffer.toString('base64'), format: 'mp3' as const };
        },
        (error) => aiError('Failed to generate speech', error)
      ),
  };
};

export type OpenAiEffects = ReturnType<typeof createOpenAIEffects>;
