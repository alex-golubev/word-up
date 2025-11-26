import { pgEnum } from 'drizzle-orm/pg-core';

export const languageEnum = pgEnum('language', ['en', 'ru', 'es', 'fr', 'de']);
export const levelEnum = pgEnum('level', ['beginner', 'intermediate', 'advanced']);
export const messageRoleEnum = pgEnum('message_role', ['user', 'assistant']);
