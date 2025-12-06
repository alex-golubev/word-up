import { isLeft, isRight } from 'fp-ts/Either';

const mockChatCreate = jest.fn();
const mockSpeechCreate = jest.fn();

jest.mock('openai', () => {
  return jest.fn().mockImplementation(() => ({
    chat: {
      completions: {
        create: mockChatCreate,
      },
    },
    audio: {
      speech: {
        create: mockSpeechCreate,
      },
    },
  }));
});

import { createOpenAIEffects } from '~/infrastructure/effects/ai/openai.effects';

describe('createOpenAIEffects', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('generateChatCompletion', () => {
    it('should return content on successful response', async () => {
      mockChatCreate.mockResolvedValue({
        choices: [{ message: { content: 'Hello from AI!' } }],
      });

      const effects = createOpenAIEffects({ apiKey: 'test-key' });
      const messages = [{ role: 'user' as const, content: 'Hello!' }];

      const result = await effects.generateChatCompletion(messages)();

      expect(isRight(result)).toBe(true);
      if (isRight(result)) {
        expect(result.right).toEqual({ content: 'Hello from AI!' });
      }
      expect(mockChatCreate).toHaveBeenCalledWith({
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: 'Hello!' }],
      });
    });

    it('should use custom model when provided', async () => {
      mockChatCreate.mockResolvedValue({
        choices: [{ message: { content: 'response' } }],
      });

      const effects = createOpenAIEffects({ apiKey: 'test-key', model: 'gpt-4' });
      const messages = [{ role: 'user' as const, content: 'test' }];

      await effects.generateChatCompletion(messages)();

      expect(mockChatCreate).toHaveBeenCalledWith({
        model: 'gpt-4',
        messages: [{ role: 'user', content: 'test' }],
      });
    });

    it('should return AiError when API call fails', async () => {
      const apiError = new Error('API rate limit exceeded');
      mockChatCreate.mockRejectedValue(apiError);

      const effects = createOpenAIEffects({ apiKey: 'test-key' });
      const messages = [{ role: 'user' as const, content: 'Hello!' }];

      const result = await effects.generateChatCompletion(messages)();

      expect(isLeft(result)).toBe(true);
      if (isLeft(result)) {
        expect(result.left._tag).toBe('AiError');
        expect(result.left).toEqual({
          _tag: 'AiError',
          message: 'Failed to generate response',
          cause: apiError,
        });
      }
    });

    it('should return AiError when response content is null', async () => {
      mockChatCreate.mockResolvedValue({
        choices: [{ message: { content: null } }],
      });

      const effects = createOpenAIEffects({ apiKey: 'test-key' });
      const messages = [{ role: 'user' as const, content: 'Hello!' }];

      const result = await effects.generateChatCompletion(messages)();

      expect(isLeft(result)).toBe(true);
      if (isLeft(result)) {
        expect(result.left).toEqual({
          _tag: 'AiError',
          message: 'Failed to generate response',
          cause: expect.any(Error),
        });
      }
    });

    it('should map multiple messages correctly', async () => {
      mockChatCreate.mockResolvedValue({
        choices: [{ message: { content: 'response' } }],
      });

      const effects = createOpenAIEffects({ apiKey: 'test-key' });
      const messages = [
        { role: 'system' as const, content: 'You are helpful.' },
        { role: 'user' as const, content: 'Hello!' },
        { role: 'assistant' as const, content: 'Hi there!' },
        { role: 'user' as const, content: 'How are you?' },
      ];

      await effects.generateChatCompletion(messages)();

      expect(mockChatCreate).toHaveBeenCalledWith({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: 'You are helpful.' },
          { role: 'user', content: 'Hello!' },
          { role: 'assistant', content: 'Hi there!' },
          { role: 'user', content: 'How are you?' },
        ],
      });
    });
  });

  describe('generateSpeech', () => {
    // noinspection JSUnusedGlobalSymbols
    const createMockAudioResponse = (base64Content: string) => ({
      arrayBuffer: () => Promise.resolve(Buffer.from(base64Content)),
    });

    it('should return base64 audio on successful response', async () => {
      mockSpeechCreate.mockResolvedValue(createMockAudioResponse('audio-content'));

      const effects = createOpenAIEffects({ apiKey: 'test-key' });
      const result = await effects.generateSpeech('Hello world')();

      expect(isRight(result)).toBe(true);
      if (isRight(result)) {
        expect(result.right.format).toBe('mp3');
        expect(typeof result.right.audio).toBe('string');
      }
      expect(mockSpeechCreate).toHaveBeenCalledWith({
        model: 'tts-1',
        input: 'Hello world',
        voice: 'shimmer',
        response_format: 'mp3',
      });
    });

    it('should use custom voice when provided', async () => {
      mockSpeechCreate.mockResolvedValue(createMockAudioResponse('audio'));

      const effects = createOpenAIEffects({ apiKey: 'test-key' });
      await effects.generateSpeech('Test', 'nova')();

      expect(mockSpeechCreate).toHaveBeenCalledWith({
        model: 'tts-1',
        input: 'Test',
        voice: 'nova',
        response_format: 'mp3',
      });
    });

    it('should return AiError when API call fails', async () => {
      const apiError = new Error('TTS quota exceeded');
      mockSpeechCreate.mockRejectedValue(apiError);

      const effects = createOpenAIEffects({ apiKey: 'test-key' });
      const result = await effects.generateSpeech('Hello')();

      expect(isLeft(result)).toBe(true);
      if (isLeft(result)) {
        expect(result.left).toEqual({
          _tag: 'AiError',
          message: 'Failed to generate speech',
          cause: apiError,
        });
      }
    });
  });
});
