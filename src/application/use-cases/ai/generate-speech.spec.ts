import { isLeft, isRight } from 'fp-ts/Either';
import { left, right } from 'fp-ts/TaskEither';
import { generateSpeechUseCase } from '~/application/use-cases/ai/generate-speech';
import { aiError } from '~/domain/errors';
import { createMockEnv } from '~/test/mock-env';

describe('generateSpeechUseCase', () => {
  it('should generate speech successfully with default voice', async () => {
    const env = createMockEnv({
      generateSpeech: jest.fn().mockReturnValue(right({ audio: 'base64audio', format: 'mp3' as const })),
    });

    const result = await generateSpeechUseCase({ text: 'Hello world' })(env)();

    expect(isRight(result)).toBe(true);
    if (isRight(result)) {
      expect(result.right.audio).toBe('base64audio');
      expect(result.right.format).toBe('mp3');
    }
    expect(env.generateSpeech).toHaveBeenCalledWith('Hello world', 'shimmer');
  });

  it('should generate speech with custom voice', async () => {
    const env = createMockEnv({
      generateSpeech: jest.fn().mockReturnValue(right({ audio: 'audio', format: 'mp3' as const })),
    });

    await generateSpeechUseCase({ text: 'Test', voice: 'nova' })(env)();

    expect(env.generateSpeech).toHaveBeenCalledWith('Test', 'nova');
  });

  it('should support all available voices', async () => {
    const voices = ['alloy', 'echo', 'fable', 'onyx', 'nova', 'shimmer'] as const;

    for (const voice of voices) {
      const env = createMockEnv({
        generateSpeech: jest.fn().mockReturnValue(right({ audio: 'audio', format: 'mp3' as const })),
      });

      await generateSpeechUseCase({ text: 'Test', voice })(env)();

      expect(env.generateSpeech).toHaveBeenCalledWith('Test', voice);
    }
  });

  it('should return error when TTS fails', async () => {
    const env = createMockEnv({
      generateSpeech: jest.fn().mockReturnValue(left(aiError('TTS failed', new Error('API error')))),
    });

    const result = await generateSpeechUseCase({ text: 'Hello' })(env)();

    expect(isLeft(result)).toBe(true);
    if (isLeft(result)) {
      expect(result.left._tag).toBe('AiError');
    }
  });
});
