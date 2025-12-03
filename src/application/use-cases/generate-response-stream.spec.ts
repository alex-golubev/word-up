import { left, right } from 'fp-ts/TaskEither';
import { notFound, aiError } from '~/domain/errors';
import {
  createMockEnv,
  createMockStream,
  createThrowingStream,
  createThrowingStreamWithNonError,
} from '~/test/mock-env';
import { TEST_CONVERSATION_ID, createTestMessage, createTestScenario } from '~/test/fixtures';
import type { StreamEvent } from '~/domain/types';

const mockMessageCreate = jest.fn();
jest.mock('~/domain/functions/message', () => ({
  ...jest.requireActual('~/domain/functions/message'),
  messageCreate: (...args: unknown[]) => mockMessageCreate(...args),
}));

// Import after mock
import { generateResponseStreamUseCase } from '~/application/use-cases/generate-response-stream';
import type { messageCreate } from '~/domain/functions/message';

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

  beforeEach(() => {
    // By default, call the real implementation
    mockMessageCreate.mockImplementation((...args: unknown[]) => {
      const actual = jest.requireActual('~/domain/functions/message') as { messageCreate: typeof messageCreate };
      return actual.messageCreate(...(args as Parameters<typeof messageCreate>));
    });
  });

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

  it('should stop early and not save when aborted', async () => {
    const messages: [] = [];
    const chunks = ['First', ' Second', ' Third'];
    const abortController = new AbortController();

    const saveMessage = jest.fn().mockImplementation((msg) => right(msg));
    const env = createMockEnv({
      getMessagesByConversation: jest.fn().mockReturnValue(right(messages)),
      generateChatCompletionStream: jest.fn().mockReturnValue(right(createMockStream(chunks))),
      saveMessage,
    });

    // Abort after first chunk
    const events: StreamEvent[] = [];
    const gen = generateResponseStreamUseCase(params, env, abortController.signal);

    for await (const event of gen) {
      events.push(event);
      if (events.length === 1) {
        abortController.abort();
      }
    }

    // Should have received first delta, then stopped
    expect(events.length).toBeLessThanOrEqual(2);
    expect(events[0]).toEqual({ type: 'delta', content: 'First' });
    // Message should NOT be saved
    expect(saveMessage).not.toHaveBeenCalled();
  });

  it('should return error event when stream throws mid-streaming', async () => {
    const messages: [] = [];
    const chunks = ['First', 'Second', 'Third'];

    const env = createMockEnv({
      getMessagesByConversation: jest.fn().mockReturnValue(right(messages)),
      generateChatCompletionStream: jest.fn().mockReturnValue(right(createThrowingStream(chunks, 1))),
      saveMessage: jest.fn().mockImplementation((msg) => right(msg)),
    });

    const events = await collectEvents(generateResponseStreamUseCase(params, env));

    // Should have first delta + error
    expect(events).toHaveLength(2);
    expect(events[0]).toEqual({ type: 'delta', content: 'First' });
    expect(events[1]).toEqual({ type: 'error', error: 'Stream connection lost' });
  });

  it('should complete normally when throwing stream never throws (errorAfter >= length)', async () => {
    const messages: [] = [];
    const chunks = ['A', 'B'];

    // errorAfter=10 but only 2 chunks, so it completes normally
    const env = createMockEnv({
      getMessagesByConversation: jest.fn().mockReturnValue(right(messages)),
      generateChatCompletionStream: jest.fn().mockReturnValue(right(createThrowingStream(chunks, 10))),
      saveMessage: jest.fn().mockImplementation((msg) => right(msg)),
    });

    const events = await collectEvents(generateResponseStreamUseCase(params, env));

    expect(events).toHaveLength(3);
    expect(events[0]).toEqual({ type: 'delta', content: 'A' });
    expect(events[1]).toEqual({ type: 'delta', content: 'B' });
    expect(events[2].type).toBe('done');
  });

  it('should silently stop when stream throws after abort', async () => {
    const messages: [] = [];
    const chunks = ['First', 'Second'];
    const abortController = new AbortController();
    abortController.abort(); // Pre-abort

    const env = createMockEnv({
      getMessagesByConversation: jest.fn().mockReturnValue(right(messages)),
      generateChatCompletionStream: jest.fn().mockReturnValue(right(createThrowingStream(chunks, 0))),
      saveMessage: jest.fn(),
    });

    const events = await collectEvents(generateResponseStreamUseCase(params, env, abortController.signal));

    // Should return silently without error event
    expect(events).toHaveLength(0);
  });

  it('should return error when messageCreate throws due to content exceeding max length', async () => {
    const messages: [] = [];
    const oversizedContent = 'x'.repeat(10001); // Exceeds 10000 char limit
    const chunks = [oversizedContent];

    const env = createMockEnv({
      getMessagesByConversation: jest.fn().mockReturnValue(right(messages)),
      generateChatCompletionStream: jest.fn().mockReturnValue(right(createMockStream(chunks))),
      saveMessage: jest.fn().mockImplementation((msg) => right(msg)),
    });

    const events = await collectEvents(generateResponseStreamUseCase(params, env));

    // Should have delta + error from messageCreate validation
    expect(events).toHaveLength(2);
    expect(events[0]).toEqual({ type: 'delta', content: oversizedContent });
    expect(events[1].type).toBe('error');
  });

  it('should use fallback error message when stream throws non-Error', async () => {
    const messages: [] = [];
    const chunks = ['First', 'Second'];

    const env = createMockEnv({
      getMessagesByConversation: jest.fn().mockReturnValue(right(messages)),
      generateChatCompletionStream: jest.fn().mockReturnValue(right(createThrowingStreamWithNonError(chunks, 1))),
      saveMessage: jest.fn(),
    });

    const events = await collectEvents(generateResponseStreamUseCase(params, env));

    expect(events).toHaveLength(2);
    expect(events[0]).toEqual({ type: 'delta', content: 'First' });
    expect(events[1]).toEqual({ type: 'error', error: 'Stream interrupted' });
  });

  it('should complete normally with non-error throwing stream when it never throws', async () => {
    const messages: [] = [];
    const chunks = ['X', 'Y'];

    // errorAfter=10 but only 2 chunks
    const env = createMockEnv({
      getMessagesByConversation: jest.fn().mockReturnValue(right(messages)),
      generateChatCompletionStream: jest.fn().mockReturnValue(right(createThrowingStreamWithNonError(chunks, 10))),
      saveMessage: jest.fn().mockImplementation((msg) => right(msg)),
    });

    const events = await collectEvents(generateResponseStreamUseCase(params, env));

    expect(events).toHaveLength(3);
    expect(events[0]).toEqual({ type: 'delta', content: 'X' });
    expect(events[1]).toEqual({ type: 'delta', content: 'Y' });
    expect(events[2].type).toBe('done');
  });

  it('should stop after stream completes but before save when aborted', async () => {
    const messages: [] = [];
    const chunks = ['Content'];
    const abortController = new AbortController();

    const saveMessage = jest.fn().mockImplementation((msg) => right(msg));
    const env = createMockEnv({
      getMessagesByConversation: jest.fn().mockReturnValue(right(messages)),
      generateChatCompletionStream: jest.fn().mockReturnValue(right(createMockStream(chunks))),
      saveMessage,
    });

    const events: StreamEvent[] = [];
    const gen = generateResponseStreamUseCase(params, env, abortController.signal);

    for await (const event of gen) {
      events.push(event);
      // Abort after receiving delta but before save
      if (event.type === 'delta') {
        abortController.abort();
      }
    }

    // Should have delta only, no done event
    expect(events).toHaveLength(1);
    expect(events[0]).toEqual({ type: 'delta', content: 'Content' });
    expect(saveMessage).not.toHaveBeenCalled();
  });

  it('should use fallback error message when messageCreate throws non-Error', async () => {
    const messages: [] = [];
    const chunks = ['Valid content'];

    mockMessageCreate.mockImplementation(() => {
      throw 'Non-error string';
    });

    const env = createMockEnv({
      getMessagesByConversation: jest.fn().mockReturnValue(right(messages)),
      generateChatCompletionStream: jest.fn().mockReturnValue(right(createMockStream(chunks))),
      saveMessage: jest.fn(),
    });

    const events = await collectEvents(generateResponseStreamUseCase(params, env));

    expect(events).toHaveLength(2);
    expect(events[0]).toEqual({ type: 'delta', content: 'Valid content' });
    expect(events[1]).toEqual({ type: 'error', error: 'Failed to create message' });
  });
});
