import { isLeft, isRight } from 'fp-ts/Either';

import {
  messageAppend,
  messageCreate,
  messageFilterByRole,
  messageFormatForAI,
  messageTakeLast,
  unsafeMessageCreate,
} from '~/domain/functions/message';
import { createTestMessage, TEST_CONVERSATION_ID } from '~/test/fixtures';

import type { Message } from '~/domain/types';

describe('messageCreate', () => {
  const defaultParams = {
    conversationId: TEST_CONVERSATION_ID,
    role: 'user' as const,
    content: 'Hello, world!',
  };

  it('should return Right with message for valid content', () => {
    const result = messageCreate(defaultParams);

    expect(isRight(result)).toBe(true);
    if (isRight(result)) {
      expect(result.right.conversationId).toBe(TEST_CONVERSATION_ID);
      expect(result.right.role).toBe('user');
      expect(result.right.content).toBe('Hello, world!');
      expect(result.right.id).toBeDefined();
      expect(result.right.createdAt).toBeInstanceOf(Date);
    }
  });

  it('should return Left for empty content', () => {
    const result = messageCreate({ ...defaultParams, content: '' });

    expect(isLeft(result)).toBe(true);
    if (isLeft(result)) {
      expect(result.left._tag).toBe('ValidationError');
    }
  });

  it('should return Left for whitespace-only content', () => {
    const result = messageCreate({ ...defaultParams, content: '   ' });

    expect(isLeft(result)).toBe(true);
    if (isLeft(result)) {
      expect(result.left._tag).toBe('ValidationError');
    }
  });

  it('should return Left for content exceeding max length', () => {
    const longContent = 'a'.repeat(10001);
    const result = messageCreate({ ...defaultParams, role: 'assistant', content: longContent });

    expect(isLeft(result)).toBe(true);
    if (isLeft(result)) {
      expect(result.left._tag).toBe('ValidationError');
    }
  });

  it('should return Right for content at max length', () => {
    const maxContent = 'a'.repeat(10000);
    const result = messageCreate({ ...defaultParams, content: maxContent });

    expect(isRight(result)).toBe(true);
    if (isRight(result)) {
      expect(result.right.content).toBe(maxContent);
    }
  });
});

describe('unsafeMessageCreate', () => {
  const defaultParams = {
    conversationId: TEST_CONVERSATION_ID,
    role: 'user' as const,
    content: 'Hello, world!',
  };

  it('should return message directly for valid content', () => {
    const message = unsafeMessageCreate(defaultParams);

    expect(message.conversationId).toBe(TEST_CONVERSATION_ID);
    expect(message.role).toBe('user');
    expect(message.content).toBe('Hello, world!');
  });

  it('should throw for invalid content', () => {
    expect(() => unsafeMessageCreate({ ...defaultParams, content: '' })).toThrow();
  });
});

describe('messageTakeLast', () => {
  const messages: Message[] = [
    createTestMessage({ content: 'First' }),
    createTestMessage({ content: 'Second' }),
    createTestMessage({ content: 'Third' }),
  ];

  it('should take last n messages', () => {
    const result = messageTakeLast(2)(messages);

    expect(result).toHaveLength(2);
    expect(result[0].content).toBe('Second');
    expect(result[1].content).toBe('Third');
  });

  it('should return all messages if n is greater than array length', () => {
    const result = messageTakeLast(10)(messages);

    expect(result).toHaveLength(3);
  });

  it('should return empty array if n is 0', () => {
    const result = messageTakeLast(0)(messages);

    expect(result).toHaveLength(0);
  });

  it('should return empty array for empty input', () => {
    const result = messageTakeLast(5)([]);

    expect(result).toHaveLength(0);
  });
});

describe('messageFormatForAI', () => {
  it('should format messages as role: content', () => {
    const messages: Message[] = [
      createTestMessage({ role: 'user', content: 'Hello' }),
      createTestMessage({ role: 'assistant', content: 'Hi there!' }),
    ];

    const result = messageFormatForAI(messages);

    expect(result).toBe('user: Hello\nassistant: Hi there!');
  });

  it('should return empty string for empty array', () => {
    const result = messageFormatForAI([]);

    expect(result).toBe('');
  });
});

describe('messageFilterByRole', () => {
  const messages: Message[] = [
    createTestMessage({ role: 'user', content: 'User message 1' }),
    createTestMessage({ role: 'assistant', content: 'Assistant message' }),
    createTestMessage({ role: 'user', content: 'User message 2' }),
  ];

  it('should filter messages by user role', () => {
    const result = messageFilterByRole('user')(messages);

    expect(result).toHaveLength(2);
    expect(result.every((m) => m.role === 'user')).toBe(true);
  });

  it('should filter messages by assistant role', () => {
    const result = messageFilterByRole('assistant')(messages);

    expect(result).toHaveLength(1);
    expect(result[0].content).toBe('Assistant message');
  });

  it('should return empty array if no messages match', () => {
    const userOnlyMessages = messages.filter((m) => m.role === 'user');
    const result = messageFilterByRole('assistant')(userOnlyMessages);

    expect(result).toHaveLength(0);
  });
});

describe('messageAppend', () => {
  it('should append message to array', () => {
    const existingMessages: Message[] = [createTestMessage({ content: 'First' })];
    const newMessage = createTestMessage({ content: 'Second' });

    const result = messageAppend(newMessage)(existingMessages);

    expect(result).toHaveLength(2);
    expect(result[1].content).toBe('Second');
  });

  it('should not mutate original array', () => {
    const existingMessages: Message[] = [createTestMessage({ content: 'First' })];
    const newMessage = createTestMessage({ content: 'Second' });

    messageAppend(newMessage)(existingMessages);

    expect(existingMessages).toHaveLength(1);
  });

  it('should work with empty array', () => {
    const newMessage = createTestMessage({ content: 'First' });

    const result = messageAppend(newMessage)([]);

    expect(result).toHaveLength(1);
    expect(result[0].content).toBe('First');
  });
});
