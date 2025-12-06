import { isLeft, isRight } from 'fp-ts/Either';
import { left, right } from 'fp-ts/TaskEither';

import { refreshTokensUseCase } from '~/application/use-cases/auth/refresh-tokens';
import { dbError, makeUserId } from '~/domain/types';
import { TEST_DATE, TEST_UUID } from '~/test/fixtures';
import { createMockEnv } from '~/test/mock-env';

import type { RefreshToken } from '~/domain/types';

const mockVerifyRefreshToken = jest.fn();

jest.mock('~/infrastructure/auth', () => ({
  verifyRefreshToken: (...args: unknown[]) => mockVerifyRefreshToken(...args),
  createAccessToken: jest.fn().mockResolvedValue('new-access-token'),
  createRefreshToken: jest.fn().mockResolvedValue('new-refresh-token'),
  getRefreshTokenExpiry: jest.fn().mockReturnValue(new Date('2024-01-08')),
  REFRESH_TOKEN_GRACE_PERIOD_MS: 5000,
}));

const createTestRefreshToken = (overrides?: Partial<RefreshToken>): RefreshToken => ({
  id: 'token-id',
  userId: makeUserId(TEST_UUID.user),
  token: 'old-refresh-token',
  expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
  createdAt: TEST_DATE,
  usedAt: null,
  replacementToken: null,
  ...overrides,
});

