import { pgEnum, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';
import { conversations } from '~/infrastructure/db/schemas';

export const messageRoleEnum = pgEnum('message_role', ['user', 'assistant']);

export const messages = pgTable('messages', {
  id: uuid('id').primaryKey(),
  conversationId: uuid('conversation_id')
    .notNull()
    .references(() => conversations.id),
  role: messageRoleEnum('role').notNull(),
  content: text('content').notNull(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});
