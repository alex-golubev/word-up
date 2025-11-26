import * as E from 'fp-ts/Either';
import { makeConversationId, makeMessageId } from '~/domain/types';
import type { Message } from '~/domain/types';
import type { DBClient } from '~/infrastructure/db/client';
import { createMessageEffects } from '~/infrastructure/effects/message.effects';

const TEST_CONVERSATION_ID = makeConversationId('11111111-1111-1111-1111-111111111111');
const TEST_MESSAGE_ID = makeMessageId('22222222-2222-2222-2222-222222222222');

const createTestMessage = (): Message => ({
  id: TEST_MESSAGE_ID,
  conversationId: TEST_CONVERSATION_ID,
  role: 'user',
  content: 'Hello',
  createdAt: new Date('2024-01-01'),
});

const createTestMessageRow = () => ({
  id: TEST_MESSAGE_ID as string,
  conversationId: TEST_CONVERSATION_ID as string,
  role: 'user' as const,
  content: 'Hello',
  createdAt: new Date('2024-01-01'),
});

const createMockDB = () => {
  const mockReturning = jest.fn();
  const mockValues = jest.fn(() => ({ returning: mockReturning }));
  const mockInsert = jest.fn(() => ({ values: mockValues }));

  const mockOrderBy = jest.fn();
  const mockWhere = jest.fn(() => ({ orderBy: mockOrderBy }));
  const mockFrom = jest.fn(() => ({ where: mockWhere }));
  const mockSelect = jest.fn(() => ({ from: mockFrom }));

  return {
    insert: mockInsert,
    select: mockSelect,
    _mocks: { mockReturning, mockValues, mockInsert, mockOrderBy, mockWhere, mockFrom, mockSelect },
  } as unknown as DBClient & { _mocks: Record<string, jest.Mock> };
};

describe('createMessageEffects', () => {
  describe('saveMessage', () => {
    it('should save message and return it', async () => {
      const db = createMockDB();
      const message = createTestMessage();
      const row = createTestMessageRow();

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
      const db = createMockDB();
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
      const db = createMockDB();
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
      const db = createMockDB();
      const rows = [
        createTestMessageRow(),
        { ...createTestMessageRow(), id: '33333333-3333-3333-3333-333333333333', content: 'World' },
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
      const db = createMockDB();

      db._mocks.mockOrderBy.mockResolvedValue([]);

      const effects = createMessageEffects(db);
      const result = await effects.getMessagesByConversation(TEST_CONVERSATION_ID)();

      expect(E.isRight(result)).toBe(true);
      if (E.isRight(result)) {
        expect(result.right).toHaveLength(0);
      }
    });

    it('should return error when database throws', async () => {
      const db = createMockDB();

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
