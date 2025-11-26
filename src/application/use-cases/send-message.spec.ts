import * as E from 'fp-ts/Either';
import * as TE from 'fp-ts/TaskEither';
import type { Message } from '~/domain/types';
import { sendMessageUseCase } from '~/application/use-cases/send-message';
import { TEST_CONVERSATION_ID, createTestConversation, createTestMessage } from '~/test/fixtures';

describe('sendMessageUseCase', () => {
  const createMockDeps = () => ({
    getConversation: jest.fn(),
    saveMessage: jest.fn(),
  });

  it('should send message successfully', async () => {
    const deps = createMockDeps();
    const conversation = createTestConversation();
    const savedMessage = createTestMessage({ content: 'Hello, world!' });

    deps.getConversation.mockReturnValue(TE.right(conversation));
    deps.saveMessage.mockReturnValue(TE.right(savedMessage));

    const params = {
      conversationId: TEST_CONVERSATION_ID,
      role: 'user' as const,
      content: 'Hello, world!',
    };

    const result = await sendMessageUseCase(params, deps)();

    expect(E.isRight(result)).toBe(true);
    if (E.isRight(result)) {
      expect(result.right.content).toBe('Hello, world!');
      expect(result.right.role).toBe('user');
      expect(result.right.conversationId).toBe(TEST_CONVERSATION_ID);
    }
  });

  it('should pass correct conversation id to messageCreate', async () => {
    const deps = createMockDeps();
    const conversation = createTestConversation();

    deps.getConversation.mockReturnValue(TE.right(conversation));
    deps.saveMessage.mockImplementation((msg: Message) => TE.right(msg));

    const params = {
      conversationId: TEST_CONVERSATION_ID,
      role: 'assistant' as const,
      content: 'Hi there!',
    };

    const result = await sendMessageUseCase(params, deps)();

    expect(E.isRight(result)).toBe(true);
    if (E.isRight(result)) {
      expect(result.right.conversationId).toBe(TEST_CONVERSATION_ID);
      expect(result.right.role).toBe('assistant');
    }
  });

  it('should return error when conversation not found', async () => {
    const deps = createMockDeps();

    deps.getConversation.mockReturnValue(TE.left(new Error('Conversation not found')));

    const params = {
      conversationId: TEST_CONVERSATION_ID,
      role: 'user' as const,
      content: 'Hello!',
    };

    const result = await sendMessageUseCase(params, deps)();

    expect(E.isLeft(result)).toBe(true);
    if (E.isLeft(result)) {
      expect(result.left.message).toBe('Conversation not found');
    }
    expect(deps.saveMessage).not.toHaveBeenCalled();
  });

  it('should return error when save message fails', async () => {
    const deps = createMockDeps();
    const conversation = createTestConversation();

    deps.getConversation.mockReturnValue(TE.right(conversation));
    deps.saveMessage.mockReturnValue(TE.left(new Error('Failed to save message')));

    const params = {
      conversationId: TEST_CONVERSATION_ID,
      role: 'user' as const,
      content: 'Hello!',
    };

    const result = await sendMessageUseCase(params, deps)();

    expect(E.isLeft(result)).toBe(true);
    if (E.isLeft(result)) {
      expect(result.left.message).toBe('Failed to save message');
    }
  });

  it('should throw error for empty content', async () => {
    const deps = createMockDeps();
    const conversation = createTestConversation();

    deps.getConversation.mockReturnValue(TE.right(conversation));

    const params = {
      conversationId: TEST_CONVERSATION_ID,
      role: 'user' as const,
      content: '',
    };

    await expect(sendMessageUseCase(params, deps)()).rejects.toThrow(
      'Message content cannot be empty'
    );
  });

  it('should throw error for content exceeding max length', async () => {
    const deps = createMockDeps();
    const conversation = createTestConversation();

    deps.getConversation.mockReturnValue(TE.right(conversation));

    const params = {
      conversationId: TEST_CONVERSATION_ID,
      role: 'user' as const,
      content: 'a'.repeat(10001),
    };

    await expect(sendMessageUseCase(params, deps)()).rejects.toThrow(
      'Message content exceeds maximum length of 10000 characters'
    );
  });
});
