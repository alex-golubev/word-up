import {
  conversationAddMessage,
  conversationCreate,
  conversationLastMessage,
  conversationMessages,
  conversationMessagesCount,
} from '~/domain/functions/conversation';
import { createTestConversation, createTestMessage, TEST_SCENARIO_ID, TEST_USER_ID } from '~/test/fixtures';

describe('conversationCreate', () => {
  const defaultParams = {
    userId: TEST_USER_ID,
    scenarioId: TEST_SCENARIO_ID,
    targetLanguage: 'en' as const,
    userLevel: 'beginner' as const,
  };

  it('should create a conversation with valid parameters', () => {
    const conversation = conversationCreate(defaultParams);

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
    const conversationRu = conversationCreate({ ...defaultParams, targetLanguage: 'ru', userLevel: 'intermediate' });
    const conversationEs = conversationCreate({ ...defaultParams, targetLanguage: 'es', userLevel: 'advanced' });

    expect(conversationRu.targetLanguage).toBe('ru');
    expect(conversationEs.targetLanguage).toBe('es');
  });

  it('should generate unique ids for each conversation', () => {
    const conversation1 = conversationCreate(defaultParams);
    const conversation2 = conversationCreate(defaultParams);

    expect(conversation1.id).not.toBe(conversation2.id);
  });
});

describe('conversationAddMessage', () => {
  it('should add message to conversation', () => {
    const conversation = createTestConversation();
    const message = createTestMessage({ content: 'Hello' });

    const result = conversationAddMessage(message)(conversation);

    expect(result.messages).toHaveLength(1);
    expect(result.messages[0].content).toBe('Hello');
  });

  it('should not mutate original conversation', () => {
    const conversation = createTestConversation();
    const message = createTestMessage({ content: 'Hello' });

    conversationAddMessage(message)(conversation);

    expect(conversation.messages).toHaveLength(0);
  });

  it('should append multiple messages in order', () => {
    const conversation = createTestConversation();
    const message1 = createTestMessage({ content: 'First' });
    const message2 = createTestMessage({ content: 'Second' });

    const result = conversationAddMessage(message2)(conversationAddMessage(message1)(conversation));

    expect(result.messages).toHaveLength(2);
    expect(result.messages[0].content).toBe('First');
    expect(result.messages[1].content).toBe('Second');
  });
});

describe('conversationMessages', () => {
  it('should return messages from conversation', () => {
    const messages = [createTestMessage({ content: 'Hello' }), createTestMessage({ content: 'World' })];
    const conversation = createTestConversation({ messages });

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
      createTestMessage({ content: 'One' }),
      createTestMessage({ content: 'Two' }),
      createTestMessage({ content: 'Three' }),
    ];
    const conversation = createTestConversation({ messages });

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
      createTestMessage({ content: 'First' }),
      createTestMessage({ content: 'Second' }),
      createTestMessage({ content: 'Last' }),
    ];
    const conversation = createTestConversation({ messages });

    const result = conversationLastMessage(conversation);

    expect(result?.content).toBe('Last');
  });

  it('should return undefined for empty conversation', () => {
    const conversation = createTestConversation();

    const result = conversationLastMessage(conversation);

    expect(result).toBeUndefined();
  });

  it('should return single message if only one exists', () => {
    const messages = [createTestMessage({ content: 'Only' })];
    const conversation = createTestConversation({ messages });

    const result = conversationLastMessage(conversation);

    expect(result?.content).toBe('Only');
  });
});
