import { eq } from 'drizzle-orm';
import { pipe } from 'fp-ts/function';
import { chain, left, map, right, tryCatch } from 'fp-ts/TaskEither';

import type { AppError, ConversationId, Message } from '~/domain/types';
import { makeConversationId, makeMessageId } from '~/domain/types';
import { dbError, insertFailed } from '~/domain/types';
import type { DBClient } from '~/infrastructure/db/client';
import { messages } from '~/infrastructure/db/schemas';

import type { TaskEither } from 'fp-ts/TaskEither';

type MessageRow = typeof messages.$inferSelect;

const mapRowToMessage = (row: MessageRow): Message => ({
  id: makeMessageId(row.id),
  conversationId: makeConversationId(row.conversationId),
  role: row.role,
  content: row.content,
  createdAt: row.createdAt,
});

export const createMessageEffects = (db: DBClient) => ({
  saveMessage: (message: Message): TaskEither<AppError, Message> =>
    pipe(
      tryCatch(
        () => db.insert(messages).values(message).returning(),
        (error) => dbError(error)
      ),
      chain(([inserted]) => (inserted ? right(mapRowToMessage(inserted)) : left(insertFailed('Message'))))
    ),

  getMessagesByConversation: (id: ConversationId): TaskEither<AppError, readonly Message[]> =>
    pipe(
      tryCatch(
        () => db.select().from(messages).where(eq(messages.conversationId, id)).orderBy(messages.createdAt),
        (error) => dbError(error)
      ),
      map((rows) => rows.map(mapRowToMessage))
    ),
});

export type MessageEffects = ReturnType<typeof createMessageEffects>;
