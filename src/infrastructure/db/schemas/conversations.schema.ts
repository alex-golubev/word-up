import { pgTable, timestamp, uuid, varchar } from 'drizzle-orm/pg-core';
import { languageEnum, levelEnum, scenarios, users } from '~/infrastructure/db/schemas';

export const conversations = pgTable('conversations', {
  id: uuid('id').primaryKey(),
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id),
  scenarioId: varchar('scenario_id', { length: 50 })
    .notNull()
    .references(() => scenarios.id),
  targetLanguage: languageEnum('target_language').notNull(),
  userLevel: levelEnum('user_level').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});
