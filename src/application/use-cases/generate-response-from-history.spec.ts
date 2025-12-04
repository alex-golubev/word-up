import { isLeft, isRight } from 'fp-ts/Either';
import { left, right } from 'fp-ts/TaskEither';
import { generateResponseFromHistoryUseCase } from '~/application/use-cases/generate-response-from-history';
import { aiError } from '~/domain/errors';
import { createTestScenario } from '~/test/fixtures';
import { createMockEnv } from '~/test/mock-env';

describe('generateResponseFromHistoryUseCase', () => {
  const scenario = createTestScenario();

  it('should generate response successfully with empty history', async () => {
    const env = createMockEnv({
      generateChatCompletion: jest.fn().mockReturnValue(right({ content: 'Hello! How can I help?' })),
    });

    const result = await generateResponseFromHistoryUseCase({
      scenario,
      history: [],
      userMessage: 'Hi there!',
    })(env)();

    expect(isRight(result)).toBe(true);
    if (isRight(result)) {
      expect(result.right.content).toBe('Hello! How can I help?');
    }
  });

  it('should generate response with conversation history', async () => {
    const env = createMockEnv({
      generateChatCompletion: jest.fn().mockReturnValue(right({ content: 'A latte costs $5.' })),
    });

    const result = await generateResponseFromHistoryUseCase({
      scenario,
      history: [
        { role: 'user', content: 'Hello!' },
        { role: 'assistant', content: 'Welcome! What would you like?' },
      ],
      userMessage: 'How much is a latte?',
    })(env)();

    expect(isRight(result)).toBe(true);
    if (isRight(result)) {
      expect(result.right.content).toBe('A latte costs $5.');
    }
  });

  it('should build correct chat messages with system prompt', async () => {
    const generateChatCompletion = jest.fn().mockReturnValue(right({ content: 'Response' }));
    const env = createMockEnv({ generateChatCompletion });

    await generateResponseFromHistoryUseCase({
      scenario: createTestScenario({ targetLanguage: 'es', title: 'Ordering Food' }),
      history: [{ role: 'user', content: 'Hola' }],
      userMessage: 'Buenos dias',
    })(env)();

    expect(generateChatCompletion).toHaveBeenCalledWith([
      expect.objectContaining({
        role: 'system',
        content: expect.stringContaining('es'),
      }),
      { role: 'user', content: 'Hola' },
      { role: 'user', content: 'Buenos dias' },
    ]);
  });

  it('should include scenario details in system prompt', async () => {
    const generateChatCompletion = jest.fn().mockReturnValue(right({ content: 'Response' }));
    const env = createMockEnv({ generateChatCompletion });

    const customScenario = createTestScenario({
      title: 'Coffee Shop',
      description: 'Order a coffee',
      role: 'Friendly barista',
      targetLanguage: 'fr',
    });

    await generateResponseFromHistoryUseCase({
      scenario: customScenario,
      history: [],
      userMessage: 'Bonjour',
    })(env)();

    const systemPrompt = generateChatCompletion.mock.calls[0][0][0].content;
    expect(systemPrompt).toContain('fr');
    expect(systemPrompt).toContain('Coffee Shop');
    expect(systemPrompt).toContain('Order a coffee');
    expect(systemPrompt).toContain('Friendly barista');
  });

  it('should return error when AI fails', async () => {
    const env = createMockEnv({
      generateChatCompletion: jest.fn().mockReturnValue(left(aiError('API error', new Error('Connection failed')))),
    });

    const result = await generateResponseFromHistoryUseCase({
      scenario,
      history: [],
      userMessage: 'Hello',
    })(env)();

    expect(isLeft(result)).toBe(true);
    if (isLeft(result)) {
      expect(result.left._tag).toBe('AiError');
    }
  });
});
