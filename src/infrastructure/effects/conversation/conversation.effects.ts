import { eq } from 'drizzle-orm';
import { pipe } from 'fp-ts/function';
import { chain, left, right, tryCatch } from 'fp-ts/TaskEither';

import type { AppError, Conversation, ConversationId } from '~/domain/types';
import { makeConversationId, makeScenarioId, makeUserId } from '~/domain/types';
import { dbError, insertFailed, notFound } from '~/domain/types';
import type { DBClient } from '~/infrastructure/db/client';
import { conversations } from '~/infrastructure/db/schemas';

import type { TaskEither } from 'fp-ts/TaskEither';

type ConversationRow = typeof conversations.$inferSelect;

const mapRowToConversation = (row: ConversationRow): Conversation => ({
  id: makeConversationId(row.id),
  userId: makeUserId(row.userId),
  scenarioId: makeScenarioId(row.scenarioId),
  targetLanguage: row.targetLanguage,
  userLevel: row.userLevel,
  messages: [],
  createdAt: row.createdAt,
  updatedAt: row.updatedAt,
});

export const createConversationEffects = (db: DBClient) => ({
  saveConversation: (conversation: Conversation): TaskEither<AppError, Conversation> =>
    pipe(
      tryCatch(
        () => db.insert(conversations).values(conversation).returning(),
        (error) => dbError(error)
      ),
      chain(([inserted]) => (inserted ? right(mapRowToConversation(inserted)) : left(insertFailed('Conversation'))))
    ),

  getConversation: (conversationId: ConversationId): TaskEither<AppError, Conversation> =>
    pipe(
      tryCatch(
        () => db.select().from(conversations).where(eq(conversations.id, conversationId)),
        (error) => dbError(error)
      ),
      chain(([selected]) =>
        selected ? right(mapRowToConversation(selected)) : left(notFound('Conversation', conversationId))
      )
    ),
});

export type ConversationEffects = ReturnType<typeof createConversationEffects>;
