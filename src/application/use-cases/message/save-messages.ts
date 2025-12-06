import { randomUUID } from 'node:crypto';

import { map, traverseArray, tryCatch } from 'fp-ts/Either';
import { pipe } from 'fp-ts/function';
import { chain, fromEither, sequenceArray } from 'fp-ts/TaskEither';

import { validationError } from '~/domain/errors';
import { MessageContentSchema, unsafeMakeMessageId } from '~/domain/types';

import type { Either } from 'fp-ts/Either';

import type { AppReader } from '~/application/reader';
import type { AppError } from '~/domain/errors';
import type { ConversationId, Message, MessageRole } from '~/domain/types';

type MessageInput = {
  readonly role: MessageRole;
  readonly content: string;
  readonly createdAt: Date;
};

export type SaveMessagesParams = {
  readonly conversationId: ConversationId;
  readonly messages: readonly MessageInput[];
};

const validateAndCreateMessage =
  (conversationId: ConversationId) =>
  (m: MessageInput): Either<AppError, Message> =>
    pipe(
      tryCatch(
        () => MessageContentSchema.parse(m.content),
        (e) => validationError((e as Error).message)
      ),
      map(() => ({
        // randomUUID() always returns valid UUID
        id: unsafeMakeMessageId(randomUUID()),
        conversationId,
        role: m.role,
        content: m.content,
        createdAt: m.createdAt,
      }))
    );

export const saveMessagesUseCase =
  (params: SaveMessagesParams): AppReader<readonly Message[]> =>
  (env) =>
    pipe(
      params.messages,
      traverseArray(validateAndCreateMessage(params.conversationId)),
      fromEither,
      chain((messages) => sequenceArray(messages.map((msg) => env.saveMessage(msg))))
    );
