import { sequenceS } from 'fp-ts/Apply';
import { pipe } from 'fp-ts/function';
import { ApplyPar, chain, left, map, right } from 'fp-ts/TaskEither';

import { invalidToken, tokenExpired } from '~/domain/types';
import {
  createAccessToken,
  createRefreshToken,
  getRefreshTokenExpiry,
  REFRESH_TOKEN_GRACE_PERIOD_MS,
  verifyRefreshToken,
} from '~/infrastructure/auth';

import type { AppReader } from '~/application/reader';
import type { AuthTokens } from '~/domain/types';

export const refreshTokensUseCase =
  (oldRefreshToken: string): AppReader<AuthTokens> =>
  (env) =>
    pipe(
      env.getRefreshToken(oldRefreshToken),
      chain((tokenRecord) => (tokenRecord ? right(tokenRecord) : left(invalidToken()))),
      chain((tokenRecord) => (tokenRecord.expiresAt > new Date() ? right(tokenRecord) : left(tokenExpired()))),
      // verifyRefreshToken now returns TaskEither directly
      chain((tokenRecord) =>
        pipe(
          verifyRefreshToken(oldRefreshToken),
          map((payload) => ({ tokenRecord, payload }))
        )
      ),
      // createAccessToken and createRefreshToken now return TaskEither directly
      chain(({ tokenRecord, payload }) =>
        pipe(
          sequenceS(ApplyPar)({
            accessToken: createAccessToken(payload),
            refreshToken: createRefreshToken(payload),
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

            // createAccessToken returns TaskEither, map to a final result
            return pipe(
              createAccessToken(payload),
              map((newAccessToken) => ({
                accessToken: newAccessToken,
                refreshToken: record.replacementToken!,
              }))
            );
          })
        )
      )
    );
