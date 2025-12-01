import { isLeft, isRight } from 'fp-ts/Either';

const mockCreate = jest.fn();

jest.mock('openai', () => {
  return jest.fn().mockImplementation(() => ({
    chat: {
      completions: {
        create: mockCreate,
      },
    },
  }));
});

import { createOpenAIEffects } from '~/infrastructure/effects/openai.effects';

describe('createOpenAIEffects', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('generateChatCompletion', () => {
    it('should return content on successful response', async () => {
      mockCreate.mockResolvedValue({
        choices: [{ message: { content: 'Hello from AI!' } }],
      });

      const effects = createOpenAIEffects({ apiKey: 'test-key' });
      const messages = [{ role: 'user' as const, content: 'Hello!' }];

      const result = await effects.generateChatCompletion(messages)();

      expect(isRight(result)).toBe(true);
      if (isRight(result)) {
        expect(result.right).toEqual({ content: 'Hello from AI!' });
      }
      expect(mockCreate).toHaveBeenCalledWith({
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: 'Hello!' }],
      });
    });

    it('should use custom model when provided', async () => {
      mockCreate.mockResolvedValue({
        choices: [{ message: { content: 'response' } }],
      });

      const effects = createOpenAIEffects({ apiKey: 'test-key', model: 'gpt-4' });
      const messages = [{ role: 'user' as const, content: 'test' }];

      await effects.generateChatCompletion(messages)();

      expect(mockCreate).toHaveBeenCalledWith({
        model: 'gpt-4',
        messages: [{ role: 'user', content: 'test' }],
      });
    });

    it('should return AiError when API call fails', async () => {
      const apiError = new Error('API rate limit exceeded');
      mockCreate.mockRejectedValue(apiError);

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
      mockCreate.mockResolvedValue({
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
      mockCreate.mockResolvedValue({
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

      expect(mockCreate).toHaveBeenCalledWith({
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
});
