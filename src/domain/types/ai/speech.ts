import { z } from 'zod';

export const SpeechVoiceSchema = z.enum(['alloy', 'echo', 'fable', 'onyx', 'nova', 'shimmer']);

export type SpeechVoice = z.infer<typeof SpeechVoiceSchema>;

export type SpeechResponse = {
  readonly audio: string; // Base64 encoded mp3
  readonly format: 'mp3';
};
