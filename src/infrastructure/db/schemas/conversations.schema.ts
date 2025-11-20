import { pgTable, timestamp, uuid, varchar } from 'drizzle-orm/pg-core';
import { scenarios, users } from '~/infrastructure/db/schemas';

/**
 * Represents the `conversations` database table schema.
 *
 * Fields:
 * - `id`: A UUID that serves as the primary key for the `conversations` table. This value is set to a randomly generated UUID by default.
 * - `userId`: A UUID referring to the ID of the user associated with the conversation. This field is required and references the primary key in the `users` table.
 * - `scenarioId`: A string (maximum length 50) representing the ID of the scenario related to the conversation. This field is required and references the primary key in the `scenarios` table.
 * - `userLevel`: A string (maximum length 20) representing the level or role of the user involved in the conversation. This field is required.
 * - `createdAt`: A timestamp indicating when the conversation was created. This field is required and is automatically set to the current timestamp by default.
 * - `updatedAt`: A timestamp indicating the last time the conversation was updated. This field is required and is automatically set to the current timestamp by default.
 */
export const conversations = pgTable('conversations', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id),
  scenarioId: varchar('scenario_id', { length: 50 })
    .notNull()
    .references(() => scenarios.id),
  userLevel: varchar('user_level', { length: 20 }).notNull(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});
