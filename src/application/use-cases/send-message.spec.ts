import { isLeft, isRight } from 'fp-ts/Either';
import { left, right } from 'fp-ts/TaskEither';
import type { Message } from '~/domain/types';
import { insertFailed, notFound } from '~/domain/types';
import { sendMessageUseCase } from '~/application/use-cases/send-message';
import { TEST_CONVERSATION_ID, createTestConversation, createTestMessage } from '~/test/fixtures';
import { createMockEnv } from '~/test/mock-env';

describe('sendMessageUseCase', () => {
  it('should send message successfully', async () => {
    const conversation = createTestConversation();
    const savedMessage = createTestMessage({ content: 'Hello, world!' });

    const env = createMockEnv({
      getConversation: jest.fn().mockReturnValue(right(conversation)),
      saveMessage: jest.fn().mockReturnValue(right(savedMessage)),
    });

    const params = {
      conversationId: TEST_CONVERSATION_ID,
      role: 'user' as const,
      content: 'Hello, world!',
    };

    const result = await sendMessageUseCase(params)(env)();

    expect(isRight(result)).toBe(true);
    if (isRight(result)) {
      expect(result.right.content).toBe('Hello, world!');
      expect(result.right.role).toBe('user');
      expect(result.right.conversationId).toBe(TEST_CONVERSATION_ID);
    }
  });

  it('should pass correct conversation id to messageCreate', async () => {
    const conversation = createTestConversation();

    const env = createMockEnv({
      getConversation: jest.fn().mockReturnValue(right(conversation)),
      saveMessage: jest.fn().mockImplementation((msg: Message) => right(msg)),
    });

    const params = {
      conversationId: TEST_CONVERSATION_ID,
      role: 'assistant' as const,
      content: 'Hi there!',
    };

    const result = await sendMessageUseCase(params)(env)();

    expect(isRight(result)).toBe(true);
    if (isRight(result)) {
      expect(result.right.conversationId).toBe(TEST_CONVERSATION_ID);
      expect(result.right.role).toBe('assistant');
    }
  });

  it('should return error when conversation not found', async () => {
    const env = createMockEnv({
      getConversation: jest.fn().mockReturnValue(left(notFound('Conversation', TEST_CONVERSATION_ID))),
    });

    const params = {
      conversationId: TEST_CONVERSATION_ID,
      role: 'user' as const,
      content: 'Hello!',
    };

    const result = await sendMessageUseCase(params)(env)();

    expect(isLeft(result)).toBe(true);
    if (isLeft(result)) {
      expect(result.left._tag).toBe('NotFound');
    }
    expect(env.saveMessage).not.toHaveBeenCalled();
  });

  it('should return error when save message fails', async () => {
    const conversation = createTestConversation();

    const env = createMockEnv({
      getConversation: jest.fn().mockReturnValue(right(conversation)),
      saveMessage: jest.fn().mockReturnValue(left(insertFailed('Message'))),
    });

    const params = {
      conversationId: TEST_CONVERSATION_ID,
      role: 'user' as const,
      content: 'Hello!',
    };

    const result = await sendMessageUseCase(params)(env)();

    expect(isLeft(result)).toBe(true);
    if (isLeft(result)) {
      expect(result.left._tag).toBe('InsertFailed');
    }
  });

  it('should throw error for empty content', async () => {
    const conversation = createTestConversation();

    const env = createMockEnv({
      getConversation: jest.fn().mockReturnValue(right(conversation)),
    });

    const params = {
      conversationId: TEST_CONVERSATION_ID,
      role: 'user' as const,
      content: '',
    };

    await expect(sendMessageUseCase(params)(env)()).rejects.toThrow('Message content cannot be empty');
  });

  it('should throw error for content exceeding max length', async () => {
    const conversation = createTestConversation();

    const env = createMockEnv({
      getConversation: jest.fn().mockReturnValue(right(conversation)),
    });

    const params = {
      conversationId: TEST_CONVERSATION_ID,
      role: 'user' as const,
      content: 'a'.repeat(10001),
    };

    await expect(sendMessageUseCase(params)(env)()).rejects.toThrow(
      'Message content exceeds maximum length of 10000 characters'
    );
  });
});
