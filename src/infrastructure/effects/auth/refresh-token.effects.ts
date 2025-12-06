import type { TaskEither } from 'fp-ts/TaskEither';
import { chain, left, right, tryCatch } from 'fp-ts/TaskEither';
import { pipe } from 'fp-ts/function';
import { and, eq, isNull } from 'drizzle-orm';
import { makeUserId } from '~/domain/types';
import type { AppError, RefreshToken, UserId } from '~/domain/types';
import { dbError, insertFailed } from '~/domain/types';
import { refreshTokens } from '~/infrastructure/db/schemas';
import type { DBClient } from '~/infrastructure/db/client';

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

export const createRefreshTokenEffects = (db: DBClient) => ({
  saveRefreshToken: (userId: UserId, token: string, expiresAt: Date): TaskEither<AppError, RefreshToken> =>
    pipe(
      tryCatch(
        () => db.insert(refreshTokens).values({ userId, token, expiresAt }).returning(),
        (error) => dbError(error)
      ),
      chain(([row]) => (row ? right(mapRowToRefreshToken(row)) : left(insertFailed('RefreshToken'))))
    ),

  getRefreshToken: (token: string): TaskEither<AppError, RefreshToken | null> =>
    pipe(
      tryCatch(
        () => db.select().from(refreshTokens).where(eq(refreshTokens.token, token)),
        (error) => dbError(error)
      ),
      chain(([row]) => right(row ? mapRowToRefreshToken(row) : null))
    ),

  deleteRefreshToken: (token: string): TaskEither<AppError, void> =>
    pipe(
      tryCatch(
        () => db.delete(refreshTokens).where(eq(refreshTokens.token, token)),
        (error) => dbError(error)
      ),
      chain(() => right(undefined))
    ),

  deleteAllUserTokens: (userId: UserId): TaskEither<AppError, void> =>
    pipe(
      tryCatch(
        () => db.delete(refreshTokens).where(eq(refreshTokens.userId, userId)),
        (error) => dbError(error)
      ),
      chain(() => right(undefined))
    ),

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

export type RefreshTokenEffects = ReturnType<typeof createRefreshTokenEffects>;
