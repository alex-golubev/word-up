jest.mock('~/utils/transformer', () => ({
  transformer: {
    serialize: (v: unknown) => ({ json: v, meta: undefined }),
    deserialize: (v: { json: unknown }) => v.json,
  },
}));

// Mock functions - must return TaskEither (function returning Promise<Either>)
const mockSetAuthCookies = jest.fn();
const mockClearAuthCookies = jest.fn();
const mockVerifyAccessToken = jest.fn();

jest.mock('~/infrastructure/auth', () => {
  const { right } = jest.requireActual('fp-ts/TaskEither');
  return {
    setAuthCookies: (...args: unknown[]) => mockSetAuthCookies(...args),
    clearAuthCookies: () => mockClearAuthCookies(),
    verifyAccessToken: (...args: unknown[]) => mockVerifyAccessToken(...args),
    hashPassword: jest.fn().mockResolvedValue('hashed'),
    verifyPassword: jest.fn().mockResolvedValue(true),
    createAccessToken: jest.fn().mockReturnValue(right('access-token')),
    createRefreshToken: jest.fn().mockReturnValue(right('refresh-token')),
    getRefreshTokenExpiry: jest.fn().mockReturnValue(new Date()),
  };
});

jest.mock('~/infrastructure/effects/ai/openai.effects', () => ({
  createOpenAIEffects: () => ({
    generateChatCompletion: jest.fn(),
  }),
}));

import { createAppEnv } from '~/infrastructure/env';
import { authRouter } from '~/presentation/trpc/routers/auth.router';
import { createMockDB, createTestRefreshTokenRow, createTestUserRow, TEST_UUID } from '~/test/fixtures';

const createCaller = (
  db: ReturnType<typeof createMockDB>,
  opts: { accessToken?: string | null; refreshToken?: string | null } = {}
) => {
  const env = createAppEnv({ db: db as never, openai: { apiKey: 'test-key' } });
  return authRouter.createCaller({
    env,
    accessToken: opts.accessToken ?? null,
    refreshToken: opts.refreshToken ?? null,
    signal: new AbortController().signal,
  });
};

describe('authRouter', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { right } = require('fp-ts/TaskEither');
    // Set up default mock return values as TaskEither
    mockSetAuthCookies.mockReturnValue(right(undefined));
    mockClearAuthCookies.mockReturnValue(right(undefined));
    mockVerifyAccessToken.mockReturnValue(right({ userId: TEST_UUID.user, email: 'test@example.com' }));
  });

  describe('register', () => {
    it('should register user and set auth cookies', async () => {
      const mockDb = createMockDB();
      const userRow = createTestUserRow();

      // getUserByEmail returns null (user doesn't exist)
      mockDb._mocks.mockWhere.mockResolvedValueOnce([]);
      // saveUser returns the user
      mockDb._mocks.mockReturning.mockResolvedValueOnce([userRow]);
      // saveRefreshToken returns the token
      mockDb._mocks.mockReturning.mockResolvedValueOnce([createTestRefreshTokenRow()]);

      const caller = createCaller(mockDb);
      const result = await caller.register({
        email: 'test@example.com',
        password: 'Password123!',
        name: 'Test User',
        nativeLanguage: 'en',
      });

      expect(result).toEqual({ success: true });
      expect(mockSetAuthCookies).toHaveBeenCalledWith('access-token', 'refresh-token');
    });

    it('should throw error when email already exists', async () => {
      const mockDb = createMockDB();
      const userRow = createTestUserRow();

      mockDb._mocks.mockWhere.mockResolvedValueOnce([userRow]);

      const caller = createCaller(mockDb);

      await expect(
        caller.register({
          email: 'test@example.com',
          password: 'Password123!',
          name: 'Test User',
          nativeLanguage: 'en',
        })
      ).rejects.toMatchObject({
        code: 'CONFLICT',
      });
    });
  });

  describe('login', () => {
    it('should login user and set auth cookies', async () => {
      const mockDb = createMockDB();
      const userRow = createTestUserRow();

      // getUserByEmail returns user
      mockDb._mocks.mockWhere.mockResolvedValueOnce([userRow]);
      // saveRefreshToken returns the token
      mockDb._mocks.mockReturning.mockResolvedValueOnce([createTestRefreshTokenRow()]);

      const caller = createCaller(mockDb);
      const result = await caller.login({
        email: 'test@example.com',
        password: 'Password123!',
      });

      expect(result).toEqual({ success: true });
      expect(mockSetAuthCookies).toHaveBeenCalledWith('access-token', 'refresh-token');
    });

    it('should throw error for invalid credentials', async () => {
      const mockDb = createMockDB();

      mockDb._mocks.mockWhere.mockResolvedValueOnce([]);

      const caller = createCaller(mockDb);

      await expect(
        caller.login({
          email: 'test@example.com',
          password: 'Password123!',
        })
      ).rejects.toMatchObject({
        code: 'UNAUTHORIZED',
      });
    });
  });

  describe('logout', () => {
    it('should logout user and clear auth cookies', async () => {
      const mockDb = createMockDB();

      // mockVerifyAccessToken is set up in beforeEach with right({ userId, email })

      // deleteRefreshToken
      mockDb._mocks.mockWhere.mockResolvedValueOnce([]);

      const caller = createCaller(mockDb, {
        accessToken: 'valid-access-token',
        refreshToken: 'valid-refresh-token',
      });
      const result = await caller.logout();

      expect(result).toEqual({ success: true });
      expect(mockClearAuthCookies).toHaveBeenCalled();
    });
  });

  describe('me', () => {
    it('should return current user', async () => {
      const mockDb = createMockDB();
      const userRow = createTestUserRow();

      // mockVerifyAccessToken is set up in beforeEach with right({ userId, email })

      mockDb._mocks.mockWhere.mockResolvedValueOnce([userRow]);

      const caller = createCaller(mockDb, { accessToken: 'valid-token' });
      const result = await caller.me();

      expect(result.id).toBe(TEST_UUID.user);
      expect(result.email).toBe('test@example.com');
    });

    it('should throw error when user not found', async () => {
      const mockDb = createMockDB();

      // mockVerifyAccessToken is set up in beforeEach with right({ userId, email })

      mockDb._mocks.mockWhere.mockResolvedValueOnce([]);

      const caller = createCaller(mockDb, { accessToken: 'valid-token' });

      await expect(caller.me()).rejects.toMatchObject({
        code: 'NOT_FOUND',
      });
    });
  });
});
