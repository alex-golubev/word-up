import { pipe } from 'fp-ts/function';
import { conversationCreate } from '~/domain/functions/conversation';
import type { Conversation, Language, ScenarioId, UserId, UserLevel } from '~/domain/types';
import type { AppReader } from '~/application/reader';

export type CreateConversationParams = {
  readonly userId: UserId;
  readonly scenarioId: ScenarioId;
  readonly targetLanguage: Language;
  readonly userLevel: UserLevel;
};

export const createConversationUseCase =
  (params: CreateConversationParams): AppReader<Conversation> =>
  (env) =>
    pipe(conversationCreate(params), env.saveConversation);
