import type { TaskEither } from 'fp-ts/TaskEither';
import { tryCatch } from 'fp-ts/TaskEither';
import { eq } from 'drizzle-orm';
import { makeConversationId, makeMessageId } from '~/domain/types';
import { messages } from '~/infrastructure/db/schemas';
import type { DBClient } from '~/infrastructure/db/client';
import type { ConversationId, Message } from '~/domain/types';

type MessageRow = typeof messages.$inferSelect;

const mapRowToMessage = (row: MessageRow): Message => ({
  id: makeMessageId(row.id),
  conversationId: makeConversationId(row.conversationId),
  role: row.role,
  content: row.content,
  createdAt: row.createdAt,
});

/**
 * Creates a MessageEffects instance with database operations.
 * @param db - Database client for executing queries.
 */
export const createMessageEffects = (db: DBClient) => ({
  saveMessage: (message: Message): TaskEither<Error, Message> =>
    tryCatch(
      async (): Promise<Message> => {
        const [inserted] = await db.insert(messages).values(message).returning();
        if (!inserted) throw new Error('Insert returned no rows');
        return mapRowToMessage(inserted);
      },
      (error) => new Error('Failed to save message', { cause: error })
    ),

  getMessagesByConversation: (id: ConversationId): TaskEither<Error, readonly Message[]> =>
    tryCatch(
      async (): Promise<Message[]> => {
        const selected = await db
          .select()
          .from(messages)
          .where(eq(messages.conversationId, id))
          .orderBy(messages.createdAt);

        return selected.map(mapRowToMessage);
      },
      (error) => new Error('Failed to get messages', { cause: error })
    ),
});

export type MessageEffects = ReturnType<typeof createMessageEffects>;
