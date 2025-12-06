import { isLeft, isRight } from 'fp-ts/Either';
import { left, right } from 'fp-ts/TaskEither';

import { loginUseCase } from '~/application/use-cases/auth/login';
import { dbError, makeUserId } from '~/domain/types';
import { TEST_DATE, TEST_UUID } from '~/test/fixtures';
import { createMockEnv } from '~/test/mock-env';

import type { User } from '~/domain/types';

const mockVerifyPassword = jest.fn();

jest.mock('~/infrastructure/auth', () => ({
  verifyPassword: (...args: unknown[]) => mockVerifyPassword(...args),
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

describe('loginUseCase', () => {
  const defaultParams = {
    email: 'test@example.com',
    password: 'password123',
  };

  beforeEach(() => {
    mockVerifyPassword.mockReset();
  });

  it('should login successfully with valid credentials', async () => {
    const user = createTestUser();
    mockVerifyPassword.mockResolvedValue(true);

    const env = createMockEnv({
      getUserByEmail: jest.fn().mockReturnValue(right(user)),
      saveRefreshToken: jest.fn().mockReturnValue(right(undefined)),
    });

    const result = await loginUseCase(defaultParams)(env)();

    expect(isRight(result)).toBe(true);
    if (isRight(result)) {
      expect(result.right.accessToken).toBe('mock-access-token');
      expect(result.right.refreshToken).toBe('mock-refresh-token');
    }
  });

  it('should return InvalidCredentials when user not found', async () => {
    const env = createMockEnv({
      getUserByEmail: jest.fn().mockReturnValue(right(null)),
    });

    const result = await loginUseCase(defaultParams)(env)();

    expect(isLeft(result)).toBe(true);
    if (isLeft(result)) {
      expect(result.left._tag).toBe('InvalidCredentials');
    }
    expect(mockVerifyPassword).not.toHaveBeenCalled();
  });

  it('should return InvalidCredentials when user has no password (OAuth user)', async () => {
    const oauthUser = createTestUser({ passwordHash: null });

    const env = createMockEnv({
      getUserByEmail: jest.fn().mockReturnValue(right(oauthUser)),
    });

    const result = await loginUseCase(defaultParams)(env)();

    expect(isLeft(result)).toBe(true);
    if (isLeft(result)) {
      expect(result.left._tag).toBe('InvalidCredentials');
    }
    expect(mockVerifyPassword).not.toHaveBeenCalled();
  });

  it('should return InvalidCredentials when password is incorrect', async () => {
    const user = createTestUser();
    mockVerifyPassword.mockResolvedValue(false);

    const env = createMockEnv({
      getUserByEmail: jest.fn().mockReturnValue(right(user)),
    });

    const result = await loginUseCase(defaultParams)(env)();

    expect(isLeft(result)).toBe(true);
    if (isLeft(result)) {
      expect(result.left._tag).toBe('InvalidCredentials');
    }
    expect(mockVerifyPassword).toHaveBeenCalledWith('password123', 'hashed-password');
    expect(env.saveRefreshToken).not.toHaveBeenCalled();
  });

  it('should return error when getUserByEmail fails', async () => {
    const env = createMockEnv({
      getUserByEmail: jest.fn().mockReturnValue(left(dbError(new Error('DB error')))),
    });

    const result = await loginUseCase(defaultParams)(env)();

    expect(isLeft(result)).toBe(true);
    if (isLeft(result)) {
      expect(result.left._tag).toBe('DbError');
    }
  });

  it('should return error when verifyPassword throws', async () => {
    const user = createTestUser();
    mockVerifyPassword.mockRejectedValue(new Error('bcrypt error'));

    const env = createMockEnv({
      getUserByEmail: jest.fn().mockReturnValue(right(user)),
    });

    const result = await loginUseCase(defaultParams)(env)();

    expect(isLeft(result)).toBe(true);
    if (isLeft(result)) {
      expect(result.left._tag).toBe('DbError');
    }
  });

  it('should return error when saveRefreshToken fails', async () => {
    const user = createTestUser();
    mockVerifyPassword.mockResolvedValue(true);

    const env = createMockEnv({
      getUserByEmail: jest.fn().mockReturnValue(right(user)),
      saveRefreshToken: jest.fn().mockReturnValue(left(dbError(new Error('Token save failed')))),
    });

    const result = await loginUseCase(defaultParams)(env)();

    expect(isLeft(result)).toBe(true);
    if (isLeft(result)) {
      expect(result.left._tag).toBe('DbError');
    }
  });

  it('should save refresh token with user id', async () => {
    const user = createTestUser();
    mockVerifyPassword.mockResolvedValue(true);
    const saveRefreshTokenMock = jest.fn().mockReturnValue(right(undefined));

    const env = createMockEnv({
      getUserByEmail: jest.fn().mockReturnValue(right(user)),
      saveRefreshToken: saveRefreshTokenMock,
    });

    await loginUseCase(defaultParams)(env)();

    expect(saveRefreshTokenMock).toHaveBeenCalledWith(user.id, 'mock-refresh-token', expect.any(Date));
  });
});
