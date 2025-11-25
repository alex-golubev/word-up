export type UserId = string & { readonly __brand: 'UserId' };
export type ConversationId = string & { readonly __brand: 'ConversationId' };
export type MessageId = string & { readonly __brand: 'MessageId' };
export type ScenarioId = string & { readonly __brand: 'ScenarioId' };

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const validateUUID = (id: string, typeName: string): void => {
  if (!UUID_REGEX.test(id)) {
    throw new Error(`Invalid ${typeName}: "${id}" is not a valid UUID`);
  }
};

export const makeUserId = (id: string): UserId => {
  validateUUID(id, 'UserId');
  return id as UserId;
};

export const makeConversationId = (id: string): ConversationId => {
  validateUUID(id, 'ConversationId');
  return id as ConversationId;
};

export const makeMessageId = (id: string): MessageId => {
  validateUUID(id, 'MessageId');
  return id as MessageId;
};

export const makeScenarioId = (id: string): ScenarioId => id as ScenarioId;

export type MessageRole = 'user' | 'assistant';
export type UserLevel = 'beginner' | 'intermediate' | 'advanced';
export type Language = 'en' | 'ru' | 'es' | 'fr' | 'de';
