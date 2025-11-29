import type { TaskEither } from 'fp-ts/TaskEither';
import type { Conversation, Language, ScenarioId, UserId, UserLevel } from '~/domain/types';

type CreateConversationParams = {
  readonly userId: UserId;
  readonly scenarioId: ScenarioId;
  readonly targetLanguage: Language;
  readonly userLevel: UserLevel;
};

type CreateConversationDeps = {
  readonly createConversation: (params: CreateConversationParams) => TaskEither<Error, Conversation>;
};

export const createConversationUseCase = (params: CreateConversationParams, deps: CreateConversationDeps) =>
  deps.createConversation(params);
