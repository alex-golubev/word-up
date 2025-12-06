import { eq } from 'drizzle-orm';

import { makeConversationId, makeMessageId } from '~/domain/types';
import { insertOne, queryMany } from '~/infrastructure/db/query-helpers';
import { messages } from '~/infrastructure/db/schemas';

import type { TaskEither } from 'fp-ts/TaskEither';

import type { AppError, ConversationId, Message } from '~/domain/types';
import type { DBClient } from '~/infrastructure/db/client';

export interface MessageEffects {
  readonly saveMessage: (message: Message) => TaskEither<AppError, Message>;
  readonly getMessagesByConversation: (id: ConversationId) => TaskEither<AppError, readonly Message[]>;
}

type MessageRow = typeof messages.$inferSelect;

const mapRowToMessage = (row: MessageRow): Message => ({
  id: makeMessageId(row.id),
  conversationId: makeConversationId(row.conversationId),
  role: row.role,
  content: row.content,
  createdAt: row.createdAt,
});

export const createMessageEffects = (db: DBClient): MessageEffects => ({
  saveMessage: (message) =>
    insertOne(() => db.insert(messages).values(message).returning(), mapRowToMessage, 'Message'),

  getMessagesByConversation: (id) =>
    queryMany(
      () => db.select().from(messages).where(eq(messages.conversationId, id)).orderBy(messages.createdAt),
      mapRowToMessage
    ),
});
