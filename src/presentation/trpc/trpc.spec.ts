import { TRPCError } from '@trpc/server';

jest.mock('~/utils/transformer', () => ({
  transformer: {
    serialize: (v: unknown) => ({ json: v, meta: undefined }),
    deserialize: (v: { json: unknown }) => v.json,
  },
}));

// Mock functions - must return TaskEither (function returning Promise<Either>)
const mockVerifyAccessToken = jest.fn();
const mockVerifyRefreshToken = jest.fn();
const mockSetAuthCookies = jest.fn();
const mockClearAuthCookies = jest.fn();

jest.mock('~/infrastructure/auth', () => ({
  verifyAccessToken: (...args: unknown[]) => mockVerifyAccessToken(...args),
  verifyRefreshToken: (...args: unknown[]) => mockVerifyRefreshToken(...args),
  setAuthCookies: (...args: unknown[]) => mockSetAuthCookies(...args),
  clearAuthCookies: (...args: unknown[]) => mockClearAuthCookies(...args),
}));

const mockRefreshTokensUseCase = jest.fn();
jest.mock('~/application/use-cases', () => ({
  refreshTokensUseCase: (...args: unknown[]) => mockRefreshTokensUseCase(...args),
}));

jest.mock('~/infrastructure/effects/ai/openai.effects', () => ({
  createOpenAIEffects: () => ({
    generateChatCompletion: jest.fn(),
  }),
}));

import { createAppEnv } from '~/infrastructure/env';
import { protectedProcedure, router } from '~/presentation/trpc/trpc';
import { createMockDB, TEST_UUID } from '~/test/fixtures';

describe('trpc', () => {
  describe('protectedProcedure', () => {
    const testRouter = router({
      protectedRoute: protectedProcedure.query(({ ctx }) => ({
        userId: ctx.userId,
        userEmail: ctx.userEmail,
      })),
    });

    const createCaller = (accessToken: string | null, refreshToken: string | null = null) => {
      const db = createMockDB();
      const env = createAppEnv({ db: db as never, openai: { apiKey: 'test-key' } });
      return testRouter.createCaller({ env, accessToken, refreshToken, signal: new AbortController().signal });
    };

    beforeEach(() => {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { left: teLeft, right: teRight } = require('fp-ts/TaskEither');
      mockVerifyAccessToken.mockReset();
      mockVerifyRefreshToken.mockReset();
      mockSetAuthCookies.mockReset();
      mockClearAuthCookies.mockReset();
      mockRefreshTokensUseCase.mockReset();
      // Set up default return values
      mockVerifyAccessToken.mockReturnValue(teLeft({ _tag: 'InvalidToken' }));
      mockSetAuthCookies.mockReturnValue(teRight(undefined));
      mockClearAuthCookies.mockReturnValue(teRight(undefined));
    });

    it('should throw UNAUTHORIZED when no access token provided', async () => {
      const caller = createCaller(null);

      await expect(caller.protectedRoute()).rejects.toThrow(TRPCError);
      await expect(caller.protectedRoute()).rejects.toMatchObject({
        code: 'UNAUTHORIZED',
        message: 'Authentication required',
      });
    });

    it('should throw UNAUTHORIZED when token verification fails and no refresh token', async () => {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { left: teLeft } = require('fp-ts/TaskEither');
      mockVerifyAccessToken.mockReturnValue(teLeft({ _tag: 'InvalidToken' }));
      const caller = createCaller('invalid-token');

      await expect(caller.protectedRoute()).rejects.toThrow(TRPCError);
      await expect(caller.protectedRoute()).rejects.toMatchObject({
        code: 'UNAUTHORIZED',
        message: 'Authentication required',
      });
    });

    it('should pass userId and userEmail to context when token is valid', async () => {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { right: teRight } = require('fp-ts/TaskEither');
      mockVerifyAccessToken.mockReturnValue(teRight({ userId: TEST_UUID.user, email: 'test@example.com' }));
      const caller = createCaller('valid-token');

      const result = await caller.protectedRoute();

      expect(result.userEmail).toBe('test@example.com');
      expect(mockVerifyAccessToken).toHaveBeenCalledWith('valid-token');
    });

    it('should refresh tokens when access token is expired but refresh token is valid', async () => {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { left: teLeft, right: teRight } = require('fp-ts/TaskEither');
      mockVerifyAccessToken.mockReturnValue(teLeft({ _tag: 'TokenExpired' }));
      mockRefreshTokensUseCase.mockReturnValue(() =>
        teRight({ accessToken: 'new-access', refreshToken: 'new-refresh' })
      );
      mockVerifyRefreshToken.mockReturnValue(teRight({ userId: TEST_UUID.user, email: 'refreshed@example.com' }));

      const caller = createCaller('expired-access', 'valid-refresh');
      const result = await caller.protectedRoute();

      expect(result.userEmail).toBe('refreshed@example.com');
      expect(mockSetAuthCookies).toHaveBeenCalledWith('new-access', 'new-refresh');
      expect(mockRefreshTokensUseCase).toHaveBeenCalledWith('valid-refresh');
    });

    it('should clear cookies and throw when refresh token is invalid', async () => {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { left: teLeft } = require('fp-ts/TaskEither');
      mockVerifyAccessToken.mockReturnValue(teLeft({ _tag: 'TokenExpired' }));
      mockRefreshTokensUseCase.mockReturnValue(() => teLeft({ _tag: 'NotFound', entity: 'RefreshToken', id: 'token' }));

      const caller = createCaller('expired-access', 'invalid-refresh');

      await expect(caller.protectedRoute()).rejects.toMatchObject({
        code: 'UNAUTHORIZED',
      });
      expect(mockClearAuthCookies).toHaveBeenCalled();
    });

    it('should refresh tokens when no access token but refresh token is valid', async () => {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { right: teRight } = require('fp-ts/TaskEither');
      mockRefreshTokensUseCase.mockReturnValue(() =>
        teRight({ accessToken: 'new-access', refreshToken: 'new-refresh' })
      );
      mockVerifyRefreshToken.mockReturnValue(teRight({ userId: TEST_UUID.user, email: 'no-access@example.com' }));

      const caller = createCaller(null, 'valid-refresh');
      const result = await caller.protectedRoute();

      expect(result.userEmail).toBe('no-access@example.com');
      expect(mockVerifyAccessToken).not.toHaveBeenCalled();
      expect(mockSetAuthCookies).toHaveBeenCalledWith('new-access', 'new-refresh');
    });
  });
});
