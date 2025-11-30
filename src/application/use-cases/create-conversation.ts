import { pipe } from 'fp-ts/function';
import { conversationCreate } from '~/domain/functions/conversation';
import type { TaskEither } from 'fp-ts/TaskEither';
import type { AppError, Conversation, Language, ScenarioId, UserId, UserLevel } from '~/domain/types';

type CreateConversationParams = {
  readonly userId: UserId;
  readonly scenarioId: ScenarioId;
  readonly targetLanguage: Language;
  readonly userLevel: UserLevel;
};

type CreateConversationDeps = {
  readonly saveConversation: (conversation: Conversation) => TaskEither<AppError, Conversation>;
};

export const createConversationUseCase = (
  params: CreateConversationParams,
  deps: CreateConversationDeps
): TaskEither<AppError, Conversation> => pipe(conversationCreate(params), deps.saveConversation);
