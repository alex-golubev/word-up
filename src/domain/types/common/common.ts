import { tryCatch } from 'fp-ts/Either';
import { z } from 'zod';

import { validationError } from '~/domain/errors';

import type { Either } from 'fp-ts/Either';

import type { AppError } from '~/domain/errors';

export const UserIdSchema = z.guid({ error: 'Invalid UserId' }).brand('UserId');
export const ConversationIdSchema = z.guid({ error: 'Invalid ConversationId' }).brand('ConversationId');
export const MessageIdSchema = z.guid({ error: 'Invalid MessageId' }).brand('MessageId');
export const ScenarioIdSchema = z
  .string()
  .min(1, { error: 'Invalid ScenarioId' })
  .max(50, { error: 'Invalid ScenarioId' })
  .brand('ScenarioId');

export type UserId = z.infer<typeof UserIdSchema>;
export type ConversationId = z.infer<typeof ConversationIdSchema>;
export type MessageId = z.infer<typeof MessageIdSchema>;
export type ScenarioId = z.infer<typeof ScenarioIdSchema>;

// Safe versions - return Either<AppError, T>
export const makeUserId = (id: string): Either<AppError, UserId> =>
  tryCatch(
    () => UserIdSchema.parse(id),
    () => validationError(`Invalid UserId: ${id}`)
  );

export const makeConversationId = (id: string): Either<AppError, ConversationId> =>
  tryCatch(
    () => ConversationIdSchema.parse(id),
    () => validationError(`Invalid ConversationId: ${id}`)
  );

export const makeMessageId = (id: string): Either<AppError, MessageId> =>
  tryCatch(
    () => MessageIdSchema.parse(id),
    () => validationError(`Invalid MessageId: ${id}`)
  );

export const makeScenarioId = (id: string): Either<AppError, ScenarioId> =>
  tryCatch(
    () => ScenarioIdSchema.parse(id),
    () => validationError(`Invalid ScenarioId: ${id}`)
  );

// Unsafe versions - throw on invalid input (for tests/fixtures with guaranteed valid data)
export const unsafeMakeUserId = (id: string): UserId => UserIdSchema.parse(id);
export const unsafeMakeConversationId = (id: string): ConversationId => ConversationIdSchema.parse(id);
export const unsafeMakeMessageId = (id: string): MessageId => MessageIdSchema.parse(id);
export const unsafeMakeScenarioId = (id: string): ScenarioId => ScenarioIdSchema.parse(id);

export const MessageRoleSchema = z.enum(['user', 'assistant']);
export const MessageContentSchema = z
  .string()
  .refine((val) => val.trim().length > 0, { error: 'Message content cannot be empty' })
  .refine((val) => val.length <= 10000, { error: 'Message content exceeds maximum length of 10000 characters' });
export const UserLevelSchema = z.enum(['beginner', 'intermediate', 'advanced']);
export const LanguageSchema = z.enum(['en', 'ru', 'es', 'fr', 'de']);

export type MessageRole = z.infer<typeof MessageRoleSchema>;
export type UserLevel = z.infer<typeof UserLevelSchema>;
export type Language = z.infer<typeof LanguageSchema>;
