import { and, eq, isNull } from 'drizzle-orm';
import { tryCatch } from 'fp-ts/TaskEither';

import { dbError, makeUserId } from '~/domain/types';
import { deleteMany, insertOne, queryOneOptional } from '~/infrastructure/db/query-helpers';
import { refreshTokens } from '~/infrastructure/db/schemas';

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

const mapRowToRefreshToken = (row: RefreshTokenRow): RefreshToken => ({
  id: row.id,
  userId: makeUserId(row.userId),
  token: row.token,
  expiresAt: row.expiresAt,
  createdAt: row.createdAt,
  usedAt: row.usedAt,
  replacementToken: row.replacementToken,
});

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
    tryCatch(
      async () => {
        // Attempt atomic update (only if usedAt is NULL)
        const updated = await db
          .update(refreshTokens)
          .set({ usedAt: new Date(), replacementToken })
          .where(and(eq(refreshTokens.token, token), isNull(refreshTokens.usedAt)))
          .returning();

        if (updated.length > 0) {
          return { marked: true, record: mapRowToRefreshToken(updated[0]) };
        }

        // Token was already marked — get current state
        const [existing] = await db.select().from(refreshTokens).where(eq(refreshTokens.token, token));

        if (!existing) {
          throw new Error('Token not found');
        }

        return { marked: false, record: mapRowToRefreshToken(existing) };
      },
      (error) => dbError(error)
    ),
});
