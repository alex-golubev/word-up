import * as E from 'fp-ts/Either';
import * as TE from 'fp-ts/TaskEither';
import { createConversationUseCase } from '~/application/use-cases/create-conversation';
import { TEST_SCENARIO_ID, TEST_USER_ID, createTestConversation } from '~/test/fixtures';

describe('createConversationUseCase', () => {
  const createMockDeps = () => ({
    createConversation: jest.fn(),
  });

  const defaultParams = {
    userId: TEST_USER_ID,
    scenarioId: TEST_SCENARIO_ID,
    targetLanguage: 'en' as const,
    userLevel: 'beginner' as const,
  };

  it('should create conversation successfully', async () => {
    const deps = createMockDeps();
    const conversation = createTestConversation();

    deps.createConversation.mockReturnValue(TE.right(conversation));

    const result = await createConversationUseCase(defaultParams, deps)();

    expect(E.isRight(result)).toBe(true);
    if (E.isRight(result)) {
      expect(result.right.userId).toBe(TEST_USER_ID);
      expect(result.right.scenarioId).toBe(TEST_SCENARIO_ID);
      expect(result.right.targetLanguage).toBe('en');
      expect(result.right.userLevel).toBe('beginner');
    }
  });

  it('should pass all params to createConversation dependency', async () => {
    const deps = createMockDeps();
    const conversation = createTestConversation();

    deps.createConversation.mockReturnValue(TE.right(conversation));

    const params = {
      userId: TEST_USER_ID,
      scenarioId: TEST_SCENARIO_ID,
      targetLanguage: 'ru' as const,
      userLevel: 'advanced' as const,
    };

    await createConversationUseCase(params, deps)();

    expect(deps.createConversation).toHaveBeenCalledWith(params);
  });

  it('should return error when createConversation fails', async () => {
    const deps = createMockDeps();

    deps.createConversation.mockReturnValue(TE.left(new Error('Failed to create conversation')));

    const result = await createConversationUseCase(defaultParams, deps)();

    expect(E.isLeft(result)).toBe(true);
    if (E.isLeft(result)) {
      expect(result.left.message).toBe('Failed to create conversation');
    }
  });

  it('should create conversation with different language and level', async () => {
    const deps = createMockDeps();
    const conversation = createTestConversation({
      targetLanguage: 'es',
      userLevel: 'intermediate',
    });

    deps.createConversation.mockReturnValue(TE.right(conversation));

    const params = {
      userId: TEST_USER_ID,
      scenarioId: TEST_SCENARIO_ID,
      targetLanguage: 'es' as const,
      userLevel: 'intermediate' as const,
    };

    const result = await createConversationUseCase(params, deps)();

    expect(E.isRight(result)).toBe(true);
    if (E.isRight(result)) {
      expect(result.right.targetLanguage).toBe('es');
      expect(result.right.userLevel).toBe('intermediate');
    }
  });
});
