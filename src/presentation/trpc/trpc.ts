import { initTRPC, TRPCError } from '@trpc/server';
import { isLeft } from 'fp-ts/Either';

import { refreshTokensUseCase } from '~/application/use-cases';
import { makeUserId } from '~/domain/types';
import { clearAuthCookies, setAuthCookies, verifyAccessToken, verifyRefreshToken } from '~/infrastructure/auth';
import { transformer } from '~/utils/transformer';

import type { Context } from '~/presentation/trpc/context';

const t = initTRPC.context<Context>().create({
  transformer,
});

export const router = t.router;
export const publicProcedure = t.procedure;

const isAuthed = t.middleware(async ({ ctx, next }) => {
  if (!ctx.accessToken && !ctx.refreshToken) {
    throw new TRPCError({ code: 'UNAUTHORIZED', message: 'Authentication required' });
  }

  // Try access token first
  if (ctx.accessToken) {
    try {
      const payload = await verifyAccessToken(ctx.accessToken);
      return next({
        ctx: {
          ...ctx,
          userId: makeUserId(payload.userId),
          userEmail: payload.email,
        },
      });
    } catch {
      // Access token invalid/expired, try refresh
    }
  }

  // Try to refresh
  if (!ctx.refreshToken) {
    throw new TRPCError({ code: 'UNAUTHORIZED', message: 'Authentication required' });
  }

  const result = await refreshTokensUseCase(ctx.refreshToken)(ctx.env)();

  if (isLeft(result)) {
    await clearAuthCookies();
    throw new TRPCError({ code: 'UNAUTHORIZED', message: 'Session expired' });
  }

  const tokens = result.right;
  await setAuthCookies(tokens.accessToken, tokens.refreshToken);

  const payload = await verifyRefreshToken(ctx.refreshToken);

  return next({
    ctx: {
      ...ctx,
      refreshToken: tokens.refreshToken,
      userId: makeUserId(payload.userId),
      userEmail: payload.email,
    },
  });
});

export const protectedProcedure = t.procedure.use(isAuthed);
