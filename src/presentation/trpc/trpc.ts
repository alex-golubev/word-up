import { initTRPC, TRPCError } from '@trpc/server';
import { isLeft } from 'fp-ts/Either';

import { refreshTokensUseCase } from '~/application/use-cases';
import { makeUserId } from '~/domain/types';
import { clearAuthCookies, setAuthCookies, verifyAccessToken, verifyRefreshToken } from '~/infrastructure/auth';
import { transformer } from '~/utils/transformer';

import type { JwtPayload } from '~/domain/types';
import type { Context } from '~/presentation/trpc/context';

const t = initTRPC.context<Context>().create({
  transformer,
});

const unauthorized = (message = 'Authentication required'): never => {
  throw new TRPCError({ code: 'UNAUTHORIZED', message });
};

const tryVerifyAccessToken = async (token: string): Promise<JwtPayload | null> => {
  try {
    return await verifyAccessToken(token);
  } catch {
    return null;
  }
};

const tryRefreshTokens = async (ctx: Context): Promise<{ payload: JwtPayload; refreshToken: string }> => {
  if (!ctx.refreshToken) return unauthorized();

  const result = await refreshTokensUseCase(ctx.refreshToken)(ctx.env)();

  if (isLeft(result)) {
    await clearAuthCookies();
    return unauthorized('Session expired');
  }

  const tokens = result.right;
  await setAuthCookies(tokens.accessToken, tokens.refreshToken);

  const payload = await verifyRefreshToken(ctx.refreshToken);
  return { payload, refreshToken: tokens.refreshToken };
};

const isAuthed = t.middleware(async ({ ctx, next }) => {
  if (!ctx.accessToken && !ctx.refreshToken) unauthorized();

  const payload = ctx.accessToken ? await tryVerifyAccessToken(ctx.accessToken) : null;

  if (payload) {
    return next({ ctx: { ...ctx, userId: makeUserId(payload.userId), userEmail: payload.email } });
  }

  const refreshed = await tryRefreshTokens(ctx);
  return next({
    ctx: {
      ...ctx,
      refreshToken: refreshed.refreshToken,
      userId: makeUserId(refreshed.payload.userId),
      userEmail: refreshed.payload.email,
    },
  });
});

export const router = t.router;
export const publicProcedure = t.procedure;
export const protectedProcedure = t.procedure.use(isAuthed);
