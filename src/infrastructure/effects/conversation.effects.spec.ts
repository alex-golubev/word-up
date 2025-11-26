import * as E from 'fp-ts/Either';
import { makeConversationId, makeScenarioId, makeUserId } from '~/domain/types';
import type { DBClient } from '~/infrastructure/db/client';
import { conversationEffects } from '~/infrastructure/effects/conversation.effects';

const TEST_USER_ID = makeUserId('11111111-1111-1111-1111-111111111111');
const TEST_SCENARIO_ID = makeScenarioId('test-scenario');
const TEST_CONVERSATION_ID = makeConversationId('22222222-2222-2222-2222-222222222222');

const createTestParams = () => ({
  id: TEST_CONVERSATION_ID,
  userId: TEST_USER_ID,
  scenarioId: TEST_SCENARIO_ID,
  targetLanguage: 'en' as const,
  userLevel: 'beginner' as const,
});

const createTestRow = () => ({
  id: TEST_CONVERSATION_ID as string,
  userId: TEST_USER_ID as string,
  scenarioId: TEST_SCENARIO_ID as string,
  targetLanguage: 'en' as const,
  userLevel: 'beginner' as const,
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
});

const createMockDB = () => {
  const mockReturning = jest.fn();
  const mockValues = jest.fn(() => ({ returning: mockReturning }));
  const mockInsert = jest.fn(() => ({ values: mockValues }));

  const mockWhere = jest.fn();
  const mockFrom = jest.fn(() => ({ where: mockWhere }));
  const mockSelect = jest.fn(() => ({ from: mockFrom }));

  return {
    insert: mockInsert,
    select: mockSelect,
    _mocks: { mockReturning, mockValues, mockInsert, mockWhere, mockFrom, mockSelect },
  } as unknown as DBClient & { _mocks: Record<string, jest.Mock> };
};

describe('conversationEffects', () => {
  describe('createConversation', () => {
    it('should create conversation and return it', async () => {
      const db = createMockDB();
      const params = createTestParams();
      const row = createTestRow();

      db._mocks.mockReturning.mockResolvedValue([row]);

      const effects = conversationEffects(db);
      const result = await effects.createConversation(params)();

      expect(E.isRight(result)).toBe(true);
      if (E.isRight(result)) {
        expect(result.right.id).toBe(TEST_CONVERSATION_ID);
        expect(result.right.userId).toBe(TEST_USER_ID);
        expect(result.right.scenarioId).toBe(TEST_SCENARIO_ID);
        expect(result.right.messages).toEqual([]);
      }
    });

    it('should return error when insert returns no rows', async () => {
      const db = createMockDB();
      const params = createTestParams();

      db._mocks.mockReturning.mockResolvedValue([]);

      const effects = conversationEffects(db);
      const result = await effects.createConversation(params)();

      expect(E.isLeft(result)).toBe(true);
      if (E.isLeft(result)) {
        expect(result.left.message).toBe('Failed to create conversation');
      }
    });

    it('should return error when database throws', async () => {
      const db = createMockDB();
      const params = createTestParams();

      db._mocks.mockReturning.mockRejectedValue(new Error('DB error'));

      const effects = conversationEffects(db);
      const result = await effects.createConversation(params)();

      expect(E.isLeft(result)).toBe(true);
      if (E.isLeft(result)) {
        expect(result.left.message).toBe('Failed to create conversation');
      }
    });
  });

  describe('getConversation', () => {
    it('should return conversation by id', async () => {
      const db = createMockDB();
      const row = createTestRow();

      db._mocks.mockWhere.mockResolvedValue([row]);

      const effects = conversationEffects(db);
      const result = await effects.getConversation(TEST_CONVERSATION_ID)();

      expect(E.isRight(result)).toBe(true);
      if (E.isRight(result)) {
        expect(result.right.id).toBe(TEST_CONVERSATION_ID);
        expect(result.right.targetLanguage).toBe('en');
        expect(result.right.userLevel).toBe('beginner');
      }
    });

    it('should return error when conversation not found', async () => {
      const db = createMockDB();

      db._mocks.mockWhere.mockResolvedValue([]);

      const effects = conversationEffects(db);
      const result = await effects.getConversation(TEST_CONVERSATION_ID)();

      expect(E.isLeft(result)).toBe(true);
      if (E.isLeft(result)) {
        expect(result.left.message).toBe('Failed to get conversation');
      }
    });

    it('should return error when database throws', async () => {
      const db = createMockDB();

      db._mocks.mockWhere.mockRejectedValue(new Error('DB error'));

      const effects = conversationEffects(db);
      const result = await effects.getConversation(TEST_CONVERSATION_ID)();

      expect(E.isLeft(result)).toBe(true);
      if (E.isLeft(result)) {
        expect(result.left.message).toBe('Failed to get conversation');
      }
    });
  });
});
