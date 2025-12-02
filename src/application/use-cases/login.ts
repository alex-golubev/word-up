import { pipe } from 'fp-ts/function';
import { chain, left, map, right, tryCatch } from 'fp-ts/TaskEither';
import type { AppReader } from '~/application/reader';
import type { AuthTokens } from '~/domain/types';
import { dbError, invalidCredentials } from '~/domain/types';
import { createAccessToken, createRefreshToken, getRefreshTokenExpiry, verifyPassword } from '~/infrastructure/auth';

export type LoginParams = {
  readonly email: string;
  readonly password: string;
};

export const loginUseCase =
  (params: LoginParams): AppReader<AuthTokens> =>
  (env) =>
    pipe(
      // 1. Find user by email
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
      chain((user) =>
        tryCatch(
          async () => {
            const payload = { userId: user.id, email: user.email };
            const [accessToken, refreshToken] = await Promise.all([
              createAccessToken(payload),
              createRefreshToken(payload),
            ]);
            return { user, accessToken, refreshToken };
          },
          (error) => dbError(error)
        )
      ),

      // 4. Save refresh token to DB
      chain(({ user, accessToken, refreshToken }) =>
        pipe(
          env.saveRefreshToken(user.id, refreshToken, getRefreshTokenExpiry()),
          map(() => ({ accessToken, refreshToken }))
        )
      )
    );
