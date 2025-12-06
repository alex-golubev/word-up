import { isLeft, isRight } from 'fp-ts/Either';
import type { DBClient } from '~/infrastructure/db/client';
import { createUserEffects } from '~/infrastructure/effects/user/user.effects';
import { TEST_USER_ID, createTestUserRow, createMockDB } from '~/test/fixtures';

describe('createUserEffects', () => {
  describe('getUserById', () => {
    it('should return user by id', async () => {
      const db = createMockDB() as unknown as DBClient & { _mocks: Record<string, jest.Mock> };
      const row = createTestUserRow();

      db._mocks.mockWhere.mockResolvedValue([row]);

      const effects = createUserEffects(db);
      const result = await effects.getUserById(TEST_USER_ID)();

      expect(isRight(result)).toBe(true);
      if (isRight(result)) {
        expect(result.right.id).toBe(TEST_USER_ID);
        expect(result.right.email).toBe('test@example.com');
        expect(result.right.name).toBe('Test User');
        expect(result.right.nativeLanguage).toBe('en');
      }
    });

    it('should return NotFound error when user not found', async () => {
      const db = createMockDB() as unknown as DBClient & { _mocks: Record<string, jest.Mock> };

      db._mocks.mockWhere.mockResolvedValue([]);

      const effects = createUserEffects(db);
      const result = await effects.getUserById(TEST_USER_ID)();

      expect(isLeft(result)).toBe(true);
      if (isLeft(result)) {
        expect(result.left._tag).toBe('NotFound');
        if (result.left._tag === 'NotFound') {
          expect(result.left.entity).toBe('User');
          expect(result.left.id).toBe(TEST_USER_ID);
        }
      }
    });

    it('should return DbError when database throws', async () => {
      const db = createMockDB() as unknown as DBClient & { _mocks: Record<string, jest.Mock> };

      db._mocks.mockWhere.mockRejectedValue(new Error('DB connection error'));

      const effects = createUserEffects(db);
      const result = await effects.getUserById(TEST_USER_ID)();

      expect(isLeft(result)).toBe(true);
      if (isLeft(result)) {
        expect(result.left._tag).toBe('DbError');
      }
    });
  });

  describe('getUserByEmail', () => {
    it('should return user by email', async () => {
      const db = createMockDB() as unknown as DBClient & { _mocks: Record<string, jest.Mock> };
      const row = createTestUserRow();

      db._mocks.mockWhere.mockResolvedValue([row]);

      const effects = createUserEffects(db);
      const result = await effects.getUserByEmail('test@example.com')();

      expect(isRight(result)).toBe(true);
      if (isRight(result)) {
        expect(result.right?.email).toBe('test@example.com');
      }
    });

    it('should return null when user not found (not an error)', async () => {
      const db = createMockDB() as unknown as DBClient & { _mocks: Record<string, jest.Mock> };

      db._mocks.mockWhere.mockResolvedValue([]);

      const effects = createUserEffects(db);
      const result = await effects.getUserByEmail('notfound@example.com')();

      expect(isRight(result)).toBe(true);
      if (isRight(result)) {
        expect(result.right).toBeNull();
      }
    });

    it('should return DbError when database throws', async () => {
      const db = createMockDB() as unknown as DBClient & { _mocks: Record<string, jest.Mock> };

      db._mocks.mockWhere.mockRejectedValue(new Error('DB error'));

      const effects = createUserEffects(db);
      const result = await effects.getUserByEmail('test@example.com')();

      expect(isLeft(result)).toBe(true);
      if (isLeft(result)) {
        expect(result.left._tag).toBe('DbError');
      }
    });
  });

  describe('createUser', () => {
    it('should create user and return it', async () => {
      const db = createMockDB() as unknown as DBClient & { _mocks: Record<string, jest.Mock> };
      const row = createTestUserRow();

      db._mocks.mockReturning.mockResolvedValue([row]);

      const effects = createUserEffects(db);
      const result = await effects.createUser({
        email: 'test@example.com',
        passwordHash: 'hashed-password',
        name: 'Test User',
        nativeLanguage: 'en',
      })();

      expect(isRight(result)).toBe(true);
      if (isRight(result)) {
        expect(result.right.id).toBe(TEST_USER_ID);
        expect(result.right.email).toBe('test@example.com');
      }
    });

    it('should create user with null name', async () => {
      const db = createMockDB() as unknown as DBClient & { _mocks: Record<string, jest.Mock> };
      const row = createTestUserRow({ name: null });

      db._mocks.mockReturning.mockResolvedValue([row]);

      const effects = createUserEffects(db);
      const result = await effects.createUser({
        email: 'test@example.com',
        passwordHash: 'hashed-password',
        nativeLanguage: 'en',
      })();

      expect(isRight(result)).toBe(true);
      if (isRight(result)) {
        expect(result.right.name).toBeNull();
      }
    });

    it('should return InsertFailed error when insert returns no rows', async () => {
      const db = createMockDB() as unknown as DBClient & { _mocks: Record<string, jest.Mock> };

      db._mocks.mockReturning.mockResolvedValue([]);

      const effects = createUserEffects(db);
      const result = await effects.createUser({
        email: 'test@example.com',
        passwordHash: 'hashed-password',
        nativeLanguage: 'en',
      })();

      expect(isLeft(result)).toBe(true);
      if (isLeft(result)) {
        expect(result.left._tag).toBe('InsertFailed');
        if (result.left._tag === 'InsertFailed') {
          expect(result.left.entity).toBe('User');
        }
      }
    });

    it('should return DbError when database throws', async () => {
      const db = createMockDB() as unknown as DBClient & { _mocks: Record<string, jest.Mock> };

      db._mocks.mockReturning.mockRejectedValue(new Error('DB error'));

      const effects = createUserEffects(db);
      const result = await effects.createUser({
        email: 'test@example.com',
        passwordHash: 'hashed-password',
        nativeLanguage: 'en',
      })();

      expect(isLeft(result)).toBe(true);
      if (isLeft(result)) {
        expect(result.left._tag).toBe('DbError');
      }
    });
  });

  describe('updateUser', () => {
    it('should update user and return updated data', async () => {
      const db = createMockDB() as unknown as DBClient & { _mocks: Record<string, jest.Mock> };
      const updatedRow = createTestUserRow({ name: 'New Name' });

      db._mocks.mockReturning.mockResolvedValue([updatedRow]);

      const effects = createUserEffects(db);
      const result = await effects.updateUser(TEST_USER_ID, { name: 'New Name' })();

      expect(isRight(result)).toBe(true);
      if (isRight(result)) {
        expect(result.right.name).toBe('New Name');
      }
    });

    it('should update user language', async () => {
      const db = createMockDB() as unknown as DBClient & { _mocks: Record<string, jest.Mock> };
      const updatedRow = createTestUserRow({ nativeLanguage: 'ru' });

      db._mocks.mockReturning.mockResolvedValue([updatedRow]);

      const effects = createUserEffects(db);
      const result = await effects.updateUser(TEST_USER_ID, { nativeLanguage: 'ru' })();

      expect(isRight(result)).toBe(true);
      if (isRight(result)) {
        expect(result.right.nativeLanguage).toBe('ru');
      }
    });

    it('should return NotFound error when user not found', async () => {
      const db = createMockDB() as unknown as DBClient & { _mocks: Record<string, jest.Mock> };

      db._mocks.mockReturning.mockResolvedValue([]);

      const effects = createUserEffects(db);
      const result = await effects.updateUser(TEST_USER_ID, { name: 'New Name' })();

      expect(isLeft(result)).toBe(true);
      if (isLeft(result)) {
        expect(result.left._tag).toBe('NotFound');
      }
    });

    it('should return DbError when database throws', async () => {
      const db = createMockDB() as unknown as DBClient & { _mocks: Record<string, jest.Mock> };

      db._mocks.mockReturning.mockRejectedValue(new Error('DB error'));

      const effects = createUserEffects(db);
      const result = await effects.updateUser(TEST_USER_ID, { name: 'New Name' })();

      expect(isLeft(result)).toBe(true);
      if (isLeft(result)) {
        expect(result.left._tag).toBe('DbError');
      }
    });
  });
});
