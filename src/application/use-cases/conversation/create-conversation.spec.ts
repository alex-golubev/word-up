import { isLeft, isRight } from 'fp-ts/Either';
import { left, right } from 'fp-ts/TaskEither';

import { createConversationUseCase } from '~/application/use-cases/conversation/create-conversation';
import { insertFailed } from '~/domain/types';
import { TEST_SCENARIO_ID, TEST_USER_ID, createTestConversation } from '~/test/fixtures';
import { createMockEnv } from '~/test/mock-env';

describe('createConversationUseCase', () => {
  const defaultParams = {
    userId: TEST_USER_ID,
    scenarioId: TEST_SCENARIO_ID,
    targetLanguage: 'en' as const,
    userLevel: 'beginner' as const,
  };

  it('should create conversation with domain function and save it', async () => {
    const savedConversation = createTestConversation();
    const env = createMockEnv({
      saveConversation: jest.fn().mockReturnValue(right(savedConversation)),
    });

    const result = await createConversationUseCase(defaultParams)(env)();

    expect(isRight(result)).toBe(true);
    expect(env.saveConversation).toHaveBeenCalledTimes(1);

    const calledWith = (env.saveConversation as jest.Mock).mock.calls[0][0];
    expect(calledWith.userId).toBe(TEST_USER_ID);
    expect(calledWith.scenarioId).toBe(TEST_SCENARIO_ID);
    expect(calledWith.targetLanguage).toBe('en');
    expect(calledWith.userLevel).toBe('beginner');
    expect(calledWith.id).toBeDefined();
  });

  it('should generate unique conversation id via domain function', async () => {
    const env = createMockEnv({
      saveConversation: jest.fn().mockReturnValue(right(createTestConversation())),
    });

    await createConversationUseCase(defaultParams)(env)();
    const firstCallId = (env.saveConversation as jest.Mock).mock.calls[0][0].id;

    await createConversationUseCase(defaultParams)(env)();
    const secondCallId = (env.saveConversation as jest.Mock).mock.calls[1][0].id;

    expect(firstCallId).not.toBe(secondCallId);
  });

  it('should return error when saveConversation fails', async () => {
    const env = createMockEnv({
      saveConversation: jest.fn().mockReturnValue(left(insertFailed('Conversation'))),
    });

    const result = await createConversationUseCase(defaultParams)(env)();

    expect(isLeft(result)).toBe(true);
    if (isLeft(result)) {
      expect(result.left._tag).toBe('InsertFailed');
    }
  });

  it('should create conversation with different language and level', async () => {
    const env = createMockEnv({
      saveConversation: jest.fn().mockReturnValue(right(createTestConversation())),
    });

    const params = {
      userId: TEST_USER_ID,
      scenarioId: TEST_SCENARIO_ID,
      targetLanguage: 'es' as const,
      userLevel: 'intermediate' as const,
    };

    await createConversationUseCase(params)(env)();

    const calledWith = (env.saveConversation as jest.Mock).mock.calls[0][0];
    expect(calledWith.targetLanguage).toBe('es');
    expect(calledWith.userLevel).toBe('intermediate');
  });
});
