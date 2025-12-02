import { isLeft, isRight } from 'fp-ts/Either';
import { left, right } from 'fp-ts/TaskEither';
import type { User } from '~/domain/types';
import { dbError, emailAlreadyExists, makeUserId } from '~/domain/types';
import { registerUseCase } from '~/application/use-cases/register';
import { createMockEnv } from '~/test/mock-env';
import { TEST_UUID, TEST_DATE } from '~/test/fixtures';

jest.mock('~/infrastructure/auth', () => ({
  hashPassword: jest.fn().mockResolvedValue('hashed-password'),
  createAccessToken: jest.fn().mockResolvedValue('mock-access-token'),
  createRefreshToken: jest.fn().mockResolvedValue('mock-refresh-token'),
  getRefreshTokenExpiry: jest.fn().mockReturnValue(new Date('2024-01-08')),
}));

const createTestUser = (overrides?: Partial<User>): User => ({
  id: makeUserId(TEST_UUID.user),
  email: 'test@example.com',
  passwordHash: 'hashed-password',
  name: 'Test User',
  nativeLanguage: 'en',
  createdAt: TEST_DATE,
  ...overrides,
});

describe('registerUseCase', () => {
  const defaultParams = {
    email: 'test@example.com',
    password: 'password123',
    name: 'Test User',
    nativeLanguage: 'en' as const,
  };

  it('should register user successfully', async () => {
    const user = createTestUser();

    const env = createMockEnv({
      getUserByEmail: jest.fn().mockReturnValue(right(null)),
      createUser: jest.fn().mockReturnValue(right(user)),
      saveRefreshToken: jest.fn().mockReturnValue(right(undefined)),
    });

    const result = await registerUseCase(defaultParams)(env)();

    expect(isRight(result)).toBe(true);
    if (isRight(result)) {
      expect(result.right.accessToken).toBe('mock-access-token');
      expect(result.right.refreshToken).toBe('mock-refresh-token');
    }
  });

  it('should call createUser with correct parameters', async () => {
    const user = createTestUser();
    const createUserMock = jest.fn().mockReturnValue(right(user));

    const env = createMockEnv({
      getUserByEmail: jest.fn().mockReturnValue(right(null)),
      createUser: createUserMock,
      saveRefreshToken: jest.fn().mockReturnValue(right(undefined)),
    });

    await registerUseCase(defaultParams)(env)();

    expect(createUserMock).toHaveBeenCalledWith({
      email: 'test@example.com',
      passwordHash: 'hashed-password',
      name: 'Test User',
      nativeLanguage: 'en',
    });
  });

  it('should use null for name when not provided', async () => {
    const user = createTestUser({ name: null });
    const createUserMock = jest.fn().mockReturnValue(right(user));

    const env = createMockEnv({
      getUserByEmail: jest.fn().mockReturnValue(right(null)),
      createUser: createUserMock,
      saveRefreshToken: jest.fn().mockReturnValue(right(undefined)),
    });

    const paramsWithoutName = {
      email: 'test@example.com',
      password: 'password123',
      nativeLanguage: 'en' as const,
    };

    await registerUseCase(paramsWithoutName)(env)();

    expect(createUserMock).toHaveBeenCalledWith(
      expect.objectContaining({
        name: null,
      })
    );
  });

  it('should return EmailAlreadyExists error when email is taken', async () => {
    const existingUser = createTestUser();

    const env = createMockEnv({
      getUserByEmail: jest.fn().mockReturnValue(right(existingUser)),
    });

    const result = await registerUseCase(defaultParams)(env)();

    expect(isLeft(result)).toBe(true);
    if (isLeft(result)) {
      expect(result.left._tag).toBe('EmailAlreadyExists');
      expect(result.left).toEqual(emailAlreadyExists(defaultParams.email));
    }
    expect(env.createUser).not.toHaveBeenCalled();
  });

  it('should return error when getUserByEmail fails', async () => {
    const env = createMockEnv({
      getUserByEmail: jest.fn().mockReturnValue(left(dbError(new Error('DB connection failed')))),
    });

    const result = await registerUseCase(defaultParams)(env)();

    expect(isLeft(result)).toBe(true);
    if (isLeft(result)) {
      expect(result.left._tag).toBe('DbError');
    }
    expect(env.createUser).not.toHaveBeenCalled();
  });

  it('should return error when createUser fails', async () => {
    const env = createMockEnv({
      getUserByEmail: jest.fn().mockReturnValue(right(null)),
      createUser: jest.fn().mockReturnValue(left(dbError(new Error('Insert failed')))),
    });

    const result = await registerUseCase(defaultParams)(env)();

    expect(isLeft(result)).toBe(true);
    if (isLeft(result)) {
      expect(result.left._tag).toBe('DbError');
    }
    expect(env.saveRefreshToken).not.toHaveBeenCalled();
  });

  it('should return error when saveRefreshToken fails', async () => {
    const user = createTestUser();

    const env = createMockEnv({
      getUserByEmail: jest.fn().mockReturnValue(right(null)),
      createUser: jest.fn().mockReturnValue(right(user)),
      saveRefreshToken: jest.fn().mockReturnValue(left(dbError(new Error('Token save failed')))),
    });

    const result = await registerUseCase(defaultParams)(env)();

    expect(isLeft(result)).toBe(true);
    if (isLeft(result)) {
      expect(result.left._tag).toBe('DbError');
    }
  });

  it('should save refresh token with correct parameters', async () => {
    const user = createTestUser();
    const saveRefreshTokenMock = jest.fn().mockReturnValue(right(undefined));

    const env = createMockEnv({
      getUserByEmail: jest.fn().mockReturnValue(right(null)),
      createUser: jest.fn().mockReturnValue(right(user)),
      saveRefreshToken: saveRefreshTokenMock,
    });

    await registerUseCase(defaultParams)(env)();

    expect(saveRefreshTokenMock).toHaveBeenCalledWith(user.id, 'mock-refresh-token', expect.any(Date));
  });
});
