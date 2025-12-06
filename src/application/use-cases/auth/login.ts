import { sequenceS } from 'fp-ts/Apply';
import { pipe } from 'fp-ts/function';
import { ApplyPar, chain, left, map, right, tryCatch } from 'fp-ts/TaskEither';

import type { AppReader } from '~/application/reader';
import { dbError, invalidCredentials } from '~/domain/types';
import type { AuthTokens } from '~/domain/types';
import { createAccessToken, createRefreshToken, getRefreshTokenExpiry, verifyPassword } from '~/infrastructure/auth';

export type LoginParams = {
  readonly email: string;
  readonly password: string;
};

export const loginUseCase =
  (params: LoginParams): AppReader<AuthTokens> =>
  (env) =>
    pipe(
      // 1. Find the user by email
      env.getUserByEmail(params.email),
      chain((user) => (user && user.passwordHash ? right(user) : left(invalidCredentials()))),

      // 2. Verify password
      chain((user) =>
        pipe(
          tryCatch(
            () => verifyPassword(params.password, user.passwordHash!),
            (error) => dbError(error)
          ),
          chain((isValid) => (isValid ? right(user) : left(invalidCredentials())))
        )
      ),

      // 3. Create JWT tokens
      chain((user) => {
        const payload = { userId: user.id, email: user.email };
        return pipe(
          sequenceS(ApplyPar)({
            accessToken: tryCatch(() => createAccessToken(payload), dbError),
            refreshToken: tryCatch(() => createRefreshToken(payload), dbError),
          }),
          map((tokens) => ({ user, ...tokens }))
        );
      }),

      // 4. Save a refresh token to DB
      chain(({ user, accessToken, refreshToken }) =>
        pipe(
          env.saveRefreshToken(user.id, refreshToken, getRefreshTokenExpiry()),
          map(() => ({ accessToken, refreshToken }))
        )
      )
    );
