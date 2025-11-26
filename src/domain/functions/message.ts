import { randomUUID } from 'node:crypto';
import { pipe } from 'fp-ts/function';
import * as Arr from 'fp-ts/Array';
import type { ConversationId, Message, MessageRole } from '~/domain/types';
import { makeMessageId } from '~/domain/types';

const MESSAGE_CONTENT_MAX_LENGTH = 10000;

const validateMessageContent = (content: string): void => {
  if (content.trim().length === 0) {
    throw new Error('Message content cannot be empty');
  }
  if (content.length > MESSAGE_CONTENT_MAX_LENGTH) {
    throw new Error(`Message content exceeds maximum length of ${MESSAGE_CONTENT_MAX_LENGTH} characters`);
  }
};

/** @throws {Error} If content is empty or exceeds 10,000 characters */
export const messageCreate = (conversationId: ConversationId, role: MessageRole, content: string): Message => {
  validateMessageContent(content);
  return {
    id: makeMessageId(randomUUID()),
    conversationId,
    role,
    content,
    createdAt: new Date(),
  };
};

export const messageTakeLast =
  (n: number): ((messages: Message[]) => readonly Message[]) =>
  (messages: Message[]): readonly Message[] =>
    pipe(messages, Arr.takeRight(n));

export const messageFormatForAI = (messages: readonly Message[]): string =>
  messages.map((m) => `${m.role}: ${m.content}`).join('\n');

export const messageFilterByRole =
  (role: MessageRole): ((messages: readonly Message[]) => readonly Message[]) =>
  (messages: readonly Message[]): readonly Message[] =>
    messages.filter((m) => m.role === role);

export const messageAppend =
  (message: Message): ((messages: readonly Message[]) => readonly Message[]) =>
  (messages: readonly Message[]): readonly Message[] => [...messages, message];
