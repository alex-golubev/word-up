import { pgTable, text, timestamp, uuid, varchar } from 'drizzle-orm/pg-core';
import { languageEnum } from '~/infrastructure/db/schemas';

export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  passwordHash: varchar('password_hash', { length: 255 }), // nullable for future OAuth
  name: text('name'),
  nativeLanguage: languageEnum('native_language').notNull().default('en'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});
