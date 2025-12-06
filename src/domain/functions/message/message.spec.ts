import {
  messageAppend,
  messageCreate,
  messageFilterByRole,
  messageFormatForAI,
  messageTakeLast,
} from '~/domain/functions/message';
import type { Message } from '~/domain/types';
import { TEST_CONVERSATION_ID, createTestMessage } from '~/test/fixtures';

describe('messageCreate', () => {
  const defaultParams = {
    conversationId: TEST_CONVERSATION_ID,
    role: 'user' as const,
    content: 'Hello, world!',
  };

  it('should create a message with valid content', () => {
    const message = messageCreate(defaultParams);

    expect(message.conversationId).toBe(TEST_CONVERSATION_ID);
    expect(message.role).toBe('user');
    expect(message.content).toBe('Hello, world!');
    expect(message.id).toBeDefined();
    expect(message.createdAt).toBeInstanceOf(Date);
  });

  it('should throw error for empty content', () => {
    expect(() => messageCreate({ ...defaultParams, content: '' })).toThrow('Message content cannot be empty');
  });

  it('should throw error for whitespace-only content', () => {
    expect(() => messageCreate({ ...defaultParams, content: '   ' })).toThrow('Message content cannot be empty');
  });

  it('should throw error for content exceeding max length', () => {
    const longContent = 'a'.repeat(10001);

    expect(() => messageCreate({ ...defaultParams, role: 'assistant', content: longContent })).toThrow(
      'Message content exceeds maximum length of 10000 characters'
    );
  });

  it('should accept content at max length', () => {
    const maxContent = 'a'.repeat(10000);
    const message = messageCreate({ ...defaultParams, content: maxContent });

    expect(message.content).toBe(maxContent);
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
