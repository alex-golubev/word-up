import { z } from 'zod';

export const UserIdSchema = z.guid({ error: 'Invalid UserId' }).brand('UserId');
export const ConversationIdSchema = z.guid({ error: 'Invalid ConversationId' }).brand('ConversationId');
export const MessageIdSchema = z.guid({ error: 'Invalid MessageId' }).brand('MessageId');
export const ScenarioIdSchema = z
  .string()
  .min(1, { message: 'Invalid ScenarioId' })
  .max(50, { message: 'Invalid ScenarioId' })
  .brand('ScenarioId');

export type UserId = z.infer<typeof UserIdSchema>;
export type ConversationId = z.infer<typeof ConversationIdSchema>;
export type MessageId = z.infer<typeof MessageIdSchema>;
export type ScenarioId = z.infer<typeof ScenarioIdSchema>;

export const makeUserId = (id: string): UserId => UserIdSchema.parse(id);
export const makeConversationId = (id: string): ConversationId => ConversationIdSchema.parse(id);
export const makeMessageId = (id: string): MessageId => MessageIdSchema.parse(id);
export const makeScenarioId = (id: string): ScenarioId => ScenarioIdSchema.parse(id);

export const MessageRoleSchema = z.enum(['user', 'assistant']);
export const MessageContentSchema = z
  .string()
  .refine((val) => val.trim().length > 0, { message: 'Message content cannot be empty' })
  .refine((val) => val.length <= 10000, {
    message: 'Message content exceeds maximum length of 10000 characters',
  });
export const UserLevelSchema = z.enum(['beginner', 'intermediate', 'advanced']);
export const LanguageSchema = z.enum(['en', 'ru', 'es', 'fr', 'de']);

export type MessageRole = z.infer<typeof MessageRoleSchema>;
export type MessageContent = z.infer<typeof MessageContentSchema>;
export type UserLevel = z.infer<typeof UserLevelSchema>;
export type Language = z.infer<typeof LanguageSchema>;
