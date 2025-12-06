import { sequenceS } from 'fp-ts/Apply';
import { pipe } from 'fp-ts/function';
import { ApplyPar, chain, left, map, right, tryCatch } from 'fp-ts/TaskEither';

import type { AppReader } from '~/application/reader';
import type { AuthTokens, Language } from '~/domain/types';
import { dbError, emailAlreadyExists } from '~/domain/types';
import { createAccessToken, createRefreshToken, getRefreshTokenExpiry, hashPassword } from '~/infrastructure/auth';

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

      // 4. Create JWT tokens
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

      // 5. Save refresh token to DB
      chain(({ user, accessToken, refreshToken }) =>
        pipe(
          env.saveRefreshToken(user.id, refreshToken, getRefreshTokenExpiry()),
          map(() => ({ accessToken, refreshToken }))
        )
      )
    );
