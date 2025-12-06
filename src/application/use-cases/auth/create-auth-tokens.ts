import { sequenceS } from 'fp-ts/Apply';
import { pipe } from 'fp-ts/function';
import { ApplyPar, chain, map, tryCatch } from 'fp-ts/TaskEither';

import { dbError } from '~/domain/types';
import { createAccessToken, createRefreshToken, getRefreshTokenExpiry } from '~/infrastructure/auth';

import type { TaskEither } from 'fp-ts/TaskEither';

import type { AppEnv } from '~/application/env';
import type { AuthTokens, UserId } from '~/domain/types';

type TokenPayload = {
  readonly userId: UserId;
  readonly email: string;
};

/**
 * Creates access and refresh tokens in parallel.
 */
export const createAuthTokenPair = (
  payload: TokenPayload
): TaskEither<ReturnType<typeof dbError>, { accessToken: string; refreshToken: string }> =>
  sequenceS(ApplyPar)({
    accessToken: tryCatch(() => createAccessToken(payload), dbError),
    refreshToken: tryCatch(() => createRefreshToken(payload), dbError),
  });

/**
 * Creates tokens and persists refresh token to DB.
 * Returns only the token pair (without user data).
 */
export const createAndPersistAuthTokens = (
  env: AppEnv,
  userId: UserId,
  email: string
): TaskEither<ReturnType<typeof dbError>, AuthTokens> =>
  pipe(
    createAuthTokenPair({ userId, email }),
    chain((tokens) =>
      pipe(
        env.saveRefreshToken(userId, tokens.refreshToken, getRefreshTokenExpiry()),
        map(() => tokens)
      )
    )
  );
