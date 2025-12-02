import { TRPCError } from '@trpc/server';
import { left, right } from 'fp-ts/Either';

jest.mock('~/utils/transformer', () => ({
  transformer: {
    serialize: (v: unknown) => ({ json: v, meta: undefined }),
    deserialize: (v: { json: unknown }) => v.json,
  },
}));

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

jest.mock('~/infrastructure/effects/openai.effects', () => ({
  createOpenAIEffects: () => ({
    generateChatCompletion: jest.fn(),
  }),
}));

import { router, protectedProcedure } from '~/presentation/trpc/trpc';
import { createAppEnv } from '~/infrastructure/env';
import { createMockDB } from '~/test/fixtures';

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
      return testRouter.createCaller({ env, accessToken, refreshToken });
    };

    beforeEach(() => {
      mockVerifyAccessToken.mockReset();
      mockVerifyRefreshToken.mockReset();
      mockSetAuthCookies.mockReset();
      mockClearAuthCookies.mockReset();
      mockRefreshTokensUseCase.mockReset();
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
      mockVerifyAccessToken.mockRejectedValue(new Error('Invalid token'));
      const caller = createCaller('invalid-token');

      await expect(caller.protectedRoute()).rejects.toThrow(TRPCError);
      await expect(caller.protectedRoute()).rejects.toMatchObject({
        code: 'UNAUTHORIZED',
        message: 'Authentication required',
      });
    });

    it('should pass userId and userEmail to context when token is valid', async () => {
      mockVerifyAccessToken.mockResolvedValue({
        userId: '11111111-1111-1111-1111-111111111111',
        email: 'test@example.com',
      });
      const caller = createCaller('valid-token');

      const result = await caller.protectedRoute();

      expect(result.userEmail).toBe('test@example.com');
      expect(mockVerifyAccessToken).toHaveBeenCalledWith('valid-token');
    });

    it('should refresh tokens when access token is expired but refresh token is valid', async () => {
      mockVerifyAccessToken.mockRejectedValue(new Error('Token expired'));
      mockRefreshTokensUseCase.mockReturnValue(
        () => () => Promise.resolve(right({ accessToken: 'new-access', refreshToken: 'new-refresh' }))
      );
      mockVerifyRefreshToken.mockResolvedValue({
        userId: '22222222-2222-2222-2222-222222222222',
        email: 'refreshed@example.com',
      });

      const caller = createCaller('expired-access', 'valid-refresh');
      const result = await caller.protectedRoute();

      expect(result.userEmail).toBe('refreshed@example.com');
      expect(mockSetAuthCookies).toHaveBeenCalledWith('new-access', 'new-refresh');
      expect(mockRefreshTokensUseCase).toHaveBeenCalledWith('valid-refresh');
    });

    it('should clear cookies and throw when refresh token is invalid', async () => {
      mockVerifyAccessToken.mockRejectedValue(new Error('Token expired'));
      mockRefreshTokensUseCase.mockReturnValue(
        () => () => Promise.resolve(left({ _tag: 'NotFound', entity: 'RefreshToken', id: 'token' }))
      );

      const caller = createCaller('expired-access', 'invalid-refresh');

      await expect(caller.protectedRoute()).rejects.toMatchObject({
        code: 'UNAUTHORIZED',
        message: 'Session expired',
      });
      expect(mockClearAuthCookies).toHaveBeenCalled();
    });
  });
});
