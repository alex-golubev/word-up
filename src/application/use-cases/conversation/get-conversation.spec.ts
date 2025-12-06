import { isLeft, isRight } from 'fp-ts/Either';
import { left, right } from 'fp-ts/TaskEither';

import { getConversationUseCase } from '~/application/use-cases/conversation/get-conversation';
import { dbError, notFound } from '~/domain/types';
import { createTestConversation, createTestMessage, TEST_CONVERSATION_ID } from '~/test/fixtures';
import { createMockEnv } from '~/test/mock-env';

describe('getConversationUseCase', () => {
  it('should return conversation with messages successfully', async () => {
    const conversation = createTestConversation();
    const messages = [createTestMessage({ content: 'Hello' }), createTestMessage({ content: 'Hi there' })];

    const env = createMockEnv({
      getConversation: jest.fn().mockReturnValue(right(conversation)),
      getMessagesByConversation: jest.fn().mockReturnValue(right(messages)),
    });

    const result = await getConversationUseCase(TEST_CONVERSATION_ID)(env)();

    expect(isRight(result)).toBe(true);
    if (isRight(result)) {
      expect(result.right.id).toBe(TEST_CONVERSATION_ID);
      expect(result.right.messages).toHaveLength(2);
      expect(result.right.messages[0].content).toBe('Hello');
      expect(result.right.messages[1].content).toBe('Hi there');
    }
  });

  it('should return conversation with empty messages array', async () => {
    const conversation = createTestConversation();

    const env = createMockEnv({
      getConversation: jest.fn().mockReturnValue(right(conversation)),
      getMessagesByConversation: jest.fn().mockReturnValue(right([])),
    });

    const result = await getConversationUseCase(TEST_CONVERSATION_ID)(env)();

    expect(isRight(result)).toBe(true);
    if (isRight(result)) {
      expect(result.right.messages).toEqual([]);
    }
  });

  it('should return error when conversation not found', async () => {
    const env = createMockEnv({
      getConversation: jest.fn().mockReturnValue(left(notFound('Conversation', TEST_CONVERSATION_ID))),
      getMessagesByConversation: jest.fn().mockReturnValue(right([])),
    });

    const result = await getConversationUseCase(TEST_CONVERSATION_ID)(env)();

    expect(isLeft(result)).toBe(true);
    if (isLeft(result)) {
      expect(result.left._tag).toBe('NotFound');
    }
  });

  it('should return error when getting messages fails', async () => {
    const conversation = createTestConversation();

    const env = createMockEnv({
      getConversation: jest.fn().mockReturnValue(right(conversation)),
      getMessagesByConversation: jest.fn().mockReturnValue(left(dbError(new Error('DB error')))),
    });

    const result = await getConversationUseCase(TEST_CONVERSATION_ID)(env)();

    expect(isLeft(result)).toBe(true);
    if (isLeft(result)) {
      expect(result.left._tag).toBe('DbError');
    }
  });

  it('should call both dependencies with correct conversation id', async () => {
    const conversation = createTestConversation();

    const env = createMockEnv({
      getConversation: jest.fn().mockReturnValue(right(conversation)),
      getMessagesByConversation: jest.fn().mockReturnValue(right([])),
    });

    await getConversationUseCase(TEST_CONVERSATION_ID)(env)();

    expect(env.getConversation).toHaveBeenCalledWith(TEST_CONVERSATION_ID);
    expect(env.getMessagesByConversation).toHaveBeenCalledWith(TEST_CONVERSATION_ID);
  });
});
