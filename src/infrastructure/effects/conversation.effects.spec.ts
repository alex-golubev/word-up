import * as E from 'fp-ts/Either';
import type { DBClient } from '~/infrastructure/db/client';
import { createConversationEffects } from '~/infrastructure/effects/conversation.effects';
import type { Conversation } from '~/domain/types';
import {
  TEST_USER_ID,
  TEST_SCENARIO_ID,
  TEST_CONVERSATION_ID,
  createTestConversation,
  createTestConversationRow,
  createMockDB,
} from '~/test/fixtures';

describe('createConversationEffects', () => {
  describe('saveConversation', () => {
    it('should save conversation and return it', async () => {
      const db = createMockDB() as unknown as DBClient & { _mocks: Record<string, jest.Mock> };
      const conversation = createTestConversation();
      const row = createTestConversationRow();

      db._mocks.mockReturning.mockResolvedValue([row]);

      const effects = createConversationEffects(db);
      const result = await effects.saveConversation(conversation)();

      expect(E.isRight(result)).toBe(true);
      if (E.isRight(result)) {
        expect(result.right.id).toBe(TEST_CONVERSATION_ID);
        expect(result.right.userId).toBe(TEST_USER_ID);
        expect(result.right.scenarioId).toBe(TEST_SCENARIO_ID);
        expect(result.right.messages).toEqual([]);
      }
    });

    it('should return error when insert returns no rows', async () => {
      const db = createMockDB() as unknown as DBClient & { _mocks: Record<string, jest.Mock> };
      const conversation = createTestConversation();

      db._mocks.mockReturning.mockResolvedValue([]);

      const effects = createConversationEffects(db);
      const result = await effects.saveConversation(conversation)();

      expect(E.isLeft(result)).toBe(true);
      if (E.isLeft(result)) {
        expect(result.left.message).toBe('Failed to save conversation');
      }
    });

    it('should return error when database throws', async () => {
      const db = createMockDB() as unknown as DBClient & { _mocks: Record<string, jest.Mock> };
      const conversation = createTestConversation();

      db._mocks.mockReturning.mockRejectedValue(new Error('DB error'));

      const effects = createConversationEffects(db);
      const result = await effects.saveConversation(conversation)();

      expect(E.isLeft(result)).toBe(true);
      if (E.isLeft(result)) {
        expect(result.left.message).toBe('Failed to save conversation');
      }
    });
  });

  describe('getConversation', () => {
    it('should return conversation by id', async () => {
      const db = createMockDB() as unknown as DBClient & { _mocks: Record<string, jest.Mock> };
      const row = createTestConversationRow();

      db._mocks.mockWhere.mockResolvedValue([row]);

      const effects = createConversationEffects(db);
      const result = await effects.getConversation(TEST_CONVERSATION_ID)();

      expect(E.isRight(result)).toBe(true);
      if (E.isRight(result)) {
        expect(result.right.id).toBe(TEST_CONVERSATION_ID);
        expect(result.right.targetLanguage).toBe('en');
        expect(result.right.userLevel).toBe('beginner');
      }
    });

    it('should return error when conversation not found', async () => {
      const db = createMockDB() as unknown as DBClient & { _mocks: Record<string, jest.Mock> };

      db._mocks.mockWhere.mockResolvedValue([]);

      const effects = createConversationEffects(db);
      const result = await effects.getConversation(TEST_CONVERSATION_ID)();

      expect(E.isLeft(result)).toBe(true);
      if (E.isLeft(result)) {
        expect(result.left.message).toBe('Failed to get conversation');
      }
    });

    it('should return error when database throws', async () => {
      const db = createMockDB() as unknown as DBClient & { _mocks: Record<string, jest.Mock> };

      db._mocks.mockWhere.mockRejectedValue(new Error('DB error'));

      const effects = createConversationEffects(db);
      const result = await effects.getConversation(TEST_CONVERSATION_ID)();

      expect(E.isLeft(result)).toBe(true);
      if (E.isLeft(result)) {
        expect(result.left.message).toBe('Failed to get conversation');
      }
    });
  });
});
