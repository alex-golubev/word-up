import { pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';

import { conversations, messageRoleEnum } from '~/infrastructure/db/schemas';

export const messages = pgTable('messages', {
  id: uuid('id').primaryKey(),
  conversationId: uuid('conversation_id')
    .notNull()
    .references(() => conversations.id),
  role: messageRoleEnum('role').notNull(),
  content: text('content').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});
