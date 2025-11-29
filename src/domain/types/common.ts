import { z } from 'zod';

const UserIdSchema = z.guid({ error: 'Invalid UserId' }).brand('UserId');
const ConversationIdSchema = z.guid({ error: 'Invalid ConversationId' }).brand('ConversationId');
const MessageIdSchema = z.guid({ error: 'Invalid MessageId' }).brand('MessageId');

const ScenarioIdSchema = z
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

export type MessageRole = 'user' | 'assistant';
export type UserLevel = 'beginner' | 'intermediate' | 'advanced';
export type Language = 'en' | 'ru' | 'es' | 'fr' | 'de';
