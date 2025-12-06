import { isLeft, isRight } from 'fp-ts/Either';

import type { DBClient } from '~/infrastructure/db/client';
import { createConversationEffects } from '~/infrastructure/effects/conversation/conversation.effects';
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

      expect(isRight(result)).toBe(true);
      if (isRight(result)) {
        expect(result.right.id).toBe(TEST_CONVERSATION_ID);
        expect(result.right.userId).toBe(TEST_USER_ID);
        expect(result.right.scenarioId).toBe(TEST_SCENARIO_ID);
        expect(result.right.messages).toEqual([]);
      }
    });

    it('should return InsertFailed error when insert returns no rows', async () => {
      const db = createMockDB() as unknown as DBClient & { _mocks: Record<string, jest.Mock> };
      const conversation = createTestConversation();

      db._mocks.mockReturning.mockResolvedValue([]);

      const effects = createConversationEffects(db);
      const result = await effects.saveConversation(conversation)();

      expect(isLeft(result)).toBe(true);
      if (isLeft(result)) {
        expect(result.left._tag).toBe('InsertFailed');
        if (result.left._tag === 'InsertFailed') {
          expect(result.left.entity).toBe('Conversation');
        }
      }
    });

    it('should return DbError when database throws', async () => {
      const db = createMockDB() as unknown as DBClient & { _mocks: Record<string, jest.Mock> };
      const conversation = createTestConversation();

      db._mocks.mockReturning.mockRejectedValue(new Error('DB error'));

      const effects = createConversationEffects(db);
      const result = await effects.saveConversation(conversation)();

      expect(isLeft(result)).toBe(true);
      if (isLeft(result)) {
        expect(result.left._tag).toBe('DbError');
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

      expect(isRight(result)).toBe(true);
      if (isRight(result)) {
        expect(result.right.id).toBe(TEST_CONVERSATION_ID);
        expect(result.right.targetLanguage).toBe('en');
        expect(result.right.userLevel).toBe('beginner');
      }
    });

    it('should return NotFound error when conversation not found', async () => {
      const db = createMockDB() as unknown as DBClient & { _mocks: Record<string, jest.Mock> };

      db._mocks.mockWhere.mockResolvedValue([]);

      const effects = createConversationEffects(db);
      const result = await effects.getConversation(TEST_CONVERSATION_ID)();

      expect(isLeft(result)).toBe(true);
      if (isLeft(result)) {
        expect(result.left._tag).toBe('NotFound');
        if (result.left._tag === 'NotFound') {
          expect(result.left.entity).toBe('Conversation');
          expect(result.left.id).toBe(TEST_CONVERSATION_ID);
        }
      }
    });

    it('should return DbError when database throws', async () => {
      const db = createMockDB() as unknown as DBClient & { _mocks: Record<string, jest.Mock> };

      db._mocks.mockWhere.mockRejectedValue(new Error('DB error'));

      const effects = createConversationEffects(db);
      const result = await effects.getConversation(TEST_CONVERSATION_ID)();

      expect(isLeft(result)).toBe(true);
      if (isLeft(result)) {
        expect(result.left._tag).toBe('DbError');
      }
    });
  });
});
