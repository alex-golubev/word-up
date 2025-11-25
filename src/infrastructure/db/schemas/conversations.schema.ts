import { pgEnum, pgTable, timestamp, uuid, varchar } from 'drizzle-orm/pg-core';
import { scenarios, users } from '~/infrastructure/db/schemas';

export const userLevelEnum = pgEnum('user_level', ['beginner', 'intermediate', 'advanced']);

export const conversations = pgTable('conversations', {
  id: uuid('id').primaryKey(),
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id),
  scenarioId: varchar('scenario_id', { length: 50 })
    .notNull()
    .references(() => scenarios.id),
  userLevel: userLevelEnum('user_level').notNull(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});
