import type { Conversation, Message } from '~/domain/types';
import { makeConversationId, makeMessageId, makeScenarioId, makeUserId } from '~/domain/types';
import {
  conversationAddMessage,
  conversationCreate,
  conversationLastMessage,
  conversationMessages,
  conversationMessagesCount,
} from '~/domain/functions/conversation';

const TEST_USER_ID = makeUserId('11111111-1111-1111-1111-111111111111');
const TEST_SCENARIO_ID = makeScenarioId('test-scenario');
const TEST_CONVERSATION_ID = makeConversationId('22222222-2222-2222-2222-222222222222');

const createTestMessage = (content: string, index: number): Message => ({
  id: makeMessageId(`33333333-3333-3333-3333-33333333333${index}`),
  conversationId: TEST_CONVERSATION_ID,
  role: 'user',
  content,
  createdAt: new Date('2024-01-01'),
});

const createTestConversation = (messages: readonly Message[] = []): Conversation => ({
  id: TEST_CONVERSATION_ID,
  userId: TEST_USER_ID,
  scenarioId: TEST_SCENARIO_ID,
  targetLanguage: 'en',
  userLevel: 'beginner',
  messages,
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
});

describe('conversationCreate', () => {
  it('should create a conversation with valid parameters', () => {
    const conversation = conversationCreate(TEST_USER_ID, TEST_SCENARIO_ID, 'en', 'beginner');

    expect(conversation.userId).toBe(TEST_USER_ID);
    expect(conversation.scenarioId).toBe(TEST_SCENARIO_ID);
    expect(conversation.targetLanguage).toBe('en');
    expect(conversation.userLevel).toBe('beginner');
    expect(conversation.id).toBeDefined();
    expect(conversation.messages).toEqual([]);
    expect(conversation.createdAt).toBeInstanceOf(Date);
    expect(conversation.updatedAt).toBeInstanceOf(Date);
  });

  it('should create conversation with different languages', () => {
    const conversationRu = conversationCreate(TEST_USER_ID, TEST_SCENARIO_ID, 'ru', 'intermediate');
    const conversationEs = conversationCreate(TEST_USER_ID, TEST_SCENARIO_ID, 'es', 'advanced');

    expect(conversationRu.targetLanguage).toBe('ru');
    expect(conversationEs.targetLanguage).toBe('es');
  });

  it('should generate unique ids for each conversation', () => {
    const conversation1 = conversationCreate(TEST_USER_ID, TEST_SCENARIO_ID, 'en', 'beginner');
    const conversation2 = conversationCreate(TEST_USER_ID, TEST_SCENARIO_ID, 'en', 'beginner');

    expect(conversation1.id).not.toBe(conversation2.id);
  });
});

describe('conversationAddMessage', () => {
  it('should add message to conversation', () => {
    const conversation = createTestConversation();
    const message = createTestMessage('Hello', 1);

    const result = conversationAddMessage(message)(conversation);

    expect(result.messages).toHaveLength(1);
    expect(result.messages[0].content).toBe('Hello');
  });

  it('should not mutate original conversation', () => {
    const conversation = createTestConversation();
    const message = createTestMessage('Hello', 1);

    conversationAddMessage(message)(conversation);

    expect(conversation.messages).toHaveLength(0);
  });

  it('should append multiple messages in order', () => {
    const conversation = createTestConversation();
    const message1 = createTestMessage('First', 1);
    const message2 = createTestMessage('Second', 2);

    const result = conversationAddMessage(message2)(conversationAddMessage(message1)(conversation));

    expect(result.messages).toHaveLength(2);
    expect(result.messages[0].content).toBe('First');
    expect(result.messages[1].content).toBe('Second');
  });
});

describe('conversationMessages', () => {
  it('should return messages from conversation', () => {
    const messages = [createTestMessage('Hello', 1), createTestMessage('World', 2)];
    const conversation = createTestConversation(messages);

    const result = conversationMessages(conversation);

    expect(result).toEqual(messages);
  });

  it('should return empty array for conversation without messages', () => {
    const conversation = createTestConversation();

    const result = conversationMessages(conversation);

    expect(result).toEqual([]);
  });
});

describe('conversationMessagesCount', () => {
  it('should return correct count of messages', () => {
    const messages = [
      createTestMessage('One', 1),
      createTestMessage('Two', 2),
      createTestMessage('Three', 3),
    ];
    const conversation = createTestConversation(messages);

    const result = conversationMessagesCount(conversation);

    expect(result).toBe(3);
  });

  it('should return 0 for empty conversation', () => {
    const conversation = createTestConversation();

    const result = conversationMessagesCount(conversation);

    expect(result).toBe(0);
  });
});

describe('conversationLastMessage', () => {
  it('should return last message', () => {
    const messages = [
      createTestMessage('First', 1),
      createTestMessage('Second', 2),
      createTestMessage('Last', 3),
    ];
    const conversation = createTestConversation(messages);

    const result = conversationLastMessage(conversation);

    expect(result?.content).toBe('Last');
  });

  it('should return undefined for empty conversation', () => {
    const conversation = createTestConversation();

    const result = conversationLastMessage(conversation);

    expect(result).toBeUndefined();
  });

  it('should return single message if only one exists', () => {
    const messages = [createTestMessage('Only', 1)];
    const conversation = createTestConversation(messages);

    const result = conversationLastMessage(conversation);

    expect(result?.content).toBe('Only');
  });
});
