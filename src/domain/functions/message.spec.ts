import type { ConversationId, Message, MessageId } from '~/domain/types';
import { makeConversationId, makeMessageId } from '~/domain/types';
import {
  messageAppend,
  messageCreate,
  messageFilterByRole,
  messageFormatForAI,
  messageTakeLast,
} from '~/domain/functions/message';

const TEST_CONVERSATION_ID = makeConversationId('11111111-1111-1111-1111-111111111111');

const createTestMessage = (
  overrides: Partial<Message> & { id: MessageId; conversationId: ConversationId }
): Message => ({
  role: 'user',
  content: 'test content',
  createdAt: new Date('2024-01-01'),
  ...overrides,
});

describe('messageCreate', () => {
  it('should create a message with valid content', () => {
    const message = messageCreate(TEST_CONVERSATION_ID, 'user', 'Hello, world!');

    expect(message.conversationId).toBe(TEST_CONVERSATION_ID);
    expect(message.role).toBe('user');
    expect(message.content).toBe('Hello, world!');
    expect(message.id).toBeDefined();
    expect(message.createdAt).toBeInstanceOf(Date);
  });

  it('should throw error for empty content', () => {
    expect(() => messageCreate(TEST_CONVERSATION_ID, 'user', '')).toThrow(
      'Message content cannot be empty'
    );
  });

  it('should throw error for whitespace-only content', () => {
    expect(() => messageCreate(TEST_CONVERSATION_ID, 'user', '   ')).toThrow(
      'Message content cannot be empty'
    );
  });

  it('should throw error for content exceeding max length', () => {
    const longContent = 'a'.repeat(10001);

    expect(() => messageCreate(TEST_CONVERSATION_ID, 'assistant', longContent)).toThrow(
      'Message content exceeds maximum length of 10000 characters'
    );
  });

  it('should accept content at max length', () => {
    const maxContent = 'a'.repeat(10000);
    const message = messageCreate(TEST_CONVERSATION_ID, 'user', maxContent);

    expect(message.content).toBe(maxContent);
  });
});

describe('messageTakeLast', () => {
  const messages: Message[] = [
    createTestMessage({
      id: makeMessageId('11111111-0000-0000-0000-000000000001'),
      conversationId: TEST_CONVERSATION_ID,
      content: 'First',
    }),
    createTestMessage({
      id: makeMessageId('11111111-0000-0000-0000-000000000002'),
      conversationId: TEST_CONVERSATION_ID,
      content: 'Second',
    }),
    createTestMessage({
      id: makeMessageId('11111111-0000-0000-0000-000000000003'),
      conversationId: TEST_CONVERSATION_ID,
      content: 'Third',
    }),
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
      createTestMessage({
        id: makeMessageId('11111111-0000-0000-0000-000000000001'),
        conversationId: TEST_CONVERSATION_ID,
        role: 'user',
        content: 'Hello',
      }),
      createTestMessage({
        id: makeMessageId('11111111-0000-0000-0000-000000000002'),
        conversationId: TEST_CONVERSATION_ID,
        role: 'assistant',
        content: 'Hi there!',
      }),
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
    createTestMessage({
      id: makeMessageId('11111111-0000-0000-0000-000000000001'),
      conversationId: TEST_CONVERSATION_ID,
      role: 'user',
      content: 'User message 1',
    }),
    createTestMessage({
      id: makeMessageId('11111111-0000-0000-0000-000000000002'),
      conversationId: TEST_CONVERSATION_ID,
      role: 'assistant',
      content: 'Assistant message',
    }),
    createTestMessage({
      id: makeMessageId('11111111-0000-0000-0000-000000000003'),
      conversationId: TEST_CONVERSATION_ID,
      role: 'user',
      content: 'User message 2',
    }),
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
    const existingMessages: Message[] = [
      createTestMessage({
        id: makeMessageId('11111111-0000-0000-0000-000000000001'),
        conversationId: TEST_CONVERSATION_ID,
        content: 'First',
      }),
    ];
    const newMessage = createTestMessage({
      id: makeMessageId('11111111-0000-0000-0000-000000000002'),
      conversationId: TEST_CONVERSATION_ID,
      content: 'Second',
    });

    const result = messageAppend(newMessage)(existingMessages);

    expect(result).toHaveLength(2);
    expect(result[1].content).toBe('Second');
  });

  it('should not mutate original array', () => {
    const existingMessages: Message[] = [
      createTestMessage({
        id: makeMessageId('11111111-0000-0000-0000-000000000001'),
        conversationId: TEST_CONVERSATION_ID,
        content: 'First',
      }),
    ];
    const newMessage = createTestMessage({
      id: makeMessageId('11111111-0000-0000-0000-000000000002'),
      conversationId: TEST_CONVERSATION_ID,
      content: 'Second',
    });

    messageAppend(newMessage)(existingMessages);

    expect(existingMessages).toHaveLength(1);
  });

  it('should work with empty array', () => {
    const newMessage = createTestMessage({
      id: makeMessageId('11111111-0000-0000-0000-000000000001'),
      conversationId: TEST_CONVERSATION_ID,
      content: 'First',
    });

    const result = messageAppend(newMessage)([]);

    expect(result).toHaveLength(1);
    expect(result[0].content).toBe('First');
  });
});
