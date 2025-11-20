import type { Language, ScenarioId, UserLevel } from '~/domain/types';

export type Scenario = {
  readonly id: ScenarioId;
  readonly title: string;
  readonly description: string;
  readonly role: string;
  readonly userLevel: UserLevel;
  readonly targetLanguage: Language;
  readonly startingMessage: string;
  readonly vocabulary: readonly string[];
};
