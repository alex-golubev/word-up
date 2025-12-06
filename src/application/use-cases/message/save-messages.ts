import { randomUUID } from 'node:crypto';

import { traverseArray, tryCatch, map } from 'fp-ts/Either';
import { pipe } from 'fp-ts/function';
import { chain, fromEither, sequenceArray } from 'fp-ts/TaskEither';

import type { AppReader } from '~/application/reader';
import type { AppError } from '~/domain/errors';
import { validationError } from '~/domain/errors';
import type { ConversationId, Message, MessageRole } from '~/domain/types';
import { makeMessageId, MessageContentSchema } from '~/domain/types';

import type { Either } from 'fp-ts/Either';

export type SaveMessagesParams = {
  readonly conversationId: ConversationId;
  readonly messages: readonly { role: MessageRole; content: string; createdAt: Date }[];
};

type MessageInput = { role: MessageRole; content: string; createdAt: Date };

const validateAndCreateMessage =
  (conversationId: ConversationId) =>
  (m: MessageInput): Either<AppError, Message> =>
    pipe(
      tryCatch(
        () => MessageContentSchema.parse(m.content),
        (e) => validationError((e as Error).message)
      ),
      map(() => ({
        id: makeMessageId(randomUUID()),
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
      chain((msgs) => sequenceArray(msgs.map((msg) => env.saveMessage(msg))))
    );
