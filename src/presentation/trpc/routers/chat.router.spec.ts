import { TRPCError } from '@trpc/server';
import { right } from 'fp-ts/TaskEither';

jest.mock('~/utils/transformer', () => ({
  transformer: {
    serialize: (v: unknown) => ({ json: v, meta: undefined }),
    deserialize: (v: { json: unknown }) => v.json,
  },
}));

jest.mock('~/infrastructure/effects/ai/openai.effects', () => ({
  createOpenAIEffects: () => ({
    generateChatCompletion: jest.fn().mockReturnValue(right({ content: 'mocked response' })),
  }),
}));

import { createAppEnv } from '~/infrastructure/env';
import { chatRouter } from '~/presentation/trpc/routers/chat.router';
import { createMockDB, createTestConversationRow, createTestMessageRow, TEST_UUID } from '~/test/fixtures';

const createCaller = (db: ReturnType<typeof createMockDB>) => {
  const env = createAppEnv({ db: db as never, openai: { apiKey: 'test-key' } });
  return chatRouter.createCaller({ env, accessToken: null, refreshToken: null, signal: new AbortController().signal });
};

describe('chatRouter', () => {
  describe('createConversation', () => {
    it('should create conversation successfully', async () => {
      const mockDb = createMockDB();
      const conversationRow = createTestConversationRow();
      mockDb._mocks.mockReturning.mockResolvedValue([conversationRow]);

      const caller = createCaller(mockDb);
      const result = await caller.createConversation({
        userId: TEST_UUID.user,
        scenarioId: TEST_UUID.scenario,
        targetLanguage: 'en',
        userLevel: 'beginner',
      });

      expect(result.id).toBe(TEST_UUID.conversation);
      expect(result.userId).toBe(TEST_UUID.user);
      expect(result.targetLanguage).toBe('en');
      expect(mockDb.insert).toHaveBeenCalled();
    });

    it('should throw BAD_REQUEST for invalid userId', async () => {
      const mockDb = createMockDB();
      const caller = createCaller(mockDb);

      await expect(
        caller.createConversation({
          userId: 'invalid-uuid',
          scenarioId: TEST_UUID.scenario,
          targetLanguage: 'en',
          userLevel: 'beginner',
        })
      ).rejects.toThrow(TRPCError);
    });

    it('should throw INTERNAL_SERVER_ERROR when insert fails', async () => {
      const mockDb = createMockDB();
      mockDb._mocks.mockReturning.mockResolvedValue([]);

      const caller = createCaller(mockDb);

      await expect(
        caller.createConversation({
          userId: TEST_UUID.user,
          scenarioId: TEST_UUID.scenario,
          targetLanguage: 'en',
          userLevel: 'beginner',
        })
      ).rejects.toMatchObject({
        code: 'INTERNAL_SERVER_ERROR',
      });
    });

    it('should throw INTERNAL_SERVER_ERROR on database error', async () => {
      const mockDb = createMockDB();
      mockDb._mocks.mockReturning.mockRejectedValue(new Error('Connection failed'));

      const caller = createCaller(mockDb);

      await expect(
        caller.createConversation({
          userId: TEST_UUID.user,
          scenarioId: TEST_UUID.scenario,
          targetLanguage: 'en',
          userLevel: 'beginner',
        })
      ).rejects.toMatchObject({
        code: 'INTERNAL_SERVER_ERROR',
      });
    });
  });

  describe('getConversation', () => {
    // Helper to create thenable mock that works for both parallel queries
    // noinspection JSUnusedGlobalSymbols
    const createWhereResult = (conversationRows: unknown[], messageRows: unknown[]) => ({
      // For messages query - chained with orderBy
      orderBy: jest.fn().mockResolvedValue(messageRows),
      // For conversation query - awaited directly (thenable)
      then: (resolve: (v: unknown) => void, reject?: (e: unknown) => void) =>
        Promise.resolve(conversationRows).then(resolve, reject),
    });

    it('should get conversation with messages successfully', async () => {
      const mockDb = createMockDB();
      const conversationRow = createTestConversationRow();
      const messageRow = createTestMessageRow();

      mockDb._mocks.mockWhere.mockReturnValue(createWhereResult([conversationRow], [messageRow]));

      const caller = createCaller(mockDb);
      const result = await caller.getConversation({
        conversationId: TEST_UUID.conversation,
      });

      expect(result.id).toBe(TEST_UUID.conversation);
      expect(result.messages).toHaveLength(1);
      expect(result.messages[0].content).toBe('test content');
    });

    it('should throw NOT_FOUND when conversation does not exist', async () => {
      const mockDb = createMockDB();

      mockDb._mocks.mockWhere.mockReturnValue(createWhereResult([], []));

      const caller = createCaller(mockDb);

      await expect(
        caller.getConversation({
          conversationId: TEST_UUID.conversation,
        })
      ).rejects.toMatchObject({
        code: 'NOT_FOUND',
      });
    });

    it('should throw BAD_REQUEST for invalid conversationId', async () => {
      const mockDb = createMockDB();
      const caller = createCaller(mockDb);

      await expect(
        caller.getConversation({
          conversationId: 'not-a-valid-uuid',
        })
      ).rejects.toThrow(TRPCError);
    });
  });
});
