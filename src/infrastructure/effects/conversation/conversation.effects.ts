import { eq } from 'drizzle-orm';
import { sequenceS } from 'fp-ts/Apply';
import { Apply, map } from 'fp-ts/Either';
import { pipe } from 'fp-ts/function';

import { makeConversationId, makeScenarioId, makeUserId } from '~/domain/types';
import { insertOne, queryOne } from '~/infrastructure/db/query-helpers';
import { conversations } from '~/infrastructure/db/schemas';

import type { Either } from 'fp-ts/Either';
import type { TaskEither } from 'fp-ts/TaskEither';

import type { AppError, Conversation, ConversationId } from '~/domain/types';
import type { DBClient } from '~/infrastructure/db/client';

export interface ConversationEffects {
  readonly saveConversation: (conversation: Conversation) => TaskEither<AppError, Conversation>;
  readonly getConversation: (conversationId: ConversationId) => TaskEither<AppError, Conversation>;
}

type ConversationRow = typeof conversations.$inferSelect;

const mapRowToConversation = (row: ConversationRow): Either<AppError, Conversation> =>
  pipe(
    sequenceS(Apply)({
      id: makeConversationId(row.id),
      userId: makeUserId(row.userId),
      scenarioId: makeScenarioId(row.scenarioId),
    }),
    map(({ id, userId, scenarioId }) => ({
      id,
      userId,
      scenarioId,
      targetLanguage: row.targetLanguage,
      userLevel: row.userLevel,
      messages: [],
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    }))
  );

export const createConversationEffects = (db: DBClient): ConversationEffects => ({
  saveConversation: (conversation) =>
    insertOne(() => db.insert(conversations).values(conversation).returning(), mapRowToConversation, 'Conversation'),

  getConversation: (conversationId) =>
    queryOne(
      () => db.select().from(conversations).where(eq(conversations.id, conversationId)),
      mapRowToConversation,
      'Conversation',
      conversationId
    ),
});
