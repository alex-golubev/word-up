import { isLeft, isRight } from 'fp-ts/Either';
import { left, right } from 'fp-ts/TaskEither';
import type { Message } from '~/domain/types';
import { aiError, insertFailed, notFound } from '~/domain/types';
import { generateResponseUseCase } from '~/application/use-cases/generate-response';
import { TEST_CONVERSATION_ID, createTestConversation, createTestMessage, createTestScenario } from '~/test/fixtures';
import { createMockEnv } from '~/test/mock-env';

describe('generateResponseUseCase', () => {
  it('should generate response successfully', async () => {
    const conversation = createTestConversation({
      messages: [createTestMessage({ role: 'user', content: 'Hello!' })],
    });
    const scenario = createTestScenario();
    const generatedContent = 'Hi there! Welcome to the coffee shop.';

    const env = createMockEnv({
      getConversation: jest.fn().mockReturnValue(right(conversation)),
      generateChatCompletion: jest.fn().mockReturnValue(right({ content: generatedContent })),
      saveMessage: jest.fn().mockImplementation((msg: Message) => right(msg)),
    });

    const params = {
      conversationId: TEST_CONVERSATION_ID,
      scenario,
    };

    const result = await generateResponseUseCase(params)(env)();

    expect(isRight(result)).toBe(true);
    if (isRight(result)) {
      expect(result.right.content).toBe(generatedContent);
      expect(result.right.role).toBe('assistant');
      expect(result.right.conversationId).toBe(TEST_CONVERSATION_ID);
    }
  });

  it('should build system prompt with scenario details', async () => {
    const conversation = createTestConversation({ messages: [] });
    const scenario = createTestScenario({
      title: 'Restaurant',
      description: 'Order food at a restaurant',
      role: 'waiter',
      targetLanguage: 'es',
    });

    let capturedMessages: unknown[] = [];
    const env = createMockEnv({
      getConversation: jest.fn().mockReturnValue(right(conversation)),
      generateChatCompletion: jest.fn().mockImplementation((messages) => {
        capturedMessages = messages;
        return right({ content: 'response' });
      }),
      saveMessage: jest.fn().mockImplementation((msg: Message) => right(msg)),
    });

    await generateResponseUseCase({ conversationId: TEST_CONVERSATION_ID, scenario })(env)();

    expect(capturedMessages[0]).toEqual(
      expect.objectContaining({
        role: 'system',
        content: expect.stringContaining('Restaurant'),
      })
    );
    expect((capturedMessages[0] as { content: string }).content).toContain('Order food at a restaurant');
    expect((capturedMessages[0] as { content: string }).content).toContain('waiter');
    expect((capturedMessages[0] as { content: string }).content).toContain('es');
  });

  it('should include conversation messages in chat completion request', async () => {
    const messages = [
      createTestMessage({ role: 'user', content: 'Hello!' }),
      createTestMessage({ role: 'assistant', content: 'Hi there!' }),
      createTestMessage({ role: 'user', content: 'Can I have a coffee?' }),
    ];
    const conversation = createTestConversation({ messages });
    const scenario = createTestScenario();

    let capturedMessages: unknown[] = [];
    const env = createMockEnv({
      getConversation: jest.fn().mockReturnValue(right(conversation)),
      generateChatCompletion: jest.fn().mockImplementation((msgs) => {
        capturedMessages = msgs;
        return right({ content: 'response' });
      }),
      saveMessage: jest.fn().mockImplementation((msg: Message) => right(msg)),
    });

    await generateResponseUseCase({ conversationId: TEST_CONVERSATION_ID, scenario })(env)();

    expect(capturedMessages).toHaveLength(4);
    expect(capturedMessages[1]).toEqual({ role: 'user', content: 'Hello!' });
    expect(capturedMessages[2]).toEqual({ role: 'assistant', content: 'Hi there!' });
    expect(capturedMessages[3]).toEqual({ role: 'user', content: 'Can I have a coffee?' });
  });

  it('should return error when conversation not found', async () => {
    const scenario = createTestScenario();

    const env = createMockEnv({
      getConversation: jest.fn().mockReturnValue(left(notFound('Conversation', TEST_CONVERSATION_ID))),
    });

    const result = await generateResponseUseCase({ conversationId: TEST_CONVERSATION_ID, scenario })(env)();

    expect(isLeft(result)).toBe(true);
    if (isLeft(result)) {
      expect(result.left._tag).toBe('NotFound');
    }
    expect(env.generateChatCompletion).not.toHaveBeenCalled();
    expect(env.saveMessage).not.toHaveBeenCalled();
  });

  it('should return error when AI generation fails', async () => {
    const conversation = createTestConversation();
    const scenario = createTestScenario();

    const env = createMockEnv({
      getConversation: jest.fn().mockReturnValue(right(conversation)),
      generateChatCompletion: jest.fn().mockReturnValue(left(aiError('API error', new Error('timeout')))),
    });

    const result = await generateResponseUseCase({ conversationId: TEST_CONVERSATION_ID, scenario })(env)();

    expect(isLeft(result)).toBe(true);
    if (isLeft(result)) {
      expect(result.left._tag).toBe('AiError');
    }
    expect(env.saveMessage).not.toHaveBeenCalled();
  });

  it('should return error when save message fails', async () => {
    const conversation = createTestConversation();
    const scenario = createTestScenario();

    const env = createMockEnv({
      getConversation: jest.fn().mockReturnValue(right(conversation)),
      generateChatCompletion: jest.fn().mockReturnValue(right({ content: 'response' })),
      saveMessage: jest.fn().mockReturnValue(left(insertFailed('Message'))),
    });

    const result = await generateResponseUseCase({ conversationId: TEST_CONVERSATION_ID, scenario })(env)();

    expect(isLeft(result)).toBe(true);
    if (isLeft(result)) {
      expect(result.left._tag).toBe('InsertFailed');
    }
  });
});
