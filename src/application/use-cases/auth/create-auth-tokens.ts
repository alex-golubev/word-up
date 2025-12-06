import { sequenceS } from 'fp-ts/Apply';
import { pipe } from 'fp-ts/function';
import { ApplyPar, chain, map } from 'fp-ts/TaskEither';

import { createAccessToken, createRefreshToken, getRefreshTokenExpiry } from '~/infrastructure/auth';

import type { TaskEither } from 'fp-ts/TaskEither';

import type { AppEnv } from '~/application/env';
import type { AppError } from '~/domain/errors';
import type { AuthTokens, UserId } from '~/domain/types';

type TokenPayload = {
  readonly userId: UserId;
  readonly email: string;
};

/**
 * Creates access and refresh tokens in parallel.
 * JWT functions now return TaskEither directly - no tryCatch needed.
 */
export const createAuthTokenPair = (
  payload: TokenPayload
): TaskEither<AppError, { accessToken: string; refreshToken: string }> =>
  sequenceS(ApplyPar)({
    accessToken: createAccessToken(payload),
    refreshToken: createRefreshToken(payload),
  });

/**
 * Creates tokens and persists refresh token to DB.
 * Returns only the token pair (without user data).
 */
export const createAndPersistAuthTokens = (
  env: AppEnv,
  userId: UserId,
  email: string
): TaskEither<AppError, AuthTokens> =>
  pipe(
    createAuthTokenPair({ userId, email }),
    chain((tokens) =>
      pipe(
        env.saveRefreshToken(userId, tokens.refreshToken, getRefreshTokenExpiry()),
        map(() => tokens)
      )
    )
  );
