import { eq } from 'drizzle-orm';
import { tryCatch } from 'fp-ts/TaskEither';
import { conversations } from '~/infrastructure/db/schemas';
import { makeConversationId, makeScenarioId, makeUserId } from '~/domain/types';
import type {
  Conversation,
  ConversationId,
  Language,
  ScenarioId,
  UserId,
  UserLevel,
} from '~/domain/types';
import type { TaskEither } from 'fp-ts/TaskEither';
import type { DBClient } from '~/infrastructure/db/client';

type CreateConversationParams = {
  readonly id: ConversationId;
  readonly userId: UserId;
  readonly scenarioId: ScenarioId;
  readonly targetLanguage: Language;
  readonly userLevel: UserLevel;
};

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

export const conversationEffects = (db: DBClient) => ({
  createConversation: (params: CreateConversationParams): TaskEither<Error, Conversation> =>
    tryCatch(
      async (): Promise<Conversation> => {
        const [inserted] = await db.insert(conversations).values(params).returning();
        if (!inserted) throw new Error('Failed to create conversation');
        return mapRowToConversation(inserted);
      },
      (error) => new Error('Failed to create conversation', { cause: error })
    ),

  getConversation: (conversationId: ConversationId) =>
    tryCatch(
      async (): Promise<Conversation> => {
        const [selected] = await db
          .select()
          .from(conversations)
          .where(eq(conversations.id, conversationId));
        if (!selected) throw new Error('Conversation not found');
        return mapRowToConversation(selected);
      },
      (error) => new Error('Failed to get conversation', { cause: error })
    ),
});
