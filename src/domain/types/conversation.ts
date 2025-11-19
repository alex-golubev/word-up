import type {
  ConversationId,
  Language,
  ScenarioId,
  UserId,
  UserLevel,
} from '~/domain/types/common';
import type { Message } from 'postcss';

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
