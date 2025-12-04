import type { AppReader } from '~/application/reader';
import type { SpeechResponse, SpeechVoice } from '~/domain/types';

export type GenerateSpeechParams = {
  readonly text: string;
  readonly voice?: SpeechVoice;
};

export const generateSpeechUseCase =
  (params: GenerateSpeechParams): AppReader<SpeechResponse> =>
  (env) =>
    env.generateSpeech(params.text, params.voice ?? 'shimmer');
