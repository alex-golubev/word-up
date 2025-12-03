import { left, right } from 'fp-ts/TaskEither';
import { notFound, aiError } from '~/domain/errors';
import { generateResponseStreamUseCase } from '~/application/use-cases/generate-response-stream';
import { createMockEnv, createMockStream } from '~/test/mock-env';
import { TEST_CONVERSATION_ID, createTestMessage, createTestScenario } from '~/test/fixtures';
import type { StreamEvent } from '~/domain/types';

const collectEvents = async (gen: AsyncGenerator<StreamEvent>): Promise<StreamEvent[]> => {
  const events: StreamEvent[] = [];
  for await (const event of gen) {
    events.push(event);
  }
  return events;
};

describe('generateResponseStreamUseCase', () => {
  const scenario = createTestScenario();
  const params = { conversationId: TEST_CONVERSATION_ID, scenario };

  it('should stream deltas and complete with done event', async () => {
    const messages = [createTestMessage({ role: 'user', content: 'Hello!' })];
    const chunks = ['Hi', ' there', '!'];

    const env = createMockEnv({
      getMessagesByConversation: jest.fn().mockReturnValue(right(messages)),
      generateChatCompletionStream: jest.fn().mockReturnValue(right(createMockStream(chunks))),
      saveMessage: jest.fn().mockImplementation((msg) => right(msg)),
    });

    const events = await collectEvents(generateResponseStreamUseCase(params, env));

    expect(events).toHaveLength(4);
    expect(events[0]).toEqual({ type: 'delta', content: 'Hi' });
    expect(events[1]).toEqual({ type: 'delta', content: ' there' });
    expect(events[2]).toEqual({ type: 'delta', content: '!' });
    expect(events[3]).toMatchObject({
      type: 'done',
      fullContent: 'Hi there!',
    });
  });

  it('should return error event when messages fetch fails', async () => {
    const env = createMockEnv({
      getMessagesByConversation: jest.fn().mockReturnValue(left(notFound('Conversation', TEST_CONVERSATION_ID))),
    });

    const events = await collectEvents(generateResponseStreamUseCase(params, env));

    expect(events).toHaveLength(1);
    expect(events[0].type).toBe('error');
  });

  it('should return error event when stream fails to start', async () => {
    const messages = [createTestMessage()];

    const env = createMockEnv({
      getMessagesByConversation: jest.fn().mockReturnValue(right(messages)),
      generateChatCompletionStream: jest.fn().mockReturnValue(left(aiError('Connection failed', new Error()))),
    });

    const events = await collectEvents(generateResponseStreamUseCase(params, env));

    expect(events).toHaveLength(1);
    expect(events[0].type).toBe('error');
  });

  it('should save message after stream completes', async () => {
    const messages: [] = [];
    const chunks = ['Test', ' content'];

    const saveMessage = jest.fn().mockImplementation((msg) => right(msg));
    const env = createMockEnv({
      getMessagesByConversation: jest.fn().mockReturnValue(right(messages)),
      generateChatCompletionStream: jest.fn().mockReturnValue(right(createMockStream(chunks))),
      saveMessage,
    });

    await collectEvents(generateResponseStreamUseCase(params, env));

    expect(saveMessage).toHaveBeenCalledWith(
      expect.objectContaining({
        role: 'assistant',
        content: 'Test content',
        conversationId: TEST_CONVERSATION_ID,
      })
    );
  });

  it('should return error event when save fails', async () => {
    const messages = [createTestMessage()];
    const chunks = ['Hello'];

    const env = createMockEnv({
      getMessagesByConversation: jest.fn().mockReturnValue(right(messages)),
      generateChatCompletionStream: jest.fn().mockReturnValue(right(createMockStream(chunks))),
      saveMessage: jest.fn().mockReturnValue(left(notFound('Message', 'id'))),
    });

    const events = await collectEvents(generateResponseStreamUseCase(params, env));

    // Should have delta event + error event
    expect(events).toHaveLength(2);
    expect(events[0]).toEqual({ type: 'delta', content: 'Hello' });
    expect(events[1].type).toBe('error');
  });

  it('should handle empty stream with error', async () => {
    const messages = [createTestMessage()];

    const env = createMockEnv({
      getMessagesByConversation: jest.fn().mockReturnValue(right(messages)),
      generateChatCompletionStream: jest.fn().mockReturnValue(right(createMockStream([]))),
      saveMessage: jest.fn().mockImplementation((msg) => right(msg)),
    });

    const events = await collectEvents(generateResponseStreamUseCase(params, env));

    expect(events).toHaveLength(1);
    expect(events[0]).toEqual({ type: 'error', error: 'AI returned empty response' });
  });

  it('should include messageId in done event', async () => {
    const messages: [] = [];
    const chunks = ['Response'];

    const env = createMockEnv({
      getMessagesByConversation: jest.fn().mockReturnValue(right(messages)),
      generateChatCompletionStream: jest.fn().mockReturnValue(right(createMockStream(chunks))),
      saveMessage: jest.fn().mockImplementation((msg) => right(msg)),
    });

    const events = await collectEvents(generateResponseStreamUseCase(params, env));

    const doneEvent = events.find((e) => e.type === 'done');
    expect(doneEvent).toBeDefined();
    if (doneEvent?.type === 'done') {
      expect(doneEvent.messageId).toBeDefined();
      expect(typeof doneEvent.messageId).toBe('string');
    }
  });
});