describe('refreshTokensUseCase', () => {
  const oldToken = 'old-refresh-token';

  beforeEach(() => {
    mockVerifyRefreshToken.mockReset();
    mockVerifyRefreshToken.mockResolvedValue({ userId: TEST_UUID.user, email: 'test@example.com' });
  });

  it('should refresh tokens successfully when we are first', async () => {
    const tokenRecord = createTestRefreshToken();

    const env = createMockEnv({
      getRefreshToken: jest.fn().mockReturnValue(right(tokenRecord)),
      tryMarkTokenAsUsed: jest.fn().mockReturnValue(right({ marked: true, record: tokenRecord })),
      saveRefreshToken: jest.fn().mockReturnValue(right(undefined)),
    });

    const result = await refreshTokensUseCase(oldToken)(env)();

    expect(isRight(result)).toBe(true);
    if (isRight(result)) {
      expect(result.right.accessToken).toBe('new-access-token');
      expect(result.right.refreshToken).toBe('new-refresh-token');
    }
  });

  it('should return InvalidToken when token not found in DB', async () => {
    const env = createMockEnv({
      getRefreshToken: jest.fn().mockReturnValue(right(null)),
    });

    const result = await refreshTokensUseCase(oldToken)(env)();

    expect(isLeft(result)).toBe(true);
    if (isLeft(result)) {
      expect(result.left._tag).toBe('InvalidToken');
    }
  });

  it('should return TokenExpired when token has expired', async () => {
    const expiredToken = createTestRefreshToken({
      expiresAt: new Date(Date.now() - 1000), // expired 1 second ago
    });

    const env = createMockEnv({
      getRefreshToken: jest.fn().mockReturnValue(right(expiredToken)),
    });

    const result = await refreshTokensUseCase(oldToken)(env)();

    expect(isLeft(result)).toBe(true);
    if (isLeft(result)) {
      expect(result.left._tag).toBe('TokenExpired');
    }
  });

  it('should return InvalidToken when JWT verification fails', async () => {
    const tokenRecord = createTestRefreshToken();
    mockVerifyRefreshToken.mockRejectedValue(new Error('Invalid signature'));

    const env = createMockEnv({
      getRefreshToken: jest.fn().mockReturnValue(right(tokenRecord)),
    });

    const result = await refreshTokensUseCase(oldToken)(env)();

    expect(isLeft(result)).toBe(true);
    if (isLeft(result)) {
      expect(result.left._tag).toBe('InvalidToken');
    }
  });

  it('should return error when getRefreshToken fails', async () => {
    const env = createMockEnv({
      getRefreshToken: jest.fn().mockReturnValue(left(dbError(new Error('DB error')))),
    });

    const result = await refreshTokensUseCase(oldToken)(env)();

    expect(isLeft(result)).toBe(true);
    if (isLeft(result)) {
      expect(result.left._tag).toBe('DbError');
    }
  });

  it('should return error when saveRefreshToken fails', async () => {
    const tokenRecord = createTestRefreshToken();

    const env = createMockEnv({
      getRefreshToken: jest.fn().mockReturnValue(right(tokenRecord)),
      tryMarkTokenAsUsed: jest.fn().mockReturnValue(right({ marked: true, record: tokenRecord })),
      saveRefreshToken: jest.fn().mockReturnValue(left(dbError(new Error('Save failed')))),
    });

    const result = await refreshTokensUseCase(oldToken)(env)();

    expect(isLeft(result)).toBe(true);
    if (isLeft(result)) {
      expect(result.left._tag).toBe('DbError');
    }
  });

  it('should save new refresh token with correct parameters', async () => {
    const tokenRecord = createTestRefreshToken();
    const saveRefreshTokenMock = jest.fn().mockReturnValue(right(undefined));

    const env = createMockEnv({
      getRefreshToken: jest.fn().mockReturnValue(right(tokenRecord)),
      tryMarkTokenAsUsed: jest.fn().mockReturnValue(right({ marked: true, record: tokenRecord })),
      saveRefreshToken: saveRefreshTokenMock,
    });

    await refreshTokensUseCase(oldToken)(env)();

    expect(saveRefreshTokenMock).toHaveBeenCalledWith(tokenRecord.userId, 'new-refresh-token', expect.any(Date));
  });

  describe('concurrent request handling (grace period)', () => {
    it('should return replacement tokens within grace period', async () => {
      const tokenRecord = createTestRefreshToken();
      const usedRecord = createTestRefreshToken({
        usedAt: new Date(Date.now() - 2000), // used 2 seconds ago (within 5s grace)
        replacementToken: 'existing-replacement-token',
      });

      const env = createMockEnv({
        getRefreshToken: jest.fn().mockReturnValue(right(tokenRecord)),
        tryMarkTokenAsUsed: jest.fn().mockReturnValue(right({ marked: false, record: usedRecord })),
      });

      const result = await refreshTokensUseCase(oldToken)(env)();

      expect(isRight(result)).toBe(true);
      if (isRight(result)) {
        expect(result.right.accessToken).toBe('new-access-token');
        expect(result.right.refreshToken).toBe('existing-replacement-token');
      }
    });

    it('should return TokenExpired when grace period has passed', async () => {
      const tokenRecord = createTestRefreshToken();
      const usedRecord = createTestRefreshToken({
        usedAt: new Date(Date.now() - 10000), // used 10 seconds ago (outside 5s grace)
        replacementToken: 'existing-replacement-token',
      });

      const env = createMockEnv({
        getRefreshToken: jest.fn().mockReturnValue(right(tokenRecord)),
        tryMarkTokenAsUsed: jest.fn().mockReturnValue(right({ marked: false, record: usedRecord })),
      });

      const result = await refreshTokensUseCase(oldToken)(env)();

      expect(isLeft(result)).toBe(true);
      if (isLeft(result)) {
        expect(result.left._tag).toBe('TokenExpired');
      }
    });

    it('should return InvalidToken when record has no usedAt', async () => {
      const tokenRecord = createTestRefreshToken();
      const usedRecord = createTestRefreshToken({
        usedAt: null,
        replacementToken: 'existing-replacement-token',
      });

      const env = createMockEnv({
        getRefreshToken: jest.fn().mockReturnValue(right(tokenRecord)),
        tryMarkTokenAsUsed: jest.fn().mockReturnValue(right({ marked: false, record: usedRecord })),
      });

      const result = await refreshTokensUseCase(oldToken)(env)();

      expect(isLeft(result)).toBe(true);
      if (isLeft(result)) {
        expect(result.left._tag).toBe('InvalidToken');
      }
    });

    it('should return InvalidToken when record has no replacementToken', async () => {
      const tokenRecord = createTestRefreshToken();
      const usedRecord = createTestRefreshToken({
        usedAt: new Date(),
        replacementToken: null,
      });

      const env = createMockEnv({
        getRefreshToken: jest.fn().mockReturnValue(right(tokenRecord)),
        tryMarkTokenAsUsed: jest.fn().mockReturnValue(right({ marked: false, record: usedRecord })),
      });

      const result = await refreshTokensUseCase(oldToken)(env)();

      expect(isLeft(result)).toBe(true);
      if (isLeft(result)) {
        expect(result.left._tag).toBe('InvalidToken');
      }
    });
  });
});
