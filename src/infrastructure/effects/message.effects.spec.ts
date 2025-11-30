import { randomUUID } from 'node:crypto';
import { isLeft, isRight } from 'fp-ts/Either';
import type { DBClient } from '~/infrastructure/db/client';
import { createMessageEffects } from '~/infrastructure/effects/message.effects';
import {
  TEST_CONVERSATION_ID,
  TEST_MESSAGE_ID,
  createTestMessage,
  createTestMessageRow,
  createMockDB,
} from '~/test/fixtures';

describe('createMessageEffects', () => {
  describe('saveMessage', () => {
    it('should save message and return it', async () => {
      const db = createMockDB() as unknown as DBClient & { _mocks: Record<string, jest.Mock> };
      const message = createTestMessage({ id: TEST_MESSAGE_ID, content: 'Hello' });
      const row = createTestMessageRow({ content: 'Hello' });

      db._mocks.mockReturning.mockResolvedValue([row]);

      const effects = createMessageEffects(db);
      const result = await effects.saveMessage(message)();

      expect(isRight(result)).toBe(true);
      if (isRight(result)) {
        expect(result.right.id).toBe(TEST_MESSAGE_ID);
        expect(result.right.content).toBe('Hello');
      }
    });

    it('should return InsertFailed error when insert returns no rows', async () => {
      const db = createMockDB() as unknown as DBClient & { _mocks: Record<string, jest.Mock> };
      const message = createTestMessage();

      db._mocks.mockReturning.mockResolvedValue([]);

      const effects = createMessageEffects(db);
      const result = await effects.saveMessage(message)();

      expect(isLeft(result)).toBe(true);
      if (isLeft(result)) {
        expect(result.left._tag).toBe('InsertFailed');
        if (result.left._tag === 'InsertFailed') {
          expect(result.left.entity).toBe('Message');
        }
      }
    });

    it('should return DbError when database throws', async () => {
      const db = createMockDB() as unknown as DBClient & { _mocks: Record<string, jest.Mock> };
      const message = createTestMessage();

      db._mocks.mockReturning.mockRejectedValue(new Error('DB error'));

      const effects = createMessageEffects(db);
      const result = await effects.saveMessage(message)();

      expect(isLeft(result)).toBe(true);
      if (isLeft(result)) {
        expect(result.left._tag).toBe('DbError');
      }
    });
  });

  describe('getMessagesByConversation', () => {
    it('should return messages for conversation', async () => {
      const db = createMockDB() as unknown as DBClient & { _mocks: Record<string, jest.Mock> };
      const rows = [
        createTestMessageRow({ content: 'Hello' }),
        createTestMessageRow({ id: randomUUID(), content: 'World' }),
      ];

      db._mocks.mockOrderBy.mockResolvedValue(rows);

      const effects = createMessageEffects(db);
      const result = await effects.getMessagesByConversation(TEST_CONVERSATION_ID)();

      expect(isRight(result)).toBe(true);
      if (isRight(result)) {
        expect(result.right).toHaveLength(2);
        expect(result.right[0].content).toBe('Hello');
        expect(result.right[1].content).toBe('World');
      }
    });

    it('should return empty array when no messages', async () => {
      const db = createMockDB() as unknown as DBClient & { _mocks: Record<string, jest.Mock> };

      db._mocks.mockOrderBy.mockResolvedValue([]);

      const effects = createMessageEffects(db);
      const result = await effects.getMessagesByConversation(TEST_CONVERSATION_ID)();

      expect(isRight(result)).toBe(true);
      if (isRight(result)) {
        expect(result.right).toHaveLength(0);
      }
    });

    it('should return DbError when database throws', async () => {
      const db = createMockDB() as unknown as DBClient & { _mocks: Record<string, jest.Mock> };

      db._mocks.mockOrderBy.mockRejectedValue(new Error('DB error'));

      const effects = createMessageEffects(db);
      const result = await effects.getMessagesByConversation(TEST_CONVERSATION_ID)();

      expect(isLeft(result)).toBe(true);
      if (isLeft(result)) {
        expect(result.left._tag).toBe('DbError');
      }
    });
  });
});
