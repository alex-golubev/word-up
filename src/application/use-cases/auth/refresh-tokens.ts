import { sequenceS } from 'fp-ts/Apply';
import { pipe } from 'fp-ts/function';
import { ApplyPar, chain, left, map, right, tryCatch } from 'fp-ts/TaskEither';

import type { AppReader } from '~/application/reader';
import type { AuthTokens } from '~/domain/types';
import { dbError, invalidToken, tokenExpired } from '~/domain/types';
import {
  createAccessToken,
  createRefreshToken,
  getRefreshTokenExpiry,
  REFRESH_TOKEN_GRACE_PERIOD_MS,
  verifyRefreshToken,
} from '~/infrastructure/auth';

export const refreshTokensUseCase =
  (oldRefreshToken: string): AppReader<AuthTokens> =>
  (env) =>
    pipe(
      env.getRefreshToken(oldRefreshToken),
      chain((tokenRecord) => (tokenRecord ? right(tokenRecord) : left(invalidToken()))),
      chain((tokenRecord) => (tokenRecord.expiresAt > new Date() ? right(tokenRecord) : left(tokenExpired()))),
      chain((tokenRecord) =>
        pipe(
          tryCatch(
            () => verifyRefreshToken(oldRefreshToken),
            () => invalidToken()
          ),
          map((payload) => ({ tokenRecord, payload }))
        )
      ),
      chain(({ tokenRecord, payload }) =>
        pipe(
          sequenceS(ApplyPar)({
            accessToken: tryCatch(() => createAccessToken(payload), dbError),
            refreshToken: tryCatch(() => createRefreshToken(payload), dbError),
          }),
          map((tokens) => ({ tokenRecord, payload, ...tokens }))
        )
      ),
      chain(({ tokenRecord, payload, accessToken, refreshToken }) =>
        pipe(
          env.tryMarkTokenAsUsed(oldRefreshToken, refreshToken),
          chain(({ marked, record }) => {
            if (marked) {
              return pipe(
                env.saveRefreshToken(tokenRecord.userId, refreshToken, getRefreshTokenExpiry()),
                map(() => ({ accessToken, refreshToken }))
              );
            }

            if (!record.usedAt || !record.replacementToken) {
              return left(invalidToken());
            }

            const elapsed = Date.now() - record.usedAt.getTime();
            if (elapsed > REFRESH_TOKEN_GRACE_PERIOD_MS) {
              return left(tokenExpired());
            }

            return tryCatch(
              async () => ({
                accessToken: await createAccessToken(payload),
                refreshToken: record.replacementToken!,
              }),
              (error) => dbError(error)
            );
          })
        )
      )
    );
