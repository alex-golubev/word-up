export type SpeechVoice = 'alloy' | 'echo' | 'fable' | 'onyx' | 'nova' | 'shimmer';

export type SpeechResponse = {
  readonly audio: string; // Base64 encoded mp3
  readonly format: 'mp3';
};
