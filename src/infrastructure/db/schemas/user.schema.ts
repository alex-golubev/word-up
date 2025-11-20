import { pgTable, timestamp, uuid, varchar } from 'drizzle-orm/pg-core';

/**
 * Represents the database table `users` with schema definitions.
 *
 * Each user is identified by a unique UUID and has several attributes
 * including email, native language, and creation timestamp.
 *
 * Table Schema:
 * - `id`: A unique identifier (UUID) for each user. This serves as the primary key and is
 *   generated automatically with a random default.
 * - `email`: The email address of the user. It is a non-nullable field and must be unique
 *   across the table. The maximum character length is 255.
 * - `nativeLanguage`: The user's native language represented as a string. The maximum
 *   character length is 10, and this field is non-nullable.
 * - `createdAt`: The timestamp indicating when the user record was created. This field
 *   is non-nullable and defaults to the current time when a new record is inserted.
 */
export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  nativeLanguage: varchar('native_language', { length: 10 }).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});
