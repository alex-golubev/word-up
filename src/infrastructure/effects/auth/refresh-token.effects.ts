import { and, eq, isNull } from 'drizzle-orm';
import { isLeft, map } from 'fp-ts/Either';
import { pipe } from 'fp-ts/function';
import { chain, left, right, tryCatch } from 'fp-ts/TaskEither';

import { dbError, makeUserId, notFound } from '~/domain/types';
import { deleteMany, insertOne, queryOneOptional } from '~/infrastructure/db/query-helpers';
import { refreshTokens } from '~/infrastructure/db/schemas';

import type { Either } from 'fp-ts/Either';
import type { TaskEither } from 'fp-ts/TaskEither';

import type { AppError, RefreshToken, UserId } from '~/domain/types';
import type { DBClient } from '~/infrastructure/db/client';

export interface RefreshTokenEffects {
  readonly saveRefreshToken: (userId: UserId, token: string, expiresAt: Date) => TaskEither<AppError, RefreshToken>;
  readonly getRefreshToken: (token: string) => TaskEither<AppError, RefreshToken | null>;
  readonly deleteRefreshToken: (token: string) => TaskEither<AppError, void>;
  readonly deleteAllUserTokens: (userId: UserId) => TaskEither<AppError, void>;
  readonly tryMarkTokenAsUsed: (
    token: string,
    replacementToken: string
  ) => TaskEither<AppError, { marked: boolean; record: RefreshToken }>;
}

type RefreshTokenRow = typeof refreshTokens.$inferSelect;

const mapRowToRefreshToken = (row: RefreshTokenRow): Either<AppError, RefreshToken> =>
  pipe(
    makeUserId(row.userId),
    map((userId) => ({
      id: row.id,
      userId,
      token: row.token,
      expiresAt: row.expiresAt,
      createdAt: row.createdAt,
      usedAt: row.usedAt,
      replacementToken: row.replacementToken,
    }))
  );

export const createRefreshTokenEffects = (db: DBClient): RefreshTokenEffects => ({
  saveRefreshToken: (userId: UserId, token: string, expiresAt: Date): TaskEither<AppError, RefreshToken> =>
    insertOne(
      () => db.insert(refreshTokens).values({ userId, token, expiresAt }).returning(),
      mapRowToRefreshToken,
      'RefreshToken'
    ),

  getRefreshToken: (token: string): TaskEither<AppError, RefreshToken | null> =>
    queryOneOptional(() => db.select().from(refreshTokens).where(eq(refreshTokens.token, token)), mapRowToRefreshToken),

  deleteRefreshToken: (token: string): TaskEither<AppError, void> =>
    deleteMany(() => db.delete(refreshTokens).where(eq(refreshTokens.token, token))),

  deleteAllUserTokens: (userId: UserId): TaskEither<AppError, void> =>
    deleteMany(() => db.delete(refreshTokens).where(eq(refreshTokens.userId, userId))),

  tryMarkTokenAsUsed: (
    token: string,
    replacementToken: string
  ): TaskEither<AppError, { marked: boolean; record: RefreshToken }> =>
    pipe(
      tryCatch(
        () =>
          db
            .update(refreshTokens)
            .set({ usedAt: new Date(), replacementToken })
            .where(and(eq(refreshTokens.token, token), isNull(refreshTokens.usedAt)))
            .returning(),
        dbError
      ),
      chain((updated) => {
        if (updated.length > 0) {
          const result = mapRowToRefreshToken(updated[0]);
          return isLeft(result) ? left(result.left) : right({ marked: true, record: result.right });
        }
        // Token was already marked — get current state
        return pipe(
          tryCatch(() => db.select().from(refreshTokens).where(eq(refreshTokens.token, token)), dbError),
          chain(([existing]) => {
            if (!existing) {
              return left(notFound('RefreshToken', token));
            }
            const result = mapRowToRefreshToken(existing);
            return isLeft(result) ? left(result.left) : right({ marked: false, record: result.right });
          })
        );
      })
    ),
});
