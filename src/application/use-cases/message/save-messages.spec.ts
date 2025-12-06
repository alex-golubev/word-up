import { isLeft, isRight } from 'fp-ts/Either';
import { left, right } from 'fp-ts/TaskEither';

import { saveMessagesUseCase } from '~/application/use-cases/message/save-messages';
import { dbError } from '~/domain/errors';
import { TEST_CONVERSATION_ID, TEST_DATE } from '~/test/fixtures';
import { createMockEnv } from '~/test/mock-env';

describe('saveMessagesUseCase', () => {
  it('should save multiple messages successfully', async () => {
    const saveMessage = jest.fn().mockImplementation((msg) => right(msg));
    const env = createMockEnv({ saveMessage });

    const result = await saveMessagesUseCase({
      conversationId: TEST_CONVERSATION_ID,
      messages: [
        { role: 'user', content: 'Hello', createdAt: TEST_DATE },
        { role: 'assistant', content: 'Hi there!', createdAt: TEST_DATE },
      ],
    })(env)();

    expect(isRight(result)).toBe(true);
    if (isRight(result)) {
      expect(result.right).toHaveLength(2);
      expect(result.right[0].role).toBe('user');
      expect(result.right[0].content).toBe('Hello');
      expect(result.right[1].role).toBe('assistant');
      expect(result.right[1].content).toBe('Hi there!');
    }
    expect(saveMessage).toHaveBeenCalledTimes(2);
  });

  it('should assign unique message IDs', async () => {
    const saveMessage = jest.fn().mockImplementation((msg) => right(msg));
    const env = createMockEnv({ saveMessage });

    const result = await saveMessagesUseCase({
      conversationId: TEST_CONVERSATION_ID,
      messages: [
        { role: 'user', content: 'First', createdAt: TEST_DATE },
        { role: 'user', content: 'Second', createdAt: TEST_DATE },
      ],
    })(env)();

    expect(isRight(result)).toBe(true);
    if (isRight(result)) {
      expect(result.right[0].id).not.toBe(result.right[1].id);
    }
  });

  it('should preserve conversation ID and timestamps', async () => {
    const saveMessage = jest.fn().mockImplementation((msg) => right(msg));
    const env = createMockEnv({ saveMessage });

    const customDate = new Date('2024-06-15T10:30:00Z');

    const result = await saveMessagesUseCase({
      conversationId: TEST_CONVERSATION_ID,
      messages: [{ role: 'user', content: 'Test', createdAt: customDate }],
    })(env)();

    expect(isRight(result)).toBe(true);
    if (isRight(result)) {
      expect(result.right[0].conversationId).toBe(TEST_CONVERSATION_ID);
      expect(result.right[0].createdAt).toEqual(customDate);
    }
  });

  it('should return validation error for content exceeding max length', async () => {
    const env = createMockEnv();
    const oversizedContent = 'x'.repeat(10001);

    const result = await saveMessagesUseCase({
      conversationId: TEST_CONVERSATION_ID,
      messages: [{ role: 'user', content: oversizedContent, createdAt: TEST_DATE }],
    })(env)();

    expect(isLeft(result)).toBe(true);
    if (isLeft(result)) {
      expect(result.left._tag).toBe('ValidationError');
    }
  });

  it('should return validation error for empty content', async () => {
    const env = createMockEnv();

    const result = await saveMessagesUseCase({
      conversationId: TEST_CONVERSATION_ID,
      messages: [{ role: 'user', content: '', createdAt: TEST_DATE }],
    })(env)();

    expect(isLeft(result)).toBe(true);
    if (isLeft(result)) {
      expect(result.left._tag).toBe('ValidationError');
    }
  });

  it('should fail fast on first invalid message', async () => {
    const saveMessage = jest.fn().mockImplementation((msg) => right(msg));
    const env = createMockEnv({ saveMessage });

    const result = await saveMessagesUseCase({
      conversationId: TEST_CONVERSATION_ID,
      messages: [
        { role: 'user', content: 'Valid', createdAt: TEST_DATE },
        { role: 'user', content: '', createdAt: TEST_DATE }, // Invalid
        { role: 'user', content: 'Also valid', createdAt: TEST_DATE },
      ],
    })(env)();

    expect(isLeft(result)).toBe(true);
    expect(saveMessage).not.toHaveBeenCalled();
  });

  it('should return error when save fails', async () => {
    const saveMessage = jest.fn().mockReturnValue(left(dbError(new Error('Connection lost'))));
    const env = createMockEnv({ saveMessage });

    const result = await saveMessagesUseCase({
      conversationId: TEST_CONVERSATION_ID,
      messages: [{ role: 'user', content: 'Hello', createdAt: TEST_DATE }],
    })(env)();

    expect(isLeft(result)).toBe(true);
    if (isLeft(result)) {
      expect(result.left._tag).toBe('DbError');
    }
  });

  it('should handle empty messages array', async () => {
    const saveMessage = jest.fn();
    const env = createMockEnv({ saveMessage });

    const result = await saveMessagesUseCase({
      conversationId: TEST_CONVERSATION_ID,
      messages: [],
    })(env)();

    expect(isRight(result)).toBe(true);
    if (isRight(result)) {
      expect(result.right).toEqual([]);
    }
    expect(saveMessage).not.toHaveBeenCalled();
  });
});
