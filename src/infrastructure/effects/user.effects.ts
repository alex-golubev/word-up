import type { TaskEither } from 'fp-ts/TaskEither';
import { chain, left, right, tryCatch } from 'fp-ts/TaskEither';
import { pipe } from 'fp-ts/function';
import { eq } from 'drizzle-orm';
import { makeUserId } from '~/domain/types';
import type { AppError, Language, User, UserId, UserCreateParams } from '~/domain/types';
import { dbError, insertFailed, notFound } from '~/domain/types';
import { users } from '~/infrastructure/db/schemas';
import type { DBClient } from '~/infrastructure/db/client';

type UserRow = typeof users.$inferSelect;

const mapRowToUser = (row: UserRow): User => ({
  id: makeUserId(row.id),
  email: row.email,
  passwordHash: row.passwordHash,
  name: row.name,
  nativeLanguage: row.nativeLanguage,
  createdAt: row.createdAt,
});

export const createUserEffects = (db: DBClient) => ({
  getUserById: (userId: UserId): TaskEither<AppError, User> =>
    pipe(
      tryCatch(
        () => db.select().from(users).where(eq(users.id, userId)),
        (error) => dbError(error)
      ),
      chain(([row]) => (row ? right(mapRowToUser(row)) : left(notFound('User', userId))))
    ),

  getUserByEmail: (email: string): TaskEither<AppError, User | null> =>
    pipe(
      tryCatch(
        () => db.select().from(users).where(eq(users.email, email)),
        (error) => dbError(error)
      ),
      chain(([row]) => right(row ? mapRowToUser(row) : null))
    ),

  createUser: (params: UserCreateParams): TaskEither<AppError, User> =>
    pipe(
      tryCatch(
        () =>
          db
            .insert(users)
            .values({
              email: params.email,
              passwordHash: params.passwordHash,
              name: params.name ?? null,
              nativeLanguage: params.nativeLanguage,
            })
            .returning(),
        (error) => dbError(error)
      ),
      chain(([row]) => (row ? right(mapRowToUser(row)) : left(insertFailed('User'))))
    ),

  updateUser: (userId: UserId, data: { name?: string | null; nativeLanguage?: Language }): TaskEither<AppError, User> =>
    pipe(
      tryCatch(
        () => db.update(users).set(data).where(eq(users.id, userId)).returning(),
        (error) => dbError(error)
      ),
      chain(([row]) => (row ? right(mapRowToUser(row)) : left(notFound('User', userId))))
    ),
});

export type UserEffects = ReturnType<typeof createUserEffects>;
