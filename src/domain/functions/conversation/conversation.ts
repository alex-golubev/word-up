import { randomUUID } from 'node:crypto';

import { messageAppend } from '~/domain/functions/message';
import { unsafeMakeConversationId } from '~/domain/types';

import type { Conversation, Language, Message, ScenarioId, UserId, UserLevel } from '~/domain/types';

type ConversationCreateParams = {
  readonly userId: UserId;
  readonly scenarioId: ScenarioId;
  readonly targetLanguage: Language;
  readonly userLevel: UserLevel;
};

// randomUUID() always returns valid UUID, so an unsafe version is fine here
export const conversationCreate = (params: ConversationCreateParams): Conversation => ({
  id: unsafeMakeConversationId(randomUUID()),
  ...params,
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

export const conversationMessages = (conversation: Conversation): readonly Message[] => conversation.messages;

export const conversationMessagesCount = (conversation: Conversation): number => conversation.messages.length;

export const conversationLastMessage = (conversation: Conversation): Message | undefined =>
  conversation.messages[conversation.messages.length - 1];
