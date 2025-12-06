import { initTRPC, TRPCError } from '@trpc/server';
import { isLeft } from 'fp-ts/Either';
import { pipe } from 'fp-ts/function';
import { chain } from 'fp-ts/TaskEither';

import { refreshTokensUseCase } from '~/application/use-cases';
import { getErrorMessage, makeUserId, unauthorized as unauthorizedError } from '~/domain/types';
import { clearAuthCookies, setAuthCookies, verifyAccessToken, verifyRefreshToken } from '~/infrastructure/auth';
import { transformer } from '~/utils/transformer';

import type { TaskEither } from 'fp-ts/TaskEither';

import type { AppError, JwtPayload, UserId } from '~/domain/types';
import type { Context } from '~/presentation/trpc/context';

const t = initTRPC.context<Context>().create({
  transformer,
});

type AuthResult = {
  readonly userId: UserId;
  readonly userEmail: string;
  readonly newRefreshToken?: string;
};

// Try to verify access token, return null on failure (not an error - just means we need to refresh)
const tryVerifyAccess =
  (token: string): TaskEither<AppError, JwtPayload | null> =>
  async () => {
    const result = await verifyAccessToken(token)();
    return isLeft(result) ? { _tag: 'Right' as const, right: null } : result;
  };

// Full auth flow using TaskEither
const authenticateUser = (ctx: Context): TaskEither<AppError, AuthResult> => {
  // No tokens at all
  if (!ctx.accessToken && !ctx.refreshToken) {
    return async () => ({ _tag: 'Left', left: unauthorizedError() });
  }

  // Try an access token first
  if (ctx.accessToken) {
    return pipe(
      tryVerifyAccess(ctx.accessToken),
      chain((payload) => {
        if (payload) {
          // Access token valid - parse userId
          const userIdResult = makeUserId(payload.userId);
          if (isLeft(userIdResult)) {
            return async () => ({ _tag: 'Left' as const, left: userIdResult.left });
          }
          return async () => ({
            _tag: 'Right' as const,
            right: { userId: userIdResult.right, userEmail: payload.email },
          });
        }
        // Access token invalid - try refresh
        return refreshFlow(ctx);
      })
    );
  }

  // Only refresh token available
  return refreshFlow(ctx);
};

// Refresh token flow
const refreshFlow = (ctx: Context): TaskEither<AppError, AuthResult> => {
  if (!ctx.refreshToken) {
    return async () => ({ _tag: 'Left', left: unauthorizedError() });
  }

  return pipe(
    refreshTokensUseCase(ctx.refreshToken)(ctx.env),
    chain((tokens) =>
      pipe(
        setAuthCookies(tokens.accessToken, tokens.refreshToken),
        chain(() => verifyRefreshToken(ctx.refreshToken!)),
        chain((payload) => {
          const userIdResult = makeUserId(payload.userId);
          if (isLeft(userIdResult)) {
            return async () => ({ _tag: 'Left' as const, left: userIdResult.left });
          }
          return async () => ({
            _tag: 'Right' as const,
            right: {
              userId: userIdResult.right,
              userEmail: payload.email,
              newRefreshToken: tokens.refreshToken,
            },
          });
        })
      )
    )
  );
};

const isAuthed = t.middleware(async ({ ctx, next }) => {
  const result = await authenticateUser(ctx)();

  if (isLeft(result)) {
    // Clear cookies on auth failure (fire-and-forget)
    void clearAuthCookies()();
    throw new TRPCError({ code: 'UNAUTHORIZED', message: getErrorMessage(result.left) });
  }

  const auth = result.right;
  return next({
    ctx: {
      ...ctx,
      userId: auth.userId,
      userEmail: auth.userEmail,
      ...(auth.newRefreshToken && { refreshToken: auth.newRefreshToken }),
    },
  });
});

export const router = t.router;
export const publicProcedure = t.procedure;
export const protectedProcedure = t.procedure.use(isAuthed);
