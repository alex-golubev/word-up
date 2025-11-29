import * as E from 'fp-ts/Either';
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

      expect(E.isRight(result)).toBe(true);
      if (E.isRight(result)) {
        expect(result.right.id).toBe(TEST_MESSAGE_ID);
        expect(result.right.content).toBe('Hello');
      }
    });

    it('should return error when insert returns no rows', async () => {
      const db = createMockDB() as unknown as DBClient & { _mocks: Record<string, jest.Mock> };
      const message = createTestMessage();

      db._mocks.mockReturning.mockResolvedValue([]);

      const effects = createMessageEffects(db);
      const result = await effects.saveMessage(message)();

      expect(E.isLeft(result)).toBe(true);
      if (E.isLeft(result)) {
        expect(result.left.message).toBe('Failed to save message');
      }
    });

    it('should return error when database throws', async () => {
      const db = createMockDB() as unknown as DBClient & { _mocks: Record<string, jest.Mock> };
      const message = createTestMessage();

      db._mocks.mockReturning.mockRejectedValue(new Error('DB error'));

      const effects = createMessageEffects(db);
      const result = await effects.saveMessage(message)();

      expect(E.isLeft(result)).toBe(true);
      if (E.isLeft(result)) {
        expect(result.left.message).toBe('Failed to save message');
      }
    });
  });

  describe('getMessagesByConversation', () => {
    it('should return messages for conversation', async () => {
      const db = createMockDB() as unknown as DBClient & { _mocks: Record<string, jest.Mock> };
      const rows = [
        createTestMessageRow({ content: 'Hello' }),
        createTestMessageRow({ id: crypto.randomUUID(), content: 'World' }),
      ];

      db._mocks.mockOrderBy.mockResolvedValue(rows);

      const effects = createMessageEffects(db);
      const result = await effects.getMessagesByConversation(TEST_CONVERSATION_ID)();

      expect(E.isRight(result)).toBe(true);
      if (E.isRight(result)) {
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

      expect(E.isRight(result)).toBe(true);
      if (E.isRight(result)) {
        expect(result.right).toHaveLength(0);
      }
    });

    it('should return error when database throws', async () => {
      const db = createMockDB() as unknown as DBClient & { _mocks: Record<string, jest.Mock> };

      db._mocks.mockOrderBy.mockRejectedValue(new Error('DB error'));

      const effects = createMessageEffects(db);
      const result = await effects.getMessagesByConversation(TEST_CONVERSATION_ID)();

      expect(E.isLeft(result)).toBe(true);
      if (E.isLeft(result)) {
        expect(result.left.message).toBe('Failed to get messages');
      }
    });
  });
});
