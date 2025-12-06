import { eq } from 'drizzle-orm';
import { map } from 'fp-ts/Either';
import { pipe } from 'fp-ts/function';

import { makeUserId } from '~/domain/types';
import { insertOne, queryOne, queryOneOptional, updateOne } from '~/infrastructure/db/query-helpers';
import { users } from '~/infrastructure/db/schemas';

import type { Either } from 'fp-ts/Either';
import type { TaskEither } from 'fp-ts/TaskEither';

import type { AppError, Language, User, UserCreateParams, UserId } from '~/domain/types';
import type { DBClient } from '~/infrastructure/db/client';

export interface UserEffects {
  readonly getUserById: (userId: UserId) => TaskEither<AppError, User>;
  readonly getUserByEmail: (email: string) => TaskEither<AppError, User | null>;
  readonly createUser: (params: UserCreateParams) => TaskEither<AppError, User>;
  readonly updateUser: (
    userId: UserId,
    data: { name?: string | null; nativeLanguage?: Language }
  ) => TaskEither<AppError, User>;
}

type UserRow = typeof users.$inferSelect;

const mapRowToUser = (row: UserRow): Either<AppError, User> =>
  pipe(
    makeUserId(row.id),
    map((id) => ({
      id,
      email: row.email,
      passwordHash: row.passwordHash,
      name: row.name,
      nativeLanguage: row.nativeLanguage,
      createdAt: row.createdAt,
    }))
  );

export const createUserEffects = (db: DBClient): UserEffects => ({
  getUserById: (userId) =>
    queryOne(() => db.select().from(users).where(eq(users.id, userId)), mapRowToUser, 'User', userId),

  getUserByEmail: (email) =>
    queryOneOptional(() => db.select().from(users).where(eq(users.email, email)), mapRowToUser),

  createUser: (params) =>
    insertOne(
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
      mapRowToUser,
      'User'
    ),

  updateUser: (userId, data) =>
    updateOne(() => db.update(users).set(data).where(eq(users.id, userId)).returning(), mapRowToUser, 'User', userId),
});
