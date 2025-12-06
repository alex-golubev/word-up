import { isLeft, isRight } from 'fp-ts/Either';

import { createRefreshTokenEffects } from '~/infrastructure/effects/auth/refresh-token.effects';
import { createMockDB, createTestRefreshTokenRow, TEST_USER_ID } from '~/test/fixtures';

import type { DBClient } from '~/infrastructure/db/client';

describe('createRefreshTokenEffects', () => {
  describe('saveRefreshToken', () => {
    it('should save refresh token and return it', async () => {
      const db = createMockDB() as unknown as DBClient & { _mocks: Record<string, jest.Mock> };
      const row = createTestRefreshTokenRow();
      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

      db._mocks.mockReturning.mockResolvedValue([row]);

      const effects = createRefreshTokenEffects(db);
      const result = await effects.saveRefreshToken(TEST_USER_ID, 'test-refresh-token', expiresAt)();

      expect(isRight(result)).toBe(true);
      if (isRight(result)) {
        expect(result.right.userId).toBe(TEST_USER_ID);
        expect(result.right.token).toBe('test-refresh-token');
      }
    });

    it('should return InsertFailed error when insert returns no rows', async () => {
      const db = createMockDB() as unknown as DBClient & { _mocks: Record<string, jest.Mock> };
      const expiresAt = new Date();

      db._mocks.mockReturning.mockResolvedValue([]);

      const effects = createRefreshTokenEffects(db);
      const result = await effects.saveRefreshToken(TEST_USER_ID, 'test-token', expiresAt)();

      expect(isLeft(result)).toBe(true);
      if (isLeft(result)) {
        expect(result.left._tag).toBe('InsertFailed');
        if (result.left._tag === 'InsertFailed') {
          expect(result.left.entity).toBe('RefreshToken');
        }
      }
    });

    it('should return DbError when database throws', async () => {
      const db = createMockDB() as unknown as DBClient & { _mocks: Record<string, jest.Mock> };
      const expiresAt = new Date();

      db._mocks.mockReturning.mockRejectedValue(new Error('DB error'));

      const effects = createRefreshTokenEffects(db);
      const result = await effects.saveRefreshToken(TEST_USER_ID, 'test-token', expiresAt)();

      expect(isLeft(result)).toBe(true);
      if (isLeft(result)) {
        expect(result.left._tag).toBe('DbError');
      }
    });
  });

  describe('getRefreshToken', () => {
    it('should return refresh token by token string', async () => {
      const db = createMockDB() as unknown as DBClient & { _mocks: Record<string, jest.Mock> };
      const row = createTestRefreshTokenRow();

      db._mocks.mockWhere.mockResolvedValue([row]);

      const effects = createRefreshTokenEffects(db);
      const result = await effects.getRefreshToken('test-refresh-token')();

      expect(isRight(result)).toBe(true);
      if (isRight(result)) {
        expect(result.right?.token).toBe('test-refresh-token');
        expect(result.right?.userId).toBe(TEST_USER_ID);
      }
    });

    it('should return null when token not found (not an error)', async () => {
      const db = createMockDB() as unknown as DBClient & { _mocks: Record<string, jest.Mock> };

      db._mocks.mockWhere.mockResolvedValue([]);

      const effects = createRefreshTokenEffects(db);
      const result = await effects.getRefreshToken('non-existent-token')();

      expect(isRight(result)).toBe(true);
      if (isRight(result)) {
        expect(result.right).toBeNull();
      }
    });

    it('should return DbError when database throws', async () => {
      const db = createMockDB() as unknown as DBClient & { _mocks: Record<string, jest.Mock> };

      db._mocks.mockWhere.mockRejectedValue(new Error('DB error'));

      const effects = createRefreshTokenEffects(db);
      const result = await effects.getRefreshToken('test-token')();

      expect(isLeft(result)).toBe(true);
      if (isLeft(result)) {
        expect(result.left._tag).toBe('DbError');
      }
    });
  });

  describe('deleteRefreshToken', () => {
    it('should delete refresh token successfully', async () => {
      const db = createMockDB() as unknown as DBClient & { _mocks: Record<string, jest.Mock> };

      db._mocks.mockWhere.mockResolvedValue([]);

      const effects = createRefreshTokenEffects(db);
      const result = await effects.deleteRefreshToken('test-token')();

      expect(isRight(result)).toBe(true);
      expect(db.delete).toHaveBeenCalled();
    });

    it('should return DbError when database throws', async () => {
      const db = createMockDB() as unknown as DBClient & { _mocks: Record<string, jest.Mock> };

      db._mocks.mockWhere.mockRejectedValue(new Error('DB error'));

      const effects = createRefreshTokenEffects(db);
      const result = await effects.deleteRefreshToken('test-token')();

      expect(isLeft(result)).toBe(true);
      if (isLeft(result)) {
        expect(result.left._tag).toBe('DbError');
      }
    });
  });

  describe('deleteAllUserTokens', () => {
    it('should delete all user tokens successfully', async () => {
      const db = createMockDB() as unknown as DBClient & { _mocks: Record<string, jest.Mock> };

      db._mocks.mockWhere.mockResolvedValue([]);

      const effects = createRefreshTokenEffects(db);
      const result = await effects.deleteAllUserTokens(TEST_USER_ID)();

      expect(isRight(result)).toBe(true);
      expect(db.delete).toHaveBeenCalled();
    });

    it('should return DbError when database throws', async () => {
      const db = createMockDB() as unknown as DBClient & { _mocks: Record<string, jest.Mock> };

      db._mocks.mockWhere.mockRejectedValue(new Error('DB error'));

      const effects = createRefreshTokenEffects(db);
      const result = await effects.deleteAllUserTokens(TEST_USER_ID)();

      expect(isLeft(result)).toBe(true);
      if (isLeft(result)) {
        expect(result.left._tag).toBe('DbError');
      }
    });
  });

  describe('tryMarkTokenAsUsed', () => {
    it('should mark token as used when we are first', async () => {
      const db = createMockDB() as unknown as DBClient & { _mocks: Record<string, jest.Mock> };
      const markedRow = createTestRefreshTokenRow({
        usedAt: new Date(),
        replacementToken: 'new-token',
      });

      db._mocks.mockReturning.mockResolvedValue([markedRow]);

      const effects = createRefreshTokenEffects(db);
      const result = await effects.tryMarkTokenAsUsed('old-token', 'new-token')();

      expect(isRight(result)).toBe(true);
      if (isRight(result)) {
        expect(result.right.marked).toBe(true);
        expect(result.right.record.replacementToken).toBe('new-token');
      }
    });

    it('should return marked=false when token was already used', async () => {
      const db = createMockDB() as unknown as DBClient & { _mocks: Record<string, jest.Mock> };
      const existingRow = createTestRefreshTokenRow({
        usedAt: new Date(),
        replacementToken: 'existing-replacement',
      });

      // Mock the behavior for concurrent case:
      // 1. update().set().where().returning() returns [] (already marked)
      // 2. select().from().where() returns existing row
      let whereCallCount = 0;
      db._mocks.mockWhere.mockImplementation(() => {
        whereCallCount++;
        if (whereCallCount === 1) {
          // First call from update - return object with returning
          return { returning: jest.fn().mockResolvedValue([]) };
        }
        // Second call from select - return promise directly
        return Promise.resolve([existingRow]);
      });

      const effects = createRefreshTokenEffects(db);
      const result = await effects.tryMarkTokenAsUsed('old-token', 'new-token')();

      expect(isRight(result)).toBe(true);
      if (isRight(result)) {
        expect(result.right.marked).toBe(false);
        expect(result.right.record.replacementToken).toBe('existing-replacement');
      }
    });

    it('should return DbError when token not found after failed update', async () => {
      const db = createMockDB() as unknown as DBClient & { _mocks: Record<string, jest.Mock> };

      // Mock the behavior when token doesn't exist:
      // 1. update() returns [] (no rows updated)
      // 2. select() returns [] (token not found) - throws error
      let whereCallCount = 0;
      db._mocks.mockWhere.mockImplementation(() => {
        whereCallCount++;
        if (whereCallCount === 1) {
          return { returning: jest.fn().mockResolvedValue([]) };
        }
        return Promise.resolve([]);
      });

      const effects = createRefreshTokenEffects(db);
      const result = await effects.tryMarkTokenAsUsed('non-existent-token', 'new-token')();

      expect(isLeft(result)).toBe(true);
      if (isLeft(result)) {
        expect(result.left._tag).toBe('DbError');
      }
    });

    it('should return DbError when database throws', async () => {
      const db = createMockDB() as unknown as DBClient & { _mocks: Record<string, jest.Mock> };

      db._mocks.mockReturning.mockRejectedValue(new Error('DB error'));

      const effects = createRefreshTokenEffects(db);
      const result = await effects.tryMarkTokenAsUsed('old-token', 'new-token')();

      expect(isLeft(result)).toBe(true);
      if (isLeft(result)) {
        expect(result.left._tag).toBe('DbError');
      }
    });
  });
});
