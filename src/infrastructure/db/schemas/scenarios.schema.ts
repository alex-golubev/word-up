import { pgTable, text, varchar } from 'drizzle-orm/pg-core';
import { languageEnum, levelEnum } from '~/infrastructure/db/schemas';

export const scenarios = pgTable('scenarios', {
  id: varchar('id', { length: 50 }).primaryKey(),
  title: varchar('title', { length: 255 }).notNull(),
  description: text('description').notNull(),
  role: varchar('role', { length: 255 }).notNull(),
  level: levelEnum('level').notNull(),
  targetLanguage: languageEnum('target_language').notNull(),
  startingMessage: text('starting_message').notNull(),
  vocabulary: text('vocabularies').array().notNull(),
});
