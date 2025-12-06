import { randomUUID } from 'node:crypto';

import { takeRight } from 'fp-ts/Array';
import { map, tryCatch } from 'fp-ts/Either';
import { pipe } from 'fp-ts/function';

import { validationError } from '~/domain/errors';
import { MessageContentSchema, unsafeMakeMessageId } from '~/domain/types';

import type { Either } from 'fp-ts/Either';

import type { AppError } from '~/domain/errors';
import type { ConversationId, Message, MessageRole } from '~/domain/types';

type MessageCreateParams = {
  readonly conversationId: ConversationId;
  readonly role: MessageRole;
  readonly content: string;
};

// Safe version - returns Either<AppError, Message>
export const messageCreate = (params: MessageCreateParams): Either<AppError, Message> =>
  pipe(
    tryCatch(
      () => MessageContentSchema.parse(params.content),
      (e) => validationError((e as Error).message)
    ),
    map(() => ({
      // randomUUID() always returns valid UUID, so an unsafe version is fine here
      id: unsafeMakeMessageId(randomUUID()),
      conversationId: params.conversationId,
      role: params.role,
      content: params.content,
      createdAt: new Date(),
    }))
  );

// Unsafe version for tests where content is guaranteed valid
export const unsafeMessageCreate = (params: MessageCreateParams): Message => {
  MessageContentSchema.parse(params.content);
  return {
    id: unsafeMakeMessageId(randomUUID()),
    conversationId: params.conversationId,
    role: params.role,
    content: params.content,
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
