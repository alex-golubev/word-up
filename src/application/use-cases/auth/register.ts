import { pipe } from 'fp-ts/function';
import { chain, left, right, tryCatch } from 'fp-ts/TaskEither';

import { createAndPersistAuthTokens } from '~/application/use-cases/auth/create-auth-tokens';
import { dbError, emailAlreadyExists } from '~/domain/types';
import { hashPassword } from '~/infrastructure/auth';

import type { AppReader } from '~/application/reader';
import type { AuthTokens, Language } from '~/domain/types';

export type RegisterParams = {
  readonly email: string;
  readonly password: string;
  readonly name?: string;
  readonly nativeLanguage: Language;
};

export const registerUseCase =
  (params: RegisterParams): AppReader<AuthTokens> =>
  (env) =>
    pipe(
      // 1. Check that email is not taken
      env.getUserByEmail(params.email),
      chain((existingUser) => (existingUser ? left(emailAlreadyExists(params.email)) : right(undefined))),

      // 2. Hash the password
      chain(() =>
        tryCatch(
          () => hashPassword(params.password),
          (error) => dbError(error)
        )
      ),

      // 3. Create the user
      chain((passwordHash) =>
        env.createUser({
          email: params.email,
          passwordHash,
          name: params.name ?? null,
          nativeLanguage: params.nativeLanguage,
        })
      ),

      // 4. Create JWT tokens and save refresh token
      chain((user) => createAndPersistAuthTokens(env, user.id, user.email))
    );
