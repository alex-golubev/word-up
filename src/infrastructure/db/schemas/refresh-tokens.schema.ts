import { pgTable, timestamp, uuid, varchar } from 'drizzle-orm/pg-core';

import { users } from './user.schema';

export const refreshTokens = pgTable('refresh_tokens', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  token: varchar('token', { length: 255 }).notNull().unique(),
  expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  // Grace period support for concurrent refresh requests:
  usedAt: timestamp('used_at', { withTimezone: true }),
  replacementToken: varchar('replacement_token', { length: 255 }),
});
