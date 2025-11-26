import * as E from 'fp-ts/Either';
import * as TE from 'fp-ts/TaskEither';
import { getConversationUseCase } from '~/application/use-cases/get-conversation';
import { TEST_CONVERSATION_ID, createTestConversation, createTestMessage } from '~/test/fixtures';

describe('getConversationUseCase', () => {
  const createMockDeps = () => ({
    getConversation: jest.fn(),
    getMessagesByConversation: jest.fn(),
  });

  it('should return conversation with messages successfully', async () => {
    const deps = createMockDeps();
    const conversation = createTestConversation();
    const messages = [createTestMessage({ content: 'Hello' }), createTestMessage({ content: 'Hi there' })];

    deps.getConversation.mockReturnValue(TE.right(conversation));
    deps.getMessagesByConversation.mockReturnValue(TE.right(messages));

    const result = await getConversationUseCase(TEST_CONVERSATION_ID, deps)();

    expect(E.isRight(result)).toBe(true);
    if (E.isRight(result)) {
      expect(result.right.id).toBe(TEST_CONVERSATION_ID);
      expect(result.right.messages).toHaveLength(2);
      expect(result.right.messages[0].content).toBe('Hello');
      expect(result.right.messages[1].content).toBe('Hi there');
    }
  });

  it('should return conversation with empty messages array', async () => {
    const deps = createMockDeps();
    const conversation = createTestConversation();

    deps.getConversation.mockReturnValue(TE.right(conversation));
    deps.getMessagesByConversation.mockReturnValue(TE.right([]));

    const result = await getConversationUseCase(TEST_CONVERSATION_ID, deps)();

    expect(E.isRight(result)).toBe(true);
    if (E.isRight(result)) {
      expect(result.right.messages).toEqual([]);
    }
  });

  it('should return error when conversation not found', async () => {
    const deps = createMockDeps();

    deps.getConversation.mockReturnValue(TE.left(new Error('Conversation not found')));
    deps.getMessagesByConversation.mockReturnValue(TE.right([]));

    const result = await getConversationUseCase(TEST_CONVERSATION_ID, deps)();

    expect(E.isLeft(result)).toBe(true);
    if (E.isLeft(result)) {
      expect(result.left.message).toBe('Conversation not found');
    }
  });

  it('should return error when getting messages fails', async () => {
    const deps = createMockDeps();
    const conversation = createTestConversation();

    deps.getConversation.mockReturnValue(TE.right(conversation));
    deps.getMessagesByConversation.mockReturnValue(TE.left(new Error('Failed to get messages')));

    const result = await getConversationUseCase(TEST_CONVERSATION_ID, deps)();

    expect(E.isLeft(result)).toBe(true);
    if (E.isLeft(result)) {
      expect(result.left.message).toBe('Failed to get messages');
    }
  });

  it('should call both dependencies with correct conversation id', async () => {
    const deps = createMockDeps();
    const conversation = createTestConversation();

    deps.getConversation.mockReturnValue(TE.right(conversation));
    deps.getMessagesByConversation.mockReturnValue(TE.right([]));

    await getConversationUseCase(TEST_CONVERSATION_ID, deps)();

    expect(deps.getConversation).toHaveBeenCalledWith(TEST_CONVERSATION_ID);
    expect(deps.getMessagesByConversation).toHaveBeenCalledWith(TEST_CONVERSATION_ID);
  });
});
