export type UserId = string & { readonly __brand: 'UserId' };
export type ConversationId = string & { readonly __brand: 'ConversationId' };
export type MessageId = string & { readonly __brand: 'MessageId' };
export type ScenarioId = string & { readonly __brand: 'ScenarioId' };

export const makeUserId = (id: string): UserId => id as UserId;
export const makeConversationId = (id: string): ConversationId => id as ConversationId;
export const makeMessageId = (id: string): MessageId => id as MessageId;
export const makeScenarioId = (id: string): ScenarioId => id as ScenarioId;

export type MessageRole = 'user' | 'assistant';
export type UserLevel = 'beginner' | 'intermediate' | 'advanced';
export type Language = 'en' | 'ru' | 'es' | 'fr' | 'de';
