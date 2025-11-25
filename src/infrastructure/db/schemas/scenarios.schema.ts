import { pgEnum, pgTable, text, varchar } from 'drizzle-orm/pg-core';

export const scenarioLevelEnum = pgEnum('scenario_level', ['beginner', 'intermediate', 'advanced']);
export const languageEnum = pgEnum('language', ['en', 'ru', 'es', 'fr', 'de']);

export const scenarios = pgTable('scenarios', {
  id: varchar('id', { length: 50 }).primaryKey(),
  title: varchar('title', { length: 255 }).notNull(),
  description: text('description').notNull(),
  role: varchar('role', { length: 255 }).notNull(),
  level: scenarioLevelEnum('level').notNull(),
  targetLanguage: languageEnum('target_language').notNull(),
  startingMessage: text('starting_message').notNull(),
  vocabulary: text('vocabularies').array().notNull(),
});
