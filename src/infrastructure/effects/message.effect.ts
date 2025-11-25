import type { TaskEither } from 'fp-ts/TaskEither';
import { tryCatch } from 'fp-ts/TaskEither';
import { makeConversationId, makeMessageId } from '~/domain/types';
import { messages } from '~/infrastructure/db/schemas';
import type { DBClient } from '~/infrastructure/db/client';
import type { Message } from '~/domain/types';

type MessageEffect = {
  readonly saveMessage: (message: Message) => TaskEither<Error, Message>;
};

export const createMessageEffect = (db: DBClient): MessageEffect => ({
  saveMessage: (message: Message): TaskEither<Error, Message> =>
    tryCatch(
      async () => {
        const [inserted] = await db.insert(messages).values(message).returning();
        if (!inserted) {
          throw new Error('Insert returned no rows');
        }
        return {
          id: makeMessageId(inserted.id),
          conversationId: makeConversationId(inserted.conversationId),
          role: inserted.role,
          content: inserted.content,
          createdAt: inserted.createdAt,
        };
      },
      (error) => new Error(`Failed to save message: ${error}`, { cause: error })
    ),
});
