import type { Message, Scenario, UserLevel } from '~/domain/types';

export type ChatRole = 'system' | 'user' | 'assistant';

export type ChatMessage = {
  readonly role: ChatRole;
  readonly content: string;
};

export type GenerateResponseParams = {
  readonly scenario: Scenario;
  readonly userLevel: UserLevel;
  readonly messages: readonly Message[];
};

export type GenerateResponse = {
  readonly content: string;
};
