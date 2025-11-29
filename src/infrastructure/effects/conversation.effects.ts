import type { TaskEither } from 'fp-ts/TaskEither';
import { tryCatch } from 'fp-ts/TaskEither';
import { eq } from 'drizzle-orm';
import { makeConversationId, makeScenarioId, makeUserId } from '~/domain/types';
import { conversations } from '~/infrastructure/db/schemas';
import type { DBClient } from '~/infrastructure/db/client';
import type { Conversation, ConversationId } from '~/domain/types';

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

/**
 * Creates a ConversationEffects instance with database operations.
 * @param db - Database client for executing queries.
 */
export const createConversationEffects = (db: DBClient) => ({
  saveConversation: (conversation: Conversation): TaskEither<Error, Conversation> =>
    tryCatch(
      async (): Promise<Conversation> => {
        const [inserted] = await db.insert(conversations).values(conversation).returning();
        if (!inserted) throw new Error('Insert returned no rows');
        return mapRowToConversation(inserted);
      },
      (error) => new Error('Failed to save conversation', { cause: error })
    ),

  getConversation: (conversationId: ConversationId): TaskEither<Error, Conversation> =>
    tryCatch(
      async (): Promise<Conversation> => {
        const [selected] = await db.select().from(conversations).where(eq(conversations.id, conversationId));
        if (!selected) throw new Error('Conversation not found');
        return mapRowToConversation(selected);
      },
      (error) => new Error('Failed to get conversation', { cause: error })
    ),
});

export type ConversationEffects = ReturnType<typeof createConversationEffects>;
