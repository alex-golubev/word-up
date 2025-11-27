import { randomUUID } from 'node:crypto';
import { pipe } from 'fp-ts/function';
import { takeRight } from 'fp-ts/Array';
import { z } from 'zod';
import type { ConversationId, Message, MessageRole } from '~/domain/types';
import { makeMessageId } from '~/domain/types';

const MESSAGE_CONTENT_MAX_LENGTH = 10000;

const MessageContentSchema = z
  .string()
  .refine((val) => val.trim().length > 0, { message: 'Message content cannot be empty' })
  .refine((val) => val.length <= MESSAGE_CONTENT_MAX_LENGTH, {
    message: `Message content exceeds maximum length of ${MESSAGE_CONTENT_MAX_LENGTH} characters`,
  });

/** @throws {Error} If content is empty or exceeds 10,000 characters */
export const messageCreate = (conversationId: ConversationId, role: MessageRole, content: string): Message => {
  MessageContentSchema.parse(content);
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
    pipe(messages, takeRight(n));

export const messageFormatForAI = (messages: readonly Message[]): string =>
  messages.map((m) => `${m.role}: ${m.content}`).join('\n');

export const messageFilterByRole =
  (role: MessageRole): ((messages: readonly Message[]) => readonly Message[]) =>
  (messages: readonly Message[]): readonly Message[] =>
    messages.filter((m) => m.role === role);

export const messageAppend =
  (message: Message): ((messages: readonly Message[]) => readonly Message[]) =>
  (messages: readonly Message[]): readonly Message[] => [...messages, message];
