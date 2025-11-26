import { randomUUID } from 'node:crypto';
import { makeConversationId } from '~/domain/types';
import type {
  Conversation,
  Language,
  Message,
  ScenarioId,
  UserId,
  UserLevel,
} from '~/domain/types';
import { messageAppend } from '~/domain/functions/message';

export const conversationCreate = (
  userId: UserId,
  scenarioId: ScenarioId,
  targetLanguage: Language,
  userLevel: UserLevel
): Conversation => ({
  id: makeConversationId(randomUUID()),
  userId,
  scenarioId,
  targetLanguage,
  userLevel,
  messages: [],
  createdAt: new Date(),
  updatedAt: new Date(),
});

export const conversationAddMessage =
  (message: Message): ((conversation: Conversation) => Conversation) =>
  (conversation: Conversation): Conversation => ({
    ...conversation,
    messages: messageAppend(message)(conversation.messages),
  });

export const conversationMessages = (conversation: Conversation): readonly Message[] =>
  conversation.messages;

export const conversationMessagesCount = (conversation: Conversation): number =>
  conversation.messages.length;

export const conversationLastMessage = (conversation: Conversation): Message | undefined =>
  conversation.messages[conversation.messages.length - 1];
