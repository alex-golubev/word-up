import { pgTable, text, varchar } from 'drizzle-orm/pg-core';

/**
 * Represents the database table `scenarios` with its columns and their respective properties.
 * This table is used to store information about various scenariosSchema including metadata,
 * description, and other relevant details.
 *
 * Columns:
 * - `id`: Unique identifier for the scenario. It is a string with a maximum length of 50 characters
 *         and serves as the primary key.
 * - `title`: The title of the scenario. It is a mandatory string with a maximum length of 255 characters.
 * - `description`: Detailed description of the scenario. It is a mandatory text field.
 * - `role`: Defines the role associated with the scenario. It is a mandatory string with a
 *           maximum length of 255 characters.
 * - `level`: Represents the difficulty or complexity level of the scenario. It is a mandatory
 *            string with a maximum length of 20 characters.
 * - `targetLanguage`: Specifies the target language for the scenario. It is a mandatory string
 *                     with a maximum length of 10 characters.
 * - `startingMessage`: An introductory message for the scenario. It is a mandatory text field.
 * - `vocabulary`: A mandatory array of text elements, representing vocabulary terms
 *                 associated with the scenario.
 */
export const scenarios = pgTable('scenariosSchema', {
  id: varchar('id', { length: 50 }).primaryKey(),
  title: varchar('title', { length: 255 }).notNull(),
  description: text('description').notNull(),
  role: varchar('role', { length: 255 }).notNull(),
  level: varchar('level', { length: 20 }).notNull(),
  targetLanguage: varchar('target_language', { length: 10 }).notNull(),
  startingMessage: text('starting_message').notNull(),
  vocabulary: text('vocabularies').array().notNull(),
});
