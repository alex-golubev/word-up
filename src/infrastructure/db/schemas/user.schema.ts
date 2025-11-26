import { pgTable, timestamp, uuid, varchar } from 'drizzle-orm/pg-core';
import { languageEnum } from '~/infrastructure/db/schemas';

export const users = pgTable('users', {
  id: uuid('id').primaryKey(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  nativeLanguage: languageEnum('native_language').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});
