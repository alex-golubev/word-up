import * as E from 'fp-ts/Either';
import * as TE from 'fp-ts/TaskEither';
import { createConversationUseCase } from '~/application/use-cases/create-conversation';
import { TEST_SCENARIO_ID, TEST_USER_ID, createTestConversation } from '~/test/fixtures';
import type { Conversation } from '~/domain/types';

describe('createConversationUseCase', () => {
  const createMockDeps = () => ({
    saveConversation: jest.fn<ReturnType<typeof TE.right<Error, Conversation>>, [Conversation]>(),
  });

  const defaultParams = {
    userId: TEST_USER_ID,
    scenarioId: TEST_SCENARIO_ID,
    targetLanguage: 'en' as const,
    userLevel: 'beginner' as const,
  };

  it('should create conversation with domain function and save it', async () => {
    const deps = createMockDeps();
    const savedConversation = createTestConversation();

    deps.saveConversation.mockReturnValue(TE.right(savedConversation));

    const result = await createConversationUseCase(defaultParams, deps)();

    expect(E.isRight(result)).toBe(true);
    expect(deps.saveConversation).toHaveBeenCalledTimes(1);

    const calledWith = deps.saveConversation.mock.calls[0][0];
    expect(calledWith.userId).toBe(TEST_USER_ID);
    expect(calledWith.scenarioId).toBe(TEST_SCENARIO_ID);
    expect(calledWith.targetLanguage).toBe('en');
    expect(calledWith.userLevel).toBe('beginner');
    expect(calledWith.id).toBeDefined();
  });

  it('should generate unique conversation id via domain function', async () => {
    const deps = createMockDeps();
    deps.saveConversation.mockReturnValue(TE.right(createTestConversation()));

    await createConversationUseCase(defaultParams, deps)();
    const firstCallId = deps.saveConversation.mock.calls[0][0].id;

    await createConversationUseCase(defaultParams, deps)();
    const secondCallId = deps.saveConversation.mock.calls[1][0].id;

    expect(firstCallId).not.toBe(secondCallId);
  });

  it('should return error when saveConversation fails', async () => {
    const deps = createMockDeps();

    deps.saveConversation.mockReturnValue(TE.left(new Error('Failed to save conversation')));

    const result = await createConversationUseCase(defaultParams, deps)();

    expect(E.isLeft(result)).toBe(true);
    if (E.isLeft(result)) {
      expect(result.left.message).toBe('Failed to save conversation');
    }
  });

  it('should create conversation with different language and level', async () => {
    const deps = createMockDeps();
    deps.saveConversation.mockReturnValue(TE.right(createTestConversation()));

    const params = {
      userId: TEST_USER_ID,
      scenarioId: TEST_SCENARIO_ID,
      targetLanguage: 'es' as const,
      userLevel: 'intermediate' as const,
    };

    await createConversationUseCase(params, deps)();

    const calledWith = deps.saveConversation.mock.calls[0][0];
    expect(calledWith.targetLanguage).toBe('es');
    expect(calledWith.userLevel).toBe('intermediate');
  });
});
