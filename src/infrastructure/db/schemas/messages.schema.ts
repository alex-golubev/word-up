import { pgTable, text, timestamp, uuid, varchar } from 'drizzle-orm/pg-core';
import { conversations } from '~/infrastructure/db/schemas';

/**
 * Represents the `messages` table in the database.
 *
 * Fields:
 * - `id`: A unique identifier for a message. Automatically generated as a random UUID. Primary key.
 * - `conversationId`: A unique identifier linking the message to a specific conversation. Cannot be null. References the `id` field of the `conversations` table.
 * - `role`: The role of the entity sending the message (e.g., user, system). Cannot exceed a length of 20 characters. Cannot be null.
 * - `content`: The textual content of the message. Cannot be null.
 * - `createdAt`: The timestamp of when the message was created. Cannot be null. Defaults to the current timestamp.
 */
export const messages = pgTable('messages', {
  id: uuid('id').primaryKey().defaultRandom(),
  conversationId: uuid('conversation_id')
    .notNull()
    .references(() => conversations.id),
  role: varchar('role', { length: 20 }).notNull(),
  content: text('content').notNull(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});
