import type { ConversationId, Language, Message, ScenarioId, UserId, UserLevel } from '~/domain/types';

export type Conversation = {
  readonly id: ConversationId;
  readonly userId: UserId;
  readonly scenarioId: ScenarioId;
  readonly targetLanguage: Language;
  readonly userLevel: UserLevel;
  readonly messages: readonly Message[];
  readonly createdAt: Date;
  readonly updatedAt: Date;
};
