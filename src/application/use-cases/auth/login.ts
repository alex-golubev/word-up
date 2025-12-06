import { pipe } from 'fp-ts/function';
import { chain, left, right, tryCatch } from 'fp-ts/TaskEither';

import { createAndPersistAuthTokens } from '~/application/use-cases/auth/create-auth-tokens';
import { dbError, invalidCredentials } from '~/domain/types';
import { verifyPassword } from '~/infrastructure/auth';

import type { AppReader } from '~/application/reader';
import type { AuthTokens } from '~/domain/types';

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

      // 3. Create JWT tokens and save a refresh token
      chain((user) => createAndPersistAuthTokens(env, user.id, user.email))
    );
